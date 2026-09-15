// LE SERVICE WORKER. Ce qui rend l'app installable sur l'ecran d'accueil et
// utilisable sans reseau.
//
// TROIS caches separes, et c'est volontaire. Chacun a sa propre version,
// parce que chacun change a un rythme different :
//   COQUE     le code et les pages. Change a chaque livraison.
//   MORCEAUX  les JSON de songs/. Changent quand j'ajoute ou corrige un
//             morceau, soit quelques dizaines de Ko.
//   SONS      les 2,6 Mo d'echantillons. Ne changent quasiment jamais.
// Tout mettre ensemble ferait retelecharger 2,6 Mo a chaque correction d'une
// ligne de CSS. Mettre les morceaux avec les sons ferait l'inverse : un
// morceau corrige ne redescendrait JAMAIS, parce que la strategie est cache
// d'abord sans revalidation.
//
// Regle dure n° 4 du projet : aucun appel reseau au moment de jouer. Le
// service worker en est la garantie mecanique, pas seulement une intention.
//
// CE QU'IL N'Y A PAS ICI : la liste des 76 echantillons. Elle vit dans
// src/echantillons.js et nulle part ailleurs. La page, qui importe ce module,
// envoie la liste par postMessage quand on demande a preparer le hors ligne.
// Un service worker Safari ne peut pas etre un module ES, il ne peut donc pas
// importer ce fichier : dupliquer la liste ici aurait cree un troisieme miroir
// a garder d'accord, et un miroir qui derive donne un 404 hors ligne, donc un
// instrument muet sans aucune erreur visible.

// REGLE DE LIVRAISON : monter ce numero a chaque fois qu'un fichier de la
// coque change. La strategie est « cache d'abord » sans revalidation, donc un
// appareil qui a deja la coque en cache continuerait de servir l'ANCIEN code,
// indefiniment, et la correction n'arriverait jamais chez l'enfant. Changer ce
// numero change aussi les octets de ce fichier-ci, ce qui est justement ce qui
// declenche l'installation d'un nouveau service worker.
const VERSION_COQUE = "v6";
const VERSION_MORCEAUX = "v1";   // a monter quand un fichier de songs/ change
const VERSION_SONS = "v1";       // a monter quand un echantillon change
const COQUE = "orchestre-coque-" + VERSION_COQUE;
const MORCEAUX = "orchestre-morceaux-" + VERSION_MORCEAUX;
const SONS = "orchestre-sons-" + VERSION_SONS;

// La coque, mise en cache a l'installation. Tout ce qu'il faut pour que l'app
// s'affiche et reponde au doigt, meme sans reseau et meme sans avoir jamais
// joue. Les sons viennent ensuite, a l'usage ou a la demande.
const FICHIERS_COQUE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "src/app.css",
  "src/app.js",
  "src/moteur.js",
  "src/instruments.js",
  "src/echantillons.js",
  "src/format-morceau.js",
  "src/bibliotheque.js",
  "src/parent.js",
  "src/midi.js",
  "src/vendor/tone.js",
  "assets/silence.mp3",
  "assets/img/icone-32.png",
  "assets/img/icone-180.png",
  "assets/img/icone-192.png",
  "assets/img/icone-512.png",
  "songs/index.json",
];

const cachePour = (url) => {
  if (url.pathname.includes("/assets/samples/")) return SONS;
  if (url.pathname.includes("/songs/")) return MORCEAUX;
  return COQUE;
};

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(COQUE);
    // cache: "reload" : on veut la version du reseau, pas ce que le cache HTTP
    // du navigateur garde sous le coude. Sans ca, une nouvelle coque pourrait
    // se remplir d'anciens fichiers et le numero de version ne servirait a rien.
    await Promise.all(FICHIERS_COQUE.map((u) => c.add(new Request(u, { cache: "reload" }))));
    // Les morceaux se deduisent de l'index : pas de liste en dur, donc pas de
    // miroir a garder d'accord avec songs/index.json.
    try {
      const index = await (await fetch("songs/index.json", { cache: "no-cache" })).json();
      const s = await caches.open(MORCEAUX);
      await Promise.all(index.morceaux.map((id) =>
        s.add(new Request(`songs/${id}.json`, { cache: "reload" }))));
    } catch (err) {
      // Pas bloquant : les morceaux seront mis en cache a la premiere lecture.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const garder = [COQUE, MORCEAUX, SONS];
    for (const nom of await caches.keys()) {
      if (nom.startsWith("orchestre-") && !garder.includes(nom)) await caches.delete(nom);
    }
    await self.clients.claim();
  })());
});

// Cache d'abord, reseau ensuite, et on garde ce qui passe. C'est la bonne
// strategie ici parce que rien n'est dynamique : les memes fichiers servent
// toujours, et l'app doit marcher sans reseau.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const enCache = await caches.match(req, { ignoreSearch: true });
    if (enCache) return enCache;
    try {
      const rep = await fetch(req);
      if (rep && rep.ok && rep.type === "basic") {
        const c = await caches.open(cachePour(url));
        c.put(req, rep.clone());
      }
      return rep;
    } catch (err) {
      // Hors ligne et pas en cache. Pour une navigation, on sert la page
      // d'accueil : l'app se chargera avec ce qu'elle a.
      if (req.mode === "navigate") {
        const accueil = await caches.match("index.html");
        if (accueil) return accueil;
      }
      return new Response("hors ligne et pas en cache", { status: 503, statusText: "hors ligne" });
    }
  })());
});

// « Preparer le hors ligne » : la page envoie la liste des fichiers a garder,
// deduite de src/echantillons.js, et on rend compte de l'avancement. Un par un
// et pas en addAll, pour pouvoir afficher une progression et ne pas tout
// perdre si un seul fichier echoue.
self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type !== "garde-hors-ligne" || !Array.isArray(msg.urls)) return;
  const source = e.source;
  e.waitUntil((async () => {
    const sons = await caches.open(SONS), morceaux = await caches.open(MORCEAUX);
    let fait = 0, rates = 0;
    for (const u of msg.urls) {
      const c = String(u).includes("/songs/") ? morceaux : sons;
      try {
        if (await c.match(u)) { fait++; }
        else { await c.add(u); fait++; }
      } catch (err) { rates++; }
      if ((fait + rates) % 8 === 0 || fait + rates === msg.urls.length) {
        source.postMessage({ type: "hors-ligne-avance", fait, rates, total: msg.urls.length });
      }
    }
    source.postMessage({ type: "hors-ligne-fini", fait, rates, total: msg.urls.length });
  })());
});
