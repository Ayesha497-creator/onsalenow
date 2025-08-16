// OneSignalProvider.jsx
import { useEffect } from "react";
import OneSignal from "react-onesignal";

export const OneSignalProvider = () => {
  useEffect(() => {
    const initOneSignal = async () => {
      await OneSignal.init({
        // OneSignal.init({
        appId: "d2bc8f72-d654-4b6e-8554-aa3dd5d38bda",
        safari_web_id: "web.onesignal.auto.YOUR-ID", // replace if needed
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true,
        },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: true,
                text: {
                  actionMessage: "Would you like to receive notifications?",
                  acceptButton: "Yes",
                  cancelButton: "No",
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 10,
                },
              },
            ],
          },
        },
      });
    }
    initOneSignal();
  }, []);

  return null;
};
