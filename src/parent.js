// LA ZONE PARENT. Trois pages : la bibliotheque, l'import, « a propos ».
//
// Ce module est separe de src/app.js pour une raison simple : l'app est le
// jeu, et le jeu n'a pas besoin de savoir lire un fichier MIDI ni de gerer un
// cache. Il communique avec l'app par un seul rappel, surChangement, appele
// quand la liste des morceaux visibles a bouge.
//
// Cibles tactiles : 64 px pour les actions, comme le reste du projet. C'est ce
// qui dicte la forme des lignes de la bibliotheque, titre sur une ligne et
// actions sur la suivante : quatre boutons de 64 px et un titre ne tiennent pas
// cote a cote sur la largeur d'un iPhone.

import { INSTRUMENTS } from "./instruments.js";
import { valide } from "./format-morceau.js";
import { urlsDesEchantillons } from "./echantillons.js";
import * as biblio from "./bibliotheque.js";
import * as midi from "./midi.js";

const $ = (id) => document.getElementById(id);

// Glyphes de l'interface, en SVG comme ceux d'index.html. Pas d'emoji : le
// rendu change d'un appareil a l'autre (interdit du projet).
const ICONES = {
  haut: '<svg viewBox="0 0 24 24"><path d="M12 5l8 9h-16z"/></svg>',
  bas: '<svg viewBox="0 0 24 24"><path d="M12 19l-8-9h16z"/></svg>',
  visible: '<svg viewBox="0 0 24 24"><path d="M12 5C6 5 2.5 9.5 1.5 12c1 2.5 4.5 7 10.5 7s9.5-4.5 10.5-7c-1-2.5-4.5-7-10.5-7m0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8"/></svg>',
  masque: '<svg viewBox="0 0 24 24"><path d="M12 5C6 5 2.5 9.5 1.5 12c1 2.5 4.5 7 10.5 7s9.5-4.5 10.5-7c-1-2.5-4.5-7-10.5-7m0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8"/><path d="M3 2.5l18.5 18.5-1.5 1.5L1.5 4z"/></svg>',
  export: '<svg viewBox="0 0 24 24"><path d="M11 3h2v9l3.5-3.5 1.4 1.4L12 16 6.1 9.9l1.4-1.4L11 12z"/><path d="M4 18h16v3H4z"/></svg>',
  supprime: '<svg viewBox="0 0 24 24"><path d="M6.2 5l12.8 12.8-1.2 1.2L5 6.2z"/><path d="M19 6.2L6.2 19 5 17.8 17.8 5z"/></svg>',
};

let surChangement = () => {};
let versionTexte = "";
let enAttente = null;       // l'import en cours, en attente de confirmation

// --- Bibliotheque -----------------------------------------------------------

function ligne(e, i, total) {
  // La couleur part dans un attribut style : on ne fait confiance a rien qui
  // vienne d'un fichier importe, meme si le validateur l'a deja vue passer.
  const couleur = /^#[0-9A-Fa-f]{6}$/.test(String(e.morceau.couleur)) ? e.morceau.couleur : "#7C8CC4";
  const etiquette = e.origine === "importe" ? "importé" : "du dépôt";
  const boutons = [
    ["haut", ICONES.haut, "monter", i === 0],
    ["bas", ICONES.bas, "descendre", i === total - 1],
    [e.masque ? "montre" : "masque", e.masque ? ICONES.masque : ICONES.visible,
      e.masque ? "rendre visible" : "masquer", false],
    ["export", ICONES.export, "exporter", false],
  ];
  if (e.origine === "importe") boutons.push(["supprime", ICONES.supprime, "supprimer", false]);
  return `<li class="ligne-morceau${e.masque ? " masquee" : ""}" data-id="${e.id}">
    <div class="titre-morceau">
      <span class="pastille" style="background:${couleur}"></span>
      <span class="nom">${echappe(e.morceau.titre || e.id)}</span>
      <span class="origine">${etiquette}</span>
    </div>
    <div class="actions">${boutons.map(([act, svg, aide, off]) =>
      `<button class="action" data-act="${act}" aria-label="${aide}" title="${aide}"${off ? " disabled" : ""}>${svg}</button>`
    ).join("")}</div>
  </li>`;
}

