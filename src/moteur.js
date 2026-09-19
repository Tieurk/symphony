// LE MOTEUR AUDIO. C'est le coeur du projet, et il tient sur une seule idee.
//
// Une horloge unique, le Tone.Transport, fait tourner le morceau en boucle. Au
// chargement d'un morceau, LES 13 PARTIES SONT PROGRAMMEES D'UN COUP. Elles
// tournent toutes en permanence, y compris celles des instruments restes en
// reserve.
//
// Poser un instrument sur la scene NE LANCE RIEN. Ca ouvre son canal : le gain
// de mute passe de 0 a 1. Le retirer referme le canal. C'est ce qui garantit
// que tout reste cale a la note pres quel que soit le moment ou l'enfant agit.
// Demarrer ou arreter une partie individuelle pour gerer l'audibilite est
// l'interdit central du projet : ca desynchronise, et ça ne se rattrape pas.
//
// Chaine par instrument :
//   source -> Tone.Gain (mute, a 0 au depart) -> Tone.Gain (mixage) -> bus
//
// Scene vide, aucun son : les 13 canaux sont fermes, l'horloge continue de
// tourner. C'est l'invariant qu'il faut mesurer a chaque changement.

import {
  MELODIQUES, PERCUSSIONS, INSTRUMENT_DE_FRAPPE,
} from "./echantillons.js";
import { tempsParMesure } from "./format-morceau.js";

// Les chemins sont resolus depuis l'emplacement du MODULE, pas depuis celui de
// la page. Une page a la racine et une page dans test/ chargent donc les memes
// fichiers sans que le moteur ait a savoir d'ou on l'appelle.
const RACINE = new URL("../assets/", import.meta.url).href;

// Rampe de mute. Assez longue pour eviter le clic, assez courte pour ne pas
// rater l'attaque. Mesure en phase 0 : le gain atteint zero en 11 ms.
const RAMPE_MUTE = 0.008;

// L'ANTICIPATION, tranchee par Mathieu a l'oreille sur l'iPad le 15 septembre
// 2026. Tone met 0,1 s par defaut en mode « interactive », ce qui donnait une
// reaction percue de 108 ms alors que la rampe de mute fait son travail en 11.
// A 20 ms la reaction tombe a environ 28 ms, soit quatre fois plus vif.
// Reserve a garder en tete : CLAUDE.md previent qu'un reglage court peut
// accrocher sur un appareil faible. Teste sur l'iPad, PAS sur l'iPhone. Le banc
// d'essai garde ses trois boutons pour retester ailleurs, via anticipation().
const ANTICIPATION = 0.02;
Tone.getContext().lookAhead = ANTICIPATION;
// Rampe du niveau de mixage, au changement de morceau. Un saut brutal sur un
// canal deja ouvert s'entend.
const RAMPE_MIX = 0.02;

const INSTRUMENTS = [...Object.keys(MELODIQUES), ...Object.keys(PERCUSSIONS)];

// --- Etat -------------------------------------------------------------------

let pret = false;
let bus = null;
const sources = {};   // instrument melodique -> Tone.Sampler
const tampons = {};   // instrument de percussion -> Tone.ToneAudioBuffers
const voies = {};     // instrument -> { mute, mixage, ouvert }
const etouffement = {};
let parties = [];     // les Tone.Part du morceau courant, a jeter au suivant
let morceauCourant = null;
let pourcentageTempo = 100;
let rapporteErreur = (texte) => console.error(texte);
let rappelNote = null;      // (instrument) -> void, au temps VISUEL
let rappelMesure = null;    // () -> void, au temps VISUEL
let idMesure = null;

const silencieux = new Audio(RACINE + "silence.mp3");
silencieux.loop = true;
silencieux.setAttribute("playsinline", "");

export function surErreur(rappel) { rapporteErreur = rappel; }

// LA SYNCHRONISATION VISUELLE PASSE PAR ICI, ET NULLE PART AILLEURS.
// L'app ne touche jamais a Tone directement : c'est ce qui garde la
// connaissance de l'audio dans un seul fichier. Et c'est Tone.Draw qui aligne
// le visuel sur le temps AUDIO : un setTimeout tomberait a cote, d'autant plus
// que l'anticipation vaut 20 ms.
export function surNote(rappel) { rappelNote = rappel; }
export function surMesure(rappel) { rappelMesure = rappel; }

// Appele depuis le rappel de partie, donc environ 20 ms avant que le son
// sorte. L'etat ouvert est relu au temps VISUEL : un instrument ferme ne doit
// jamais tressaillir, meme si sa partie tourne (et elles tournent toutes).
function signaleNote(inst, temps) {
  if (!rappelNote) return;
  Tone.Draw.schedule(() => {
    if (voies[inst] && voies[inst].ouvert) rappelNote(inst);
  }, temps);
}
export function estPret() { return pret; }
export function morceau() { return morceauCourant; }
export function instruments() { return INSTRUMENTS.slice(); }

