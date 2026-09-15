// MON PREMIER ORCHESTRE, l'interaction.
//
// Ce fichier ne sait rien de l'audio au dela de trois verbes : ouvre, ferme,
// et les deux rappels visuels du moteur. Toute la connaissance de Tone.js vit
// dans src/moteur.js, y compris la synchronisation des animations. L'app ne
// touche JAMAIS a Tone directement.
//
// L'etat tient en un tableau : `emplacements`, six cases valant un
// identifiant d'instrument ou null. La reserve n'a pas d'etat propre : un
// instrument est en reserve s'il n'est pas dans ce tableau. Un seul etat, donc
// pas de desynchronisation possible entre la scene et la reserve.

import { INSTRUMENTS, injecteSprite, instrument } from "./instruments.js";
import * as moteur from "./moteur.js";
import * as biblio from "./bibliotheque.js";
import * as parent from "./parent.js";

injecteSprite();

const NB_PLACES = 6;
const SEUIL_GLISSER = 8;      // px avant qu'un appui devienne un glisser
const APPUI_LONG = 2000;      // ms sur l'engrenage, comme dit le cadrage
const BRIDE_TRESSAUT = 150;   // ms entre deux tressauts du meme instrument
const CLE = "orchestre";      // cle de persistance
const VERSION = "phase 1, hors ligne, 15 septembre 2026";

const emplacements = new Array(NB_PLACES).fill(null);
let morceaux = [];
let choisi = 0;
let amorcage = null;          // la promesse d'amorcage, une seule fois
let veutJouer = false;        // l'intention de lecture, voir plus bas
let intentionDite = false;    // un geste a-t-il DEJA dit ce qu'il voulait ?

const $ = (id) => document.getElementById(id);
const zScene = $("scene"), zPlaces = $("places"), zMorceaux = $("morceaux");
const fantome = $("fantome");

// --- rendu ------------------------------------------------------------------
// Le DOM est ecrit UNE fois, puis on ne fait plus que basculer des classes et
// changer la cible des <use>. Reconstruire en innerHTML casserait les
// animations en cours et les captures de pointeur.

const dessin = (id) => {
  const i = instrument(id);
  return `<svg class="f-${i.famille}"><use href="#i-${id}"/></svg>`;
};

zPlaces.innerHTML = Array.from({ length: NB_PLACES },
  () => `<div class="place libre"><svg><use href="#i-violon"/></svg></div>`).join("");
const places = [...zPlaces.children];

const GAUCHE = ["cordes", "bois"];
const jetonHtml = (i) =>
  `<div class="jeton" data-inst="${i.id}" title="${i.nom}">${dessin(i.id)}</div>`;
$("res-a").innerHTML = INSTRUMENTS.filter((i) => GAUCHE.includes(i.famille)).map(jetonHtml).join("");
$("res-b").innerHTML = INSTRUMENTS.filter((i) => !GAUCHE.includes(i.famille)).map(jetonHtml).join("");
$("res-portrait").innerHTML = INSTRUMENTS.map(jetonHtml).join("");
// Un instrument a DEUX jetons dans le DOM, un par mise en page : un seul est
// visible a la fois, les deux portent le meme data-inst.
const jetons = [...document.querySelectorAll(".jeton")];

function rend() {
  places.forEach((el, n) => {
    const id = emplacements[n];
    const use = el.querySelector("use"), svg = el.querySelector("svg");
    if (id) {
      use.setAttribute("href", "#i-" + id);
      svg.setAttribute("class", "f-" + instrument(id).famille);
      el.dataset.inst = id;
    } else {
      delete el.dataset.inst;
    }
    el.classList.toggle("occupe", !!id);
    el.classList.toggle("libre", !id);
  });
  for (const j of jetons) j.classList.toggle("vide", surScene(j.dataset.inst));
  const m = morceaux[choisi];
  for (const b of zMorceaux.children) b.classList.toggle("choisi", +b.dataset.morceau === choisi);
  if (m) document.title = "Mon premier orchestre, " + m.titre;
  sauve();
}

