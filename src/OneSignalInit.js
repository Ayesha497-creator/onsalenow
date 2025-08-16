import OneSignal from 'react-onesignal';

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: "d2bc8f72-d654-4b6e-8554-aa3dd5d38bda",
      safari_web_id: "YOUR_SAFARI_WEB_ID", // Optional: Only needed if you want Safari push
      notifyButton: {
        enable: true, // Shows the bell icon in the bottom right
      },
      allowLocalhostAsSecureOrigin: true, // For testing on localhost
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Would you like to receive notifications about new products from your favorite brands?",
                acceptButton: "Yes",
                cancelButton: "No"
              },
              delay: {
                pageViews: 1,
                timeDelay: 10
              }
            }
          ]
        }
      }
    });

    console.log("OneSignal initialized successfully");
    // window.OneSignal = OneSignal;
    return true;
  } catch (error) {
    console.error("Error initializing OneSignal:", error);
    return false;
  }
};

// Function to add brand subscription tag to OneSignal
export const addBrandTagToOneSignal = async (brandName) => {
  try {
    // Format the brand name to match your tag format
    const brandKey = brandName.replace(/\s+/g, "_").toLowerCase();

    // Set the tag for this brand to true
    await OneSignal.sendTag(`brand_${brandKey}`, "true");
    // await window.OneSignal.sendTags({
    //   [`brand_${brandKey}`]: "true",
    // });
    console.log(`Successfully added OneSignal tag for brand: ${brandName}`);
    return true;
  } catch (error) {
    console.error(`Error adding brand tag to OneSignal: ${error}`);
    return false;
  }
};

// Function to remove brand tag from OneSignal
export const removeBrandTagFromOneSignal = async (brandName) => {
  try {
    const brandKey = brandName.replace(/\s+/g, "_").toLowerCase();
    await OneSignal.deleteTag(`brand_${brandKey}`);
    //  await window.OneSignal.deleteTag(`brand_${brandKey}`);
    console.log(`Successfully removed OneSignal tag for brand: ${brandName}`);
    return true;
  } catch (error) {
    console.error(`Error removing brand tag from OneSignal: ${error}`);
    return false;
  }
};

// Function to get the OneSignal User ID (useful for debugging)
export const getOneSignalUserId = async () => {
  try {
    const deviceState = await OneSignal.getDeviceState();
    return deviceState.userId;
  } catch (error) {
    console.error("Error getting OneSignal User ID:", error);
    return null;
  }
};