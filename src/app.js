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

injecteSprite();

const NB_PLACES = 6;
const SEUIL_GLISSER = 8;      // px avant qu'un appui devienne un glisser
const APPUI_LONG = 2000;      // ms sur l'engrenage, comme dit le cadrage
const BRIDE_TRESSAUT = 150;   // ms entre deux tressauts du meme instrument

const emplacements = new Array(NB_PLACES).fill(null);
let morceaux = [];
let choisi = 0;
let amorcage = null;          // la promesse d'amorcage, une seule fois

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

// --- amorcage ---------------------------------------------------------------
// Le contexte audio d'iOS ne demarre qu'apres un geste, et le bouton silencieux
// de l'iPhone se contourne dans le meme geste. Donc le PREMIER geste amorce,
// quel qu'il soit : un enfant touche un instrument, ca doit jouer.

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
      moteur.lecture();
      majPlay();
    } catch (e) {
      console.error("amorcage audio : ", e);
      amorcage = null;   // on pourra reessayer au geste suivant
    } finally {
      $("play").classList.remove("charge");
    }
  })();
  return amorcage;
}

function majPlay() {
  const joue = moteur.enLecture();
  // Une classe, pas l'attribut hidden : voir le commentaire de src/app.css,
  // hidden n'existe pas sur un SVGElement.
  $("play").classList.toggle("joue", joue);
  $("play").setAttribute("aria-label", joue ? "pause" : "lecture");
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
  await amorce();
  moteur.basculeLecture();
  majPlay();
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

// --- zone parent, appui long de 2 s -----------------------------------------

let minuteur = null;
const eng = $("engrenage");
eng.addEventListener("pointerdown", (e) => {
  eng.classList.add("presse");
  minuteur = setTimeout(() => { $("parent").hidden = false; annule(); }, APPUI_LONG);
  try { eng.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
});
function annule() {
  if (minuteur) { clearTimeout(minuteur); minuteur = null; }
  eng.classList.remove("presse");
}
eng.addEventListener("pointerup", annule);
eng.addEventListener("pointercancel", annule);
eng.addEventListener("pointermove", (e) => {
  // un doigt qui derape annule : sinon l'appui long se declencherait pendant
  // un glisser qui passe sur l'engrenage
  if (minuteur && (Math.abs(e.movementX) > 6 || Math.abs(e.movementY) > 6)) annule();
});
$("ferme-parent").addEventListener("click", () => { $("parent").hidden = true; });

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

// --- demarrage --------------------------------------------------------------
// Les morceaux se chargent sans geste : c'est du reseau, pas de l'audio.

const index = await (await fetch("songs/index.json")).json();
morceaux = await Promise.all(index.morceaux.map(async (id) =>
  (await fetch(`songs/${id}.json`)).json()));

zMorceaux.innerHTML = morceaux.map((m, i) =>
  `<button class="morceau" data-morceau="${i}" style="background:${m.couleur}">
     <span>${m.titre}</span></button>`).join("");

rend();
majPlay();
majReperes(+$("tempo").value);

// Pour la verification en navigateur sans tete. L'app n'en a pas besoin.
window.app = {
  emplacements, moteur,
  enReserve: () => INSTRUMENTS.map((i) => i.id).filter((id) => !surScene(id)),
  morceaux: () => morceaux,
  choisi: () => choisi,
};
window.pret = true;
