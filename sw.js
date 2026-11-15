/* Mon Budget Zen : mode hors-ligne.
   À déposer à côté de index.html (même dossier sur GitHub Pages).
   - la page : réseau d'abord (pour recevoir les mises à jour), copie en cache si pas de réseau
   - photos des thèmes, polices, scripts : cache d'abord, téléchargés une fois puis gardés */
const VERSION = 'mbz-v1';
const PAGE = 'mbz-page-' + VERSION;
const MEDIA = 'mbz-media-' + VERSION;
 
self.addEventListener('install', e => {
    e.waitUntil(caches.open(PAGE).then(c => Promise.all(
        ['./', './index.html', './plus.mp4', './revenus.mp4'].map(u => c.add(u).catch(() => {}))
    )).then(() => self.skipWaiting()));
});
 
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== PAGE && k !== MEDIA).map(k => caches.delete(k))
    )).then(() => self.clients.claim()));
});
 
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
 
    // la page elle-même : réseau d'abord, cache si hors-ligne
    if (req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname))) {
        e.respondWith(fetch(req).then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(PAGE).then(c => c.put('./index.html', copy)); }
            return res;
        }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
        return;
    }
 
    // photos, polices, scripts, vidéos : cache d'abord
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(MEDIA).then(c => c.put(req, copy)); }
        return res;
    }).catch(() => hit)));
});
 
