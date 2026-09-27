# Importer un morceau depuis l'appareil

L'app joue quatorze morceaux écrits dans le dépôt, plus tout ce que tu lui donnes toi-même. Ce
deuxième circuit est prévu depuis le cadrage (section 7.2), il marche depuis la phase 2, et
c'est lui qui débloque les morceaux que je ne peux pas écrire.

**Un morceau importé reste sur l'appareil où tu l'as importé.** Il vit dans le stockage local
du navigateur, il n'est jamais envoyé nulle part, il n'entre pas dans le dépôt et il n'est pas
publié en ligne. Sur un autre appareil, il n'existe pas.

## Deux sortes de fichiers

| Format | Ce que c'est |
|---|---|
| `.json` | un morceau au format du projet, celui que produit le bouton d'export |
| `.mid` ou `.midi` | un MIDI standard, dont tu répartis les pistes sur les instruments de la scène |

## Les étapes, sur l'iPad

1. **Amener le fichier sur l'iPad.** AirDrop depuis le Mac, ou téléchargement dans Safari. Il
   atterrit dans l'app Fichiers, c'est là que tu iras le chercher
2. **Ouvrir la zone parent** : appui long de 2 secondes sur l'engrenage, en haut à droite.
   L'anneau se remplit pendant l'appui. Si le maintien ne passe pas, **trois appuis de suite**
   ouvrent aussi
3. Onglet **Importer**
4. **Choisir un fichier**, puis prendre le `.mid` dans Fichiers
5. L'**écran de correspondance** s'affiche : une ligne par voix trouvée dans le fichier, avec
   un instrument déjà proposé. Tu changes ce que tu veux dans les listes déroulantes
6. **Ajouter à la bibliothèque**. Le morceau apparaît dans le ruban, avec les autres

## Ce qu'il faut savoir avant de juger le résultat

- **La proposition d'instruments est une estimation.** Elle vient des numéros de programme
  General MIDI du fichier, par famille : les cordes vers le violon, les basses vers le tuba,
  les flûtes vers la flûte. Sur un fichier réel elle tombe parfois à côté, et c'est à toi de
  corriger dans les listes
- **Le canal 10 donne deux voix**, une batterie et une cymbales, parce que ce sont deux
  instruments distincts de la scène. Une seule voix en perdrait la moitié
- **Un MIDI trouvé sur le web n'a pas été écrit pour cette scène.** Ça jouera. Mais chaque
  morceau du dépôt est arrangé pour que n'importe quel sous-ensemble de 1 à 6 instruments
  sonne juste, et un fichier venu d'ailleurs n'a pas cette propriété. Attends-toi à devoir
  poser les bons instruments plutôt que n'importe lesquels
- Les hauteurs hors de la tessiture rapatriée sont **ramenées par octaves**, et le compte
  rendu te le dit. Les positions sont calées sur la double-croche
- Un fichier refusé le dit avec un motif lisible : division SMPTE, format 2, fichier qui n'est
  pas un MIDI

## Deux précautions

**Installe l'app sur l'écran d'accueil** avant d'importer quoi que ce soit à quoi tu tiens. Les
données d'un simple onglet Safari peuvent être purgées au bout de sept jours, celles d'une
app installée restent. Bouton Partager, puis « Sur l'écran d'accueil ».

**Exporte ce que tu veux garder.** Chaque ligne de la bibliothèque a un bouton d'export qui
passe par la feuille de partage : tu t'envoies le fichier par AirDrop ou par mail, et tu l'as
en sécurité.

## D'un enregistrement audio vers un MIDI

Le cas où tu n'as pas de MIDI mais un enregistrement : `scripts/melodie.py` écoute un fichier
audio et en sort un MIDI d'**une seule ligne de chant**. C'est exactement ce dont l'app a
besoin, puisqu'elle dérive les 13 instruments à partir d'une mélodie : un MIDI qui contient
tout l'orchestre ne lui sert à rien.

Il tourne sur ton Mac, jamais dans l'app. Aucune dépendance n'entre dans le dépôt.

**Les commandes ci-dessous supposent que tu es dans le dossier du dépôt.** Cette commande l'y
amène sans que tu aies à savoir où il est :

```bash
cd "$(find ~ -maxdepth 6 -type d -name symphony 2>/dev/null | head -1)" && pwd
```

**Installation, une seule fois :**

