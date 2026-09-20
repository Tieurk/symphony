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
const VERSION_COQUE = "v8";
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

// DANS QUEL CACHE RANGER CETTE URL. Un fichier ne doit vivre que dans UN
// cache : voir la reparation dans activate, et le defaut du 19 septembre 2026
// plus bas.
const cachePour = (url) => {
  if (url.pathname.includes("/assets/samples/")) return SONS;
  // songs/index.json fait partie de la COQUE, il est dans FICHIERS_COQUE. Le
  // ranger avec les morceaux le mettait dans un cache JAMAIS versionne et ne
  // AVANT la coque, donc prioritaire a la lecture : sa copie perimee masquait
  // la bonne, et la liste des morceaux se figeait pour toujours.
  if (url.pathname.endsWith("/songs/index.json")) return COQUE;
  if (url.pathname.includes("/songs/")) return MORCEAUX;
  return COQUE;
};

// cache: "reload" : on veut la version du reseau, pas ce que le cache HTTP du
// navigateur garde sous le coude. Sans ca, une nouvelle coque pourrait se
// remplir d'anciens fichiers et le numero de version ne servirait a rien.
//
// L'option n'existe pas sur toutes les versions de Safari, et sa seule
// CONSTRUCTION peut lever. Comme l'installation est un Promise.all, une seule
// levee faisait echouer l'installation entiere sur cet appareil, en silence,
// et l'app y restait sur l'ancienne coque indefiniment.
function demande(u) {
  try { return new Request(u, { cache: "reload" }); }
  catch (err) { return new Request(u); }
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(COQUE);
    await Promise.all(FICHIERS_COQUE.map((u) => c.add(demande(u))));

    // VERIFIER PLUTOT QUE CROIRE. Une coque incomplete qui prend la main sert
    // des 404 : l'app ne se charge plus et rien ne le dit. On refuse alors de
    // s'installer, et l'ancienne coque, elle coherente, continue de servir.
    const manquants = [];
    for (const u of FICHIERS_COQUE) if (!(await c.match(u))) manquants.push(u);
    if (manquants.length) throw new Error("coque incomplete : " + manquants.join(", "));

    // Les morceaux se deduisent de l'index : pas de liste en dur, donc pas de
    // miroir a garder d'accord avec songs/index.json.
    try {
      const index = await (await fetch("songs/index.json", { cache: "no-cache" })).json();
      const s = await caches.open(MORCEAUX);
      await Promise.all(index.morceaux.map((id) => s.add(demande(`songs/${id}.json`))));
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

    // REPARATION, une fois pour toutes, du defaut du 19 septembre 2026.
    // L'ancien routage rangeait songs/index.json dans le cache des morceaux.
    // Ce cache n'est jamais versionne et il est ne AVANT la coque : comme la
    // lecture se faisait par un caches.match() global, qui parcourt les caches
    // dans l'ordre de CREATION, sa copie perimee masquait la copie fraiche de
    // la coque. La liste des morceaux se figeait donc pour toujours, et aucune
    // montee de VERSION_COQUE ne pouvait la debloquer. Mesure faite : 2
    // morceaux servis alors que la coque en contenait 9.
    try {
      const m = await caches.open(MORCEAUX);
      for (const req of await m.keys()) {
        if (new URL(req.url).pathname.endsWith("/songs/index.json")) await m.delete(req);
      }
    } catch (err) { /* rien a reparer */ }

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
    // ON REGARDE DANS LE SEUL CACHE DESIGNE pour cette URL, et plus dans tous
    // les caches a la fois. caches.match() global parcourt les caches dans
    // l'ordre de CREATION : une copie perimee dans un cache ne plus tot
    // masquait definitivement la copie fraiche de la coque. C'est le defaut
    // du 19 septembre 2026, voir cachePour() et la reparation dans activate.
    const c = await caches.open(cachePour(url));
    const enCache = await c.match(req, { ignoreSearch: true });
    if (enCache) return enCache;
    try {
      const rep = await fetch(req);
      if (rep && rep.ok && rep.type === "basic") {
        // ATTENDU, jamais en tache de fond : iOS arrete les service workers
        // sans menagement, et une entree a moitie ecrite donne un corps qui ne
        // finit jamais d'arriver, donc un chargement suspendu pour toujours.
        await c.put(req, rep.clone());
      }
      return rep;
    } catch (err) {
      // Hors ligne et pas en cache. Pour une navigation, on sert la page
      // d'accueil : l'app se chargera avec ce qu'elle a.
      if (req.mode === "navigate") {
        const coque = await caches.open(COQUE);
        const accueil = (await coque.match("index.html")) || (await coque.match("./"));
        if (accueil) return accueil;
      }
      // Une ERREUR RESEAU FRANCHE, et surtout pas un 503 avec un corps texte.
      // Un echantillon manquant servi en 503 arrivait jusqu'a decodeAudioData,
      // qui sur WebKit peut ne JAMAIS rappeler : le chargement des sons restait
      // alors suspendu, et l'anneau du bouton de lecture tournait sans fin.
      return Response.error();
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
    let fait = 0, rates = 0;
    for (const u of msg.urls) {
      // Le meme routage que partout ailleurs : un fichier, un seul cache.
      const c = await caches.open(cachePour(new URL(u, self.location.href)));
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
