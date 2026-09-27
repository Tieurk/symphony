#!/usr/bin/env python3
"""D'un fichier audio vers un MIDI d'UNE SEULE LIGNE DE CHANT.

    python3 scripts/melodie.py ma-musique.mp3
    python3 scripts/melodie.py --essai        # verifie la chaine, sans fichier

Pourquoi une seule ligne : l'app derive les 13 instruments a partir d'une
melodie. Un MIDI qui contient tout l'orchestre ne lui sert a rien, alors qu'une
ligne propre suffit pour fabriquer un arrangement entier.

Ce que fait le script, dans l'ordre :
  1. Basic Pitch (Spotify, Apache 2.0) ecoute l'audio et en sort des notes.
  2. On jette ce qui est trop court, trop grave ou trop aigu pour etre du chant.
  3. On rend la ligne MONOPHONIQUE : quand deux notes se chevauchent, la plus
     haute gagne. C'est elle qu'une oreille suit.

Le fichier produit reste sur cette machine. S'il vient d'un enregistrement sous
droits, il n'a pas a en sortir : ni dans ce depot, ni en ligne. Un morceau du
DOMAINE PUBLIC, lui, peut revenir ici en arrangement a 13 parties.

Cet outil ne tourne jamais dans l'app : aucune regle dure du projet n'est en
jeu, et il n'ajoute aucune dependance a l'execution. Installation, une fois :

    python3 -m venv ~/basic-pitch
    source ~/basic-pitch/bin/activate
    pip install basic-pitch

L'environnement se reactive a chaque nouveau terminal (`source ...`), et
l'invite affiche alors « (basic-pitch) ».
"""
import contextlib
import io
import math
import struct
import sys
import wave
from pathlib import Path

# --- reglages, et ce qu'ils font -------------------------------------------
# Montes ONSET si le resultat fourmille de notes parasites, descends-le si des
# notes manquent. C'est le reglage qui compte le plus.
ONSET = 0.6            # 0.5 par defaut. Plus haut = moins de fausses attaques
FRAME = 0.4            # 0.3 par defaut. Plus haut = notes plus franches
MINI_MS = 150.0        # une note plus courte que ca est un artefact
GRAVE_HZ = 110.0       # la2, sous le chant
AIGU_HZ = 1200.0       # au-dessus du chant courant

# Le chemin CoreML de basic-pitch ecrit trois lignes de debogage par fenetre
# audio, en dur dans son code (inference.py, dans Model.predict). Sur trois
# minutes d'audio ca fait des centaines de lignes. On les retire de l'affichage
# SANS rien masquer d'autre : un vrai message, lui, doit passer.
BAVARDAGE = ("isfinite:", "shape:", "dtype:")

class SansBavardage(io.TextIOBase):
    def __init__(self, vers):
        self.vers = vers
    def write(self, texte):
        for ligne in texte.splitlines(True):
            if not ligne.lstrip().startswith(BAVARDAGE):
                self.vers.write(ligne)
        return len(texte)
    def flush(self):
        self.vers.flush()

def monophonique(notes):
    """Une seule note a la fois : la plus haute gagne, la plus basse est
    coupee. Sans ca, Basic Pitch rend aussi les harmoniques et les voix
    d'accompagnement, et la melodie se noie dedans."""
    notes = sorted(notes, key=lambda n: (n.start, -n.pitch))
    gardees = []
    for n in notes:
        if not gardees:
            gardees.append(n); continue
        p = gardees[-1]
        if n.start < p.end - 0.01:            # elles se chevauchent
            if n.pitch > p.pitch:
                p.end = min(p.end, n.start)   # la precedente cede la place
                if p.end - p.start < MINI_MS / 1000.0:
                    gardees.pop()
                gardees.append(n)
            # sinon on ignore la plus basse
        else:
            gardees.append(n)
    return gardees

def ecoute(src):
    """L'audio vers une liste de notes pretty_midi, deja nettoyee."""
    from basic_pitch.inference import predict
    from basic_pitch import ICASSP_2022_MODEL_PATH

    with contextlib.redirect_stdout(SansBavardage(sys.stdout)):
        _, midi, _ = predict(
            str(src),
            ICASSP_2022_MODEL_PATH,
            onset_threshold=ONSET,
            frame_threshold=FRAME,
            minimum_note_length=MINI_MS,
            minimum_frequency=GRAVE_HZ,
            maximum_frequency=AIGU_HZ,
            multiple_pitch_bends=False,
            melodia_trick=True,
        )
    brutes = [n for inst in midi.instruments for n in inst.notes]
    return brutes, monophonique(brutes)

def ecris(lignes, dest):
    import pretty_midi
    sortie = pretty_midi.PrettyMIDI()
    piste = pretty_midi.Instrument(program=73, name="melodie")   # flute
    piste.notes = lignes
    sortie.instruments.append(piste)
    sortie.write(str(dest))