// --- Amorcage ---------------------------------------------------------------

// AUCUNE ATTENTE SANS BORNE. Le 19 septembre 2026, Mathieu rapporte que l'app
// « charge a l'infini et ne joue plus de musique » sur l'iPad et l'iPhone.
// L'anneau du bouton de lecture est pose avant cet amorcage et retire apres :
// un anneau qui tourne sans fin veut donc dire que cette fonction est
// SUSPENDUE, ni en succes ni en erreur. Et suspendue, elle ne dit rien.
//
// Les deux attentes ci-dessous ont chacune une facon connue de ne jamais
// rendre la main sur WebKit :
//   Tone.start()    resume() du contexte audio reste en attente si le systeme
//                   refuse le son sans le dire
//   Tone.loaded()   decodeAudioData sur des octets qui ne sont pas de l'audio
//                   peut ne rappeler ni en succes ni en erreur
// Les deux sont donc bornees, avec un motif distinct. Mieux vaut une app qui
// dit « le son n'a pas demarre » qu'une app qui tourne dans le vide.
const DELAI_CONTEXTE = 5000;    // ms pour que le contexte audio reprenne
// 12 s pour les 2,6 Mo d'echantillons. Court expres : depasser ce delai ne
// perd rien, puisque les parties verifient a chaque note si leur echantillon
// est arrive. Un instrument en retard SE MET A JOUER TOUT SEUL des qu'il est
// la. Mieux vaut donc un orchestre qui se remplit qu'un enfant devant un
// anneau qui tourne.
const DELAI_SONS = 12000;

function avecDelai(promesse, ms, quoi) {
  let minuteur = null;
  const limite = new Promise((_, rejette) => {
    minuteur = setTimeout(() => rejette(new Error(quoi + " : rien apres " + (ms / 1000) + " s")), ms);
  });
  return Promise.race([promesse, limite]).finally(() => clearTimeout(minuteur));
}

// Ce que le dernier amorcage a donne, pour la page « A propos » : sans ca,
// diagnostiquer un appareil que je ne peux pas essayer passe par des questions.
let dernierEchec = "";

// Un instrument est-il reellement jouable ? Les melodiques sont des Sampler
// dans « sources », les percussions des ToneAudioBuffers dans « tampons ».
export function chargeInstrument(nom) {
  const src = sources[nom] || tampons[nom];
  return !!(src && src.loaded);
}

// A APPELER DEPUIS UN GESTE UTILISATEUR, sans aucun await avant.
// Deux pieges iOS d'un coup : le contexte audio ne demarre qu'apres un geste,
// et le bouton silencieux de l'iPhone coupe l'audio web tant qu'un element
// <audio> n'a pas bascule la session. Les deux doivent partir dans le geste,
// donc avant tout chargement.
export async function demarre() {
  if (pret) return { sessionIos: true };

  let sessionIos = true;
  silencieux.play().catch((e) => {
    sessionIos = false;
    rapporteErreur("session audio iOS refusee : " + e.name);
  });

  try {
    await avecDelai(Tone.start(), DELAI_CONTEXTE, "le contexte audio n'a pas repris");
  } catch (e) {
    dernierEchec = e.message;
    throw e;
  }
  // Tone.start() reprend le contexte existant, il ne le remplace pas, donc la
  // valeur posee au chargement tient. On la reaffirme quand meme : si une
  // version de Tone recreait le contexte, on repartirait a 0,1 s en silence.
  Tone.getContext().lookAhead = ANTICIPATION;
  construis();

  // UN ECHANTILLON QUI NE VIENT PAS NE DOIT PLUS EMPORTER LES DOUZE AUTRES.
  // On attend, borne, et on continue avec ce qui est arrive : un instrument
  // muet vaut mieux qu'une app muette. Les manquants sont nommes dans le
  // diagnostic, et les parties les sautent.
  try {
    await avecDelai(Tone.loaded(), DELAI_SONS, "les sons ne se sont pas charges");
    dernierEchec = "";
  } catch (e) {
    dernierEchec = e.message;
    rapporteErreur(e.message);
  }
  pret = true;
  return { sessionIos, manquants: diagnostic().manquants };
}

function urlsDeNotes(notes) {
  const o = {};
  for (const n of notes) o[n] = n + ".mp3";
  return o;
}

function voie(nom) {
  const mixage = new Tone.Gain(1).connect(bus);
  const mute = new Tone.Gain(0).connect(mixage);   // ferme au depart
  voies[nom] = { mute, mixage, ouvert: false };
  return mute;
}

