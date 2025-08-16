// importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  
  const title = data.title || '📣 New Notificationnnnn';
  const options = {
    body: data.alert || 'You have a new messageeeee!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