// --- persistance ------------------------------------------------------------
// La scene, le morceau et les reglages survivent a la fermeture. Sans ca, un
// enfant qui rouvre l'app retrouve une scene vide et doit tout reposer.
//
// Piege iOS n° 4 : les donnees d'un simple onglet Safari peuvent etre purgees
// apres sept jours, celles d'une PWA installee sur l'ecran d'accueil
// persistent. D'ou l'interet d'installer.

function sauve() {
  try {
    localStorage.setItem(CLE, JSON.stringify({
      v: 2, emplacements,
      // L'IDENTIFIANT et pas le rang : la bibliotheque se reordonne et se
      // masque, donc un rang enregistre designerait un autre morceau au
      // prochain lancement.
      choisiId: morceaux[choisi] ? morceaux[choisi].id : null,
      tempo: +$("tempo").value, volume: +$("volume").value,
    }));
  } catch (e) { /* navigation privee, quota plein : on continue sans */ }
}

function restaure() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { return; }
  if (!d || d.v !== 2) return;
  // On valide TOUT : localStorage peut contenir n'importe quoi, une version
  // precedente du format, ou une saisie a la main. Un identifiant inconnu
  // poserait un instrument fantome sur la scene.
  const connus = new Set(INSTRUMENTS.map((i) => i.id));
  if (Array.isArray(d.emplacements) && d.emplacements.length === NB_PLACES) {
    const vus = new Set();
    d.emplacements.forEach((id, n) => {
      if (typeof id === "string" && connus.has(id) && !vus.has(id)) {
        emplacements[n] = id;
        vus.add(id);
      }
    });
  }
  const n = morceaux.findIndex((m) => m.id === d.choisiId);
  if (n >= 0) choisi = n;
  if (Number.isFinite(d.tempo) && d.tempo >= 60 && d.tempo <= 140) $("tempo").value = d.tempo;
  if (Number.isFinite(d.volume) && d.volume >= 0 && d.volume <= 100) $("volume").value = d.volume;
}

const surScene = (id) => emplacements.includes(id);

// --- poser, retirer, echanger -----------------------------------------------
// Poser appelle moteur.ouvre, retirer appelle moteur.ferme, et rien d'autre.
// Demarrer ou arreter une partie pour gerer l'audibilite est l'interdit
// central du projet : les 13 parties tournent en permanence.

function pose(id, cible) {
  if (surScene(id)) return;
  const n = cible === undefined ? emplacements.indexOf(null) : cible;
  if (n < 0) { refuse(id); return; }           // scene pleine
  if (emplacements[n] !== null) { echange(n, id); return; }
  emplacements[n] = id;
  moteur.ouvre(id);
  rend();
}

function retire(id) {
  const n = emplacements.indexOf(id);
  if (n < 0) return;
  emplacements[n] = null;
  moteur.ferme(id);
  rend();
}

// Glisser sur un emplacement occupe : echange, comme dit le cadrage.
function echange(n, id) {
  const sortant = emplacements[n];
  if (sortant === id) return;
  const depuis = emplacements.indexOf(id);
  if (depuis >= 0) {
    // deux instruments deja poses permutent : rien a ouvrir ni fermer
    emplacements[depuis] = sortant;
  } else {
    // l'entrant vient de la reserve, le sortant y retourne
    moteur.ferme(sortant);
    moteur.ouvre(id);
  }
  emplacements[n] = id;
  rend();
}

function deplace(n, id) {
  const depuis = emplacements.indexOf(id);
  if (depuis === n) return;
  if (depuis >= 0) emplacements[depuis] = null; else moteur.ouvre(id);
  emplacements[n] = id;
  rend();
}

