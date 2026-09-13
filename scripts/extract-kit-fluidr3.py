#!/usr/bin/env python3
"""Extrait les neuf frappes du kit « Standard » d'un soundfont SF2.

PHASE 0, OUTIL JETABLE. Appele par scripts/fetch-kits.sh.

Le rendu MP3 pre-fabrique de midi-js-soundfonts ne couvre que les 128 programmes
melodiques du General MIDI. La banque de percussion (banque 128) n'existe que
dans le .sf2 d'origine, d'ou cet extracteur.

Aucune dependance : lecture RIFF a la main, ecriture WAV par le module wave de
la bibliotheque standard.

Astuce de transposition : au lieu de reechantillonner ici, on ecrit l'en-tete WAV
avec une frequence d'echantillonnage corrigee, de sorte que la conversion vers
44 100 Hz faite ensuite par ffmpeg produise exactement la hauteur voulue.

    python3 scripts/extract-kit-fluidr3.py <fichier.sf2> <dossier_de_sortie>
"""
from array import array
import os
import struct
import sys
import wave

# Generateurs SF2 utilises (specification SoundFont 2.04, section 8.1)
GEN_INSTRUMENT = 41
GEN_KEY_RANGE = 43
GEN_VEL_RANGE = 44
GEN_SAMPLE_ID = 53
GEN_ROOT_KEY = 58
GEN_COARSE_TUNE = 51
GEN_FINE_TUNE = 52

BANQUE_PERCUSSION = 128
PRESET_STANDARD = 0
VELOCITE_CIBLE = 100

# Frappe du projet -> note General MIDI du kit de percussion.
# 41 low floor tom, 45 low tom, 50 high tom : les trois toms les mieux ecartes
# parmi les six que propose le General MIDI.
FRAPPES = {
    "kick": 36,             # Bass Drum 1
    "snare": 38,            # Acoustic Snare
    "tom_bas": 41,          # Low Floor Tom
    "tom_med": 45,          # Low Tom
    "tom_haut": 50,         # High Tom
    "charley": 42,          # Closed Hi-Hat
    "charley_ouvert": 46,   # Open Hi-Hat
    "crash": 49,            # Crash Cymbal 1
    "ride": 51,             # Ride Cymbal 1
}


# Types d'echantillon SF2 (specification, section 7.10)
TYPE_MONO = 1
TYPE_DROITE = 2
TYPE_GAUCHE = 4


def replie_en_mono(canal_a, canal_b):
    """Moyenne deux canaux PCM 16 bits signes, sans ecretage."""
    a = array("h")
    a.frombytes(canal_a)
    b = array("h")
    b.frombytes(canal_b)
    n = min(len(a), len(b))
    sortie = array("h", bytes(2 * n))
    for i in range(n):
        sortie[i] = (a[i] + b[i]) // 2
    return sortie.tobytes()


def lit_chunks(donnees, debut, fin):
    """Parcourt les chunks RIFF entre deux offsets."""
    i = debut
    while i + 8 <= fin:
        ident = donnees[i:i + 4]
        taille = struct.unpack_from("<I", donnees, i + 4)[0]
        corps = i + 8
        if ident == b"LIST":
            yield donnees[corps:corps + 4].decode("ascii"), corps + 4, corps + taille
        else:
            yield ident.decode("ascii", "replace"), corps, corps + taille
        i = corps + taille + (taille & 1)


def charge_sf2(chemin):
    with open(chemin, "rb") as f:
        donnees = f.read()

    if donnees[:4] != b"RIFF" or donnees[8:12] != b"sfbk":
        raise SystemExit("Ce fichier n'est pas un SoundFont 2 (en-tete RIFF/sfbk absent).")

    taille = struct.unpack_from("<I", donnees, 4)[0]
    blocs = {}
    for nom, debut, fin in lit_chunks(donnees, 12, 8 + taille):
        if nom in ("sdta", "pdta", "INFO"):
            for sous_nom, sd, sf in lit_chunks(donnees, debut, fin):
                blocs[sous_nom] = (sd, sf)
    return donnees, blocs


def table(donnees, bornes, taille_entree):
    debut, fin = bornes
    return [donnees[debut + i:debut + i + taille_entree]
            for i in range(0, fin - debut, taille_entree)]


def generateurs(donnees, bornes, debut_idx, fin_idx):
    """Lit les paires (operateur, valeur) d'une plage de pgen ou igen."""
    debut, _ = bornes
    res = []
    for i in range(debut_idx, fin_idx):
        op, val = struct.unpack_from("<HH", donnees, debut + i * 4)
        res.append((op, val))
    return res


def plage(valeur):
    return valeur & 0xFF, (valeur >> 8) & 0xFF


def couvre(gens, note, velocite):
    """Une zone couvre-t-elle cette note et cette velocite ?"""
    for op, val in gens:
        if op == GEN_KEY_RANGE:
            bas, haut = plage(val)
            if not bas <= note <= haut:
                return False
        elif op == GEN_VEL_RANGE:
            bas, haut = plage(val)
            if not bas <= velocite <= haut:
                return False
    return True