function construis() {
  bus = new Tone.Gain(1).toDestination();

  for (const [nom, fiche] of Object.entries(MELODIQUES)) {
    sources[nom] = new Tone.Sampler({
      urls: urlsDeNotes(fiche.notes),
      baseUrl: RACINE + "samples/" + nom + "/",
      release: 0.4,
    }).connect(voie(nom));
  }

  for (const [nom, frappes] of Object.entries(PERCUSSIONS)) {
    const urls = {};
    for (const f of frappes) urls[f] = f + ".wav";
    tampons[nom] = new Tone.ToneAudioBuffers({
      urls, baseUrl: RACINE + "samples/" + nom + "/",
    });
    voie(nom);
  }
}

// --- Frappes ----------------------------------------------------------------

// Une source jetable par frappe, donc vraie polyphonie et pas d'erreur de
// redemarrage quand la meme frappe revient vite. Un Sampler ne convient pas
// ici : il coupe la note precedente de la meme hauteur.
function frappe(nom, temps, destination, velocite) {
  const tampon = tampons[INSTRUMENT_DE_FRAPPE[nom]].get(nom);
  const src = new Tone.ToneBufferSource({ url: tampon, fadeOut: 0.02 }).connect(destination);

  // Le charley s'etouffe lui-meme et etouffe le charley ouvert, comme un vrai.
  if (nom === "charley" || nom === "charley_ouvert") {
    const ancien = etouffement.charley;
    if (ancien) { try { ancien.stop(temps + 0.02); } catch (e) { /* deja fini */ } }
    etouffement.charley = src;
  }

  src.onended = () => src.dispose();
  src.start(temps, 0, undefined, velocite === undefined ? 1 : velocite);
  return src;
}

// --- Programmation ----------------------------------------------------------

// Tone.Part EXIGE que la cle du temps d'un evenement s'appelle « time ». Le
// format du projet utilise « t ». La conversion se fait ICI, a la frontiere du
// moteur, et nulle part ailleurs. Sans elle, Part programme tout au tick 0 avec
// une valeur indefinie, le rappel plante, et on n'entend rien sans voir aucune
// erreur : l'exception se perd dans l'horloge audio.
function versTone(evenements) {
  return evenements.map((ev) => Object.assign({}, ev, { time: ev.t }));
}

// Un rappel qui plante dans une partie ne remonte nulle part, pour la meme
// raison. On l'attrape et on le fait remonter a l'appelant.
function garde(nomPartie, rappel) {
  return (temps, ev) => {
    try {
      rappel(temps, ev);
    } catch (e) {
      rapporteErreur("partie " + nomPartie + " : " + (e && e.message ? e.message : e));
    }
  };
}

function niveau(m, inst) {
  const db = m.mix && typeof m.mix[inst] === "number" ? m.mix[inst] : 0;
  return Tone.dbToGain(db);
}

// Charge un morceau. Les instruments deja poses RESTENT poses, et le nouveau
// morceau repart du debut dans le meme etat de lecture (cahier des charges).
// Le detail qui compte : on reapplique les niveaux de mixage du nouveau morceau
// SANS TOUCHER au gain de mute, sinon on entend un clic sur un instrument qui
// n'a pas bouge.
export function chargeMorceau(m) {
  if (!pret) throw new Error("chargeMorceau avant demarre()");

  for (const p of parties) p.dispose();
  parties = [];
  // « 1m » depend de la signature rythmique, qui change d'un morceau a
  // l'autre : la pulsation de mesure se reprogramme avec les parties.
  if (idMesure !== null) { Tone.Transport.clear(idMesure); idMesure = null; }

  const parMesure = tempsParMesure(m.mesure) || 4;
  const sig = /^(\d+)\/(\d+)$/.exec(String(m.mesure || "4/4"));
  Tone.Transport.timeSignature = sig ? [parseInt(sig[1], 10), parseInt(sig[2], 10)] : 4;
  Tone.Transport.bpm.value = m.bpm * (pourcentageTempo / 100);
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = m.longueur + "m";
  Tone.Transport.position = 0;

  for (const inst of INSTRUMENTS) {
    voies[inst].mixage.gain.rampTo(niveau(m, inst), RAMPE_MIX);

    const evts = Array.isArray(m.parties[inst]) ? m.parties[inst] : [];
    const joue = PERCUSSIONS[inst]
      ? (temps, ev) => frappe(ev.frappe, temps, voies[inst].mute, ev.vel)
      : (temps, ev) => sources[inst].triggerAttackRelease(
          ev.note, ev.duree, temps, ev.vel === undefined ? 0.8 : ev.vel);
    // Un instrument dont l'echantillon n'est pas arrive SE TAIT au lieu de
    // lever a chaque note : depuis que l'attente des sons est bornee, le
    // moteur peut demarrer incomplet, et douze instruments qui jouent valent
    // mieux qu'une app qui refuse de demarrer.
    const rappel = (temps, ev) => {
      if (!chargeInstrument(inst)) return;
      joue(temps, ev);
      signaleNote(inst, temps);
    };

    // La partie est programmee meme vide : les 13 tournent en permanence, et
    // une partie vide qui tourne coute zero.
    parties.push(new Tone.Part(garde(inst, rappel), versTone(evts)).start(0));
  }

  idMesure = Tone.Transport.scheduleRepeat((temps) => {
    if (rappelMesure) Tone.Draw.schedule(rappelMesure, temps);
  }, "1m", 0);

  morceauCourant = m;
  // parMesure sert au diagnostic, pas au Transport qui le recalcule lui-meme.
  return { tempsParMesure: parMesure };
}

