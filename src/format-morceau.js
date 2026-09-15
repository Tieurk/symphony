// Validation d'un morceau au format du projet.
//
// POURQUOI CE MODULE EXISTE, ET POURQUOI ICI PLUTOT QUE DANS UN SCRIPT
// La phase 2 doit accepter un fichier importe depuis l'appareil (cadrage
// section 7.2). Un fichier venu du dehors peut etre n'importe quoi, et le
// controle a faire dessus est exactement celui qu'on veut faire sur les
// morceaux du depot. Un seul validateur, deux usages : la page de test
// verifie songs/, l'import verifiera le fichier choisi.
//
// Il ne leve JAMAIS d'exception. Il rend la liste de ce qui cloche, et c'est
// a l'appelant de decider. Un validateur qui plante sur une entree invalide
// ne sert a rien : c'est precisement pour les entrees invalides qu'il existe.
//
// Contrat complet dans docs/format-morceau.md.

import {
  MELODIQUES, PERCUSSIONS, INSTRUMENT_DE_FRAPPE,
  DUREE_ECHANTILLON, versDemiTons, distanceDeTransposition,
} from "./echantillons.js";

export const INSTRUMENTS_ATTENDUS = [
  ...Object.keys(MELODIQUES), ...Object.keys(PERCUSSIONS),
];

// --- Conversions de temps, memes regles que Tone.js -------------------------

// « 4/4 » -> 4, « 6/8 » -> 3, « 3/4 » -> 3.
// Tone compte en NOIRES, pas en unites de la signature : il ramene [n, d] a
// n / (d / 4). Une mesure de 6/8 vaut donc 3 temps, pas 6. C'est le piege a
// connaitre en ecrivant un morceau en mesure composee : les positions se
// notent en noires et en doubles-croches, jamais en croches de 6/8.
export function tempsParMesure(mesure) {
  const m = /^(\d+)\/(\d+)$/.exec(String(mesure || ""));
  if (!m) return null;
  const n = parseInt(m[1], 10), d = parseInt(m[2], 10);
  if (!n || !d) return null;
  return n / (d / 4);
}