```bash
python3 -m venv ~/basic-pitch
source ~/basic-pitch/bin/activate
pip install basic-pitch
```

**Vérifier que la chaîne marche, avant de perdre du temps sur un vrai morceau.** Le script
fabrique lui-même un petit fichier dont il connaît les onze notes, le passe dans la chaîne et
compare :

```bash
source ~/basic-pitch/bin/activate
python3 scripts/melodie.py --essai
```

Il doit finir par « OK : 11 notes sur 11 exactes ». Si le compte est différent, envoie-moi les
lignes telles quelles : ça veut dire que le réglage ne convient pas à ta machine, pas que la
chaîne est cassée.

Il écrit au passage un `essai-melodie.wav` dans le dossier courant. Tu peux l'écouter, c'est
une petite montée et descente que j'ai écrite pour la mesure, et le supprimer ensuite.

**Sur un vrai fichier :**

```bash
source ~/basic-pitch/bin/activate
python3 scripts/melodie.py ~/Downloads/le-fichier.mp3
```

Le MIDI est écrit à côté du fichier source, avec `-melodie.mid` à la fin. Tu l'amènes ensuite
sur l'iPad et tu l'importes comme n'importe quel MIDI, en suivant les étapes ci-dessus.

### Quatre choses mesurées, pour ne pas t'inquiéter pour rien

- **L'environnement se réactive à chaque nouveau terminal.** Sans `source`, `python3` est celui
  du système et ne connaît pas basic-pitch. Ton invite affiche `(basic-pitch)` quand c'est bon
- **basic-pitch a quatre moteurs** et prend celui qui est installé : TensorFlow s'il est là,
  sinon CoreML, sinon tflite, sinon ONNX. Sur un Mac sans TensorFlow c'est CoreML, et le
  modèle est livré avec le paquet, donc il n'y a rien à télécharger. Le mode `--essai` affiche
  lequel il utilise
- **Le chemin CoreML écrit trois lignes de débogage par fenêtre audio**, en dur dans le code de
  basic-pitch. Sur trois minutes d'audio ça ferait des centaines de lignes qui défilent : le
  script les retire de l'affichage, et rien d'autre
- **Si la lecture d'un MP3 coince**, convertis-le en WAV avec `afconvert`, qui est déjà dans
  macOS :
  `afconvert -f WAVE -d LEI16@44100 -c 1 fichier.mp3 fichier.wav`
- **Attention au glob dans zsh** : `ls *.mp3` fait échouer toute la ligne quand rien ne
  correspond, et `2>/dev/null` ne rattrape pas ça. `find ~/Downloads -iname '*.mp3'` n'a pas ce
  défaut

### Ce que ça ne fait pas

- **Ça ne sépare pas les instruments.** Sur un enregistrement d'orchestre, le modèle entend
  tout en même temps et la ligne qui sort est un compromis. Un enregistrement où la mélodie
  domine (un piano seul, une voix, une boîte à musique) donne un bien meilleur résultat
- **Ça ne remplace pas une partition.** Ce qui sort est ce que le modèle a entendu, pas ce qui
  est écrit : des notes en trop, des notes manquantes, des durées approchées
- **Un enregistrement sous droits reste sur ta machine.** Le MIDI qui en sort aussi. Il n'entre
  pas dans le dépôt et il n'est pas publié. Pour un morceau du **domaine public**, au
  contraire, renvoie-le-moi : je pourrai l'écrire en arrangement à 13 parties

## Le cas qui m'intéresse : me renvoyer un morceau

Si tu importes un morceau **du domaine public** et que le résultat te plaît, exporte-le et
envoie-le-moi. J'aurai alors ses notes sous les yeux, et je pourrai le réécrire en vrai
arrangement à 13 parties pour le dépôt, comme les quatorze autres.

C'est le chemin le plus court pour les pièces dont je ne peux pas vérifier la mélodie depuis
mon conteneur. Mesuré le 20 septembre 2026, tous les sites de partitions sont bloqués par le
mandataire de sortie : `mutopiaproject.org`, IMSLP, `abcnotation.com`, `kern.ccarh.org`,
`partitions-domaine-public.fr`, `thesession.org`. Seuls passent les fichiers bruts de GitHub,
à condition de connaître leur chemin exact.

Pour un morceau **sous droits**, garde-le pour toi : il reste sur ton appareil, et il n'a pas
à en sortir.
