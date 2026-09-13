#!/usr/bin/env bash
# PHASE 0, OUTIL JETABLE.
# Rapatrie et normalise les trois kits de percussion candidats dans
# test/kits/<kit>/<frappe>.wav, pour l'ecoute comparee sur test/phase0.html.
#
# Les 27 fichiers WAV produits sont COMMITTES dans le depot. Ce script n'a donc
# pas a etre relance : il est la pour documenter la provenance exacte de chaque
# echantillon et pouvoir refaire l'operation. Il demande ffmpeg, que le depot
# n'exige nulle part ailleurs.
#
# Une fois le kit choisi, ce script et les deux dossiers non retenus disparaissent,
# et le kit gagnant migre vers assets/samples/.
#
#   bash scripts/fetch-kits.sh
#   FFMPEG=/chemin/vers/ffmpeg bash scripts/fetch-kits.sh
#   SF2_LOCAL=/chemin/FluidR3_GM.sf2 bash scripts/fetch-kits.sh   (evite 148 Mo)
#
# Les neuf frappes portent les noms du format de morceau (docs/format-morceau.md) :
#   kick snare tom_bas tom_med tom_haut charley charley_ouvert crash ride
#
# NORMALISATION, identique pour les trois kits, sans quoi la comparaison serait
# un concours de volume :
#   mono, 44 100 Hz, PCM 16 bits
#   pic ramene a -1 dBFS
#   duree plafonnee par frappe, fondu de sortie de 120 ms pour eviter le clic
set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG="${FFMPEG:-ffmpeg}"
if ! command -v "$FFMPEG" >/dev/null 2>&1; then
  cat >&2 <<'AIDE'
ffmpeg est introuvable.

Les 27 fichiers WAV sont deja committes dans test/kits/, tu n'as normalement
aucune raison de lancer ce script. Si tu veux vraiment le refaire :

  brew install ffmpeg

ou, sans rien installer sur le systeme :

  npm i ffmpeg-static
  FFMPEG=./node_modules/ffmpeg-static/ffmpeg bash scripts/fetch-kits.sh
AIDE
  exit 1
fi

DEST="test/kits"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- normalise <source> <cible.wav> <duree_max_s> [taux_de_relecture] --------
# Le taux de relecture sert a fabriquer un tom intermediaire quand le kit n'en
# a que deux : 0.84 descend d'environ trois demi-tons.
normalise() {
  local src="$1" dst="$2" dur="$3" taux="${4:-1}"

  local chaine="aresample=44100,aformat=channel_layouts=mono"
  if [ "$taux" != "1" ]; then
    local sr
    sr=$(awk "BEGIN{printf \"%d\", 44100*$taux}")
    chaine="aresample=44100,asetrate=$sr,aresample=44100,aformat=channel_layouts=mono"
  fi
  chaine="$chaine,atrim=0:$dur,areverse,afade=t=in:d=0.12,areverse"

  # Trois passes, et non deux. Mesurer le pic sur un graphe de filtres et
  # appliquer le gain sur un autre donne un resultat faux : quand la source est
  # stereo, le repliement en mono n'applique pas le meme gain dans les deux
  # invocations, la mesure sous-estime de 6 dB et l'ecriture ecrete a 0 dBFS.
  # On mesure donc sur le fichier intermediaire lui-meme, pas sur un graphe.
  local brut="$TMP/normalise_brut.wav"

  # 1. mise en forme, sans toucher au niveau
  "$FFMPEG" -y -v error -i "$src" -af "$chaine" \
    -ac 1 -ar 44100 -c:a pcm_s16le "$brut"

  # 2. mesure du pic sur ce fichier precis
  local pic gain
  pic=$("$FFMPEG" -hide_banner -nostats -i "$brut" -af volumedetect \
        -f null - 2>&1 | grep -oE 'max_volume: -?[0-9.]+' | tail -1 | awk '{print $2}')
  if [ -z "${pic:-}" ]; then
    echo "ECHEC : pic illisible sur $src" >&2
    exit 1
  fi
  gain=$(awk "BEGIN{printf \"%.2f\", -1 - ($pic)}")

  # 3. application du gain, rien d'autre
  mkdir -p "$(dirname "$dst")"
  "$FFMPEG" -y -v error -i "$brut" -af "volume=${gain}dB" \
    -ac 1 -ar 44100 -c:a pcm_s16le "$dst"
  rm -f "$brut"

  printf '  %-16s %7s o   gain %+6s dB\n' \
    "$(basename "$dst")" "$(wc -c < "$dst" | tr -d ' ')" "$gain"
}