// « 2:1:2 » -> position en noires depuis le debut.
export function positionEnTemps(t, parMesure) {
  const m = /^(\d+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(String(t || ""));
  if (!m) return null;
  return parseFloat(m[1]) * parMesure + parseFloat(m[2]) + parseFloat(m[3]) / 4;
}

// « 4n » -> 1 noire, « 8n. » -> 0,75, « 8t » -> 1/3.
// Tone lit Nn comme 4/N noire, le point multiplie par 1,5, le t par 2/3.
export function dureeEnTemps(duree) {
  const m = /^(\d+)(n|t)(\.?)$/.exec(String(duree || ""));
  if (!m) return null;
  let v = 4 / parseInt(m[1], 10);
  if (m[2] === "t") v *= 2 / 3;
  if (m[3] === ".") v *= 1.5;
  return v;
}

// --- Le validateur ----------------------------------------------------------

// Rend { erreurs: [], reserves: [] }.
// Une erreur empeche le morceau de jouer correctement. Une reserve est un
// avertissement de qualite : ca jouera, mais ca sonnera probablement mal.
export function valide(morceau) {
  const erreurs = [], reserves = [];
  const ko = (t) => erreurs.push(t);
  const hmm = (t) => reserves.push(t);

  if (!morceau || typeof morceau !== "object" || Array.isArray(morceau)) {
    return { erreurs: ["le fichier n'est pas un objet JSON"], reserves };
  }

  for (const champ of ["id", "titre", "bpm", "mesure", "longueur", "parties"]) {
    if (morceau[champ] === undefined) ko(`champ obligatoire manquant : ${champ}`);
  }
  if (typeof morceau.id === "string" && !/^[a-z0-9-]+$/.test(morceau.id)) {
    ko(`id « ${morceau.id} » : minuscules, chiffres et tirets seulement, il sert de nom de fichier`);
  }
  if (morceau.bpm !== undefined && !(morceau.bpm > 20 && morceau.bpm < 300)) {
    ko(`bpm ${morceau.bpm} hors du plausible`);
  }
  if (morceau.longueur !== undefined && !(Number.isInteger(morceau.longueur) && morceau.longueur > 0)) {
    ko(`longueur ${morceau.longueur} : un entier de mesures, superieur a zero`);
  }
  if (morceau.couleur !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(String(morceau.couleur))) {
    ko(`couleur « ${morceau.couleur} » : attendu #RRGGBB`);
  }

  const parMesure = tempsParMesure(morceau.mesure);
  if (morceau.mesure !== undefined && parMesure === null) {
    ko(`mesure « ${morceau.mesure} » illisible, attendu 4/4, 3/4, 6/8`);
  }

  // mix : des decibels, donc negatifs ou nuls. Un mix positif sature le bus.
  if (morceau.mix !== undefined) {
    if (typeof morceau.mix !== "object" || morceau.mix === null) {
      ko("mix doit etre un objet instrument -> decibels");
    } else {
      for (const [inst, db] of Object.entries(morceau.mix)) {
        if (!INSTRUMENTS_ATTENDUS.includes(inst)) ko(`mix : « ${inst} » n'est pas un instrument de la scene`);
        else if (typeof db !== "number" || db > 0) ko(`mix.${inst} = ${db} : des decibels, donc zero ou negatif`);
        else if (db < -40) hmm(`mix.${inst} = ${db} dB, soit quasiment inaudible`);
      }
    }
  }

  // Les 13 cles, toujours presentes, eventuellement vides. C'est le contrat :
  // le moteur programme les 13 parties d'un coup, une cle absente est un trou
  // dans l'orchestre et pas un instrument silencieux.
  const parties = morceau.parties;
  if (!parties || typeof parties !== "object" || Array.isArray(parties)) {
    return { erreurs: [...erreurs, "parties manquant ou n'est pas un objet"], reserves };
  }
  for (const inst of INSTRUMENTS_ATTENDUS) {
    if (!Array.isArray(parties[inst])) ko(`parties.${inst} manquant : les 13 cles sont toujours presentes, meme vides`);
  }
  for (const cle of Object.keys(parties)) {
    if (!INSTRUMENTS_ATTENDUS.includes(cle)) ko(`parties.${cle} : « ${cle} » n'est pas un instrument de la scene`);
  }

  const secondeParTemps = morceau.bpm > 0 ? 60 / morceau.bpm : null;
  const finDeBoucle = parMesure !== null && morceau.longueur > 0
    ? morceau.longueur * parMesure : null;

  for (const inst of INSTRUMENTS_ATTENDUS) {
    const evts = parties[inst];
    if (!Array.isArray(evts)) continue;
    const percussion = PERCUSSIONS[inst] !== undefined;

    evts.forEach((ev, i) => {
      const ou = `parties.${inst}[${i}]`;
      if (!ev || typeof ev !== "object") { ko(`${ou} n'est pas un objet`); return; }

      // position
      const pos = positionEnTemps(ev.t, parMesure === null ? 4 : parMesure);
      if (pos === null) ko(`${ou}.t « ${ev.t} » illisible, attendu mesure:temps:doubles-croches`);
      else if (finDeBoucle !== null && pos >= finDeBoucle) {
        ko(`${ou}.t = ${ev.t} tombe hors de la boucle (${morceau.longueur} mesures), donc ne joue jamais`);
      }

      // velocite
      if (ev.vel !== undefined && !(typeof ev.vel === "number" && ev.vel > 0 && ev.vel <= 1)) {
        ko(`${ou}.vel = ${ev.vel} : attendu entre 0 exclu et 1`);
      }

      if (percussion) {
        if (ev.note !== undefined) ko(`${ou} : une percussion porte « frappe », pas « note »`);
        if (typeof ev.frappe !== "string") { ko(`${ou}.frappe manquant`); return; }
        if (INSTRUMENT_DE_FRAPPE[ev.frappe] === undefined) {
          ko(`${ou}.frappe « ${ev.frappe} » inconnue`);
        } else if (INSTRUMENT_DE_FRAPPE[ev.frappe] !== inst) {
          // Le cas qui fait perdre une heure : la frappe existe, elle est
          // juste sur le mauvais canal, donc elle joue au niveau de l'autre
          // instrument ou reste muette si celui-la n'est pas pose.
          ko(`${ou}.frappe « ${ev.frappe} » appartient a ${INSTRUMENT_DE_FRAPPE[ev.frappe]}, pas a ${inst}`);
        }
        return;
      }

      // instrument melodique
      if (ev.frappe !== undefined) ko(`${ou} : un instrument melodique porte « note », pas « frappe »`);
      if (typeof ev.note !== "string") { ko(`${ou}.note manquant`); return; }
      if (versDemiTons(ev.note) === null) {
        ko(`${ou}.note « ${ev.note} » : majuscule, bemol en « b » minuscule, octave. Les dieses n'existent pas dans la banque`);
      } else {
        const d = distanceDeTransposition(inst, ev.note);
        if (d !== null && d > 5) {
          hmm(`${ou}.note ${ev.note} est a ${d} demi-tons du plus proche echantillon de ${inst} : le timbre va changer`);
        }
      }

      const battues = dureeEnTemps(ev.duree);
      if (battues === null) ko(`${ou}.duree « ${ev.duree} » illisible, attendu 4n, 8n, 2n, 4n., 8t`);
      else if (secondeParTemps !== null && battues * secondeParTemps > DUREE_ECHANTILLON) {
        // L'echantillon s'arrete a 3,16 s et sonne jusqu'au bout : au dela, la
        // note est coupee net, on entend une fin abrupte.
        const s = (battues * secondeParTemps).toFixed(2);
        hmm(`${ou} dure ${s} s a ${morceau.bpm} a la noire, l'echantillon s'arrete a ${DUREE_ECHANTILLON} s : la note sera coupee`);
      }
    });
  }

  return { erreurs, reserves };
}

// Resume d'une ligne, pour un bandeau ou un journal.
export function resume(id, bilan) {
  if (bilan.erreurs.length) return `${id} : ${bilan.erreurs.length} erreur(s)`;
  if (bilan.reserves.length) return `${id} : valide, ${bilan.reserves.length} reserve(s)`;
  return `${id} : valide`;
}
