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

// Create a new brand subscription
export const subscribeToBrand = async (userId, brandName, fcmToken) => {
  try {
    // Check if subscription already exists
    const existingSubscription = await checkBrandSubscription(
      userId,
      brandName
    );

    if (existingSubscription.exists) {
      // If it exists but is inactive, reactivate it
      if (!existingSubscription.data.active) {
        return await toggleBrandSubscription(
          userId,
          brandName,
          false,
          existingSubscription.id
        );
      }

      // If it's already active, just return success
      return {
        success: true,
        message: "You are already subscribed to this brand",
        data: existingSubscription.data,
      };
    }

    // Create a new subscription
    const subscriptionId = `${userId}_${brandName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `brandSubscriptions/${subscriptionId}`
    );

    const subscriptionData = {
      id: subscriptionId,
      userId,
      brandName,
      fcmToken,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await set(subscriptionRef, subscriptionData);

    // await addBrandTagToOneSignal(brandName);
    const tagKey = `brand_${brandName.replace(/\s+/g, "_").toLowerCase()}`;
      await OneSignal.User.addTags({ [tagKey]: "true" });
    // if (typeof window !== "undefined" && window.OneSignal) {
    //   window.OneSignal.push(function () {
    //     window.OneSignal.sendTags({ [tagKey]: "true" });
    //   });
    // }

    return {
      success: true,
      message: "Successfully subscribed to brand",
      data: subscriptionData,
    };
  } catch (error) {
    console.error("Error subscribing to brand:", error);
    return {
      success: false,
      error: "Failed to subscribe to brand",
    };
  }
};

// Check if a user is subscribed to a brand
export const checkBrandSubscription = async (userId, brandName) => {
  try {
    const subscriptionId = `${userId}_${brandName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `brandSubscriptions/${subscriptionId}`
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
    console.error("Error checking brand subscription:", error);
    return {
      exists: false,
      error: "Failed to check subscription status",
    };
  }
};

// Toggle a brand subscription (activate/deactivate)
export const toggleBrandSubscription = async (
  userId,
  brandName,
  currentStatus,
  fcmToken = null,
  subscriptionId = null
) => {
  try {
    // If subscriptionId is not provided, generate it
    if (!subscriptionId) {
      subscriptionId = `${userId}_${brandName
        .replace(/\s+/g, "_")
        .toLowerCase()}`;
    }

    const subscriptionRef = ref(
      database,
      `brandSubscriptions/${subscriptionId}`
    );

    // Check if subscription exists
    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      // If trying to activate a non-existent subscription, create it
      if (!currentStatus) {
        return await subscribeToBrand(userId, brandName, fcmToken);
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

    const tagKey = `brand_${brandName.replace(/\s+/g, "_").toLowerCase()}`;
    // if (typeof window !== "undefined" && window.OneSignal) {
    if (currentStatus) {
      await OneSignal.User.removeTag(tagKey);
      // window.OneSignal.push(function () {
      //   window.OneSignal.deleteTag(tagKey);
      // });
    } else {

        await OneSignal.User.addTags({ [tagKey]: "true" });

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
    console.error("Error toggling brand subscription:", error);
    return {
      success: false,
      error: "Failed to update subscription",
    };
  }
};

// Get all brand subscriptions for a user
export const getUserBrandSubscriptions = async (userId) => {
  try {
    console.log("Fetching subscriptions for user ID:", userId);

    const subscriptionsRef = ref(database, "brandSubscriptions");
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
    console.error("Error getting user brand subscriptions:", error);
    return {
      success: false,
      error: "Failed to load brand subscriptions",
    };
  }
};

// Unsubscribe from a brand (completely remove the subscription)
export const unsubscribeFromBrand = async (userId, brandName) => {
  try {
    const subscriptionId = `${userId}_${brandName
      .replace(/\s+/g, "_")
      .toLowerCase()}`;
    const subscriptionRef = ref(
      database,
      `brandSubscriptions/${subscriptionId}`
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
      message: "Successfully unsubscribed from brand",
    };
  } catch (error) {
    console.error("Error unsubscribing from brand:", error);
    return {
      success: false,
      error: "Failed to unsubscribe from brand",
    };
  }
};
