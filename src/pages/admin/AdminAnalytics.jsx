import React, { useEffect, useState } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "../../firebase/config"; // adjust path if needed
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Table, Button, Alert } from "react-bootstrap";
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"
import { Container } from "react-bootstrap";
import CreateTestData from "../../components/admin/CreateTestData";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF4F81", "#A28EFF"];

const AdminAnalytics = () => {
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [brandSales, setBrandSales] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [orderStatusCounts, setOrderStatusCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sellersNeedingNotification, setSellersNeedingNotification] = useState([]);
    const [sendingEmails, setSendingEmails] = useState(false);
    const [emailStatus, setEmailStatus] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    // Trigger automatic email checking when sellers and products are loaded
    useEffect(() => {
        if (sellers.length > 0 && products.length > 0 && !loading) {
            console.log('Data loaded, checking for automatic emails...');
            const sellersWithStats = sellers.map(seller => {
                const sellerProducts = products.filter((p) => p.sellerId === seller.uid || p.sellerId === seller.id);
                const totalStock = sellerProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
                const totalSold = sellerProducts.reduce((sum, p) => sum + (Number(p.sold) || 0), 0);
                const percentSold = totalStock > 0 ? (totalSold / totalStock) * 100 : 0;
                
                return {
                    seller,
                    totalStock,
                    totalSold,
                    percentSold
                };
            });
            
            // Check and send automatic emails
            checkAndSendAutomaticEmails(sellersWithStats).then(emailsSent => {
                if (emailsSent > 0) {
                    setEmailStatus(`✅ Automatically sent ${emailsSent} email notification(s) for threshold alerts.`);
                    setTimeout(() => setEmailStatus(''), 8000);
                }
            });
        }
    }, [sellers, products, loading]);

    // Send email notification to seller
    const sendEmailNotification = async (sellerEmail, percentSold, message) => {
        try {
            const response = await fetch('http://13.48.16.129:5173/api/email/send-gmail-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: `OnSaleNow - Account Alert (${percentSold}% Sold)`,
                    message: message,
                    email: sellerEmail
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send email notification');
            }

            console.log(`Email notification sent to ${sellerEmail} for ${percentSold}% sold`);
            return true;
        } catch (error) {
            console.error('Error sending email notification:', error);
            return false;
        }
    };

    // Check and send automatic emails based on percentage thresholds
    const checkAndSendAutomaticEmails = async (sellers) => {
        const emailPromises = [];
        console.log('Checking automatic emails for sellers:', sellers);

        for (const seller of sellers) {
            const { seller: sellerData, percentSold } = seller;
            const sellerEmail = sellerData.email;
            
            console.log('Checking seller:', sellerData.email, 'percentSold:', percentSold, 'isFiftyPercentEmail:', sellerData.isFiftyPercentEmail, 'isSeventyPercentEmail:', sellerData.isSeventyPercentEmail);
            
            if (!sellerEmail) {
                console.warn(`No email found for seller ${sellerData.uid}`);
                continue;
            }

            // Check for 70% threshold
            if (percentSold >= 70 && !sellerData.isSeventyPercentEmail) {
                const message = `Dear ${sellerData.firstName || sellerData.brandName || 'Seller'},\n\nYour account has reached ${percentSold}% sold. Please pay the amount to continue selling on our platform.\n\nBest regards,\nOnSaleNow Team`;
                
                console.log('Sending 70% email to:', sellerEmail);
                emailPromises.push({
                    sellerId: sellerData.uid || sellerData.id,
                    email: sellerEmail,
                    percentSold,
                    message,
                    type: 'seventy'
                });
            }
            // Check for 50% threshold (but not if already at 70% or above)
            else if (percentSold >= 50 && percentSold < 70 && !sellerData.isFiftyPercentEmail) {
                const message = `Dear ${sellerData.firstName || sellerData.brandName || 'Seller'},\n\nYour account has reached above ${percentSold}% sold. Please monitor your sales and consider payment when you reach 70%.\n\nBest regards,\nOnSaleNow Team`;
                
                console.log('Sending 50% email to:', sellerEmail);
                emailPromises.push({
                    sellerId: sellerData.uid || sellerData.id,
                    email: sellerEmail,
                    percentSold,
                    message,
                    type: 'fifty'
                });
            }
        }

        console.log('Email promises to send:', emailPromises.length);

        // Send emails and update tracking attributes
        let emailsSent = 0;
        for (const emailData of emailPromises) {
            console.log('Sending email:', emailData);
            const success = await sendEmailNotification(emailData.email, emailData.percentSold, emailData.message);
            
            if (success) {
                emailsSent++;
                console.log('Email sent successfully, updating tracking for seller:', emailData.sellerId);
                
                // Update the email tracking attribute in Firebase
                const sellerRef = ref(database, `Seller/${emailData.sellerId}`);
                
                try {
                    // Get current seller data first
                    const sellerSnapshot = await get(sellerRef);
                    if (sellerSnapshot.exists()) {
                        const currentSellerData = sellerSnapshot.val();
                        
                        // Update only the specific flag
                        const updateData = {
                            ...currentSellerData
                        };
                        
                        if (emailData.type === 'seventy') {
                            updateData.isSeventyPercentEmail = true;
                        } else if (emailData.type === 'fifty') {
                            updateData.isFiftyPercentEmail = true;
                        }
                        
                        await set(sellerRef, updateData);
                        console.log(`Updated email tracking for seller ${emailData.sellerId}:`, updateData);
                    }
                } catch (error) {
                    console.error('Error updating email tracking:', error);
                }
            } else {
                console.log('Failed to send email for:', emailData.email);
            }
        }

        return emailsSent;
    };

    // Check which sellers need notifications
    const checkSellersNeedingNotifications = (sellersWithStats) => {
        const sellersNeedingEmails = [];
        
        sellersWithStats.forEach(seller => {
            const { totalStock, totalSold, percentSold } = seller;
            const percentSoldNum = parseFloat(percentSold);
            
            if (percentSoldNum >= 50) {
                sellersNeedingEmails.push({
                    seller,
                    percentSold: percentSoldNum
                });
            }
        });
        
        setSellersNeedingNotification(sellersNeedingEmails);
    };

    const fetchData = async () => {
        setLoading(true);
        const sellersSnap = await get(ref(database, "Seller"));
        const productsSnap = await get(ref(database, "products"));
        const ordersSnap = await get(ref(database, "orders"));

        const sellersData = sellersSnap.exists() ? sellersSnap.val() : {};
        const productsData = productsSnap.exists() ? productsSnap.val() : {};
        const ordersData = ordersSnap.exists() ? ordersSnap.val() : {};

        const sellersArray = Object.entries(sellersData).map(([id, s]) => ({
            ...s,
            id,
        }));
        const productsArray = Object.entries(productsData).map(([id, p]) => ({
            ...p,
            id,
        }));
        const ordersArray = Object.entries(ordersData).map(([id, o]) => ({
            ...o,
            id,
        }));

        setSellers(sellersArray);
        setProducts(productsArray);
        setOrders(ordersArray);

        calculateBrandAndCategorySales(productsArray);
        calculateOrderStatusCounts(ordersArray);
        setLoading(false);
        
        // Check for sellers needing notifications
        const sellersWithStats = sellersArray.map(seller => {
          const sellerProducts = productsArray.filter((p) => p.sellerId === seller.uid || p.sellerId === seller.id);
          const totalStock = sellerProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
          const totalSold = sellerProducts.reduce((sum, p) => sum + (Number(p.sold) || 0), 0);
          const percentSold = totalStock > 0 ? (totalSold / totalStock) * 100 : 0;
          
          console.log(`Seller ${seller.email}: totalStock=${totalStock}, totalSold=${totalSold}, percentSold=${percentSold}`);
          
          return {
            seller,
            totalStock,
            totalSold,
            percentSold
          };
        });
        checkSellersNeedingNotifications(sellersWithStats);

        // Automatically send emails for new thresholds
        console.log('Starting automatic email check...');
        const emailsSent = await checkAndSendAutomaticEmails(sellersWithStats);
        console.log('Automatic emails sent:', emailsSent, 'sellers with stats:', sellersWithStats);
        if (emailsSent > 0) {
            setEmailStatus(`✅ Automatically sent ${emailsSent} email notification(s) for threshold alerts.`);
            setTimeout(() => setEmailStatus(''), 8000);
        } else {
            console.log('No automatic emails sent - all thresholds already handled or no qualifying sellers');
        }
    };

    const calculateBrandAndCategorySales = (productsArray) => {
        const brandMap = {};
        const categoryMap = {};

        productsArray.forEach((p) => {
            const sold = Number(p.sold) || 0;
            if (p.brand) {
                brandMap[p.brand] = (brandMap[p.brand] || 0) + sold;
            }
            if (p.category) {
                categoryMap[p.category] = (categoryMap[p.category] || 0) + sold;
            }
        });

        const sortedBrands = Object.entries(brandMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        const sortedCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        setBrandSales(sortedBrands);
        setCategorySales(sortedCategories);
    };

    const calculateOrderStatusCounts = (ordersArray) => {
        const statusCounts = {};

        ordersArray.forEach((order) => {
            const status = order.status || "unknown";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const pieData = Object.entries(statusCounts).map(([status, count]) => ({
            name: status,
            value: count,
        }));

        setOrderStatusCounts(pieData);
    };

    const getSellerStats = (sellerId) => {
        const sellerProducts = products.filter((p) => p.sellerId === sellerId || p.sellerId === sellerId);
        const totalStock = sellerProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
        const totalSold = sellerProducts.reduce((sum, p) => sum + (Number(p.sold) || 0), 0);
        const percentSold = totalStock > 0 ? ((totalSold / totalStock) * 100).toFixed(1) : "0";

        return { totalStock, totalSold, percentSold };
    };

    return (
        <div className="admin-dashboard d-flex" style={{ width: "100%", overflow: "hidden" }}>
            <AdminSidebar />
            <div className="flex-grow-1" style={{ overflow: "auto", height: "100vh" }}>
                <AdminHeader />
                <Container fluid className="py-4 px-4">
                    <h2 className="mb-4">Admin Analytics</h2>
                    
                    {/* Test Data Creation Component */}
                    {/* <CreateTestData /> */}
                    
                    <div className="container mt-5">
                        {loading ? (
                            <div className="text-center my-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div>
                                        <h3 className="mt-4">Top 3 Brands Bought by Buyers</h3>
                                        <PieChart width={400} height={300}>
                                            <Pie
                                                data={brandSales.map(([name, value]) => ({ name, value }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                fill="#8884d8"
                                                label
                                            >
                                                {brandSales.map((entry, index) => (
                                                    <Cell key={`brand-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </div>

                                    <div>
                                        <h3 className="mt-4">Top 3 Categories Bought by Buyers</h3>
                                        <PieChart width={400} height={300}>
                                            <Pie
                                                data={categorySales.map(([name, value]) => ({ name, value }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                fill="#8884d8"
                                                label
                                            >
                                                {categorySales.map((entry, index) => (
                                                    <Cell key={`category-cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </div>
                                </div>

                                <h3 className="mt-5">Order Status Breakdown</h3>
                                <PieChart width={400} height={300}>
                                    <Pie
                                        data={orderStatusCounts}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#8884d8"
                                        label
                                    >
                                        {orderStatusCounts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                                {/* <div className="mt-4">
                                    <h5>Send Notifications to Sellers</h5>
                                    <p>Click the button below to send email notifications to sellers whose inventory has exceeded 50% or 70% sold.</p>
                                    
                                    {sellersNeedingNotification.length > 0 && (
                                        <div className="alert alert-info mb-3">
                                            <strong>{sellersNeedingNotification.length}</strong> seller(s) need notifications:
                                            <ul className="mb-0 mt-2">
                                                {sellersNeedingNotification.map((item, index) => (
                                                    <li key={index}>
                                                        {item.seller.firstName || item.seller.brandName || item.seller.email} - {item.percentSold.toFixed(1)}% sold
                                                        {item.percentSold >= 70 && <span className="text-danger ms-2">(Payment Required)</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    <Button 
                                        variant="primary" 
                                        onClick={async () => {
                                            setSendingEmails(true);
                                            const emailsSent = await checkAndSendAutomaticEmails(sellersNeedingNotification);
                                            setSendingEmails(false);
                                            if (emailsSent > 0) {
                                                setEmailStatus(`✅ Manually sent ${emailsSent} email notification(s).`);
                                                setTimeout(() => setEmailStatus(''), 8000);
                                            } else {
                                                setEmailStatus(`ℹ️ No emails sent - all thresholds already handled.`);
                                                setTimeout(() => setEmailStatus(''), 5000);
                                            }
                                        }}
                                        disabled={sendingEmails || sellersNeedingNotification.length === 0}
                                    >
                                        {sendingEmails ? 'Sending...' : 'Send Manual Notifications'}
                                    </Button>
                                    
                                    {emailStatus && (
                                        <div className="mt-2">
                                            <Alert variant="info" className="mb-0">
                                                {emailStatus}
                                            </Alert>
                                        </div>
                                    )}
                                </div> */}
                                <h4 className="mt-5 mb-3">Seller Inventory & Sales</h4>
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Seller UID</th>
                                            <th>Total Stock</th>
                                            <th>Total Sold</th>
                                            <th>% Sold</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellers.map((seller) => {
                                            const { totalStock, totalSold, percentSold } = getSellerStats(seller.uid);
                                            const percentSoldNum = parseFloat(percentSold);
                                            const isHighSold = percentSoldNum >= 70;
                                            
                                            return (
                                                <tr key={seller.uid} className={isHighSold ? "high-sold-row" : ""}>
                                                    <td>{seller.name || seller.email || seller.uid}</td>
                                                    <td>{totalStock}</td>
                                                    <td>{totalSold}</td>
                                                    <td>{percentSold}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>

                               
                            </>
                        )}
                    </div>

                </Container>
            </div>
        </div>
    );
};

export default AdminAnalytics;