def resume(brutes, lignes):
    import pretty_midi
    print(f"{len(brutes)} notes entendues, {len(lignes)} gardees apres nettoyage")
    if lignes:
        graves = min(n.pitch for n in lignes)
        aigus = max(n.pitch for n in lignes)
        print(f"tessiture : {pretty_midi.note_number_to_name(graves)} a "
              f"{pretty_midi.note_number_to_name(aigus)}, "
              f"duree {max(n.end for n in lignes):.1f} s")

# --- le mode essai ----------------------------------------------------------
# Pourquoi il existe : basic-pitch a QUATRE moteurs (TensorFlow, CoreML,
# tflite, ONNX) et choisit celui qui est installe. Sur un Mac sans TensorFlow
# c'est CoreML, un chemin de code different de celui que je peux essayer
# ailleurs. Un essai a reponse connue est donc la seule facon de savoir si la
# chaine marche SUR CETTE MACHINE.
#
# La melodie est de moi, une simple montee et descente : aucun droit dans
# l'histoire, et le but n'est pas la musique mais la mesure.
SR = 22050
VERITE = [            # (note, midi, duree en secondes)
    ("C4", 60, 0.5), ("D4", 62, 0.5), ("E4", 64, 0.5), ("G4", 67, 1.0),
    ("E4", 64, 0.5), ("F4", 65, 0.5), ("G4", 67, 1.0),
    ("A4", 69, 0.5), ("G4", 67, 0.5), ("E4", 64, 0.5), ("C4", 60, 1.0),
]

def fabrique_essai(dest):
    """Un WAV dont je connais les notes exactes. Bibliotheque standard seule."""
    ech = []
    for _, midi, d in VERITE:
        f = 440.0 * (2 ** ((midi - 69) / 12.0))
        for i in range(int(SR * d)):
            t = i / SR
            # une enveloppe douce, sinon les clics inventent des attaques
            a = min(1.0, t / 0.02) * min(1.0, (d - t) / 0.06)
            # un peu d'harmoniques : un sinus pur n'existe pas dans la nature,
            # et le modele a ete entraine sur des instruments reels
            v = (math.sin(2 * math.pi * f * t)
                 + 0.35 * math.sin(4 * math.pi * f * t)
                 + 0.15 * math.sin(6 * math.pi * f * t)) / 1.5
            ech.append(max(-1.0, min(1.0, v * a * 0.8)))
        ech.extend([0.0] * int(SR * 0.05))     # un souffle entre les notes
    with wave.open(str(dest), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(v * 32000)) for v in ech))
    return len(ech) / SR

def essai():
    import pretty_midi
    from basic_pitch import (TF_PRESENT, CT_PRESENT, TFLITE_PRESENT,
                             ONNX_PRESENT, ICASSP_2022_MODEL_PATH)
    moteurs = [n for n, present in (("TensorFlow", TF_PRESENT),
                                    ("CoreML", CT_PRESENT),
                                    ("tflite", TFLITE_PRESENT),
                                    ("ONNX", ONNX_PRESENT)) if present]
    print("moteurs installes :", ", ".join(moteurs) or "AUCUN")
    print("modele utilise    :", ICASSP_2022_MODEL_PATH.name)

    wav = Path("essai-melodie.wav")
    secondes = fabrique_essai(wav)
    print(f"{wav} ecrit, {secondes:.1f} s, {len(VERITE)} notes connues")
    print("verite :", " ".join(n for n, _, _ in VERITE))

    brutes, lignes = ecoute(wav)
    resume(brutes, lignes)
    entendu = [n.pitch for n in lignes]
    attendu = [m for _, m, _ in VERITE]
    print("entendu :", " ".join(
        pretty_midi.note_number_to_name(p) for p in entendu))

    if entendu == attendu:
        print(f"\nOK : {len(attendu)} notes sur {len(attendu)} exactes. "
              "La chaine marche sur cette machine.")
        return 0
    justes = sum(1 for a, b in zip(attendu, entendu) if a == b)
    print(f"\nECART : {justes} notes justes sur {len(attendu)} attendues, "
          f"{len(entendu)} rendues.")
    print("La chaine tourne, mais le reglage n'est pas bon sur cette machine. "
          "Envoie-moi ces lignes telles quelles.")
    return 1

def main(chemin):
    src = Path(chemin)
    if not src.exists():
        sys.exit(f"fichier introuvable : {src}")
    print(f"ecoute de {src.name}...")
    brutes, lignes = ecoute(src)
    dest = src.with_name(src.stem + "-melodie.mid")
    ecris(lignes, dest)
    resume(brutes, lignes)
    print(f"ecrit : {dest}")
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage : python3 melodie.py ma-musique.mp3\n"
                 "        python3 melodie.py --essai")
    sys.exit(essai() if sys.argv[1] == "--essai" else main(sys.argv[1]))
