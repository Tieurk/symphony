// LECTURE D'UN FICHIER MIDI STANDARD, et conversion au format du projet.
// Cadrage section 7.2, circuit 2 : « un fichier MIDI standard (.mid) trouve
// sur le web ou exporte d'un logiciel de musique ».
//
// Deux fonctions, et la separation entre les deux est le coeur du module :
//
//   analyse(octets)   lit le fichier et rend des VOIX, sans rien decider.
//   construis(...)    applique une affectation voix -> instrument et rend un
//                     morceau au format du projet.
//
// Entre les deux, l'ecran de correspondance : le fichier propose, le parent
// tranche. C'est ce que demande le cadrage, et c'est aussi la seule facon
// honnete de s'en sortir, parce qu'un MIDI trouve sur le web n'a pas ete ecrit
// pour cette scene.
//
// POINT D'HONNETETE A GARDER EN TETE : ca jouera, mais rarement aussi bien
// qu'un arrangement ecrit pour le jeu, ou chaque instrument a un role pense
// pour toutes les combinaisons de 1 a 6.
//
// Aucune dependance : un fichier MIDI est une suite d'octets, et le lire tient
// en cent lignes. Pas question d'ajouter une bibliotheque pour ca (regle dure
// n° 6 du projet, et l'interdit sur les dependances a l'execution).

import { MELODIQUES, PERCUSSIONS, INSTRUMENT_DE_FRAPPE } from "./echantillons.js";

// --- Lecture des octets -----------------------------------------------------

class Flux {
  constructor(vue, debut = 0, fin = vue.byteLength) {
    this.v = vue; this.i = debut; this.fin = fin;
  }
  reste() { return this.i < this.fin; }
  octet() { return this.v.getUint8(this.i++); }
  mot() { const x = this.v.getUint16(this.i); this.i += 2; return x; }
  long() { const x = this.v.getUint32(this.i); this.i += 4; return x; }
  texte(n) {
    let s = "";
    for (let k = 0; k < n; k++) s += String.fromCharCode(this.octet());
    return s;
  }
  saute(n) { this.i += n; }
  // Quantite de longueur variable : sept bits par octet, le huitieme dit
  // « il y en a encore ». C'est comme ca que sont codes les temps delta.
  vlq() {
    let x = 0, o;
    do { o = this.octet(); x = (x << 7) | (o & 0x7f); } while (o & 0x80);
    return x;
  }
}

// --- Analyse ----------------------------------------------------------------

// Familles General MIDI vers les instruments de la scene. Les bornes suivent
// les familles de la norme : 0-7 pianos, 8-15 percussions chromatiques, etc.
// Ce n'est qu'une PROPOSITION, le parent reaffecte a l'ecran suivant.
function proposePourProgramme(p) {
  if (p >= 0 && p <= 7) return "piano";
  if (p <= 15) return "xylophone";
  if (p <= 23) return "accordeon";
  if (p <= 31) return "guitare";
  if (p <= 39) return "tuba";           // basses
  if (p === 43) return "tuba";          // contrebasse
  if (p <= 47) return "violon";         // cordes
  if (p <= 55) return "violon";         // ensembles
  if (p === 58) return "tuba";          // tuba GM
  if (p <= 63) return "trompette";      // cuivres
  if (p <= 71) return "clarinette";     // anches
  if (p <= 79) return "flute";          // flutes
  if (p <= 87) return "flute";          // leads de synthese, une melodie aigue
  if (p <= 95) return "accordeon";      // nappes, des accords tenus
  if (p === 104) return "sitar";
  if (p === 107) return "koto";
  if (p <= 111) return "sitar";         // ethniques
  if (p <= 115) return "xylophone";     // percussions accordees
  return null;                          // effets et bruitages : rien a en faire
}

// Canal 10 du General MIDI : le numero de note designe une frappe, pas une
// hauteur. Table standard, ramenee aux neuf frappes du projet.
const FRAPPE_GM = {
  35: "kick", 36: "kick",
  37: "snare", 38: "snare", 39: "snare", 40: "snare",
  41: "tom_bas", 43: "tom_bas",
  45: "tom_med", 47: "tom_med",
  48: "tom_haut", 50: "tom_haut",
  42: "charley", 44: "charley",
  46: "charley_ouvert",
  49: "crash", 52: "crash", 55: "crash", 57: "crash",
  51: "ride", 53: "ride", 59: "ride",
};

const NOMS_GM = [
  "piano", "percussion chromatique", "orgue", "guitare", "basse", "cordes",
  "ensemble", "cuivres", "anches", "flutes", "lead de synthese",
  "nappe de synthese", "effet de synthese", "ethnique", "percussion", "bruitage",
];

