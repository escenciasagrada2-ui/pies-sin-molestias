// Pies Sin Molestias: guarda la app y las fotos para que abra sin conexión.
// Cambiá VERSION cada vez que publiques cambios, así los celulares bajan la versión nueva.
const VERSION = "psm-v3";
const SHELL = [
  "./pies-sin-molestias.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos propios; las cuentas (Supabase), fuentes y librerías van siempre por internet.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Página: primero internet (para tener siempre la última versión), si no hay conexión, la guardada.
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(VERSION).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match("./pies-sin-molestias.html")))
    );
    return;
  }

  // Fotos, íconos y demás: primero lo guardado, y se guarda lo nuevo la primera vez que se ve.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
