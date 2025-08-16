import { database } from "./config";
import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

// Debug function to check if orders exist in the database
export const checkOrdersExist = async () => {
  try {
    console.log("Checking if any orders exist in the database...");
    const ordersRef = ref(database, "orders");
    const snapshot = await get(ordersRef);

    if (snapshot.exists()) {
      const orders = snapshot.val();
      console.log(
        `Found ${Object.keys(orders).length} orders in the database:`,
        orders
      );
      return true;
    } else {
      console.log("No orders found in the database");
      return false;
    }
  } catch (error) {
    console.error("Error checking orders:", error);
    return false;
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    console.log("Creating order with data:", orderData);

    // Validate order data
    if (
      !orderData ||
      !orderData.userId ||
      !orderData.items ||
      !orderData.totalAmount
    ) {
      console.error("Invalid order data:", orderData);
      return { success: false, error: "Invalid order data" };
    }

    // Create a reference to the new order
    const ordersRef = ref(database, "orders");
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key;

    // Add order ID and default status to the order data
    const orderWithId = {
      ...orderData,
      id: orderId,
      status: orderData.status || "pending",
      createdAt: Date.now(),
    };

    // Save the order to the database
    await set(newOrderRef, orderWithId);
    console.log("Order created successfully:", orderId);

    // Verify the order was saved
    const savedOrderRef = ref(database, `orders/${orderId}`);
    const savedOrderSnapshot = await get(savedOrderRef);

    if (savedOrderSnapshot.exists()) {
      console.log("Order verified in database:", savedOrderSnapshot.val());
    } else {
      console.error("Order was not saved correctly!");
    }

    return { success: true, orderId };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
};

// Create a test order for a seller - FIXED to ensure correct seller ID
export const createTestOrderForSeller = async (sellerId, userId) => {
  try {
    console.log(`Creating test order for seller: ${sellerId}, user: ${userId}`);

    if (!sellerId) {
      console.error("No seller ID provided");
      return { success: false, error: "Seller ID is required" };
    }

    // Log the exact seller ID to verify it's correct
    console.log("Using exact seller ID:", sellerId);

    // Create test product data with explicit seller ID
    const testItems = [
      {
        id: `test-product-1-${Date.now()}`,
        productId: `test-product-1-${Date.now()}`,
        name: "Test Product 1",
        price: 999,
        quantity: 1,
        sellerId: sellerId, // Using the exact seller ID passed to the function
        image: "/assorted-products-display.png",
      },
      {
        id: `test-product-2-${Date.now()}`,
        productId: `test-product-2-${Date.now()}`,
        name: "Test Product 2",
        price: 1499,
        quantity: 2,
        sellerId: sellerId, // Using the exact seller ID passed to the function
        image: "/assorted-products-display.png",
      },
    ];

    // Calculate total amount
    const totalAmount = testItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Create order data with explicit seller reference
    const orderData = {
      userId: userId,
      sellerId: sellerId, // Using the exact seller ID passed to the function
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "9876543210",
      shippingAddress: "123 Test Street, Test City, Test State - 123456",
      items: testItems,
      totalAmount: totalAmount,
      paymentMethod: "COD",
      orderDate: Date.now(),
      sellerIds: [sellerId], // Using the exact seller ID passed to the function
      status: "pending",
    };

    console.log("Creating test order with data:", JSON.stringify(orderData));

    // Create the order
    const result = await createOrder(orderData);
    console.log("Test order creation result:", result);

    if (result.success) {
      // Verify the order was created with the correct seller ID
      const orderRef = ref(database, `orders/${result.orderId}`);
      const orderSnapshot = await get(orderRef);

      if (orderSnapshot.exists()) {
        const savedOrder = orderSnapshot.val();
        console.log("Saved test order:", savedOrder);

        // Check if the seller ID is correctly saved
        const savedItems = savedOrder.items || [];
        const hasSellerItems = savedItems.some(
          (item) => item.sellerId === sellerId
        );
        const hasSellerIdField = savedOrder.sellerId === sellerId;
        const hasSellerIdsArray =
          savedOrder.sellerIds && savedOrder.sellerIds.includes(sellerId);

        console.log(
          `Order has items with seller ID ${sellerId}: ${hasSellerItems}`
        );
        console.log(
          `Order has sellerId field matching ${sellerId}: ${hasSellerIdField}`
        );
        console.log(
          `Order has sellerIds array with ${sellerId}: ${hasSellerIdsArray}`
        );

        if (!hasSellerItems && !hasSellerIdField && !hasSellerIdsArray) {
          console.error("Test order does not have the correct seller ID!");
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error creating test order:", error);
    return { success: false, error: error.message };
  }
};

// Get an order by ID
export const getOrderById = async (orderId) => {
  try {
    console.log("Getting order by ID:", orderId);

    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (snapshot.exists()) {
      const orderData = snapshot.val();
      console.log("Order found:", orderData);
      return { success: true, data: orderData };
    } else {
      console.log("No order found with ID:", orderId);
      return { success: false, error: "Order not found" };
    }
  } catch (error) {
    console.error("Error getting order:", error);
    return { success: false, error: error.message };
  }
};

// Get all orders for a user
export const getUserOrders = async (userId) => {
  try {
    console.log("Getting orders for user:", userId);

    if (!userId) {
      console.error("Invalid user ID");
      return { success: false, error: "Invalid user ID" };
    }

    const ordersRef = ref(database, "orders");
    const userOrdersQuery = query(
      ordersRef,
      orderByChild("userId"),
      equalTo(userId)
    );
    const snapshot = await get(userOrdersQuery);

    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const ordersArray = Object.values(ordersData);
      console.log(`Found ${ordersArray.length} orders for user:`, userId);
      return { success: true, data: ordersArray };
    } else {
      console.log("No orders found for user:", userId);
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error("Error getting user orders:", error);
    return { success: false, error: error.message };
  }
};

// Get all orders for a seller - FIXED to properly filter by seller ID
export const getSellerOrders = async (sellerId) => {
  try {
    console.log("Getting orders for seller:", sellerId);

    if (!sellerId) {
      console.error("Invalid seller ID");
      return { success: false, error: "Invalid seller ID" };
    }

    // Get all orders
    const ordersRef = ref(database, "orders");
    const snapshot = await get(ordersRef);

    if (!snapshot.exists()) {
      console.log("No orders found in the database");
      return { success: true, data: [] };
    }

    const allOrders = snapshot.val();
    console.log(
      `Found ${Object.keys(allOrders).length} total orders in database`
    );

    // Filter orders that are related to this seller
    const sellerOrders = [];

    for (const [orderId, order] of Object.entries(allOrders)) {
      console.log(`Checking order ${orderId} for seller ${sellerId}`);
      let belongsToSeller = false;

      // Method 1: Check if order has explicit sellerId field
      if (order.sellerId === sellerId) {
        console.log(
          `Order ${orderId} has matching sellerId field: ${order.sellerId}`
        );
        belongsToSeller = true;
      }

      // Method 2: Check if order has sellerIds array containing this seller
      else if (
        order.sellerIds &&
        Array.isArray(order.sellerIds) &&
        order.sellerIds.includes(sellerId)
      ) {
        console.log(
          `Order ${orderId} has seller in sellerIds array: ${order.sellerIds}`
        );
        belongsToSeller = true;
      }

      // Method 3: Check if any item in the order belongs to this seller
      else if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.sellerId === sellerId) {
            console.log(
              `Order ${orderId} has item with matching sellerId: ${item.sellerId}`
            );
            belongsToSeller = true;
            break;
          }
        }
      }

      if (belongsToSeller) {
        console.log(`Adding order ${orderId} to seller results`);
        sellerOrders.push({
          ...order,
          id: orderId,
        });
      } else {
        console.log(`Order ${orderId} does not belong to seller ${sellerId}`);
      }
    }

    console.log(`Found ${sellerOrders.length} orders for seller ${sellerId}`);
    return { success: true, data: sellerOrders };
  } catch (error) {
    console.error("Error getting seller orders:", error);
    return { success: false, error: error.message };
  }
};

// Add a function to fix existing orders with incorrect seller IDs
export const fixOrderSellerIds = async (correctSellerId) => {
  try {
    console.log(`Fixing orders to use correct seller ID: ${correctSellerId}`);

    if (!correctSellerId) {
      return { success: false, error: "Valid seller ID required" };
    }

    // Get all orders
    const ordersRef = ref(database, "orders");
    const snapshot = await get(ordersRef);

    if (!snapshot.exists()) {
      return { success: true, message: "No orders to fix" };
    }

    const allOrders = snapshot.val();
    let fixedCount = 0;

    for (const [orderId, order] of Object.entries(allOrders)) {
      let needsUpdate = false;
      const updates = {};

      // Fix sellerId field
      if (!order.sellerId || order.sellerId !== correctSellerId) {
        updates.sellerId = correctSellerId;
        needsUpdate = true;
      }

      // Fix sellerIds array
      if (
        !order.sellerIds ||
        !Array.isArray(order.sellerIds) ||
        !order.sellerIds.includes(correctSellerId)
      ) {
        updates.sellerIds = [correctSellerId];
        needsUpdate = true;
      }

      // Fix items
      if (order.items && Array.isArray(order.items)) {
        let itemsNeedUpdate = false;
        const updatedItems = order.items.map((item) => {
          if (!item.sellerId || item.sellerId !== correctSellerId) {
            itemsNeedUpdate = true;
            return { ...item, sellerId: correctSellerId };
          }
          return item;
        });

        if (itemsNeedUpdate) {
          updates.items = updatedItems;
          needsUpdate = true;
        }
      }

      // Ensure status is set
      if (!order.status) {
        updates.status = "pending";
        needsUpdate = true;
      }

      if (needsUpdate) {
        const orderRef = ref(database, `orders/${orderId}`);
        await update(orderRef, updates);
        fixedCount++;
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} orders to use seller ID: ${correctSellerId}`,
    };
  } catch (error) {
    console.error("Error fixing order seller IDs:", error);
    return { success: false, error: error.message };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`Updating order ${orderId} status to ${status}`);

    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, { status });

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message };
  }
};

// Cancel an order
export const cancelOrder = async (orderId) => {
  try {
    return await updateOrderStatus(orderId, "cancelled");
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: error.message };
  }
};

// Create sample orders for demo purposes (if needed)
export const createSampleOrdersIfNeeded = async (userId, sellerId) => {
  return;
};