// Rend { ok, erreur, ppq, format, bpm, mesure, mesures, pistes }.
// Ne leve jamais : un fichier venu du dehors peut etre n'importe quoi, y
// compris un JPEG renomme.
export function analyse(octets) {
  let d;
  try { d = new DataView(octets); } catch (e) { return { ok: false, erreur: "fichier illisible" }; }
  if (d.byteLength < 14) return { ok: false, erreur: "fichier trop court pour un MIDI" };

  const f = new Flux(d);
  if (f.texte(4) !== "MThd") return { ok: false, erreur: "ce n'est pas un fichier MIDI (en-tete MThd absente)" };
  const tailleEntete = f.long();
  const format = f.mot();
  const nbPistes = f.mot();
  const division = f.mot();
  f.saute(tailleEntete - 6);

  if (division & 0x8000) {
    return { ok: false, erreur: "MIDI en division SMPTE, non gere. Reexporte en division par noire (PPQ)." };
  }
  if (!division) return { ok: false, erreur: "division nulle dans l'en-tete" };
  if (format === 2) {
    return { ok: false, erreur: "MIDI de format 2 (pistes independantes), non gere. Reexporte en format 0 ou 1." };
  }

  let tempo = 500000;                 // microsecondes par noire, 120 a la noire
  let signature = "4/4";
  let vuTempo = false, vuSignature = false;
  const voix = new Map();             // cle -> { ... , notes: [] }
  let finMax = 0;

  for (let p = 0; p < nbPistes && f.reste(); p++) {
    // Certains fichiers portent des morceaux inconnus entre les pistes : on
    // avance jusqu'a la prochaine MTrk plutot que d'abandonner.
    let entete = f.texte(4);
    let garde = 0;
    while (entete !== "MTrk" && f.reste() && garde++ < 1024) {
      f.i -= 3;
      entete = f.texte(4);
    }
    if (entete !== "MTrk") break;
    const taille = f.long();
    const finPiste = Math.min(f.i + taille, d.byteLength);
    const piste = new Flux(d, f.i, finPiste);
    f.i = finPiste;

    let t = 0, statut = 0, nomPiste = "";
    const programmes = new Map();     // canal -> programme
    const enCours = new Map();        // canal:note -> { t, vel }

    while (piste.reste()) {
      t += piste.vlq();
      let o = piste.octet();
      if (o & 0x80) { statut = o; } else { piste.i--; }     // statut courant
      const type = statut & 0xf0, canal = statut & 0x0f;

      if (statut === 0xff) {
        const meta = piste.octet();
        const n = piste.vlq();
        if (meta === 0x51 && n === 3) {
          const a = piste.octet(), b = piste.octet(), c = piste.octet();
          if (!vuTempo) { tempo = (a << 16) | (b << 8) | c; vuTempo = true; }
        } else if (meta === 0x58 && n >= 2) {
          const num = piste.octet(), den = piste.octet();
          piste.saute(n - 2);
          if (!vuSignature) { signature = `${num}/${Math.pow(2, den)}`; vuSignature = true; }
        } else if (meta === 0x03) {
          const s = piste.texte(n);
          if (!nomPiste) nomPiste = s.replace(/[\x00-\x1f]/g, "").trim();
        } else {
          piste.saute(n);
        }
        if (meta === 0x2f) break;
        continue;
      }
      if (statut === 0xf0 || statut === 0xf7) { piste.saute(piste.vlq()); continue; }

      if (type === 0xc0) { programmes.set(canal, piste.octet()); continue; }
      if (type === 0xd0) { piste.saute(1); continue; }
      if (type === 0xa0 || type === 0xb0 || type === 0xe0) { piste.saute(2); continue; }

      if (type === 0x90 || type === 0x80) {
        const note = piste.octet(), vel = piste.octet();
        const cle = canal + ":" + note;
        if (type === 0x90 && vel > 0) {
          enCours.set(cle, { t, vel });
        } else {
          const debut = enCours.get(cle);
          if (debut) {
            enCours.delete(cle);
            const groupe = `${p}:${canal}`;
            if (!voix.has(groupe)) {
              voix.set(groupe, {
                cle: groupe, nom: nomPiste, canal, piste: p,
                programme: programmes.has(canal) ? programmes.get(canal) : 0,
                notes: [],
              });
            }
            const v = voix.get(groupe);
            if (!v.nom && nomPiste) v.nom = nomPiste;
            if (programmes.has(canal)) v.programme = programmes.get(canal);
            v.notes.push({ t: debut.t, duree: Math.max(1, t - debut.t), note, vel: debut.vel });
            finMax = Math.max(finMax, t);
          }
        }
        continue;
      }
      // Statut inconnu : on ne peut plus se fier a la suite de cette piste.
      break;
    }

    // NOTES RESTEES OUVERTES. Un note on sans note off arrive pour de vrai :
    // fichier tronque, export baclant la fin, piste qui compte sur la fin de
    // piste pour tout couper. Les jeter ferait disparaitre une melodie SANS
    // aucune erreur, donc on les ferme a la fin de la piste.
    for (const [cle, debut] of enCours) {
      const canal = parseInt(cle.split(":")[0], 10);
      const note = parseInt(cle.split(":")[1], 10);
      const groupe = `${p}:${canal}`;
      if (!voix.has(groupe)) {
        voix.set(groupe, {
          cle: groupe, nom: nomPiste, canal, piste: p,
          programme: programmes.has(canal) ? programmes.get(canal) : 0,
          notes: [],
        });
      }
      const v = voix.get(groupe);
      v.notes.push({ t: debut.t, duree: Math.max(1, t - debut.t), note, vel: debut.vel, pendante: true });
      finMax = Math.max(finMax, t);
    }
  }

  const ppq = division;
  const bpm = Math.round(60000000 / tempo);
  // Les percussions du canal 10 donnent DEUX voix, parce que la batterie et
  // les cymbales sont deux instruments distincts de la scene, avec leurs
  // propres emplacements. Une seule voix en perdrait la moitie.
  const pistes = [];
  for (const v of voix.values()) {
    if (!v.notes.length) continue;
    v.notes.sort((a, b) => a.t - b.t);
    if (v.canal === 9) {
      for (const cible of ["batterie", "cymbales"]) {
        const notes = v.notes.filter((n) => INSTRUMENT_DE_FRAPPE[FRAPPE_GM[n.note]] === cible);
        if (!notes.length) continue;
        pistes.push({
          cle: v.cle + ":" + cible,
          nom: v.nom || "percussions",
          famille: cible === "batterie" ? "grosse caisse, caisse claire, toms" : "charley, crash, ride",
          canal: 10, programme: null, percussion: true,
          notes, propose: cible,
        });
      }
      continue;
    }
    const aigus = v.notes.map((n) => n.note);
    pistes.push({
      cle: v.cle,
      nom: v.nom || `piste ${v.piste + 1}`,
      famille: NOMS_GM[Math.floor(v.programme / 8)] || "inconnu",
      canal: v.canal + 1, programme: v.programme, percussion: false,
      notes: v.notes,
      grave: Math.min(...aigus), aigu: Math.max(...aigus),
      propose: proposePourProgramme(v.programme),
    });
  }

  const parMesure = tempsParMesureLocal(signature);
  const mesures = Math.max(1, Math.floor((finMax / ppq) / parMesure) + 1);
  return { ok: true, ppq, format, bpm, mesure: signature, mesures, pistes };
}

