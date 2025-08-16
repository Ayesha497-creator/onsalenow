import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from "recharts";
import { getSellerProducts } from "../../firebase/sellerAuth";
import { getSellerOrders } from "../../firebase/orders";
import { parsePrice } from "../../firebase/products";
import SellerSidebar from "../../components/seller/SellerSidebar";

// Custom colors
const COLORS = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c"];

export default function SellerAnalytics({ user }) {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalProducts: 0,
        totalSales: 0,
        remainingStock: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        productCategories: [],
        popularProducts: [],
        salesOverTime: []
    });
    const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const sellerId = user?.uid;
                if (!sellerId) return;

                const [productsRes, ordersRes] = await Promise.all([
                    getSellerProducts(sellerId),
                    getSellerOrders(sellerId),
                ]);

                const products = productsRes?.data || [];
                const orders = ordersRes?.data || [];

                // Basic metrics
                let totalSales = 0;
                let remainingStock = 0;

                products.forEach((product) => {
                    const sold = Number(product.sold || 0);
                    const stock = Number(product.stock || 0);
                    totalSales += sold;
                    remainingStock += stock - sold;
                });

                // Order stats
                const totalOrders = orders.length;
                const completedOrders = orders.filter(o =>
                    ["completed", "delivered"].includes(o.status)).length;
                const pendingOrders = orders.filter(o =>
                    ["pending", "processing"].includes(o.status)).length;
                const cancelledOrders = orders.filter(o =>
                    ["cancelled", "rejected"].includes(o.status)).length;

                // Product categories (simplified example)
                const categories = {};
                products.forEach(product => {
                    const category = product.category || "Uncategorized";
                    if (!categories[category]) categories[category] = 0;
                    categories[category]++;
                });

                const productCategories = Object.keys(categories).map(key => ({
                    name: key,
                    value: categories[key]
                }));

                // Popular products (top 5 by sales)
                const popularProducts = [...products]
                    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                    .slice(0, 5)
                    .map(product => ({
                        name: product.name,
                        sales: product.sold || 0
                    }));

                // Mock sales over time (would be better with real data)
                // In a real app, you'd aggregate this from orders with timestamps
                const salesOverTime = groupSalesByMonth(orders);
                setAnalytics(prevState => ({
                    ...prevState,
                    salesOverTime: salesOverTime
                }));


                setAnalytics({
                    totalProducts: products.length,
                    totalSales,
                    remainingStock,
                    totalOrders,
                    completedOrders,
                    pendingOrders,
                    cancelledOrders,
                    productCategories,
                    popularProducts,
                    salesOverTime
                });
            } catch (err) {
                console.error("Error fetching analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.uid]);

    useEffect(() => {
      if (user?.uid) {
        fetch(`http://localhost:8000/seller/top-products/${user.uid}`)
          .then(res => res.json())
          .then(data => setTopProducts(data || []))
          .catch(() => setTopProducts([]));
      }
    }, [user?.uid]);

    // Function to group sales by month and calculate total sales
    const groupSalesByMonth = (orders) => {
        const salesData = {};

        orders.forEach(order => {
            const date = new Date(order.createdAt);  // Use createdAt (or orderDate if preferred)
            const month = `${date.getMonth() + 1}-${date.getFullYear()}`;  // Format: MM-YYYY

            if (!salesData[month]) {
                salesData[month] = 0;
            }

            // Sum up the totalAmount for each order in the respective month
            salesData[month] += order.totalAmount || 0;  // Ensure you're using the correct field for total sales
        });

        // Convert the sales data to an array and sort by date
        return Object.keys(salesData).map((month) => ({
            name: month,  // MM-YYYY format
            sales: salesData[month],
        })).sort((a, b) => new Date(a.name) - new Date(b.name));  // Sort by date
    };


    if (loading) {
        return (
            <div className="d-flex">
                <SellerSidebar />
                <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-black" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Order status data for pie chart
    const orderStatusData = [
        { name: "Completed", value: analytics.completedOrders },
        { name: "Pending", value: analytics.pendingOrders },
        { name: "Cancelled", value: analytics.cancelledOrders },
    ];

    // Stock overview data
    const stockData = [
        { name: "Products Sold", value: analytics.totalSales },
        { name: "Remaining Stock", value: analytics.remainingStock },
    ];

    return (
        <div className="d-flex">
            <SellerSidebar />
            <div className="flex-grow-1 bg-light">
                <div className="container-fluid py-4">
                    <div className="row mb-4">
                        <div className="col-12">
                            <h2 className="text-black fw-bold">Store Analytics</h2>
                            <p className="text-muted">Overview of your products and orders</p>
                        </div>
                    </div>
                    {topProducts.length > 0 && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-body">
                              <h5 className="mb-3 fw-bold">Your Top Selling Products</h5>
                              <div className="row">
                                {topProducts.map(product => (
                                  <div key={product.id} className="col-6 col-md-4 col-lg-3 mb-3">
                                    <div className="card h-100 border-0 shadow-sm">
                                      <img src={product.image || "/placeholder.svg"} className="card-img-top" style={{ height: "180px", objectFit: "cover" }} alt={product.name} />
                                      <div className="card-body">
                                        <h6 className="card-title fw-bold text-truncate">{product.name}</h6>
                                        <div className="fw-bold">Sold: {product.salesCount}</div>
                                        <div className="small text-secondary">{product.brand} | {product.category}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Cards */}
                    <div className="row mb-4 g-3">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">Total Products</h6>
                                    <h3 className="mb-0 fw-bold">{analytics.totalProducts}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">Total Sales</h6>
                                    <h3 className="mb-0 fw-bold">{analytics.totalSales}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">Remaining Stock</h6>
                                    <h3 className="mb-0 fw-bold">{analytics.remainingStock}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">Total Orders</h6>
                                    <h3 className="mb-0 fw-bold">{analytics.totalOrders}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Status and Stock Charts */}
                    <div className="row mb-4 g-3">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Order Status</h5>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={orderStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {orderStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Inventory Overview</h5>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={stockData}
                                                layout="vertical"
                                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="value" fill="#3498db" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Products and Sales Over Time */}
                    <div className="row mb-4 g-3">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Popular Products</h5>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={analytics.popularProducts}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="sales" fill="#2ecc71" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Sales Over Time</h5>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={analytics.salesOverTime}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Categories */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-3">
                                <div className="card-body">
                                    <h5 className="card-title">Product Categories</h5>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analytics.productCategories}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                >
                                                    {analytics.productCategories.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}