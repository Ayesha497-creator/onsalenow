import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "./config";
import { isSellerBlocked } from "./sellerAuth"

// Helper function to determine if a product is on sale
const isProductOnSale = (product) => {
  // Check if product has a discountPercent field with a value > 0
  if (
    product.discountPercent &&
    !isNaN(Number(product.discountPercent)) &&
    Number(product.discountPercent) > 0
  ) {
    return true;
  }

  // Check if product has originalPrice > price
  const originalPrice = parsePrice(product.originalPrice);
  const currentPrice = parsePrice(product.price);

  return originalPrice > 0 && currentPrice > 0 && originalPrice > currentPrice;
};

// Helper function to parse price
export const parsePrice = (priceValue) => {
  if (!priceValue) return 0;
  const priceStr = String(priceValue);
  const cleanPrice = priceStr.replace(/[^0-9.]/g, "");
  return Number.parseFloat(cleanPrice) || 0;
};

// Get all products
export const getAllProducts = async () => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const products = Object.keys(productsData).map((key) => ({
        id: key,
        ...productsData[key],
      }));

      // const filtered = filterBlockedSellerProducts(products);
      const filtered = products.filter(p => !p?.isSellerBlocked);

      return {
        success: true,
        data: filtered,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Error getting all products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get random products (for featured products section)
export const getRandomProducts = async (limit = 8) => {
  try {
    console.log(`Fetching ${limit} random products`);
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const products = Object.keys(productsData).map((key) => ({
        id: key,
        ...productsData[key],
      }));

      // Filter to only include sale products
      // const unblockedProducts = await filterBlockedSellerProducts(products);
      const unblockedProducts = products.filter(p => !p?.isSellerBlocked);
      const saleProducts = unblockedProducts.filter(isProductOnSale);
      // const saleProducts = products.filter(isProductOnSale);
      console.log(
        `Found ${saleProducts.length} sale products out of ${products.length} total products`
      );

      // Shuffle the array to get random products
      const shuffled = saleProducts.sort(() => 0.5 - Math.random());

      // Take the first 'limit' products
      const randomProducts = shuffled.slice(0, limit);

      // Log brand/website values for debugging
      const brands = new Set();
      const websites = new Set();
      randomProducts.forEach((product) => {
        if (product.brand) brands.add(product.brand);
        if (product.website) websites.add(product.website);
      });

      console.log("Random products brands:", Array.from(brands));
      console.log("Random products websites:", Array.from(websites));

      return {
        success: true,
        data: randomProducts,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Error getting random products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const productsRef = ref(database, "products");
    const categoryQuery = query(
      productsRef,
      orderByChild("category"),
      equalTo(category)
    );
    const snapshot = await get(categoryQuery);

    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const products = Object.keys(productsData).map((key) => ({
        id: key,
        ...productsData[key],
      }));

      // Filter to only include sale products
      // const unblockedProducts = await filterBlockedSellerProducts(products);
      const unblockedProducts = products.filter(p => !p?.isSellerBlocked);
      const saleProducts = unblockedProducts.filter(isProductOnSale);
      // const saleProducts = products.filter(isProductOnSale);

      console.log(
        `Found ${saleProducts.length} sale products out of ${products.length} total products for category ${category}`
      );

      // Log the first few products to debug
      if (saleProducts.length > 0) {
        console.log(
          "Sample products:",
          saleProducts.slice(0, 3).map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            website: p.website,
          }))
        );
      }

      return {
        success: true,
        data: saleProducts,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error(`Error getting products for category ${category}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  try {
    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);

    if (snapshot.exists()) {
      const product = {
        id: productId,
        ...snapshot.val(),
      };

      return {
        success: true,
        data: product,
      };
    }

    return {
      success: false,
      error: "Product not found",
    };
  } catch (error) {
    console.error(`Error getting product ${productId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get products with the highest discount
export const getHighestDiscountedProducts = async (limit = 4) => {
  try {
    const productsRef = ref(database, "products");
    const snapshot = await get(productsRef);

    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const products = Object.keys(productsData).map((key) => ({
        id: key,
        ...productsData[key],
      }));

      // Filter to only include sale products
      // const unblockedProducts = await filterBlockedSellerProducts(products);
      const unblockedProducts = products.filter(p => !p?.isSellerBlocked);
      const saleProducts = unblockedProducts.filter(isProductOnSale);
      // const saleProducts = products.filter(isProductOnSale);

      // Calculate discount percentage for each product
      const discountedProducts = saleProducts.map((product) => {
        let discountPercent = 0;
        if (
          product.discountPercent &&
          !isNaN(Number(product.discountPercent))
        ) {
          discountPercent = Number(product.discountPercent);
        } else {
          const originalPrice = parsePrice(product.originalPrice);
          const price = parsePrice(product.price);
          if (originalPrice > 0 && price > 0 && originalPrice > price) {
            discountPercent = Math.round(
              ((originalPrice - price) / originalPrice) * 100
            );
          }
        }
        return { ...product, calculatedDiscountPercent: discountPercent };
      });

      // Sort by discount percentage in descending order
      discountedProducts.sort(
        (a, b) =>
          (b.calculatedDiscountPercent || 0) -
          (a.calculatedDiscountPercent || 0)
      );

      // Take the first 'limit' products
      const highestDiscountedProducts = discountedProducts.slice(0, limit);

      return {
        success: true,
        data: highestDiscountedProducts,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Error getting highest discounted products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export other functions as needed
export const searchProducts = async (query, filters = {}) => {
  try {
    const result = await getAllProducts();
    if (!result.success) return result;

    const searchQuery = query.toLowerCase();
    const { priceRange, selectedSizes, selectedCategories } = filters;

    const filterByPrice = (price) => {
      const p = parseFloat(String(price).replace(/[^0-9.]/g, ""));
      switch (priceRange) {
        case "<2000": return p < 2000;
        case "2000-4000": return p >= 2000 && p <= 4000;
        case "4000-6000": return p > 4000 && p <= 6000;
        case "6000-10000": return p > 6000 && p <= 10000;
        case ">10000": return p > 10000;
        default: return true;
      }
    };

    const products = result.data.filter((product) => {
      const matchQuery = !searchQuery || (
        product.name?.toLowerCase().includes(searchQuery) ||
        product.description?.toLowerCase().includes(searchQuery) ||
        product.brand?.toLowerCase().includes(searchQuery) ||
        product.category?.toLowerCase().includes(searchQuery)
      );


      const matchPrice = filterByPrice(product.price);
      const matchSizes =
        !selectedSizes?.length ||
        selectedSizes.some((size) => product.sizes?.includes(size));
      const matchCategory =
        !selectedCategories?.length ||
        selectedCategories.includes(product.category);

      return matchQuery && matchPrice && matchSizes && matchCategory;
    });

    // const unblockedProducts = await filterBlockedSellerProducts(products);
    const unblockedProducts = products.filter(p => !p?.isSellerBlocked);
    const saleProducts = unblockedProducts.filter(isProductOnSale);
    // const saleProducts = products.filter(isProductOnSale);

    return { success: true, data: saleProducts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Filter out products with blocked sellers
export const filterBlockedSellerProducts = async (products) => {
  const sellerBlockCache = new Map(); // optional cache to avoid duplicate checks

  const checkPromises = products.map(async (product) => {
    try {
      if (!product.sellerId) return product;

      if (sellerBlockCache.has(product.sellerId)) {
        return sellerBlockCache.get(product.sellerId) ? null : product;
      }

      const blocked = await isSellerBlocked(product.sellerId);
      sellerBlockCache.set(product.sellerId, blocked);

      return blocked ? null : product;
    } catch (error) {
      console.warn(`Error checking seller ${product.sellerId}:`, error);
      return null;
    }
  });

  const results = await Promise.all(checkPromises);
  return results.filter(Boolean);
};