// --- Canaux -----------------------------------------------------------------

export function ouvre(inst) {
  const v = voies[inst];
  if (!v || v.ouvert) return;
  v.ouvert = true;
  v.mute.gain.rampTo(1, RAMPE_MUTE);
}

export function ferme(inst) {
  const v = voies[inst];
  if (!v || !v.ouvert) return;
  v.ouvert = false;
  v.mute.gain.rampTo(0, RAMPE_MUTE);
}

export function basculer(inst) {
  if (voies[inst] && voies[inst].ouvert) ferme(inst); else ouvre(inst);
  return estOuvert(inst);
}

export function estOuvert(inst) { return !!(voies[inst] && voies[inst].ouvert); }
export function poses() { return INSTRUMENTS.filter(estOuvert); }
export function fermeTout() { for (const i of INSTRUMENTS) ferme(i); }

// --- Horloge, tempo, volume -------------------------------------------------

export function lecture() { if (pret) Tone.Transport.start(); }
export function pause() { Tone.Transport.pause(); }
export function enLecture() { return Tone.Transport.state === "started"; }

export function basculeLecture() {
  if (enLecture()) pause(); else lecture();
  return enLecture();
}

// De 60 a 140 % du tempo d'origine du morceau. Comme l'app joue des partitions
// et non des enregistrements, la hauteur des notes ne bouge pas : le violon
// reste un violon a toutes les vitesses.
export function tempo(pourcentage) {
  pourcentageTempo = Math.max(60, Math.min(140, pourcentage));
  if (morceauCourant) {
    Tone.Transport.bpm.rampTo(morceauCourant.bpm * (pourcentageTempo / 100), 0.05);
  }
  return pourcentageTempo;
}
export function tempoCourant() { return pourcentageTempo; }

export function volume(v) {
  if (!bus) return;
  const borne = Math.max(0, Math.min(1, v));
  bus.gain.rampTo(borne <= 0 ? 0 : Tone.dbToGain(-40 * (1 - borne)), 0.05);
}

// lookAhead vaut 0,1 s par defaut en mode « interactive ». Mesure en phase 0 :
// la rampe de mute fait son travail en 11 ms, mais le son ne s'arrete que
// 125 ms apres l'appui, a cause de cette anticipation. Descendre accelere la
// reaction au prix d'un risque d'accrocs audio sur les appareils faibles.
// A trancher a la main sur l'iPad, pas a l'aveugle : d'ou ce reglage a chaud.
export function anticipation(secondes) {
  Tone.getContext().lookAhead = secondes;
  return secondes;
}

// --- Diagnostic -------------------------------------------------------------

export function diagnostic() {
  const ctx = Tone.getContext();
  const t = Tone.Transport;
  const charges = INSTRUMENTS.filter(chargeInstrument);
  return {
    pret,
    contexte: ctx.state,
    // Depuis que l'attente des sons est bornee, le moteur peut demarrer
    // incomplet. Savoir QUI manque est la premiere question qu'on se pose sur
    // un appareil qu'on ne peut pas essayer.
    instrumentsCharges: charges.length,
    instrumentsAttendus: INSTRUMENTS.length,
    manquants: INSTRUMENTS.filter((n) => !charges.includes(n)),
    dernierEchec,
    anticipation: Math.round(ctx.lookAhead * 1000) / 1000,
    reactionMs: Math.round((ctx.lookAhead + RAMPE_MUTE) * 1000),
    horloge: t.state,
    position: t.position,
    bpm: Math.round(t.bpm.value * 10) / 10,
    mesure: t.timeSignature,
    boucle: t.loop
      ? (morceauCourant ? morceauCourant.longueur + " mesures, " : "")
        + Math.round(Tone.Time(t.loopEnd).toSeconds() * 10) / 10 + " s"
      : "non",
    signature: morceauCourant ? morceauCourant.mesure : null,
    tempsParMesure: t.timeSignature,
    parties: parties.length,
    poses: poses(),
    morceau: morceauCourant ? morceauCourant.id : null,
    tempo: pourcentageTempo,
  };
}