# --- recupere <url> <fichier_temporaire> ------------------------------------
recupere() {
  local code
  code=$(curl -sSL -o "$2" -w '%{http_code}' "$1" || echo 000)
  if [ "$code" != "200" ]; then
    echo "ECHEC : $1 a repondu $code" >&2
    exit 1
  fi
}

# =============================================================================
# KIT 1 : Virtuosity Drums
# Versilian Studios et Karoryfer Samples, entree du concours KVR 2021.
# Vrai kit acoustique, baguettes, batteur Austin McMahon, enregistre chez
# Virtuosity Musical Instruments a Boston.
#   https://github.com/sfzinstruments/virtuosity_drums
#   Licence : CC0 1.0 Universal (fichier LICENSE du depot)
#   Source  : FLAC 48 kHz 24 bits, micro « mid » uniquement, couche vl3
#   Reserve : le kit n'a que deux toms. tom_med est fabrique a partir du tom
#             haut relu a 0.84, soit trois demi-tons plus bas.
# =============================================================================
echo "Virtuosity Drums (CC0)"
VD="https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/master/Samples/mid"

recupere "$VD/kick/mid_kick_snon_vl3_rr1.flac"   "$TMP/vd_kick.flac"
recupere "$VD/snare/mid_snare_center_vl3.flac"   "$TMP/vd_snare.flac"
recupere "$VD/ltom/mid_ltom_center_vl3.flac"     "$TMP/vd_ltom.flac"
recupere "$VD/htom/mid_htom_center_vl3.flac"     "$TMP/vd_htom.flac"
recupere "$VD/hh/mid_hh_closed_vl3_rr1.flac"     "$TMP/vd_hhc.flac"
recupere "$VD/hh/mid_hh_open_vl3_rr1.flac"       "$TMP/vd_hho.flac"
recupere "$VD/crash/mid_crash_crash_vl3_rr1.flac" "$TMP/vd_crash.flac"
recupere "$VD/ride/mid_ride_ride_vl3_rr1.flac"   "$TMP/vd_ride.flac"

normalise "$TMP/vd_kick.flac"  "$DEST/virtuosity/kick.wav"           1.6
normalise "$TMP/vd_snare.flac" "$DEST/virtuosity/snare.wav"          1.6
normalise "$TMP/vd_ltom.flac"  "$DEST/virtuosity/tom_bas.wav"        1.8
normalise "$TMP/vd_htom.flac"  "$DEST/virtuosity/tom_med.wav"        1.8  0.84
normalise "$TMP/vd_htom.flac"  "$DEST/virtuosity/tom_haut.wav"       1.8
normalise "$TMP/vd_hhc.flac"   "$DEST/virtuosity/charley.wav"        1.0
normalise "$TMP/vd_hho.flac"   "$DEST/virtuosity/charley_ouvert.wav" 2.5
normalise "$TMP/vd_crash.flac" "$DEST/virtuosity/crash.wav"          4.0
normalise "$TMP/vd_ride.flac"  "$DEST/virtuosity/ride.wav"           2.5

# =============================================================================
# KIT 2 : VCSL, Versilian Community Sample Library
#   https://github.com/sgossner/VCSL
#   Licence : CC0 1.0 Universal
#   Source  : WAV 44,1 kHz, deja utilisable tel quel
#   Reserves, a afficher dans la page de test, pas a cacher :
#     ce n'est pas un kit de batterie mais de la percussion d'orchestre
#     aucun ride : la cymbale suspendue frappee a la baguette en tient lieu
#     deux toms seulement : tom_med est le tom haut relu a 0.84
#     crash : cymbales frappees par paire, pas une crash de kit
# =============================================================================
echo "VCSL (CC0)"
VC="https://raw.githubusercontent.com/sgossner/VCSL/master"
MB="$VC/Membranophones/Struck%20Membranophones"
ID="$VC/Idiophones/Struck%20Idiophones"

