// LA BIBLIOTHEQUE. Quels morceaux existent, dans quel ordre, et lesquels sont
// masques. Deux origines, et c'est tout ce que l'app a besoin de savoir :
//
//   DEPOT     songs/index.json et les fichiers a cote. Les memes sur tous les
//             appareils, mis a jour par un deploiement.
//   IMPORTE   ajoute depuis l'appareil (cadrage section 7.2, circuit 2).
//             Presents seulement la, et c'est assume : l'export existe
//             justement pour me les faire passer et les mettre dans le depot.
//
// Rangement : une cle pour l'ordre et les masques, et UNE CLE PAR MORCEAU
// IMPORTE. Pas un seul gros objet : un morceau pese 30 a 60 Ko, et tout
// reecrire a chaque changement d'ordre gaspillerait le quota autant que le
// temps. Un quota depasse ne fait alors perdre que le morceau qu'on ajoute.
//
// Ce module ne touche ni au DOM ni au moteur. Il rend des donnees, l'app
// decide quoi en faire.

import { valide } from "./format-morceau.js";

const CLE = "orchestre-biblio";
const PREFIXE = "orchestre-morceau-";

// { id, morceau, origine } dans l'ordre d'affichage. La source de verite en
// memoire, reconstruite a chaque chargement.
let entrees = [];
let masques = new Set();

const lis = (cle) => { try { return localStorage.getItem(cle); } catch (e) { return null; } };
const ecris = (cle, val) => { localStorage.setItem(cle, val); };   // laisse remonter le quota
const oublie = (cle) => { try { localStorage.removeItem(cle); } catch (e) { /* rien */ } };

function reglages() {
  try {
    const d = JSON.parse(lis(CLE) || "null");
    if (d && d.v === 1) return d;
  } catch (e) { /* illisible : on repart propre */ }
  return { v: 1, ordre: [], masques: [], importes: [] };
}

function enregistreReglages() {
  try {
    ecris(CLE, JSON.stringify({
      v: 1,
      ordre: entrees.map((e) => e.id),
      masques: [...masques],
      importes: entrees.filter((e) => e.origine === "importe").map((e) => e.id),
    }));
  } catch (e) { /* plus de place pour les reglages : on continue en memoire */ }
}

// Ordonne selon l'ordre enregistre, et met a la fin ce qui n'y figure pas
// encore : un morceau ajoute au depot depuis le dernier lancement apparait
// donc, au lieu de disparaitre parce qu'il n'est pas dans la liste.
function ordonne(liste, ordre) {
  const rang = new Map(ordre.map((id, i) => [id, i]));
  return liste
    .map((e, i) => ({ e, r: rang.has(e.id) ? rang.get(e.id) : ordre.length + i }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.e);
}

// Charge tout : le depot par le reseau (ou par le cache du service worker
// hors ligne), les importes par le rangement local.
export async function charge() {
  const r = reglages();
  const depot = [];
  try {
    const index = await (await fetch("songs/index.json")).json();
    for (const id of index.morceaux) {
      try {
        const m = await (await fetch(`songs/${id}.json`)).json();
        depot.push({ id, morceau: m, origine: "depot" });
      } catch (e) { /* un morceau manquant ne doit pas couler les autres */ }
    }
  } catch (e) { /* index illisible : il reste les importes */ }

  const importes = [];
  for (const id of Array.isArray(r.importes) ? r.importes : []) {
    try {
      const m = JSON.parse(lis(PREFIXE + id) || "null");
      if (m && valide(m).erreurs.length === 0) importes.push({ id, morceau: m, origine: "importe" });
      else oublie(PREFIXE + id);
    } catch (e) { /* entree pourrie : on la laisse tomber */ }
  }

  entrees = ordonne([...depot, ...importes], Array.isArray(r.ordre) ? r.ordre : []);
  const connus = new Set(entrees.map((e) => e.id));
  masques = new Set((Array.isArray(r.masques) ? r.masques : []).filter((id) => connus.has(id)));
  // Jamais zero morceau visible : l'enfant se retrouverait devant une app
  // muette sans savoir pourquoi.
  if (entrees.length && masques.size >= entrees.length) masques.delete(entrees[0].id);
  enregistreReglages();
  return tout();
}

export function tout() {
  return entrees.map((e) => ({ ...e, masque: masques.has(e.id) }));
}

// Ce que voit l'enfant.
export function visibles() {
  return entrees.filter((e) => !masques.has(e.id)).map((e) => e.morceau);
}

export function estMasque(id) { return masques.has(id); }

// Rend vrai si le masquage a ete applique. Refuse de masquer le dernier
// visible.
export function masque(id, oui) {
  if (!entrees.some((e) => e.id === id)) return false;
  if (oui) {
    if (entrees.length - masques.size <= 1) return false;
    masques.add(id);
  } else {
    masques.delete(id);
  }
  enregistreReglages();
  return true;
}

// sens = -1 vers le haut, +1 vers le bas.
export function deplace(id, sens) {
  const i = entrees.findIndex((e) => e.id === id);
  const j = i + sens;
  if (i < 0 || j < 0 || j >= entrees.length) return false;
  [entrees[i], entrees[j]] = [entrees[j], entrees[i]];
  enregistreReglages();
  return true;
}

// Un id libre a partir de celui propose : deux imports du meme fichier ne
// doivent pas s'ecraser en silence.
function idLibre(base) {
  const propre = String(base || "morceau").toLowerCase().replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "morceau";
  if (!entrees.some((e) => e.id === propre)) return propre;
  for (let n = 2; n < 100; n++) {
    const essai = `${propre}-${n}`;
    if (!entrees.some((e) => e.id === essai)) return essai;
  }
  return `${propre}-${Date.now()}`;
}

// Ajoute un morceau importe. Rend { ok, id, bilan, erreur }.
// Le validateur decide : un fichier venu du dehors peut etre n'importe quoi.
export function ajoute(morceau) {
  const bilan = valide(morceau);
  if (bilan.erreurs.length) return { ok: false, bilan };
  const id = idLibre(morceau.id);
  const copie = { ...morceau, id };
  try {
    ecris(PREFIXE + id, JSON.stringify(copie));
  } catch (e) {
    return { ok: false, bilan, erreur: "plus de place sur l'appareil. Exporte puis supprime un morceau importe." };
  }
  entrees.push({ id, morceau: copie, origine: "importe" });
  enregistreReglages();
  return { ok: true, id, bilan };
}

// On ne supprime qu'un importe : un morceau du depot se masque, il revient au
// prochain deploiement de toute facon.
export function supprime(id) {
  const i = entrees.findIndex((e) => e.id === id);
  if (i < 0 || entrees[i].origine !== "importe") return false;
  oublie(PREFIXE + id);
  entrees.splice(i, 1);
  masques.delete(id);
  if (entrees.length && masques.size >= entrees.length) masques.delete(entrees[0].id);
  enregistreReglages();
  return true;
}

export function morceau(id) {
  const e = entrees.find((x) => x.id === id);
  return e ? e.morceau : null;
}

// Le fichier au format du projet, pret a etre partage. Indente : il peut finir
// dans le depot, et un diff lisible compte.
export function exporte(id) {
  const m = morceau(id);
  return m ? JSON.stringify(m, null, 2) : null;
}

// Tout effacer, pour le bouton de remise a zero.
export function vide() {
  for (const e of entrees) if (e.origine === "importe") oublie(PREFIXE + e.id);
  oublie(CLE);
  entrees = [];
  masques = new Set();
}