// Scene pleine : l'instrument touche tremble, les 6 emplacements clignotent
// une fois, et RIEN n'est remplace. C'est le comportement du jouet.
function refuse(id) {
  for (const j of jetons) {
    if (j.dataset.inst !== id) continue;
    j.classList.remove("refus");
    void j.offsetWidth;
    j.classList.add("refus");
  }
  for (const el of places) {
    el.classList.remove("clignote");
    void el.offsetWidth;
    el.classList.add("clignote");
  }
}
document.addEventListener("animationend", (e) => {
  e.target.classList.remove("refus", "clignote", "joue");
});

// --- amorcage et intention de lecture ---------------------------------------
// Le contexte audio d'iOS ne demarre qu'apres un geste, et le bouton silencieux
// de l'iPhone se contourne dans le meme geste. Donc le PREMIER geste amorce,
// quel qu'il soit : un enfant touche un instrument, ca doit jouer.
//
// PIEGE QUI A MORDU, et qui ne se voyait pas : confondre « amorcer » et
// « jouer ». Le pointerdown global amorce, l'amorcage lancait la lecture, et
// le clic qui suivait sur le bouton BASCULAIT ce qu'il venait de lancer. Un
// enfant qui appuyait d'abord sur lecture, le geste le plus naturel, obtenait
// le silence, et il fallait appuyer deux fois. Mesure : horloge « paused »,
// crete SILENCE, 0 echantillon audible sur 120.
//
// Donc deux choses separees :
//   AMORCER      ouvrir le contexte, construire le graphe, charger le
//                morceau. N'importe quel geste, une seule fois.
//   VOULOIR      une intention qui vit dans l'app, appliquee au moteur des
//                qu'il existe et reappliquee a chaque changement. L'ordre
//                d'arrivee des evenements n'y change plus rien.

function amorce() {
  if (amorcage) return amorcage;
  $("play").classList.add("charge");
  amorcage = (async () => {
    try {
      await moteur.demarre();
      moteur.chargeMorceau(morceaux[choisi]);
      moteur.volume(+$("volume").value / 100);
      moteur.tempo(+$("tempo").value);
      // LE PIEGE DE CE BATCH, et il ne se voit pas : moteur.ouvre() appele
      // avant que le graphe existe est un no-op SILENCIEUX, la voie n'existe
      // pas encore. Les instruments poses pendant le chargement resteraient
      // donc muets. On reapplique l'etat une fois le moteur pret.
      for (const id of emplacements) if (id) moteur.ouvre(id);
      appliqueLecture();
    } catch (e) {
      console.error("amorcage audio : ", e);
      amorcage = null;   // on pourra reessayer au geste suivant
    } finally {
      $("play").classList.remove("charge");
    }
  })();
  return amorcage;
}

// LA SEULE PORTE pour changer l'intention, et elle applique toujours. Poser
// le drapeau sans appliquer a ete la deuxieme morsure du meme piege : le geste
// disait « joue », le moteur etait deja pret, et personne ne le lui
// transmettait. Horloge « stopped », crete SILENCE.
function veut(jouer) {
  veutJouer = jouer;
  intentionDite = true;
  appliqueLecture();
}

// Appelable a tout moment. Avant l'amorcage, ca ne fait que repondre a
// l'oeil : l'etat voulu partira au moteur des qu'il existe.
function appliqueLecture() {
  majPlay();
  if (!moteur.estPret()) return;
  if (veutJouer) moteur.lecture(); else moteur.pause();
}

// L'icone montre ce que l'enfant a DEMANDE, pas l'etat de l'horloge : le
// chargement des treize instruments prend un moment, et un bouton qui ne
// repond pas tout de suite se fait appuyer une deuxieme fois.
function majPlay() {
  // Une classe, pas l'attribut hidden : voir le commentaire de src/app.css,
  // hidden n'existe pas sur un SVGElement.
  $("play").classList.toggle("joue", veutJouer);
  $("play").setAttribute("aria-label", veutJouer ? "pause" : "lecture");
}

// --- appui simple -----------------------------------------------------------

function appuie(id) {
  if (surScene(id)) retire(id); else pose(id);
}

