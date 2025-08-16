import {
  ref,
  set,
  get,
  push,
  remove,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { database } from "./config";

// Helper function to create an item with auto-generated ID
export const createItemWithId = async (path, data) => {
  try {
    const newItemRef = push(ref(database, path));
    const id = newItemRef.key;
    await set(newItemRef, { ...data, id });
    return { id, ...data };
  } catch (error) {
    console.error(`Error creating item at ${path}:`, error);
    return { success: false, error: error.message };
  }
};

// Helper function to get all items from a path
export const getAllItems = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error(`Error getting items from ${path}:`, error);
    return { success: false, error: error.message };
  }
};

// Get products data (for compatibility with brands.js)
export const getProductsData = async () => {
  try {
    const snapshot = await get(ref(database, "products"));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("Error getting products data:", error);
    return { success: false, error: error.message };
  }
};

// Get user data
export const getUserData = async () => {
  try {
    const snapshot = await get(ref(database, "user"));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("Error getting user data:", error);
    return { success: false, error: error.message };
  }
};

// Set data at a specific path
export const setData = async (path, data) => {
  try {
    await set(ref(database, path), data);
    return { success: true };
  } catch (error) {
    console.error(`Error setting data at ${path}:`, error);
    return { success: false, error: error.message };
  }
};

// Delete data at a specific path
export const deleteData = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting data at ${path}:`, error);
    return { success: false, error: error.message };
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  try {
    const snapshot = await get(ref(database, `products/${productId}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    }
    return { success: false, error: "Product not found" };
  } catch (error) {
    console.error(`Error getting product ${productId}:`, error);
    return { success: false, error: error.message };
  }
};

// Add a new product
export const addProduct = async (productId, productData) => {
  try {
    await set(ref(database, `products/${productId}`), productData);
    return { success: true };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error: error.message };
  }
};

// Update a product
export const updateProduct = async (productId, productData) => {
  try {
    await update(ref(database, `products/${productId}`), productData);
    return { success: true };
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    return { success: false, error: error.message };
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    await remove(ref(database, `products/${productId}`));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    return { success: false, error: error.message };
  }
};

// Get all products for a specific seller
export const getSellerProducts = async (sellerId) => {
  try {
    console.log("Fetching products for seller:", sellerId);

    // Query products by sellerId
    const productsRef = ref(database, "products");
    const sellerProductsQuery = query(
      productsRef,
      orderByChild("sellerId"),
      equalTo(sellerId)
    );
    const snapshot = await get(sellerProductsQuery);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push(childSnapshot.val());
      });
      console.log(`Found ${products.length} products for seller:`, sellerId);
    } else {
      console.log("No products found for seller:", sellerId);
    }

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting seller products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Add a product with seller ID
export const addSellerProduct = async (productData, sellerId) => {
  try {
    // Ensure the product has a sellerId
    const productWithSellerId = {
      ...productData,
      sellerId: sellerId,
      createdAt: new Date().toISOString(),
    };

    return await createItemWithId("products", productWithSellerId);
  } catch (error) {
    console.error("Error adding seller product:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update a product
export const updateSellerProduct = async (productId, productData, sellerId) => {
  try {
    // Ensure we're not changing the sellerId
    const updatedData = {
      ...productData,
      sellerId: sellerId, // Ensure the sellerId remains the same
      updatedAt: new Date().toISOString(),
    };

    const productRef = ref(database, `products/${productId}`);
    await set(productRef, updatedData);

    return {
      success: true,
      data: updatedData,
    };
  } catch (error) {
    console.error("Error updating seller product:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete a product
export const deleteSellerProduct = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    await remove(productRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting seller product:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get all products (for the main store)
export const getAllProducts = async () => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push(childSnapshot.val());
      });
    }

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting all products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get products by category - ensure this function isn't filtering by brand
export const getProductsByCategory = async (category) => {
  try {
    const productsRef = ref(database, "products");
    const categoryProductsQuery = query(
      productsRef,
      orderByChild("category"),
      equalTo(category)
    );
    const snapshot = await get(categoryProductsQuery);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        // Add the product with its ID
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      console.log(
        `Database query found ${products.length} products for category: ${category}`
      );
    } else {
      console.log(`No products found in database for category: ${category}`);
    }

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting products by category:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get products by brand
export const getProductsByBrand = async (brand) => {
  try {
    const productsRef = ref(database, "products");
    const brandProductsQuery = query(
      productsRef,
      orderByChild("brand"),
      equalTo(brand)
    );
    const snapshot = await get(brandProductsQuery);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push(childSnapshot.val());
      });
    }

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting products by brand:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get a product by ID
export const getProductById2 = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);

    if (snapshot.exists()) {
      return {
        success: true,
        data: snapshot.val(),
      };
    } else {
      return {
        success: false,
        error: "Product not found",
      };
    }
  } catch (error) {
    console.error("Error getting product by ID:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export any other functions that might be needed
export const getAllProductsData = async () => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    const products = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        products.push(childSnapshot.val());
      });
    }

    return products;
  } catch (error) {
    console.error("Error getting products data:", error);
    return [];
  }
};