recupere "$MB/Bass%20Drum%201/BDrumNew_hit_v5_rr1_Sum.wav"              "$TMP/vc_kick.wav"
recupere "$MB/Snare%20Drum,%20Modern%201/Snare2_HitSN_v6_rr1_Mid.wav"   "$TMP/vc_snare.wav"
recupere "$MB/Tom%202/Stick/TomL_HitS_v4_rr1_Mid.wav"                   "$TMP/vc_ltom.wav"
recupere "$MB/Tom%201/Stick/TomH_HitS_v4_rr1_Mid.wav"                   "$TMP/vc_htom.wav"
recupere "$ID/Hi-Hat%20Cymbal/HiHat_HitC_v3_rr1_Mid.wav"                "$TMP/vc_hhc.wav"
recupere "$ID/Hi-Hat%20Cymbal/HiHat_HitO_rr1_Mid.wav"                   "$TMP/vc_hho.wav"
recupere "$ID/Clash%20Cymbals%201/cymbal_crash1_mf1.wav"                "$TMP/vc_crash.wav"
recupere "$ID/Suspended%20Cymbal%201/susCymb1_hit_stick_f1.wav"         "$TMP/vc_ride.wav"

normalise "$TMP/vc_kick.wav"  "$DEST/vcsl/kick.wav"           1.6
normalise "$TMP/vc_snare.wav" "$DEST/vcsl/snare.wav"          1.6
normalise "$TMP/vc_ltom.wav"  "$DEST/vcsl/tom_bas.wav"        1.8
normalise "$TMP/vc_htom.wav"  "$DEST/vcsl/tom_med.wav"        1.8  0.84
normalise "$TMP/vc_htom.wav"  "$DEST/vcsl/tom_haut.wav"       1.8
normalise "$TMP/vc_hhc.wav"   "$DEST/vcsl/charley.wav"        1.0
normalise "$TMP/vc_hho.wav"   "$DEST/vcsl/charley_ouvert.wav" 2.5
normalise "$TMP/vc_crash.wav" "$DEST/vcsl/crash.wav"          4.0
normalise "$TMP/vc_ride.wav"  "$DEST/vcsl/ride.wav"           2.5

# =============================================================================
# KIT 3 : la banque de percussion du soundfont FluidR3_GM
#   Licence : Creative Commons Attribution 3.0, deja creditee dans l'app pour
#             les 11 instruments melodiques. Donc aucune obligation nouvelle.
#   Interet : couverture General MIDI complete, trois toms distincts, et le
#             meme timbre que le reste de l'orchestre.
#   Le rendu MP3 pre-fabrique de midi-js-soundfonts ne contient QUE les 128
#   programmes melodiques (percussion-mp3/, drums-mp3/ et standard_kit-mp3/
#   renvoient 404), il faut donc extraire du .sf2 lui-meme.
# =============================================================================
echo "FluidR3_GM, banque de percussion (CC-BY 3.0)"
SF2="$TMP/FluidR3_GM.sf2"
if [ -n "${SF2_LOCAL:-}" ] && [ -s "$SF2_LOCAL" ]; then
  echo "  soundfont local : $SF2_LOCAL"
  SF2="$SF2_LOCAL"
else
  echo "  telechargement du soundfont, 148 Mo..."
  recupere "https://raw.githubusercontent.com/urish/cinto/master/media/FluidR3%20GM.sf2" "$SF2"
fi

python3 scripts/extract-kit-fluidr3.py "$SF2" "$TMP/fluidr3"
for f in kick snare tom_bas tom_med tom_haut charley charley_ouvert crash ride; do
  case "$f" in
    charley)        d=1.0 ;;
    crash)          d=4.0 ;;
    charley_ouvert) d=2.5 ;;
    ride)           d=2.5 ;;
    *)              d=1.8 ;;
  esac
  normalise "$TMP/fluidr3/$f.wav" "$DEST/fluidr3/$f.wav" "$d"
done

echo
echo "Poids de $DEST : $(du -sh "$DEST" | cut -f1)"
find "$DEST" -name '*.wav' | wc -l | xargs echo "Fichiers :"