// --- glisser-deposer --------------------------------------------------------
// Pointer events : un seul chemin de code pour la souris et le doigt. Un
// glisser ne commence qu'apres SEUIL_GLISSER pixels, sinon il avalerait
// l'appui simple et les deux gestes s'excluraient au lieu d'etre equivalents.

let glisse = null;

function origine(el) {
  // Ni un jeton vide (son instrument est sur scene, il n'y a rien a prendre),
  // ni un emplacement libre.
  if (!el || !el.dataset.inst) return null;
  if (el.classList.contains("vide")) return null;
  return el;
}

document.addEventListener("pointerdown", (e) => {
  // Le PREMIER geste qui exprime une intention lance la lecture : un enfant
  // qui touche un instrument attend du son. Deux endroits n'expriment aucune
  // intention, et c'est pour ca qu'on regarde « intentionDite » et pas
  // « amorcage » : le bouton de lecture (il bascule, c'est son role) et la
  // zone parent. Mesure faite avec la condition sur amorcage : un parent qui
  // importait un morceau amorcait l'audio dans le panneau, donc le geste
  // suivant n'etait plus « le premier », et l'app restait muette jusqu'a ce
  // qu'on appuie sur lecture. Crete SILENCE, 0 echantillon audible sur 120.
  if (!intentionDite && !e.target.closest("#play, #engrenage, #parent")) veut(true);
  amorce();
  const el = origine(e.target.closest("[data-inst]"));
  if (!el) return;
  glisse = { id: el.dataset.inst, el, x: e.clientX, y: e.clientY, pid: e.pointerId, actif: false };
  try { el.setPointerCapture(e.pointerId); } catch (err) { /* souris hors capture */ }
});

document.addEventListener("pointermove", (e) => {
  if (!glisse || e.pointerId !== glisse.pid) return;
  if (!glisse.actif) {
    if (Math.hypot(e.clientX - glisse.x, e.clientY - glisse.y) < SEUIL_GLISSER) return;
    glisse.actif = true;
    fantome.innerHTML = dessin(glisse.id);
    fantome.hidden = false;
    glisse.el.classList.add("enleve");
  }
  fantome.style.left = e.clientX + "px";
  fantome.style.top = e.clientY + "px";
  marqueCible(e.clientX, e.clientY);
});

function fin(e) {
  if (!glisse || e.pointerId !== glisse.pid) return;
  const g = glisse;
  glisse = null;
  fantome.hidden = true;
  g.el.classList.remove("enleve");
  effaceCibles();
  if (!g.actif) { appuie(g.id); return; }       // c'etait un appui, pas un glisser
  depose(g.id, cible(e.clientX, e.clientY));
}
document.addEventListener("pointerup", fin);
document.addEventListener("pointercancel", (e) => {
  if (!glisse || e.pointerId !== glisse.pid) return;
  const g = glisse;
  glisse = null;
  fantome.hidden = true;
  g.el.classList.remove("enleve");
  effaceCibles();
});

function cible(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const place = el.closest(".place");
  if (place) return { type: "place", n: places.indexOf(place) };
  if (el.closest(".res-paysage, .res-portrait")) return { type: "reserve" };
  return null;
}

function depose(id, c) {
  if (!c) return;                                // hors cible : annule
  if (c.type === "reserve") { retire(id); return; }
  const n = c.n;
  if (emplacements[n] === null) deplace(n, id);
  else echange(n, id);
}

function marqueCible(x, y) {
  effaceCibles();
  const c = cible(x, y);
  if (!c) return;
  if (c.type === "place") places[c.n].classList.add("visee");
  else for (const z of document.querySelectorAll(".res-paysage, .res-portrait")) z.classList.add("visee");
}
function effaceCibles() {
  for (const el of document.querySelectorAll(".visee")) el.classList.remove("visee");
}

// --- controles --------------------------------------------------------------

$("play").addEventListener("click", async () => {
  veut(!veutJouer);           // l'icone repond dans le geste
  await amorce();             // amorce, ou attend l'amorcage deja en cours
  appliqueLecture();          // et le moteur suit des qu'il existe
});