def extrait(chemin_sf2, dossier):
    donnees, blocs = charge_sf2(chemin_sf2)
    for requis in ("phdr", "pbag", "pgen", "inst", "ibag", "igen", "shdr", "smpl"):
        if requis not in blocs:
            raise SystemExit(f"Bloc {requis} absent du soundfont.")

    phdr = table(donnees, blocs["phdr"], 38)
    pbag = blocs["pbag"]
    pgen = blocs["pgen"]
    inst = table(donnees, blocs["inst"], 22)
    ibag = blocs["ibag"]
    igen = blocs["igen"]
    shdr = table(donnees, blocs["shdr"], 46)
    smpl_debut, smpl_fin = blocs["smpl"]

    # --- reperer le preset banque 128 programme 0 ----------------------------
    cible = None
    for i, entree in enumerate(phdr[:-1]):          # la derniere entree est EOP
        nom = entree[:20].split(b"\x00")[0].decode("latin-1").strip()
        preset, banque, bag = struct.unpack_from("<HHH", entree, 20)
        if banque == BANQUE_PERCUSSION and preset == PRESET_STANDARD:
            bag_suivant = struct.unpack_from("<H", phdr[i + 1], 22 + 2)[0]
            cible = (nom, bag, bag_suivant)
            break
    if cible is None:
        raise SystemExit("Aucun preset en banque 128 programme 0 dans ce soundfont.")

    nom_preset, bag_debut, bag_fin = cible
    print(f"  preset « {nom_preset} », banque 128 programme 0")

    # --- zones de preset : note -> instrument --------------------------------
    zones_preset = []
    for b in range(bag_debut, bag_fin):
        gen_debut = struct.unpack_from("<H", donnees, pbag[0] + b * 4)[0]
        gen_fin = struct.unpack_from("<H", donnees, pbag[0] + (b + 1) * 4)[0]
        gens = generateurs(donnees, pgen, gen_debut, gen_fin)
        idx_inst = next((v for op, v in gens if op == GEN_INSTRUMENT), None)
        if idx_inst is not None:
            zones_preset.append((gens, idx_inst))

    os.makedirs(dossier, exist_ok=True)
    ecrits = 0

    for frappe, note in FRAPPES.items():
        trouve = None

        for gens_preset, idx_inst in zones_preset:
            if not couvre(gens_preset, note, VELOCITE_CIBLE):
                continue

            bag_i = struct.unpack_from("<H", inst[idx_inst], 20)[0]
            bag_i_fin = struct.unpack_from("<H", inst[idx_inst + 1], 20)[0]

            globaux = []
            for b in range(bag_i, bag_i_fin):
                gen_debut = struct.unpack_from("<H", donnees, ibag[0] + b * 4)[0]
                gen_fin = struct.unpack_from("<H", donnees, ibag[0] + (b + 1) * 4)[0]
                gens = generateurs(donnees, igen, gen_debut, gen_fin)
                idx_ech = next((v for op, v in gens if op == GEN_SAMPLE_ID), None)
                if idx_ech is None:
                    globaux = gens              # zone globale de l'instrument
                    continue
                if couvre(globaux + gens, note, VELOCITE_CIBLE):
                    trouve = (globaux + gens, idx_ech)
                    break
            if trouve:
                break

        if trouve is None:
            raise SystemExit(f"Aucun echantillon pour {frappe} (note {note}).")

        gens, idx_ech = trouve
        entree = shdr[idx_ech]
        nom_ech = entree[:20].split(b"\x00")[0].decode("latin-1").strip()
        debut, fin, _bcl_d, _bcl_f, taux, pitch_origine, correction = \
            struct.unpack_from("<IIIIIBb", entree, 20)
        lien, type_ech = struct.unpack_from("<HH", entree, 42)

        # Hauteur de reference et desaccord, puis taux corrige.
        racine = next((v for op, v in gens if op == GEN_ROOT_KEY), None)
        if racine is None or racine == 255:
            racine = pitch_origine
        coarse = next((v for op, v in gens if op == GEN_COARSE_TUNE), 0)
        fine = next((v for op, v in gens if op == GEN_FINE_TUNE), 0)
        coarse = coarse - 65536 if coarse > 32767 else coarse
        fine = fine - 65536 if fine > 32767 else fine

        demi_tons = (note - racine) + coarse + (fine + correction) / 100.0
        taux_corrige = max(1, int(round(taux * (2.0 ** (demi_tons / 12.0)))))

        pcm = donnees[smpl_debut + debut * 2: smpl_debut + fin * 2]
        if not pcm:
            raise SystemExit(f"Echantillon vide pour {frappe} ({nom_ech}).")

        # La percussion de FluidR3 est stockee en paires stereo : l'echantillon
        # designe porte un canal et pointe l'autre par wSampleLink. On replie les
        # deux, plutot que de jeter la moitie de la prise.
        canaux = 1
        if type_ech & (TYPE_GAUCHE | TYPE_DROITE) and lien < len(shdr) - 1:
            autre = shdr[lien]
            a_debut, a_fin = struct.unpack_from("<II", autre, 20)
            pcm_autre = donnees[smpl_debut + a_debut * 2: smpl_debut + a_fin * 2]
            if pcm_autre:
                pcm = replie_en_mono(pcm, pcm_autre)
                canaux = 2

        sortie = os.path.join(dossier, f"{frappe}.wav")
        with wave.open(sortie, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(taux_corrige)
            w.writeframes(pcm)

        duree = len(pcm) / 2 / taux_corrige
        print(f"  {frappe:<16} note {note:<3} « {nom_ech} »  "
              f"{duree:.2f} s  {taux} -> {taux_corrige} Hz  "
              f"{'stereo replie' if canaux == 2 else 'mono'}")
        ecrits += 1

    print(f"  {ecrits} frappes extraites dans {dossier}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    extrait(sys.argv[1], sys.argv[2])