const echappe = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function rafraichis() {
  const tout = biblio.tout();
  $("liste-biblio").innerHTML = tout.map((e, i) => ligne(e, i, tout.length)).join("")
    || '<li class="vide">Aucun morceau. Importe un fichier.</li>';
  // Un importe ecarte par le validateur ne doit pas disparaitre en silence :
  // il est toujours dans l'appareil, il ne joue simplement pas.
  const hs = biblio.ecartes();
  dis(hs.length
    ? `${hs.length} morceau(x) importe(s) ne passent plus le validateur et sont ecartes : ${hs.join(", ")}.`
    : "", "biblio-etat");
}

function dis(quoi, zone = "import-etat") {
  $(zone).textContent = quoi;
}

$("liste-biblio") && $("liste-biblio").addEventListener("click", async (ev) => {
  const b = ev.target.closest("button.action");
  if (!b) return;
  const id = b.closest(".ligne-morceau").dataset.id;
  const act = b.dataset.act;
  if (act === "haut" || act === "bas") {
    biblio.deplace(id, act === "haut" ? -1 : 1);
  } else if (act === "masque" || act === "montre") {
    // Refus possible : on ne masque pas le dernier morceau visible, sinon
    // l'enfant se retrouve devant une app muette sans savoir pourquoi.
    if (!biblio.masque(id, act === "masque")) {
      dis("Il faut au moins un morceau visible.", "biblio-etat");
      b.closest(".ligne-morceau").classList.add("refus");
      setTimeout(() => b.closest(".ligne-morceau").classList.remove("refus"), 600);
      return;
    }
  } else if (act === "export") {
    const r = await partage(id);
    b.closest(".ligne-morceau").classList.add("fait");
    setTimeout(() => b.closest(".ligne-morceau").classList.remove("fait"), 900);
    if (r === "telecharge") dis("Fichier enregistré.", "biblio-etat");
    return;
  } else if (act === "supprime") {
    dis("", "biblio-etat");
    // Pas de boite de confirmation : le geste est deja derriere un appui long
    // de 2 s, et l'export est juste a cote. Un seul morceau a la fois.
    biblio.supprime(id);
  }
  rafraichis();
  surChangement();
});

// --- Export -----------------------------------------------------------------
// Sur iOS, la feuille de partage est la bonne porte : AirDrop, Mail, Fichiers.
// Ailleurs, un telechargement. Les deux produisent le meme fichier, celui du
// format du projet, donc celui que je peux reprendre pour l'ajouter au depot.