zMorceaux.addEventListener("click", (e) => {
  const b = e.target.closest("[data-morceau]");
  if (!b) return;
  vaAuMorceau(+b.dataset.morceau);
});
$("suivant").addEventListener("click", () => vaAuMorceau((choisi + 1) % morceaux.length));

// Changer de morceau garde les instruments en place et repart du debut dans le
// meme etat de lecture. C'est le moteur qui tient cette promesse.
async function vaAuMorceau(n) {
  choisi = n;
  rend();
  await amorce();
  moteur.chargeMorceau(morceaux[choisi]);
}

// Tempo de 60 a 140 %, aimante sur les trois reperes : a moins de 4 %, ca colle.
const REPERES = [60, 100, 140];
$("tempo").addEventListener("input", async (e) => {
  let v = +e.target.value;
  for (const r of REPERES) if (Math.abs(v - r) <= 4) v = r;
  e.target.value = v;
  majReperes(v);
  await amorce();
  moteur.tempo(v);
});
function majReperes(v) {
  const marques = [...document.querySelectorAll(".reperes svg")];
  const proche = REPERES.reduce((a, r, i) => (Math.abs(v - r) < Math.abs(v - REPERES[a]) ? i : a), 0);
  marques.forEach((s, i) => s.classList.toggle("actif", i === proche && Math.abs(v - REPERES[i]) <= 4));
}

$("volume").addEventListener("input", async (e) => {
  await amorce();
  moteur.volume(+e.target.value / 100);
});
// A la fin du geste seulement : un enregistrement par pixel parcouru serait
// une ecriture synchrone par pixel.
for (const id of ["tempo", "volume"]) $(id).addEventListener("change", sauve);

// --- zone parent, appui long de 2 s -----------------------------------------
//
// « Marche pas », rapporte par Mathieu sur l'iPad le 15 septembre 2026. Rien
// ne se voyait dans un navigateur sans tete, et il y avait TROIS defauts
// empiles sur un geste de deux secondes :
//
// 1. RIEN NE SE VOYAIT PENDANT L'APPUI. Deux secondes sans retour visuel, on
//    lache avant la fin, et il ne se passe rien. Un anneau se remplit
//    maintenant sur l'engrenage, et sa duree vient de APPUI_LONG.
// 2. iOS PRENAIT LA MAIN SUR LE GESTE. L'engrenage n'avait ni
//    -webkit-touch-callout: none ni user-select: none, seuls les jetons et les
//    emplacements les avaient. Un doigt pose deux secondes sur un element
//    selectionnable declenche le menu systeme, donc un pointercancel, donc
//    l'annulation du minuteur. Corrige dans src/app.css, sur .rond.
// 3. LE MINUTEUR POUVAIT ARRIVER APRES LE DOIGT. Le premier geste de la
//    session declenche aussi l'amorcage audio : 2,6 Mo a telecharger et a
//    decoder, ce qui retarde un setTimeout. Si le doigt se leve avant que le
//    minuteur ne tire, l'ancien code annulait tout. On DECIDE DONC SUR LE
//    TEMPS ECOULE et plus sur l'ordre des rappels, comme pour l'intention de
//    lecture : un etat mesure ne depend pas de qui repond le premier.
//
// Le mouvement se mesure depuis le point de depart et plus par movementX, qui
// n'est pas fiable sur un evenement tactile de Safari et qui comparait de
// toute facon un pas entre deux evenements, pas une distance parcourue.

let minuteur = null;
let debutAppui = 0;
let departAppui = null;
const eng = $("engrenage");
const SEUIL_ENGRENAGE = 16;     // px de derapage toleres avant d'abandonner
eng.style.setProperty("--appui", APPUI_LONG + "ms");

function ouvreParent() {
  // Rafraichir AVANT d'afficher : la liste et le compte des sons en cache ont
  // pu changer depuis la derniere ouverture.
  parent.rafraichis();
  parent.majHorsLigne();
  $("parent").hidden = false;
  annule();
}

