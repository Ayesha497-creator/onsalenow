import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ref,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { auth, database } from "./config";
import axios from "axios";

// Register a new seller
export const registerSeller = async (uid, sellerData) => {
  try {
    let userCredential;
    if (!uid) {
      // Create user with email and password
      userCredential = await createUserWithEmailAndPassword(
        auth,
        sellerData.email,
        sellerData.password
      );
      uid = userCredential.user.uid;
    }

    // Store additional seller data in the database
    await set(ref(database, `Seller/${uid}`), {
      ...sellerData,
      uid: uid,
      createdAt: new Date().toISOString(),
      status: "pending", // Pending approval by admin
    });

    // Return seller data for the app
    return {
      success: true,
      sellerId: uid,
    };
  } catch (error) {
    console.error("Error registering seller:", error);
    let errorMessage = "Failed to register seller";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email is already in use";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Login seller
export const loginSeller = async (email, password) => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Get additional seller data from the database
    const sellerRef = ref(database, `Seller/${user.uid}`);
    const snapshot = await get(sellerRef);

    if (snapshot.exists()) {
      const sellerData = snapshot.val();

      // Only block sellers if they are blocked, allow pending sellers to log in
      if (sellerData.status === "blocked") {
        await signOut(auth);
        return {
          success: false,
          error: "Your account has been blocked. Please contact support.",
        };
      }

      // For pending sellers, allow login but include the pending status
      const isPending = sellerData.status === "pending";

      // Return seller data for the app, including pending status
      return {
        success: true,
        seller: {
          uid: user.uid,
          email: user.email,
          ...sellerData,
          isPending: sellerData.status === "pending",
        },
      };
    } else {
      // User exists in Auth but not in database as a seller
      await signOut(auth);
      return {
        success: false,
        error: "Seller account not found. Please register as a seller first.",
      };
    }
  } catch (error) {
    console.error("Error logging in:", error);
    let errorMessage = "Failed to login";

    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      errorMessage = "Invalid email or password";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed login attempts. Please try again later.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Update seller profile
export const updateSellerProfile = async (sellerId, sellerData) => {
  try {
    const sellerRef = ref(database, `Seller/${sellerId}`);
    await update(sellerRef, {
      ...sellerData,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
};

// Add a product for a seller
export const addSellerProduct = async (sellerId, productData) => {
  try {
    if (!sellerId) {
      return {
        success: false,
        error: "Seller ID is required",
      };
    }

    const { success, data } = await getSellerProfile(sellerId);
    
    // Check if seller is approved
    if (success && data?.status === "pending") {
      return {
        success: false,
        error: "Your account is pending approval. You cannot add products until your account is approved by admin.",
      };
    }
    
    if (success && data?.status === "blocked") {
      return {
        success: false,
        error: "Your account has been blocked. You cannot add products.",
      };
    }

    const productId = Date.now().toString();
    const newProductRef = ref(database, `products/${productId}`);

    const productWithSellerId = {
      ...productData,
      sellerId,
      isSellerBlocked: false, // Only approved sellers can add products
      createdAt: new Date().toISOString(),
    };

    await set(newProductRef, productWithSellerId);

    const brandKey = productData.brand.replace(/\s+/g, "_").toLowerCase();
    const categoryKey = productData.category.replace(/\s+/g, "_").toLowerCase();

    const [brandSnapshot, categorySnapshot] = await Promise.all([
      get(ref(database, "brandSubscriptions")),
      get(ref(database, "categorySubscriptions")),
    ]);

    const brandSubscriptions = brandSnapshot.val() || {};
    const categorySubscriptions = categorySnapshot.val() || {};

    let hasBrandSubscribers = false;
    let hasCategorySubscribers = false;

    for (const subId in brandSubscriptions) {
      if (subId.endsWith(`_${brandKey}`) && brandSubscriptions[subId].active) {
        hasBrandSubscribers = true;
        break;
      }
    }

    for (const subId in categorySubscriptions) {
      if (
        subId.endsWith(`_${categoryKey}`) &&
        categorySubscriptions[subId].active
      ) {
        hasCategorySubscribers = true;
        break;
      }
    }

    // Send BRAND notification
    if (hasBrandSubscribers) {
      try {
        const title = `New in ${productData.brand}`;
        const content = `${productData.name} is now available for ${
          productData.price || ""
        }`;
        const includeImage =
          productData.images && productData.images.length > 0;

        const brandPayload = {
          app_id: "fc2657f2-2b10-4b7d-a23a-9d4113b0027a",
          headings: { en: title },
          contents: { en: content },
          filters: [
            {
              field: "tag",
              key: `brand_${brandKey}`,
              relation: "=",
              value: "true",
            },
          ],
          url: `${window.location.origin}/product/${productId}`,
          data: {
            productId,
            brandName: productData.brand,
            type: "new_product_brand",
          },
        };

        if (includeImage) {
          brandPayload.big_picture = productData.images[0];
          brandPayload.chrome_web_image = productData.images[0];
        }

        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          brandPayload,
          {
            headers: {
              Authorization:
                "Basic os_v2_app_7qtfp4rlcbfx3ir2tvarhmacpjxxtr6oxn6epee3kaia6lmok7cmbtklizkosc6iwpwwwfswk7vla5py2a56icgpa33j3enz52bwvna",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Brand notification sent");
      } catch (error) {
        console.error("Error sending brand notification:", error);
      }
    }

    // Send CATEGORY notification
    if (hasCategorySubscribers) {
      try {
        const title = `New in ${productData.category}`;
        const content = `${productData.name} has arrived in ${productData.category}`;
        const includeImage =
          productData.images && productData.images.length > 0;

        const categoryPayload = {
          app_id: "fc2657f2-2b10-4b7d-a23a-9d4113b0027a",
          headings: { en: title },
          contents: { en: content },
          filters: [
            {
              field: "tag",
              key: `category_${categoryKey}`,
              relation: "=",
              value: "true",
            },
          ],
          url: `${window.location.origin}/product/${productId}`,
          data: {
            productId,
            categoryName: productData.category,
            type: "new_product_category",
          },
        };

        if (includeImage) {
          categoryPayload.big_picture = productData.images[0];
          categoryPayload.chrome_web_image = productData.images[0];
        }

        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          categoryPayload,
          {
            headers: {
              Authorization:
                "Basic os_v2_app_7qtfp4rlcbfx3ir2tvarhmacpjxxtr6oxn6epee3kaia6lmok7cmbtklizkosc6iwpwwwfswk7vla5py2a56icgpa33j3enz52bwvna",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Category notification sent");
      } catch (error) {
        console.error("Error sending category notification:", error);
      }
    }

    return {
      success: true,
      productId,
    };
  } catch (error) {
    console.error("Error adding product:", error);
    return {
      success: false,
      error: "Failed to add product: " + error.message,
    };
  }
};

// Get all products for a seller
export const getSellerProducts = async (sellerId) => {
  try {
    if (!sellerId) {
      console.error("No seller ID provided to getSellerProducts");
      return {
        success: false,
        error: "Seller ID is required",
        data: [],
      };
    }

    console.log("Fetching products for seller ID:", sellerId);

    // Use the indexed query now that we've added the index to Firebase rules
    const productsQuery = query(
      ref(database, "products"),
      orderByChild("sellerId"),
      equalTo(sellerId)
    );
    const snapshot = await get(productsQuery);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      console.log("Found products:", products.length);
    } else {
      console.log("No products found for seller");
    }

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting seller products:", error);
    return {
      success: false,
      error: "Failed to get products: " + error.message,
      data: [],
    };
  }
};

// Update a seller's product
export const updateSellerProduct = async (productId, productData) => {
  try {
    console.log("Updating product with ID:", productId);
    if (!productId) {
      throw new Error("Product ID is required for updating");
    }

    // Get the product to find the seller ID
    const productRef = ref(database, `products/${productId}`);
    const productSnapshot = await get(productRef);
    
    if (!productSnapshot.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const product = productSnapshot.val();
    const sellerId = product.sellerId;

    // Check seller status
    const { success, data } = await getSellerProfile(sellerId);
    
    if (success && data?.status === "pending") {
      return {
        success: false,
        error: "Your account is pending approval. You cannot update products until your account is approved by admin.",
      };
    }
    
    if (success && data?.status === "blocked") {
      return {
        success: false,
        error: "Your account has been blocked. You cannot update products.",
      };
    }

    // Don't overwrite the ID
    const { id, isSellerBlocked, ...dataToUpdate } = productData;

    await update(productRef, {
      ...dataToUpdate,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: "Failed to update product: " + error.message,
    };
  }
};

// Delete a seller's product
export const deleteSellerProduct = async (productId) => {
  try {
    // Get the product to find the seller ID
    const productRef = ref(database, `products/${productId}`);
    const productSnapshot = await get(productRef);
    
    if (!productSnapshot.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const product = productSnapshot.val();
    const sellerId = product.sellerId;

    // Check seller status
    const { success, data } = await getSellerProfile(sellerId);
    
    if (success && data?.status === "pending") {
      return {
        success: false,
        error: "Your account is pending approval. You cannot delete products until your account is approved by admin.",
      };
    }
    
    if (success && data?.status === "blocked") {
      return {
        success: false,
        error: "Your account has been blocked. You cannot delete products.",
      };
    }

    await remove(productRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: "Failed to delete product: " + error.message,
    };
  }
};

// Get seller orders
export const getSellerOrders = async (sellerId) => {
  try {
    // Query orders by sellerId
    const ordersQuery = query(
      ref(database, "Orders"),
      orderByChild("sellerId"),
      equalTo(sellerId)
    );

    const snapshot = await get(ordersQuery);

    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        orders.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      return {
        success: true,
        orders,
      };
    } else {
      return {
        success: true,
        orders: [],
      };
    }
  } catch (error) {
    console.error("Error getting seller orders:", error);
    return {
      success: false,
      error: "Failed to get orders",
    };
  }
};

// Logout seller
export const logoutSeller = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      success: false,
      error: "Failed to logout",
    };
  }
};

// Get current seller
export const getCurrentSeller = () => {
  return auth.currentUser;
};

// Get seller profile
export const getSellerProfile = async (sellerId) => {
  try {
    const sellerRef = ref(database, `Seller/${sellerId}`);
    const snapshot = await get(sellerRef);

    if (snapshot.exists()) {
      return {
        success: true,
        data: {
          id: sellerId,
          ...snapshot.val(),
        },
      };
    } else {
      return {
        success: false,
        error: "Seller profile not found",
      };
    }
  } catch (error) {
    console.error("Error getting seller profile:", error);
    return {
      success: false,
      error: "Failed to get seller profile",
    };
  }
};

export const toggleSellerBlockStatus = async (sellerId, status) => {
  const isBlocked = status?.status == "blocked" ? true : false;
  try {
    // 1. Update seller
    await update(ref(database, `Seller/${sellerId}`), {
      status: status?.status,
      updatedAt: new Date().toISOString(),
    });

    // 2. Get all products by that seller
    const result = await getSellerProducts(sellerId);
    if (!result.success) throw new Error(result.error);
    console.log("boss1 seller's prod:- ", result);
    // 3. Update all their products
    const updatePromises = result.data.map((product) =>
      updateSellerProduct(product.id, {
        isSellerBlocked: isBlocked,
      })
    );

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error("Error toggling seller status:", error);
    return { success: false, error: error.message };
  }
};

// Update seller status
export const updateSellerStatus = async (sellerId, status) => {
  try {
    const sellerRef = ref(database, `Seller/${sellerId}`);
    await update(sellerRef, {
      status: status,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating seller status:", error);
    return {
      success: false,
      error: "Failed to update seller status",
    };
  }
};

// Check if a seller is blocked
export const isSellerBlocked = async (sellerId) => {
  try {
    const sellerRef = ref(database, `sellers/${sellerId}`);
    const snapshot = await get(sellerRef);

    if (snapshot.exists()) {
      const seller = snapshot.val();
      return seller.status === "blocked";
    }
    return false; // If seller not found, treat as not blocked
  } catch (error) {
    console.error("Error checking seller status:", error);
    return false;
  }
};
