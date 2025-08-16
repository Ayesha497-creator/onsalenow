import {
  ref,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  update,
  remove,
} from "firebase/database";
import { database } from "./config";
import { addBrandTagToOneSignal, removeBrandTagFromOneSignal } from '../OneSignalInit';
import OneSignal from "react-onesignal";

// Create a new category subscription
export const subscribeToCategory = async (userId, categoryName, fcmToken) => {
  try {
    // Check if subscription already exists
    const existingSubscription = await checkCategorySubscription(
      userId,
      categoryName
    );

    if (existingSubscription.exists) {
      // If it exists but is inactive, reactivate it
      if (!existingSubscription.data.active) {
        return await toggleCategorySubscription(
          userId,
          categoryName,
          false,
          existingSubscription.id
        );
      }

      // If it's already active, just return success
      return {
        success: true,
        message: "You are already subscribed to this category",
        data: existingSubscription.data,
      };
    }

    // Create a new subscription
    const subscriptionId = `${userId}_${categoryName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `categorySubscriptions/${subscriptionId}`
    );

    const subscriptionData = {
      id: subscriptionId,
      userId,
      categoryName,
      fcmToken,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await set(subscriptionRef, subscriptionData);

    // await addBrandTagToOneSignal(brandName);
    const tagKey = `category_${categoryName.replace(/\s+/g, "_").toLowerCase()}`;
      await OneSignal.User.addTags({ [tagKey]: "true" });
    // if (typeof window !== "undefined" && window.OneSignal) {
    //   window.OneSignal.push(function () {
    //     window.OneSignal.sendTags({ [tagKey]: "true" });
    //   });
    // }

    return {
      success: true,
      message: "Successfully subscribed to category",
      data: subscriptionData,
    };
  } catch (error) {
    console.error("Error subscribing to category:", error);
    return {
      success: false,
      error: "Failed to subscribe to category",
    };
  }
};

// Check if a user is subscribed to a category
export const checkCategorySubscription = async (userId, categoryName) => {
  try {
    const subscriptionId = `${userId}_${categoryName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `categorySubscriptions/${subscriptionId}`
    );
    const snapshot = await get(subscriptionRef);

    if (snapshot.exists()) {
      return {
        exists: true,
        id: subscriptionId,
        data: snapshot.val(),
      };
    }

    return {
      exists: false,
    };
  } catch (error) {
    console.error("Error checking category subscription:", error);
    return {
      exists: false,
      error: "Failed to check subscription status",
    };
  }
};

// Toggle a category subscription (activate/deactivate)
export const toggleCategorySubscription = async (
  userId,
  categoryName,
  currentStatus,
  fcmToken = null,
  subscriptionId = null
) => {
  try {
    // If subscriptionId is not provided, generate it
    if (!subscriptionId) {
      subscriptionId = `${userId}_${categoryName
        .replace(/\s+/g, "_")
        .toLowerCase()}`;
    }

    const subscriptionRef = ref(
      database,
      `categorySubscriptions/${subscriptionId}`
    );

    // Check if subscription exists
    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      // If trying to activate a non-existent subscription, create it
      if (!currentStatus) {
        return await subscribeToCategory(userId, categoryName, fcmToken);
      }

      return {
        success: false,
        error: "Subscription not found",
      };
    }

    // Update the active status
    await update(subscriptionRef, {
      active: !currentStatus,
      updatedAt: new Date().toISOString(),
    });

    const tagKey = `category_${categoryName.replace(/\s+/g, "_").toLowerCase()}`;
    // if (typeof window !== "undefined" && window.OneSignal) {
    if (currentStatus) {
      await OneSignal.User.removeTag(tagKey);
      // window.OneSignal.push(function () {
      //   window.OneSignal.deleteTag(tagKey);
      // });
    } else {
      // window.OneSignal.push(function () {
      //   window.OneSignal.sendTags({ [tagKey]: "true" });
      // });
    }
    // }

    return {
      success: true,
      message: !currentStatus
        ? "Subscription activated"
        : "Subscription deactivated",
    };
  } catch (error) {
    console.error("Error toggling category subscription:", error);
    return {
      success: false,
      error: "Failed to update subscription",
    };
  }
};

// Get all category subscriptions for a user
export const getUserCategorySubscriptions = async (userId) => {
  try {
    console.log("Fetching subscriptions for user ID:", userId);

    const subscriptionsRef = ref(database, "categorySubscriptions");
    const userSubscriptionsQuery = query(
      subscriptionsRef,
      orderByChild("userId"),
      equalTo(userId)
    );

    const snapshot = await get(userSubscriptionsQuery);

    if (snapshot.exists()) {
      const subscriptions = [];
      snapshot.forEach((childSnapshot) => {
        subscriptions.push(childSnapshot.val());
      });

      return {
        success: true,
        data: subscriptions,
      };
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Error getting user category subscriptions:", error);
    return {
      success: false,
      error: "Failed to load category subscriptions",
    };
  }
};

// Unsubscribe from a category (completely remove the subscription)
export const unsubscribeFromCategory = async (userId, categoryName) => {
  try {
    const subscriptionId = `${userId}_${categoryName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `categorySubscriptions/${subscriptionId}`
    );

    // Check if subscription exists
    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        error: "Subscription not found",
      };
    }

    // Remove the subscription
    await remove(subscriptionRef);

    return {
      success: true,
      message: "Successfully unsubscribed from category",
    };
  } catch (error) {
    console.error("Error unsubscribing from category:", error);
    return {
      success: false,
      error: "Failed to unsubscribe from category",
    };
  }
};
