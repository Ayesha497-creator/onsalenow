// Browser-compatible script to create test seller with 70% sales
// Run this in browser console after importing Firebase

const createTestSeller = async () => {
  try {
    // Import Firebase (assuming it's already available in the app)
    const { ref, set } = await import("firebase/database");
    const { database } = await import("./src/firebase/config.js");

    // Create seller data
    const sellerId = "test_seller_zyler_kemp";
    const sellerData = {
      uid: sellerId,
      email: "zyler.kemp@freedrops.org",
      firstName: "Zyler",
      lastName: "Kemp",
      brandName: "Zyler's Fashion",
      phoneNumber: "03123456789",
      address: "123 Test Street, Karachi, Pakistan",
      businessDescription: "Premium fashion and lifestyle products",
      website: "https://zylersfashion.com",
      storeCategory: "Men",
      status: "approved", // Approved seller
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create products with sales to reach 70% sold
    const products = [
      {
        id: "product_1_zyler",
        name: "Premium Cotton T-Shirt",
        brand: "Zyler's Fashion",
        price: 1500,
        originalPrice: 2000,
        description: "High-quality cotton t-shirt with modern design",
        category: "men",
        stock: 100,
        sold: 70, // 70% sold (70/100 = 70%)
        sellerId: sellerId,
        image: "https://via.placeholder.com/300x400/3498db/ffffff?text=T-Shirt",
        keywords: ["men", "cotton", "t-shirt", "casual"],
        discountPercent: 25,
        onSale: true,
        createdAt: new Date().toISOString(),
        isSellerBlocked: false,
      },
      {
        id: "product_2_zyler",
        name: "Denim Jeans",
        brand: "Zyler's Fashion",
        price: 2500,
        originalPrice: 3000,
        description: "Comfortable denim jeans for everyday wear",
        category: "men",
        stock: 50,
        sold: 35, // 70% sold (35/50 = 70%)
        sellerId: sellerId,
        image: "https://via.placeholder.com/300x400/2ecc71/ffffff?text=Jeans",
        keywords: ["men", "denim", "jeans", "casual"],
        discountPercent: 17,
        onSale: true,
        createdAt: new Date().toISOString(),
        isSellerBlocked: false,
      },
      {
        id: "product_3_zyler",
        name: "Leather Jacket",
        brand: "Zyler's Fashion",
        price: 5000,
        originalPrice: 6000,
        description: "Stylish leather jacket for men",
        category: "men",
        stock: 20,
        sold: 14, // 70% sold (14/20 = 70%)
        sellerId: sellerId,
        image: "https://via.placeholder.com/300x400/e74c3c/ffffff?text=Jacket",
        keywords: ["men", "leather", "jacket", "formal"],
        discountPercent: 17,
        onSale: true,
        createdAt: new Date().toISOString(),
        isSellerBlocked: false,
      },
    ];

    // Add seller to database
    await set(ref(database, `Seller/${sellerId}`), sellerData);
    console.log("✅ Seller created successfully:", sellerData.email);

    // Add products to database
    for (const product of products) {
      await set(ref(database, `products/${product.id}`), product);
      console.log(
        `✅ Product created: ${product.name} - ${product.sold}/${
          product.stock
        } sold (${((product.sold / product.stock) * 100).toFixed(1)}%)`
      );
    }

    // Calculate total stats
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
    const percentSold = ((totalSold / totalStock) * 100).toFixed(1);

    console.log("\n📊 Test Seller Summary:");
    console.log(`Email: ${sellerData.email}`);
    console.log(`Total Stock: ${totalStock}`);
    console.log(`Total Sold: ${totalSold}`);
    console.log(`Percent Sold: ${percentSold}%`);
    console.log(
      `Status: ${
        percentSold >= 70
          ? "🔴 PAYMENT REQUIRED (70%+)"
          : percentSold >= 50
          ? "🟡 WARNING (50%+)"
          : "🟢 OK"
      }`
    );

    console.log("\n🎯 This seller should trigger email notifications:");
    console.log("- 70% threshold: Payment reminder email");
    console.log("- 50% threshold: Warning email");
  } catch (error) {
    console.error("❌ Error creating test seller:", error);
  }
};

// Export for use
window.createTestSeller = createTestSeller;
console.log("🚀 Test seller creation script loaded. Run: createTestSeller()");