// Meme regle que Tone et que format-morceau.js : Tone compte en NOIRES, donc
// une mesure de 6/8 vaut 3 temps. Copie locale volontairement minuscule pour
// ne pas creer de dependance circulaire entre les deux modules.
function tempsParMesureLocal(mesure) {
  const m = /^(\d+)\/(\d+)$/.exec(String(mesure || "4/4"));
  if (!m) return 4;
  return parseInt(m[1], 10) / (parseInt(m[2], 10) / 4);
}

// --- Construction du morceau ------------------------------------------------

// Pas de dieses dans la banque FluidR3 : les noms s'ecrivent en bemols.
const NOMS_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const MIDI_MIN = 21, MIDI_MAX = 108;      // A0 a C8, la tessiture rapatriee

function nomDeNote(n) {
  return NOMS_NOTES[n % 12] + (Math.floor(n / 12) - 1);
}

// Les durees que le format accepte, en noires. Le fichier donne des durees
// quelconques, le format veut la notation de Tone : on prend la plus proche.
const DUREES = [
  ["1n", 4], ["2n.", 3], ["2n", 2], ["4n.", 1.5], ["2t", 4 / 3], ["4n", 1],
  ["8n.", 0.75], ["4t", 2 / 3], ["8n", 0.5], ["16n.", 0.375], ["8t", 1 / 3],
  ["16n", 0.25], ["16t", 1 / 6], ["32n", 0.125],
];

function dureeProche(noires) {
  let meilleur = DUREES[DUREES.length - 1], ecart = Infinity;
  for (const [nom, v] of DUREES) {
    // Comparaison en rapport et non en difference : a l'oreille, 1/16 contre
    // 1/8 est le meme ecart que 1n contre 2n.
    const e = Math.abs(Math.log(noires / v));
    if (e < ecart) { ecart = e; meilleur = [nom, v]; }
  }
  return meilleur[0];
}