function annule() {
  if (minuteur) { clearTimeout(minuteur); minuteur = null; }
  debutAppui = 0;
  departAppui = null;
  eng.classList.remove("presse");
}

let minuteurAstuce = null;
function astuce(texte) {
  const z = $("astuce");
  z.textContent = texte;
  z.hidden = false;
  if (minuteurAstuce) clearTimeout(minuteurAstuce);
  minuteurAstuce = setTimeout(() => { z.hidden = true; }, 2600);
}

eng.addEventListener("pointerdown", (e) => {
  debutAppui = performance.now();
  departAppui = { x: e.clientX, y: e.clientY };
  // Retirer puis remettre la classe, sinon l'animation de l'anneau ne repart
  // pas au deuxieme appui.
  eng.classList.remove("presse");
  void eng.offsetWidth;
  eng.classList.add("presse");
  minuteur = setTimeout(ouvreParent, APPUI_LONG);
  try { eng.setPointerCapture(e.pointerId); } catch (err) { /* souris hors capture */ }
});

// TROIS APPUIS DE SUITE OUVRENT AUSSI, et c'est une porte de secours
// assumee. Si iOS mange encore le maintien sur un appareil que je ne peux pas
// essayer, un parent reste enferme dehors : la zone parent porte les credits,
// le hors ligne et la bibliotheque. Compter trois lachers en 1,5 s ne depend
// d'aucun maintien, donc d'aucun comportement systeme, et reste hors de
// portee d'un geste de jeu : un enfant touche les instruments, pas trois fois
// de suite un engrenage de 68 px. Ca donne aussi un diagnostic : si les trois
// appuis marchent et que le maintien non, c'est le maintien qui est mange.
const FENETRE_TRIPLE = 1500;
let appuis = [];

function relache() {
  if (!debutAppui) return;
  const tenu = performance.now() - debutAppui;
  // minuteur non nul veut dire qu'il n'a pas encore tire : s'il est en retard
  // alors que le temps est fait, on ouvre quand meme.
  if (minuteur !== null && tenu >= APPUI_LONG) { ouvreParent(); appuis = []; return; }
  annule();

  const t = performance.now();
  appuis = appuis.filter((x) => t - x < FENETRE_TRIPLE);
  appuis.push(t);
  if (appuis.length >= 3) { appuis = []; ouvreParent(); return; }
  astuce("Garde le doigt appuyé 2 secondes sur l'engrenage, ou appuie trois fois de suite.");
}
eng.addEventListener("pointerup", relache);
eng.addEventListener("pointercancel", relache);
eng.addEventListener("pointermove", (e) => {
  // Un doigt qui derape abandonne : sinon l'appui long se declencherait
  // pendant un glisser qui passe sur l'engrenage. Sans astuce ici, ce n'est
  // pas un appui rate mais un autre geste.
  if (!minuteur || !departAppui) return;
  if (Math.hypot(e.clientX - departAppui.x, e.clientY - departAppui.y) > SEUIL_ENGRENAGE) annule();
});
const fermeParent = () => { $("parent").hidden = true; };
$("ferme-parent").addEventListener("click", fermeParent);
// Deux sorties de plus, parce que sur un iPhone le bouton « Retour au jeu »
// est en bas d'un panneau plus haut que l'ecran : le voile ferme, et la touche
// d'echappement aussi sur le Mac.
$("parent").addEventListener("click", (e) => { if (e.target === $("parent")) fermeParent(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermeParent(); });

// --- hors ligne -------------------------------------------------------------
// Le service worker garantit mecaniquement la regle dure n° 4 du projet :
// aucun appel reseau au moment de jouer.

if ("serviceWorker" in navigator) {
  // Y avait-il DEJA un service worker au chargement ? C'est ce qui distingue
  // une premiere visite d'une mise a jour, plus bas.
  const avaitControleur = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.register("./sw.js")
    .then((reg) => {
      parent.majHorsLigne();
      // Demander la verification tout de suite : sans ca, mesure faite, il
      // fallait TROIS ouvertures de l'app pour qu'une correction arrive.
      reg.update().catch(() => { /* hors ligne, ce sera pour la prochaine fois */ });
    })
    .catch((e) => console.warn("service worker refuse : ", e && e.message));

  // Quand un nouveau service worker prend la main, la page tourne encore sur
  // l'ANCIEN code. On recharge donc une fois, mais SEULEMENT si rien n'a
  // commence : couper la musique sous les doigts d'un enfant pour appliquer
  // une correction serait pire que la correction. Sinon, ce sera au prochain
  // lancement, et le service worker actif est deja le bon.
  let rechargee = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (rechargee || !avaitControleur || amorcage) return;
    rechargee = true;
    location.reload();
  });
}

