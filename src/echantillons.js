// Ce que le moteur doit charger : pour chaque instrument, ou sont ses fichiers
// et quelles notes existent reellement sur le disque.
//
// MIROIR DE scripts/fetch-samples.sh. Le script rapatrie, ce module charge, et
// les deux tableaux doivent rester d'accord : une note listee ici mais absente
// du script donne un 404 au chargement, une note rapatriee mais absente d'ici
// est du poids mort dans le depot. Si tu ajoutes une note, ajoute-la des deux
// cotes.
//
// Pourquoi 6 notes et pas 88 : le Tone.Sampler transpose. Six points par
// instrument suffisent a couvrir sa tessiture sans que la transposition
// s'entende, et c'est ce qui garde la banque a 2,9 Mo au lieu de 60.
//
// Source : rendu MP3 du soundfont FluidR3_GM, projet midi-js-soundfonts,
// Creative Commons Attribution 3.0. La percussion est extraite du .sf2 par
// scripts/fetch-percussion.sh, meme banque, meme licence.

export const RACINE = "assets/samples/";

// Les 11 instruments melodiques : Tone.Sampler, fichiers .mp3.
// Convention de nommage FluidR3 confirmee fichier par fichier : majuscule,
// bemol en « b » minuscule, numero d'octave. Les dieses n'existent pas.
export const MELODIQUES = {
  violon:     { gm: "violin",                notes: ["G3", "C4", "E4", "A4", "C5", "E5"] },
  guitare:    { gm: "acoustic_guitar_nylon", notes: ["E2", "A2", "D3", "G3", "B3", "E4"] },
  koto:       { gm: "koto",                  notes: ["D3", "G3", "C4", "F4", "Bb4", "Eb5"] },
  sitar:      { gm: "sitar",                 notes: ["C3", "F3", "Bb3", "Eb4", "G4", "C5"] },
  flute:      { gm: "flute",                 notes: ["C4", "F4", "A4", "D5", "G5", "C6"] },
  clarinette: { gm: "clarinet",              notes: ["D3", "G3", "C4", "F4", "Bb4", "Eb5"] },
  trompette:  { gm: "trumpet",               notes: ["Bb3", "Eb4", "G4", "C5", "F5", "Bb5"] },
  tuba:       { gm: "tuba",                  notes: ["E1", "A1", "D2", "G2", "C3", "F3"] },
  xylophone:  { gm: "xylophone",             notes: ["F4", "Bb4", "D5", "G5", "C6", "F6"] },
  piano:      { gm: "acoustic_grand_piano",  notes: ["C2", "G2", "D3", "A3", "E4", "C5", "G5"] },
  accordeon:  { gm: "accordion",             notes: ["F2", "C3", "G3", "D4", "A4", "E5"] },
};

// Les 2 instruments de percussion : ToneAudioBuffers, fichiers .wav.
// WAV et non MP3 : l'encodage MP3 ajoute un silence d'amorce audible sur une
// attaque de batterie, et neuf fichiers courts ne pesent rien.
//
// Batterie et cymbales sont DEUX instruments de la scene, avec leurs propres
// emplacements et leurs propres niveaux. L'enfant peut poser l'un sans l'autre.
export const PERCUSSIONS = {
  batterie: ["kick", "snare", "tom_bas", "tom_med", "tom_haut"],
  cymbales: ["charley", "charley_ouvert", "crash", "ride"],
};

// frappe -> instrument qui la porte. Sert au moteur pour router une frappe vers
// le bon canal, et au validateur pour refuser « kick » sur les cymbales.
export const INSTRUMENT_DE_FRAPPE = {};
for (const [inst, frappes] of Object.entries(PERCUSSIONS)) {
  for (const f of frappes) INSTRUMENT_DE_FRAPPE[f] = inst;
}

// Duree d'un echantillon, mesuree le 13 septembre 2026 : 3,16 s pour toutes les
// notes de toutes les banques, et il sonne jusqu'au bout (aucun silence de
// queue, mesure a -60 dB). Une note plus longue est donc coupee net.
// A 100 a la noire une ronde tient (2,4 s), au dela de cinq temps ca coupe.
export const DUREE_ECHANTILLON = 3.16;

// --- Outils de hauteur, partages par le moteur et le validateur -------------

const DEMI_TONS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// « Bb3 » -> 58. Rend null si le nom ne respecte pas la convention du projet.
// Les dieses sont refuses exprès : « Cs4 » et « C#4 » renvoient 404 sur la
// banque, donc les accepter ici ne ferait que deplacer l'erreur plus loin.
export function versDemiTons(nom) {
  const m = /^([A-G])(b?)(-?\d+)$/.exec(nom);
  if (!m) return null;
  return DEMI_TONS[m[1]] - (m[2] ? 1 : 0) + (parseInt(m[3], 10) + 1) * 12;
}

// Combien de demi-tons separent cette note de l'echantillon le plus proche.
// Au dela d'environ 5, le Sampler tire tellement sur l'echantillon que le
// timbre change : un violon transpose d'une octave ne sonne plus violon.
export function distanceDeTransposition(instrument, nom) {
  const fiche = MELODIQUES[instrument];
  if (!fiche) return null;
  const cible = versDemiTons(nom);
  if (cible === null) return null;
  return Math.min(...fiche.notes.map((n) => Math.abs(versDemiTons(n) - cible)));
}
