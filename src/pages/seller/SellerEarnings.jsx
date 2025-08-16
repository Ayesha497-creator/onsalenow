import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { getSellerProducts } from "../../firebase/sellerAuth";
import { getSellerOrders } from "../../firebase/orders";
import { parsePrice } from "../../firebase/products";
import SellerSidebar from "../../components/seller/SellerSidebar";

// Custom colors
const COLORS = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];

export default function SellerEarnings({ user }) {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    revenueByCategory: [],
    topProducts: [],
    revenueOverTime: [],
    paymentMethods: []
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const sellerId = user?.uid;
        if (!sellerId) return;

        const [productsRes, ordersRes] = await Promise.all([
          getSellerProducts(sellerId),
          getSellerOrders(sellerId),
        ]);

        const products = productsRes?.data || [];
        const orders = ordersRes?.data || [];

        // Calculate total revenue
        let totalRevenue = 0;
        const completedOrders = orders.filter(o =>
          ["completed", "delivered"].includes(o.status)
        );

        completedOrders.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              const price = parsePrice(item.price);
              const quantity = Number(item.quantity || 1);
              totalRevenue += price * quantity;
            });
          }
        });
        // console.log("boss",orders)
        // Dynamic time-based revenues (today, week, month)
        const today = new Date();
        const todayRevenue = completedOrders
          .filter(order => new Date(order.createdAt).toLocaleDateString() === today.toLocaleDateString())
          .reduce((acc, order) => {
            order.items.forEach(item => {
              const price = parsePrice(item.price);
              const quantity = Number(item.quantity || 1);
              acc += price * quantity;
            });
            return acc;
          }, 0);

        const weeklyRevenue = completedOrders
          .filter(order => {
            const orderDate = new Date(order.createdAt);
            const diff = (today - orderDate) / (1000 * 60 * 60 * 24);
            return diff <= 7; // Orders within the last 7 days
          })
          .reduce((acc, order) => {
            order.items.forEach(item => {
              const price = parsePrice(item.price);
              const quantity = Number(item.quantity || 1);
              acc += price * quantity;
            });
            return acc;
          }, 0);

        const monthlyRevenue = completedOrders
          .filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
          })
          .reduce((acc, order) => {
            order.items.forEach(item => {
              const price = parsePrice(item.price);
              const quantity = Number(item.quantity || 1);
              acc += price * quantity;
            });
            return acc;
          }, 0);
        
        // Revenue by category
        const categoryRevenue = {};
        products.forEach(product => {
          const category = product.category || "Uncategorized";
          const sold = Number(product.sold || 0);
          const price = parsePrice(product.price);
          const revenue = sold * price;

          if (!categoryRevenue[category]) categoryRevenue[category] = 0;
          categoryRevenue[category] += revenue;
        });

        const revenueByCategory = Object.keys(categoryRevenue).map(key => ({
          name: key,
          value: categoryRevenue[key]
        }));

        // Top earning products
        const topProducts = [...products]
          .sort((a, b) => {
            const aRevenue = (a.sold || 0) * parsePrice(a.price);
            const bRevenue = (b.sold || 0) * parsePrice(b.price);
            return bRevenue - aRevenue;
          })
          .slice(0, 5)
          .map(product => ({
            name: product.name,
            revenue: (product.sold || 0) * parsePrice(product.price)
          }));

        // Revenue over time (grouped by month)
        const revenueOverTime = groupSalesByMonth(completedOrders);

        // Payment methods distribution
        const paymentMethods = calculatePaymentMethodsDistribution(orders);

        // Calculate percentage increase/decrease for today, week, and month
        const yesterdayRevenue = calculateYesterdayRevenue(completedOrders);
        const lastWeekRevenue = calculateLastWeekRevenue(completedOrders);
        const lastMonthRevenue = calculateLastMonthRevenue(completedOrders);

        // Set earnings state
        setEarnings({
          totalRevenue,
          todayRevenue,
          weeklyRevenue,
          monthlyRevenue,
          revenueByCategory,
          topProducts,
          revenueOverTime,
          paymentMethods,
          percentageIncreaseFromYesterday: calculatePercentageChange(todayRevenue, yesterdayRevenue),
          percentageIncreaseFromLastWeek: calculatePercentageChange(weeklyRevenue, lastWeekRevenue),
          percentageIncreaseFromLastMonth: calculatePercentageChange(monthlyRevenue, lastMonthRevenue)
        });

      } catch (err) {
        console.error("Error fetching earnings data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user?.uid]);

  const groupSalesByMonth = (orders) => {
    const salesData = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const month = `${date.getMonth() + 1}-${date.getFullYear()}`;

      if (!salesData[month]) {
        salesData[month] = 0;
      }

      order.items.forEach(item => {
        const price = parsePrice(item.price);
        const quantity = Number(item.quantity || 1);
        salesData[month] += price * quantity;
      });
    });

    return Object.keys(salesData).map((month) => ({
      name: month,
      revenue: salesData[month],
    })).sort((a, b) => new Date(a.name) - new Date(b.name));  // Sort by date
  };

  const calculatePaymentMethodsDistribution = (orders) => {
    const paymentMethods = {};

    orders.forEach(order => {
      const paymentMethod = order.paymentMethod || "Unknown";
      if (!paymentMethods[paymentMethod]) paymentMethods[paymentMethod] = 0;
      paymentMethods[paymentMethod] += 1;  // Count occurrences (or sum if needed)

    });

    return Object.keys(paymentMethods).map(key => ({
      name: key,
      value: paymentMethods[key],
    }));
  };

  const calculateYesterdayRevenue = (orders) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return orders
      .filter(order => new Date(order.createdAt).toLocaleDateString() === yesterday.toLocaleDateString())
      .reduce((acc, order) => {
        order.items.forEach(item => {
          const price = parsePrice(item.price);
          const quantity = Number(item.quantity || 1);
          acc += price * quantity;
        });
        return acc;
      }, 0);
  };

  const calculateLastWeekRevenue = (orders) => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    return orders
      .filter(order => new Date(order.createdAt) >= lastWeek)
      .reduce((acc, order) => {
        order.items.forEach(item => {
          const price = parsePrice(item.price);
          const quantity = Number(item.quantity || 1);
          acc += price * quantity;
        });
        return acc;
      }, 0);
  };

  const calculateLastMonthRevenue = (orders) => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    return orders
      .filter(order => new Date(order.createdAt).getMonth() === lastMonth.getMonth())
      .reduce((acc, order) => {
        order.items.forEach(item => {
          const price = parsePrice(item.price);
          const quantity = Number(item.quantity || 1);
          acc += price * quantity;
        });
        return acc;
      }, 0);
  };

  const calculatePercentageChange = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
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

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs ${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="d-flex">
      <SellerSidebar />
      <div className="flex-grow-1 bg-light">
        <div className="container-fluid py-4">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-black fw-bold">Earnings Dashboard</h2>
              <p className="text-muted">Track your revenue and financial performance</p>
            </div>
          </div>

          {/* Revenue Cards */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100 bg-gradient" style={{ background: 'linear-gradient(45deg, #3498db, #2980b9)' }}>
                <div className="card-body">
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h3 className="mb-0 fw-bold">{formatCurrency(earnings.totalRevenue)}</h3>
                  <small>Lifetime earnings</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Today's Earnings</h6>
                  <h3 className="mb-0 fw-bold">{formatCurrency(earnings.todayRevenue)}</h3>
                  <small className="text-success">{earnings.percentageIncreaseFromYesterday.toFixed(2)}% from yesterday</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Weekly Earnings</h6>
                  <h3 className="mb-0 fw-bold">{formatCurrency(earnings.weeklyRevenue)}</h3>
                  <small className="text-success">{earnings.percentageIncreaseFromLastWeek.toFixed(2)}% from last week</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Monthly Earnings</h6>
                  <h3 className="mb-0 fw-bold">{formatCurrency(earnings.monthlyRevenue)}</h3>
                  <small className="text-success">{earnings.percentageIncreaseFromLastMonth.toFixed(2)}% from last month</small>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title">Revenue Trends</h5>
                  <div style={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={earnings.revenueOverTime}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3498db" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3498db" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}`} />
                        <Tooltip formatter={(value) => [`Rs ${value}`, 'Revenue']} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3498db"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products and Revenue by Category */}
          <div className="row mb-4 g-3">
            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h5 className="card-title">Top Earning Products</h5>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={earnings.topProducts}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3498db" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h5 className="card-title">Revenue by Category</h5>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={earnings.revenueByCategory}
                          dataKey="value"
                          // nameKey="name"
                          label={({ name, value }) => `${name}: ${value}`}
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          // label
                        >
                          {earnings.revenueByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
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
