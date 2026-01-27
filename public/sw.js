/* Basic Service Worker for notifications */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional: handle push if you later add real push subscriptions
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "CodeOwl", body: event.data?.text?.() };
  }

  const title = payload.title || "CodeOwl";
  const options = {
    body: payload.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data || {},
    tag: payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const hadWindow = clientsArr.find((c) => c.url.includes(url));
      if (hadWindow) return hadWindow.focus();
      return self.clients.openWindow(url);
    })
  );
});