async function partage(id) {
  const texte = biblio.exporte(id);
  if (!texte) return "rien";
  const nom = `${id}.json`;
  try {
    const fichier = new File([texte], nom, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
      await navigator.share({ files: [fichier], title: nom });
      return "partage";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "annule";
  }
  const url = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "telecharge";
}

// --- Import -----------------------------------------------------------------

const PALETTE = ["#F2A65A", "#5BA4A4", "#A8577E", "#7C9E4E", "#C4673E", "#6E7BC0"];

function slug(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "importe";
}

function cache() {
  $("import-pistes").hidden = true;
  $("import-pistes").innerHTML = "";
  $("import-actions").hidden = true;
  enAttente = null;
}

$("fichier") && $("fichier").addEventListener("change", async (ev) => {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";                 // pour pouvoir rechoisir le meme fichier
  if (!f) return;
  cache();
  dis("Lecture de " + f.name + "...");
  const estMidi = /\.midi?$/i.test(f.name);
  try {
    if (estMidi) await lisMidi(f);
    else await lisJson(f);
  } catch (e) {
    dis("Fichier illisible : " + (e && e.message ? e.message : "erreur inconnue"));
  }
});

async function lisJson(f) {
  let morceau;
  try {
    morceau = JSON.parse(await f.text());
  } catch (e) {
    dis("Ce fichier n'est pas du JSON valide.");
    return;
  }
  // Valide TOUT DE SUITE plutot qu'au clic sur « Ajouter » : un parent qui
  // vient de choisir un fichier veut savoir la, pas apres un geste de plus.
  const bilan = valide(morceau);
  if (bilan.erreurs.length) {
    dis("Ce fichier n'est pas un morceau valide : " + bilan.erreurs.slice(0, 3).join(" / ")
      + (bilan.erreurs.length > 3 ? ` (et ${bilan.erreurs.length - 3} autres)` : ""));
    return;
  }
  enAttente = { type: "json", morceau };
  const t = morceau && morceau.titre ? morceau.titre : f.name;
  $("import-pistes").innerHTML = `
    <p class="resume">Morceau au format du projet : <strong>${echappe(t)}</strong>,
    ${echappe(String(morceau && morceau.mesure))}, ${echappe(String(morceau && morceau.bpm))} à la noire,
    ${echappe(String(morceau && morceau.longueur))} mesures.</p>`;
  $("import-pistes").hidden = false;
  $("import-actions").hidden = false;
  dis(bilan.reserves.length
    ? `Valide, avec ${bilan.reserves.length} réserve(s) de qualité. Prêt à ajouter.`
    : "Valide. Prêt à ajouter.");
}

async function lisMidi(f) {
  const a = midi.analyse(await f.arrayBuffer());
  if (!a.ok) { dis("MIDI refusé : " + a.erreur); return; }
  if (!a.pistes.length) { dis("Ce MIDI ne contient aucune note."); return; }

  const titre = f.name.replace(/\.midi?$/i, "").replace(/[_-]+/g, " ").trim() || "Morceau importé";
  enAttente = { type: "midi", analyse: a };

  const options = (choisi) => [`<option value=""${choisi ? "" : " selected"}>ne pas utiliser</option>`]
    .concat(INSTRUMENTS.map((i) =>
      `<option value="${i.id}"${i.id === choisi ? " selected" : ""}>${i.nom}</option>`)).join("");

  $("import-pistes").innerHTML = `
    <p class="resume">MIDI format ${a.format}, ${echappe(a.mesure)}, ${a.bpm} à la noire,
    ${a.mesures} mesure${a.mesures > 1 ? "s" : ""}, ${a.pistes.length} piste${a.pistes.length > 1 ? "s" : ""}.
    L'affectation proposée vient des numéros d'instrument du fichier.</p>
    <label class="champ">Titre
      <input type="text" id="import-titre" value="${echappe(titre)}" maxlength="60">
    </label>
    <ul class="liste pistes">
      ${a.pistes.map((p) => `
        <li class="ligne-piste">
          <div class="titre-morceau">
            <span class="nom">${echappe(p.nom)}</span>
            <span class="origine">${echappe(p.famille)}</span>
          </div>
          <p class="aide">canal ${p.canal}, ${p.notes.length} note${p.notes.length > 1 ? "s" : ""}${
            p.percussion ? "" : `, de ${nomCourt(p.grave)} à ${nomCourt(p.aigu)}`}</p>
          <select data-cle="${echappe(p.cle)}" aria-label="instrument pour ${echappe(p.nom)}">
            ${options(p.propose)}
          </select>
        </li>`).join("")}
    </ul>`;
  $("import-pistes").hidden = false;
  $("import-actions").hidden = false;
  const proposees = a.pistes.filter((p) => p.propose).length;
  dis(`${proposees} piste(s) sur ${a.pistes.length} ont une proposition. Vérifie, puis ajoute.`);
}

const NOMS_NOTES = ["Do", "Ré b", "Ré", "Mi b", "Mi", "Fa", "Sol b", "Sol", "La b", "La", "Si b", "Si"];
// Nom francais pour l'ecran de correspondance : c'est un parent qui lit, pas le
// format du fichier. Le fichier exporte, lui, garde la notation anglaise.
function nomCourt(n) {
  if (!Number.isFinite(n)) return "?";
  return NOMS_NOTES[n % 12] + (Math.floor(n / 12) - 1);
}

$("import-annule") && $("import-annule").addEventListener("click", () => {
  cache();
  dis("");
});

$("import-valide") && $("import-valide").addEventListener("click", () => {
  if (!enAttente) return;
  let morceau, rapport = null;
  if (enAttente.type === "json") {
    morceau = enAttente.morceau;
  } else {
    const affectation = {};
    for (const s of $("import-pistes").querySelectorAll("select")) affectation[s.dataset.cle] = s.value;
    const utilises = Object.values(affectation).filter(Boolean);
    if (!utilises.length) { dis("Aucune piste affectée : il n'y aurait rien à jouer."); return; }
    const titre = ($("import-titre").value || "Morceau importé").trim();
    const r = midi.construis(enAttente.analyse, affectation, {
      id: slug(titre), titre,
      couleur: PALETTE[biblio.tout().length % PALETTE.length],
      source: "Importé depuis un fichier MIDI",
    });
    morceau = r.morceau;
    rapport = r.rapport;
    const doublons = utilises.length - new Set(utilises).size;
    if (doublons) rapport.doublons = doublons;
  }

  const res = biblio.ajoute(morceau);
  if (!res.ok) {
    const quoi = res.erreur ? [res.erreur] : res.bilan.erreurs.slice(0, 4);
    dis("Refusé : " + quoi.join(" / ") + (res.bilan && res.bilan.erreurs.length > 4
      ? ` (et ${res.bilan.erreurs.length - 4} autres)` : ""));
    return;
  }
  cache();
  rafraichis();
  surChangement();
  const bouts = [`« ${morceau.titre} » ajouté`];
  if (rapport) {
    bouts.push(`${rapport.retenues} notes retenues`);
    if (rapport.ignorees) bouts.push(`${rapport.ignorees} ignorées`);
    if (rapport.ramenees) bouts.push(`${rapport.ramenees} ramenées dans la tessiture`);
    if (rapport.doublons) bouts.push(`${rapport.doublons} piste(s) superposée(s) sur un même instrument`);
  }
  if (res.bilan.reserves.length) bouts.push(`${res.bilan.reserves.length} réserve(s) de qualité`);
  dis(bouts.join(", ") + ".");
});

// --- Hors ligne et remise a zero -------------------------------------------

// Compte ce qui est REELLEMENT en cache, plutot que d'afficher une intention.
export async function majHorsLigne() {
  const zone = $("etat-hors-ligne");
  if (!zone) return;
  if (!("caches" in window)) { zone.textContent = "Ce navigateur ne sait pas garder hors ligne."; return; }
  const attendus = urlsDesEchantillons();
  let en = 0;
  for (const u of attendus) if (await caches.match(u, { ignoreSearch: true })) en++;
  const installee = matchMedia("(display-mode: standalone)").matches;
  zone.textContent = en >= attendus.length
    ? `Les ${attendus.length} sons sont gardés, l'app marche sans réseau.`
    : `${en} sons gardés sur ${attendus.length}. Ils s'enregistrent à l'usage, ou d'un coup avec le bouton.`;
  const v = $("version");
  if (v) v.textContent = versionTexte + (installee ? ", installée" : ", dans le navigateur");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    const m = e.data || {};
    if (m.type === "hors-ligne-avance") {
      $("etat-hors-ligne").textContent = `Enregistrement : ${m.fait} sur ${m.total}...`;
    } else if (m.type === "hors-ligne-fini") {
      $("hors-ligne").disabled = false;
      $("etat-hors-ligne").textContent = m.rates
        ? `${m.fait} fichiers gardés, ${m.rates} en échec. Réessaie avec du réseau.`
        : "Tout est gardé. L'app marche sans réseau.";
    }
  });
}

