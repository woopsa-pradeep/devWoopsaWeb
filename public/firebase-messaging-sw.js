importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
    apiKey: "AIzaSyD_rshvbucHnIRbvxUckVjRYSsEC8t2Wwo",
    authDomain: "retailer-woopsa.firebaseapp.com",
    projectId: "retailer-woopsa",
    storageBucket: "retailer-woopsa.firebasestorage.app",
    messagingSenderId: "533776914587",
    appId: "1:533776914587:web:374b37857532658864ce3e",
    measurementId: "G-JFYK43WHZJ"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  const { title, body } = payload.notification || {};

  // Show notification
  const notificationTitle = title || 'New Message';
  const notificationOptions = {
    body: body || 'You have a new message',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'fcm-notification',
    requireInteraction: false,
    silent: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
