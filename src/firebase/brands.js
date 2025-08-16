import { getProductsData, getAllProducts } from "./database";

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
const parsePrice = (priceValue) => {
  if (!priceValue) return 0;
  const priceStr = String(priceValue);
  const cleanPrice = priceStr.replace(/[^0-9.]/g, "");
  return Number.parseFloat(cleanPrice) || 0;
};

// Helper function to normalize brand names for comparison
const normalizeBrandName = (name) => {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Get all available brands from products (using ONLY the website property)
export const getAllBrands = async () => {
  try {
    // Try to get products using getProductsData first
    const result = await getProductsData();
    let products = [];

    if (result.success && result.data) {
      products = Object.values(result.data);
    } else {
      // Fallback to getAllProducts if getProductsData fails
      const allProductsResult = await getAllProducts();
      if (allProductsResult.success) {
        products = allProductsResult.data;
      } else {
        console.error("Failed to fetch products using both methods");
        return {
          success: false,
          error: "Failed to fetch brands: No products found",
        };
      }
    }

    // Filter to only include sale products
    const saleProducts = products.filter(isProductOnSale);

    // Extract unique brands from ONLY the website property
    const brandsSet = new Set();
    saleProducts.forEach((product) => {
      if (product.website) {
        brandsSet.add(product.website);
      }
    });

    // Convert to array and sort alphabetically
    const brands = Array.from(brandsSet).sort();

    console.log(
      `Found ${brands.length} unique brands from ${saleProducts.length} sale products`
    );
    return {
      success: true,
      data: brands,
    };
  } catch (error) {
    console.error("Error fetching brands:", error);
    return {
      success: false,
      error: "Error fetching brands: " + error.message,
    };
  }
};

// Get products by brand with improved search strategies
export const getProductsByBrand = async (
  brandValue,
  caseInsensitive = true,
  field = "website",
  allowPartial = false
) => {
  try {
    // Store the original brandValue for logging and display purposes
    const originalBrandValue = brandValue;

    console.log(
      `Fetching products for brand: ${originalBrandValue} (case insensitive: ${caseInsensitive}, field: ${field}, allowPartial: ${allowPartial})`
    );

    // Normalize the brand value for comparison - we'll use this for all comparisons
    const normalizedBrandValue = normalizeBrandName(originalBrandValue);

    // Try to get products using getProductsData first
    const result = await getProductsData();
    let products = [];

    if (result.success && result.data) {
      products = Object.keys(result.data).map((key) => ({
        id: key,
        ...result.data[key],
      }));
    } else {
      // Fallback to getAllProducts if getProductsData fails
      const allProductsResult = await getAllProducts();
      if (allProductsResult.success) {
        products = allProductsResult.data;
      } else {
        console.error("Failed to fetch products using both methods");
        return {
          success: false,
          error: "No products found in database",
        };
      }
    }

    if (!products || products.length === 0) {
      console.warn("No products found in database");
      return {
        success: true,
        data: [],
        message: "No products found in database",
      };
    }

    console.log(`Total products in database: ${products.length}`);

    // Use flexible matching to find products by the specified field
    // Process all products in a single pass to avoid multiple array iterations
    const exactMatches = [];
    const partialMatches = [];
    const looseMatches = [];

    // Track which fields we're checking for debugging
    const fieldsChecked = new Set();

    products.forEach((product) => {
      // Skip products without the specified field
      if (!product[field]) {
        return;
      }

      fieldsChecked.add(field);

      // Check if product is on sale
      if (!isProductOnSale(product)) {
        return;
      }

      // Match against the specified field
      const normalizedProductField = normalizeBrandName(product[field]);
      const productFieldLower = product[field].toLowerCase();
      const brandValueLower = originalBrandValue.toLowerCase();

      // Check for exact match (case sensitive)
      if (product[field] === originalBrandValue) {
        exactMatches.push(product);
      }
      // Check for case-insensitive exact match
      else if (
        caseInsensitive &&
        normalizedProductField === normalizedBrandValue
      ) {
        exactMatches.push(product);
      }
      // Check for partial match (contains)
      else if (allowPartial && productFieldLower.includes(brandValueLower)) {
        partialMatches.push(product);
      }
      // Check for loose match (brand value is part of product field)
      else if (
        allowPartial &&
        brandValueLower.length > 3 &&
        productFieldLower.includes(brandValueLower.substring(0, 4))
      ) {
        looseMatches.push(product);
      }
    });

    console.log(
      `Found ${exactMatches.length} exact matches, ${partialMatches.length} partial matches, and ${looseMatches.length} loose matches for brand: ${originalBrandValue} in field: ${field}`
    );

    // Determine which set of matches to return
    let matchedProducts = [];
    let searchStrategy = "";

    if (exactMatches.length > 0) {
      matchedProducts = exactMatches;
      searchStrategy = `${field}-exact`;
    } else if (partialMatches.length > 0) {
      matchedProducts = partialMatches;
      searchStrategy = `${field}-partial`;
    } else if (looseMatches.length > 0 && allowPartial) {
      matchedProducts = looseMatches;
      searchStrategy = `${field}-loose`;
    }

    // Sort products by ID to ensure consistent order
    const sortedProducts = matchedProducts.sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    return {
      success: true,
      data: sortedProducts,
      partialMatch:
        matchedProducts !== exactMatches && matchedProducts.length > 0,
      searchStrategy,
      searchQuery: originalBrandValue,
      searchField: field,
      fieldsChecked: Array.from(fieldsChecked),
    };
  } catch (error) {
    console.error("Error fetching products by brand:", error);
    return {
      success: false,
      error: "Error fetching products by brand: " + error.message,
    };
  }
};