$("hors-ligne") && $("hors-ligne").addEventListener("click", async () => {
  if (!("serviceWorker" in navigator)) return;
  $("hors-ligne").disabled = true;
  $("etat-hors-ligne").textContent = "Enregistrement...";
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) {
    $("hors-ligne").disabled = false;
    $("etat-hors-ligne").textContent = "Réessaie dans un instant.";
    return;
  }
  // La liste vient de src/echantillons.js, la source unique. Le service worker
  // ne la connait pas et n'a pas a la connaitre.
  reg.active.postMessage({
    type: "garde-hors-ligne",
    urls: [...urlsDesEchantillons(), ...biblio.tout()
      .filter((e) => e.origine === "depot").map((e) => `songs/${e.id}.json`)],
  });
});

// --- Onglets ----------------------------------------------------------------

$("onglets") && $("onglets").addEventListener("click", (e) => {
  const b = e.target.closest(".onglet");
  if (!b) return;
  for (const o of $("onglets").children) o.classList.toggle("actif", o === b);
  for (const p of ["biblio", "import", "propos"]) $("p-" + p).hidden = p !== b.dataset.page;
  $("parent").scrollTop = 0;
});

// --- Installation -----------------------------------------------------------

export function installe(options = {}) {
  surChangement = options.surChangement || (() => {});
  versionTexte = options.version || "";
  rafraichis();
  majHorsLigne();
  return { rafraichis, majHorsLigne };
}
