#!/usr/bin/env bash
# Rapatrie les echantillons de notes des instruments melodiques dans
# assets/samples/<instrument>/<note>.mp3
#
# Source : rendu MP3 du soundfont FluidR3_GM, projet midi-js-soundfonts.
# Licence : Creative Commons Attribution 3.0. A crediter dans la page « a propos ».
#
# Convention de nommage confirmee le 13 septembre 2026, fichier par fichier :
#   lettre majuscule, bemol en « b » minuscule, numero d'octave, extension .mp3
#   C4.mp3, Db4.mp3, Bb3.mp3        -> 200
#   Cs4.mp3, C#4.mp3, As3.mp3       -> 404, les dieses n'existent pas
#   88 notes de A0 a C8, chromatique, 25 585 octets par fichier
#
# L'adresse officielle du projet est https://gleitz.github.io/midi-js-soundfonts/
# On passe par raw.githubusercontent.com, qui sert exactement les memes fichiers
# depuis la branche gh-pages du meme depot, et qui traverse davantage de reseaux.
#
# A lancer depuis n'importe ou : bash scripts/fetch-samples.sh
# Relançable : les fichiers deja presents sont sautes.
set -euo pipefail

BASE="https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM"
cd "$(dirname "$0")/.."
DEST="assets/samples"

# --- Instruments a rapatrier -------------------------------------------------
# Une ligne par instrument : <nom sur la scene> <nom General MIDI> <notes...>
# Elargir une tessiture = ajouter des notes sur la ligne, rien d'autre a toucher.
# 4 a 6 notes suffisent, le Tone.Sampler transpose le reste.
#
# Les 9 instruments restants de CLAUDE.md sont en commentaire, prets pour la phase 1.
INSTRUMENTS=(
  "violon      violin                  G3 C4 E4 A4 C5 E5"
  "tuba        tuba                    E1 A1 D2 G2 C3 F3"
# "flute       flute                   C4 F4 A4 D5 G5 C6"
# "clarinette  clarinet                D3 G3 C4 F4 Bb4 Eb5"
# "trompette   trumpet                 Bb3 Eb4 G4 C5 F5 Bb5"
# "xylophone   xylophone               F4 Bb4 D5 G5 C6 F6"
# "piano       acoustic_grand_piano    C2 G2 D3 A3 E4 C5 G5"
# "guitare     acoustic_guitar_nylon   E2 A2 D3 G3 B3 E4"
# "accordeon   accordion               F2 C3 G3 D4 A4 E5"
# "koto        koto                    D3 G3 C4 F4 Bb4 Eb5"
# "sitar       sitar                   C3 F3 Bb3 Eb4 G4 C5"
)

total=0
rapatries=0

for ligne in "${INSTRUMENTS[@]}"; do
  read -r nom gm notes <<< "$ligne"
  mkdir -p "$DEST/$nom"
  printf '%-12s (%s)\n' "$nom" "$gm"

  for note in $notes; do
    cible="$DEST/$nom/$note.mp3"
    total=$((total + 1))

    if [ -s "$cible" ]; then
      printf '  %-5s deja present\n' "$note"
      continue
    fi

    url="$BASE/$gm-mp3/$note.mp3"
    code=$(curl -sS -o "$cible.part" -w '%{http_code}' "$url" || echo 000)

    if [ "$code" != "200" ]; then
      rm -f "$cible.part"
      echo
      echo "ECHEC : $url a repondu $code" >&2
      echo "Si c'est un 404, la note demandee n'existe pas dans cette banque." >&2
      echo "Les notes vont de A0 a C8, bemols en « b » minuscule, pas de dieses." >&2
      exit 1
    fi

    mv "$cible.part" "$cible"
    rapatries=$((rapatries + 1))
    printf '  %-5s %s octets\n' "$note" "$(wc -c < "$cible" | tr -d ' ')"
  done
done

echo
echo "$rapatries fichier(s) rapatrie(s) sur $total attendu(s)."
echo "Poids de $DEST : $(du -sh "$DEST" | cut -f1)"