$("reinit").addEventListener("click", () => {
  try { localStorage.removeItem(CLE); } catch (e) { /* rien */ }
  emplacements.fill(null);
  moteur.fermeTout();
  moteur.tempo(100);
  $("tempo").value = 100;
  $("volume").value = 80;
  moteur.volume(0.8);
  majReperes(100);
  choisi = 0;
  rend();
  if (moteur.estPret()) moteur.chargeMorceau(morceaux[0]);
  $("parent").hidden = true;
});

// --- le minimum vivant ------------------------------------------------------
// C'est le moteur qui appelle, au temps AUDIO passe par Tone.Draw. Un
// setTimeout tomberait a cote, d'autant plus avec une anticipation de 20 ms.

const dernierTressaut = new Map();
moteur.surNote((inst) => {
  const n = emplacements.indexOf(inst);
  if (n < 0) return;
  const t = performance.now();
  if (t - (dernierTressaut.get(inst) || 0) < BRIDE_TRESSAUT) return;
  dernierTressaut.set(inst, t);
  const el = places[n];
  el.classList.remove("joue");
  void el.offsetWidth;     // force le redemarrage de l'animation
  el.classList.add("joue");
});

moteur.surMesure(() => {
  zScene.classList.add("mesure");
  setTimeout(() => zScene.classList.remove("mesure"), 110);
});

moteur.surErreur((texte) => console.error("moteur : " + texte));

// --- le selecteur de morceaux ----------------------------------------------
// Il se reconstruit a chaque changement de bibliotheque : un morceau importe,
// masque, supprime ou deplace change la liste que voit l'enfant.

function rendSelecteur() {
  zMorceaux.innerHTML = morceaux.map((m, i) =>
    `<button class="morceau" data-morceau="${i}" style="background:${m.couleur}">
       <span>${m.titre}</span></button>`).join("");
}

// Appele par la zone parent. Garde le morceau en cours s'il est toujours
// visible, sinon retombe sur le premier : l'enfant ne doit pas se retrouver
// devant une app muette parce qu'un morceau a ete masque pendant qu'il jouait.
function recompose() {
  const avant = morceaux[choisi] ? morceaux[choisi].id : null;
  morceaux = biblio.visibles();
  const n = morceaux.findIndex((m) => m.id === avant);
  choisi = n >= 0 ? n : 0;
  rendSelecteur();
  rend();
  if (n < 0 && morceaux[choisi] && moteur.estPret()) moteur.chargeMorceau(morceaux[choisi]);
}

// --- demarrage --------------------------------------------------------------
// Les morceaux se chargent sans geste : c'est du reseau, pas de l'audio.

await biblio.charge();
morceaux = biblio.visibles();
rendSelecteur();
parent.installe({ version: VERSION, surChangement: recompose });

// Apres le chargement des morceaux, parce que la restauration verifie que le
// morceau enregistre existe encore.
restaure();
rend();
majPlay();
majReperes(+$("tempo").value);

// Pour la verification en navigateur sans tete. L'app n'en a pas besoin.
window.app = {
  emplacements, moteur, biblio,
  enReserve: () => INSTRUMENTS.map((i) => i.id).filter((id) => !surScene(id)),
  morceaux: () => morceaux,
  choisi: () => choisi,
};
window.pret = true;
