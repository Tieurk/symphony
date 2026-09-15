#!/usr/bin/env bash
# Rapatrie la percussion depuis la banque de percussion du soundfont FluidR3_GM,
# vers assets/samples/batterie/ et assets/samples/cymbales/.
#
# Kit retenu apres ecoute comparee de trois candidats, le 15 septembre 2026.
# Le tableau comparatif et les raisons sont dans docs/points-ouverts.md.
# Retenu parce qu'il vient de la MEME banque que les 11 instruments melodiques,
# donc meme prise de son, et qu'il couvre les 9 frappes sans transposition.
#
#   Source  : FluidR3_GM.sf2, banque 128 programme 0, preset « Standard »
#   Licence : Creative Commons Attribution 3.0, la meme que le reste de
#             l'orchestre. Un seul credit couvre donc toute la banque de sons.
#
# Le rendu MP3 pre-fabrique de midi-js-soundfonts ne contient QUE les 128
# programmes melodiques (percussion-mp3/, drums-mp3/ et standard_kit-mp3/
# renvoient 404), d'ou l'extraction depuis le .sf2.
#
# LES 9 FICHIERS SONT COMMITTES. Ce script n'a pas a etre relance : il est la
# pour documenter la provenance exacte et pouvoir refaire l'operation. Il
# demande ffmpeg, que le depot n'exige nulle part ailleurs.
#
#   bash scripts/fetch-percussion.sh
#   FFMPEG=/chemin/vers/ffmpeg bash scripts/fetch-percussion.sh
#   SF2_LOCAL=/chemin/FluidR3_GM.sf2 bash scripts/fetch-percussion.sh   (evite 148 Mo)
#
# Repartition des 9 frappes sur les DEUX instruments de la scene, conformement a
# CLAUDE.md : la batterie et les cymbales sont deux instruments distincts, avec
# leurs propres emplacements et leurs propres niveaux de mixage.
#
#   batterie  kick snare tom_bas tom_med tom_haut
#   cymbales  charley charley_ouvert crash ride
#
# NORMALISATION : mono, 44 100 Hz, PCM 16 bits, pic ramene a -1 dBFS, duree
# plafonnee par frappe, fondu de sortie de 120 ms pour eviter le clic.
set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG="${FFMPEG:-ffmpeg}"
if ! command -v "$FFMPEG" >/dev/null 2>&1; then
  cat >&2 <<'AIDE'
ffmpeg est introuvable.

Les 9 fichiers WAV sont deja committes dans assets/samples/batterie/ et
assets/samples/cymbales/, tu n'as normalement aucune raison de lancer ce
script. Si tu veux vraiment le refaire :

  brew install ffmpeg

ou, sans rien installer sur le systeme :

  npm i ffmpeg-static
  FFMPEG=./node_modules/ffmpeg-static/ffmpeg bash scripts/fetch-percussion.sh
AIDE
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- normalise <source> <cible.wav> <duree_max_s> --------------------------
# Trois passes, et non deux. Mesurer le pic sur un graphe de filtres et
# appliquer le gain sur un autre donne un resultat faux quand la source est
# stereo : le repliement en mono n'applique pas le meme gain dans les deux
# invocations, la mesure sous-estime de 6 dB et l'ecriture ecrete a 0 dBFS.
# On mesure donc sur le fichier intermediaire lui-meme, pas sur un graphe.
normalise() {
  local src="$1" dst="$2" dur="$3"
  local chaine="aresample=44100,aformat=channel_layouts=mono,atrim=0:$dur,areverse,afade=t=in:d=0.12,areverse"
  local brut="$TMP/normalise_brut.wav"

  "$FFMPEG" -y -v error -i "$src" -af "$chaine" -ac 1 -ar 44100 -c:a pcm_s16le "$brut"

  local pic gain
  pic=$("$FFMPEG" -hide_banner -nostats -i "$brut" -af volumedetect \
        -f null - 2>&1 | grep -oE 'max_volume: -?[0-9.]+' | tail -1 | awk '{print $2}')
  [ -n "${pic:-}" ] || { echo "ECHEC : pic illisible sur $src" >&2; exit 1; }
  gain=$(awk "BEGIN{printf \"%.2f\", -1 - ($pic)}")

  mkdir -p "$(dirname "$dst")"
  "$FFMPEG" -y -v error -i "$brut" -af "volume=${gain}dB" \
    -ac 1 -ar 44100 -c:a pcm_s16le "$dst"
  rm -f "$brut"

  printf '  %-30s %7s o   gain %+6s dB\n' \
    "$dst" "$(wc -c < "$dst" | tr -d ' ')" "$gain"
}

SF2="$TMP/FluidR3_GM.sf2"
if [ -n "${SF2_LOCAL:-}" ] && [ -s "$SF2_LOCAL" ]; then
  echo "soundfont local : $SF2_LOCAL"
  SF2="$SF2_LOCAL"
else
  echo "telechargement du soundfont, 148 Mo..."
  code=$(curl -sSL -o "$SF2" -w '%{http_code}' \
    "https://raw.githubusercontent.com/urish/cinto/master/media/FluidR3%20GM.sf2" || echo 000)
  [ "$code" = "200" ] || { echo "ECHEC : telechargement du soundfont, code $code" >&2; exit 1; }
fi

python3 scripts/extract-kit-fluidr3.py "$SF2" "$TMP/brut"

echo "normalisation :"
for f in kick snare tom_bas tom_med tom_haut; do
  normalise "$TMP/brut/$f.wav" "assets/samples/batterie/$f.wav" 1.8
done
normalise "$TMP/brut/charley.wav"        "assets/samples/cymbales/charley.wav"        1.0
normalise "$TMP/brut/charley_ouvert.wav" "assets/samples/cymbales/charley_ouvert.wav" 2.5
normalise "$TMP/brut/crash.wav"          "assets/samples/cymbales/crash.wav"          4.0
normalise "$TMP/brut/ride.wav"           "assets/samples/cymbales/ride.wav"           2.5

echo
echo "batterie : $(du -sh assets/samples/batterie | cut -f1)"
echo "cymbales : $(du -sh assets/samples/cymbales | cut -f1)"
