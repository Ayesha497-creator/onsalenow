const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendBrandNotification = functions.database
  .ref("/products/{productId}")
  .onCreate(async (snapshot, context) => {
    const product = snapshot.val();
    const brandKey = product.brand.replace(/\s+/g, "_").toLowerCase();
    const subscriptionsRef = admin.database().ref("brandSubscriptions");
    const snapshotSubscriptions = await subscriptionsRef
      .orderByChild("brandName")
      .equalTo(brandKey)
      .get();

    const tokens = [];
    snapshotSubscriptions.forEach((childSnapshot) => {
      const subscription = childSnapshot.val();
      if (subscription.active && subscription.fcmToken) {
        tokens.push(subscription.fcmToken);
      }
    });

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: `New product in ${product.brand}`,
          body: `${product.name || "A new product"} is available now!`,
        },
      };

      try {
        await admin.messaging().sendToDevice(tokens, payload);
        console.log("Notifications sent successfully.");
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }
  });
