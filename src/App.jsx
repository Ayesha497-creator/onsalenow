"use client";

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onMessage } from "./firebase/config";
import { messaging } from "./firebase/config";
import "./App.css";
// import './index.css';
import { getUserBrandSubscriptions } from "./firebase/brandSubscriptions";
import { getUserCategorySubscriptions } from "./firebase/categorySubscriptions";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import SearchPage from "./pages/SearchPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import PolicyAgreement from "./pages/PolicyAgreement";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import BrandNotificationsPage from "./pages/BrandNotificationsPage";
import CategoryNotificationsPage from "./pages/CategoryNotificationsPage"
import WishlistPage from "./pages/WishlistPage";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import "bootstrap/dist/css/bootstrap.min.css";
import { Spinner } from "react-bootstrap";
import { addBrandTagToOneSignal } from "./OneSignalInit";
// import { OneSignalProvider } from "./OneSignalProvider.jsx";
import { onAuthStateChanged } from "firebase/auth"; // Assuming you use Firebase Auth
import { auth } from "./firebase/config"; // Your Firebase config
import OneSignal from "react-onesignal";
import ForYouPage from "./pages/ForYouPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminLogout from "./pages/admin/AdminLogout";

// Seller Pages
import SellerDashboard from "./pages/seller/SellerDashboard";
import ManageProducts from "./pages/seller/ManageProducts";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerOrderDetailPage from "./pages/seller/SellerOrderDetailPage";
import SellerAnalytics from "./pages/seller/SellerAnalytics";
import SellerEarnings from "./pages/seller/SellerEarnings";
import SellerSettings from "./pages/seller/SellerSettings";
import {initializeOneSignal} from './OneSignalInit.js';
// Admin Route Protection
const AdminRoute = ({ children }) => {
  const adminUser = localStorage.getItem("adminUser");

  if (!adminUser) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Seller Route Protection
const SellerRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || !user.isSeller) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// User Route Protection
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkUserAuth = () => {
      setIsLoading(true);
      const loggedInUser = localStorage.getItem("user");
      if (loggedInUser) {
        setUser(JSON.parse(loggedInUser));
      }
      setIsLoading(false);
    };

    checkUserAuth();
  }, []);


  useEffect(() => {
    const initOneSignalAndSetTags = async () => {
      try {
        const success = await initializeOneSignal(); // call from OneSignalInit.js
        if (!success) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              await OneSignal.login(user.uid);

              // Fetch brand subscriptions
              const brandRes = await getUserBrandSubscriptions(user.uid);
              // Fetch category subscriptions
              const categoryRes = await getUserCategorySubscriptions(user.uid);

              const tags = {};

              // Add brand tags
              if (brandRes.success && brandRes.data) {
                brandRes.data.forEach((sub) => {
                  if (sub.active) {
                    const tagKey = `brand_${sub.brandName
                      .replace(/\s+/g, "_")
                      .toLowerCase()}`;
                    tags[tagKey] = "true";
                  }
                });
              }

              // Add category tags
              if (categoryRes.success && categoryRes.data) {
                categoryRes.data.forEach((sub) => {
                  if (sub.active) {
                    const tagKey = `category_${sub.categoryName
                      .replace(/\s+/g, "_")
                      .toLowerCase()}`;
                    tags[tagKey] = "true";
                  }
                });
              }

              if (tags && Object.keys(tags).length > 0) {
                await OneSignal.User.addTags(tags);
                console.log("Tags sent successfully");
              } else {
                console.warn("Skipped sending tags: empty or invalid tag object");
              }
            } catch (err) {
              console.error("OneSignal login or tag sync failed:", err);
            }
          }
        });

        return unsubscribe;
      } catch (err) {
        console.error("OneSignal initialization failed:", err);
      }
    };

    const cleanupPromise = initOneSignalAndSetTags();

    return () => {
      cleanupPromise.then((unsubscribe) => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    };
  }, []);

  // useEffect(() => {
  //   const setupOneSignal = async () => {
  //     const initialized = await initializeOneSignal();

  //     if (!initialized) {
  //       console.error("OneSignal failed to initialize");
  //       return;
  //     }

  //     // Wait until OneSignal is ready
  //     const waitUntilReady = () => {
  //       return new Promise((resolve) => {
  //         const interval = setInterval(async () => {
  //           const isPushEnabled = await OneSignal.isPushNotificationsEnabled();
  //           if (isPushEnabled) {
  //             clearInterval(interval);
  //             resolve(true);
  //           }
  //         }, 1000);
  //       });
  //     };

  //     await waitUntilReady();

  //     // Now check login and tagging
  //     const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //       if (user) {
  //         try {
  //           await window.OneSignal.login(user.uid);

  //           const result = await getUserBrandSubscriptions(user.uid);
  //           if (result.success && result.data.length > 0) {
  //             for (const subscription of result.data) {
  //               if (subscription.active) {
  //                 await addBrandTagToOneSignal(subscription.brandName);
  //               }
  //             }
  //           }
  //         } catch (error) {
  //           console.error("Error during OneSignal user sync:", error);
  //         }
  //       }
  //     });

  //     return unsubscribe;
  //   };

  //   setupOneSignal();
  // }, []);

  // useEffect(() => {
  //   console.log("window.OneSignal available?", !!window.OneSignal);
  // }, []);

  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker
  //       .register('./firebase-messaging-sw.js')
  //       .then((registration) => {
  //         console.log('Service Worker registered with scope:', registration.scope);
  //       })
  //       .catch((error) => {
  //         console.error('Service Worker registration failed:', error);
  //       });
  //   }
  // }, []);

  // useEffect(() => {
  //   if (!user) return;

  //   const setupOneSignal = async () => {
  //     window.OneSignal = window.OneSignal || [];

  //     OneSignal.push(async () => {
  //       OneSignal.init({
  //         appId: "fc2657f2-2b10-4b7d-a23a-9d4113b0027a",
  //       });

  //       // Prompt for notification permission
  //       const isEnabled = await OneSignal.isPushNotificationsEnabled();
  //       if (!isEnabled) {
  //         OneSignal.showSlidedownPrompt();
  //       }

  //       // Login user
  //       await OneSignal.login(user.uid);

  //       // ✅ Get brand subscriptions and tag them
  //       const res = await getUserBrandSubscriptions(user.uid);
  //       if (res.success) {
  //         for (const sub of res.data) {
  //           if (sub.active && sub.brandName) {
  //             const tagKey = "brand";
  //             const tagValue = sub.brandName.replace(/\s+/g, "_").toLowerCase();
  //             await OneSignal.sendTag(`brand_${tagValue}`, "true");
  //           }
  //         }
  //       }
  //     });
  //   };

  //   setupOneSignal();
  // }, [user]);

  // useEffect(() => {
  //   const unsubscribe = onMessage(messaging, (payload) => {
  //     console.log("Foreground message received:", payload);
  //     const { title, body } = payload.notification;

  //     if (Notification.permission === "granted") {
  //       new Notification(title, { body });
  //     }
  //   });

  //   return () => unsubscribe(); // clean up
  // }, []);

  // Update user state when login/logout happens
  const handleUserChange = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <CartProvider>
      {/* <OneSignalProvider /> */}
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route path="/admin/logout" element={<AdminLogout />} />

          {/* Seller Routes */}
          <Route
            path="/seller"
            element={
              <SellerRoute>
                <SellerDashboard user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <SellerRoute>
                <ManageProducts user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <SellerRoute>
                <SellerOrdersPage user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/orders/:orderId"
            element={
              <SellerRoute>
                <SellerOrderDetailPage user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/analytics"
            element={
              <SellerRoute>
                <SellerAnalytics user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/earnings"
            element={
              <SellerRoute>
                <SellerEarnings user={user} />
              </SellerRoute>
            }
          />
          <Route
            path="/seller/settings"
            element={
              <SellerRoute>
                <SellerSettings user={user} />
              </SellerRoute>
            }
          />

          {/* Store Routes */}
          <Route
            path="/"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route
            path="/orders"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <OrdersPage userId={user?.uid} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          <Route
            path="/order/:orderId"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <OrderDetailPage user={user} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <OrderConfirmationPage user={user} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          <Route
            path="/category/:categoryName"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <CategoryPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/brand/:brandName"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <BrandPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/search"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <SearchPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/product/:productId"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <ProductDetailPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <CartPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/checkout"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <CheckoutPage user={user} />
                <Footer />
              </>
            }
          />
          <Route
            path="/policy-agreement"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <PolicyAgreement />
                <Footer />
              </>
            }
          />
          <Route
            path="/wishlist"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <WishlistPage user={user} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          {/* Add Brand Notifications Page */}
          <Route
            path="/brand-notifications"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <BrandNotificationsPage user={user} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/category-notifications"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <UserRoute>
                  <CategoryNotificationsPage user={user} />
                </UserRoute>
                <Footer />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/for-you"
            element={
              <>
                <Navbar user={user} onUserChange={handleUserChange} />
                <ForYouPage />
                <Footer />
              </>
            }
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