// Position en noires -> « mesure:temps:doubles-croches », calee sur la
// double-croche : une comptine ne demande pas plus fin, et une grille propre
// evite les positions a rallonge dans le fichier exporte.
function position(noires, parMesure) {
  const d = Math.round(noires * 4);                 // en doubles-croches
  const parMesure16 = Math.round(parMesure * 4);
  const mesure = Math.floor(d / parMesure16);
  const dansMesure = d - mesure * parMesure16;
  return `${mesure}:${Math.floor(dansMesure / 4)}:${dansMesure % 4}`;
}

// Niveaux de depart pour un morceau importe. Ce sont des estimations, pas un
// reglage a l'oreille : le mixage morceau par morceau est la phase 4, et c'est
// Mathieu qui l'entend.
const MIX_PAR_DEFAUT = {
  violon: -3, flute: -6, trompette: -7, clarinette: -5, xylophone: -6,
  piano: -5, guitare: -4, accordeon: -6, koto: -6, sitar: -8,
  tuba: -6, batterie: -8, cymbales: -12,
};

export const INSTRUMENTS_CIBLES = [
  ...Object.keys(MELODIQUES), ...Object.keys(PERCUSSIONS),
];

// affectation : { [cle de voix]: identifiant d'instrument ou "" }.
// Rend { morceau, rapport } ou rapport dit ce qui a ete transforme : c'est ce
// qu'on affiche, parce qu'un import silencieux qui deplace des notes d'une
// octave serait une surprise desagreable.
export function construis(analyse, affectation, infos = {}) {
  const parMesure = tempsParMesureLocal(analyse.mesure);
  const parties = {};
  for (const inst of INSTRUMENTS_CIBLES) parties[inst] = [];

  let ramenees = 0, ignorees = 0, retenues = 0;
  const utilises = new Set();

  for (const piste of analyse.pistes) {
    const cible = affectation[piste.cle];
    if (!cible || !INSTRUMENTS_CIBLES.includes(cible)) { ignorees += piste.notes.length; continue; }
    utilises.add(cible);
    const percussion = PERCUSSIONS[cible] !== undefined;

    for (const n of piste.notes) {
      const t = position(n.t / analyse.ppq, parMesure);
      const vel = Math.max(0.05, Math.min(1, n.vel / 127));
      if (percussion) {
        const frappe = FRAPPE_GM[n.note];
        if (!frappe || INSTRUMENT_DE_FRAPPE[frappe] !== cible) { ignorees++; continue; }
        parties[cible].push({ t, frappe, vel: +vel.toFixed(2) });
      } else {
        let h = n.note;
        while (h < MIDI_MIN) { h += 12; ramenees++; }
        while (h > MIDI_MAX) { h -= 12; ramenees++; }
        parties[cible].push({
          t, note: nomDeNote(h),
          duree: dureeProche(n.duree / analyse.ppq),
          vel: +vel.toFixed(2),
        });
      }
      retenues++;
    }
  }

  // La longueur se calcule sur ce qu'on GARDE : une piste ignoree qui
  // depassait aurait allonge la boucle avec du silence.
  let dernier = 0;
  for (const inst of INSTRUMENTS_CIBLES) {
    for (const ev of parties[inst]) {
      const m = /^(\d+):(\d+):(\d+)$/.exec(ev.t);
      if (m) dernier = Math.max(dernier, +m[1] * parMesure + +m[2] + +m[3] / 4);
    }
    parties[inst].sort((a, b) => {
      const p = (x) => { const m = /^(\d+):(\d+):(\d+)$/.exec(x.t); return +m[1] * parMesure + +m[2] + +m[3] / 4; };
      return p(a) - p(b);
    });
  }
  const longueur = Math.max(1, Math.floor(dernier / parMesure) + 1);

  const mix = {};
  for (const inst of utilises) mix[inst] = MIX_PAR_DEFAUT[inst];

  const morceau = {
    id: infos.id || "importe",
    titre: infos.titre || "Morceau importe",
    compositeur: infos.compositeur || "Inconnu",
    source: infos.source || "Importe depuis un fichier MIDI",
    couleur: infos.couleur || "#7C8CC4",
    bpm: Math.max(21, Math.min(299, analyse.bpm || 120)),
    mesure: analyse.mesure,
    longueur,
    mix,
    parties,
  };
  return {
    morceau,
    rapport: { retenues, ignorees, ramenees, instruments: [...utilises], longueur },
  };
}
