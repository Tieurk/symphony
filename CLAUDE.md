# Symphony

PWA d'orchestre interactif pour les deux garçons de Mathieu (8 et 6 ans), inspirée du principe du jouet Symphony in B. de B. toys. L'enfant pose des instruments sur une scène, l'arrangement du morceau se transforme en direct.

Cadrage complet dans `docs/cadrage.md`. Ce fichier-ci est le contrat de travail : lis-le en entier avant de toucher au code.

## Interlocuteur

Mathieu, kinésithérapeute, pas développeur de métier mais a déjà déployé une PWA en production (Kiné-Fit Labs, sur Clever Cloud). Il lit du code, colle des commandes, comprend ce qui se passe.

- Écris et parle en français.
- Aucun tiret cadratin dans les textes rédigés pour lui (deux-points, virgules, parenthèses, ou reformulation).
- Donne du prêt à coller, pas des explications de ce qu'il faudrait changer.
- **Il est l'oreille du projet.** Aucun modèle ne peut écouter le résultat. Chaque fois qu'un arrangement ou un mixage change, c'est lui qui valide à l'écoute. Ne jamais affirmer que ça sonne bien.
- Il teste sur l'iPad, pas sur le Mac. Prévois systématiquement un serveur local accessible sur le réseau (`--host 0.0.0.0`) et donne-lui l'adresse à ouvrir sur l'iPad.

## Autonomie

Mathieu a demandé le 15 septembre 2026 que je code en quasi autonomie. Les autorisations
sont dans `.claude/settings.json`, qu'il a lui-même posé : un agent ne s'accorde pas ses
propres droits.

**Ce que je m'interdis désormais : lui faire lancer une commande que je peux lancer
moi-même.** `dig`, `curl`, un serveur local, une vérification d'état du dépôt, une mesure
dans un navigateur sans tête : tout ça est de mon côté. Chaque aller-retour de terminal que
je lui impose est du temps perdu et une erreur de méthode, pas une précaution.

Ce qui reste à lui, et que je ne peux pas faire à sa place :

| | |
|---|---|
| **L'écoute** | aucun modèle n'entend le résultat. Tout jugement sonore est le sien |
| **Le goût** | les illustrations, les couleurs, le nom, la sensation de jeu |
| **Les interfaces web** | réglages GitHub Pages, DNS, « Enforce HTTPS » |
| **L'iPad et l'iPhone réels** | le simulateur responsive ne remplace pas le doigt sur la vitre |
| **Son Mac et son wifi** | tout ce qui vit sur sa machine ou son réseau |
| **Les retours des enfants** | c'est pour eux, et ils sont les seuls à pouvoir le dire |

Et le mode plan est un réglage de sa session à lui (`shift+tab` dans le terminal, le
sélecteur de mode dans l'interface web). Aucune liste d'autorisations que j'écris ne le
change.

## Règles dures

1. **Rien de B. toys.** Ni le nom, ni les visuels, ni les fichiers audio du jouet. Seul le principe de jeu est repris. Les illustrations sont originales.
2. **Domaine public uniquement** pour les arrangements écrits dans ce dépôt. Vérifier la date de décès de l'auteur avant d'ajouter un morceau. En cas de doute, ne pas l'ajouter.
3. **Créditer les banques de sons.** FluidR3_GM est en Creative Commons Attribution 3.0 : la page « à propos » doit le mentionner.
4. **Pas d'appel réseau au moment de jouer.** Tout est local après le premier chargement, y compris Tone.js. Pas de CDN à l'exécution.
5. **Pas d'étape de compilation.** Modules ES natifs, servis tels quels. Le déploiement est une copie de fichiers.
6. **Pas de React, pas de framework.** JavaScript natif.

## Décisions figées

| Sujet | Choix |
|---|---|
| Nom affiché aux enfants | **Mon premier orchestre**, tranché le 15 septembre 2026. Le dépôt et le sous-domaine restent `symphony` |
| Ordre de travail | **Maquette fixe des deux mises en page d'abord**, tranché le 15 septembre 2026, puis la tranche verticale. Ne pas partir sur la tranche verticale avec des visuels provisoires |
| Sons | Instruments échantillonnés, pas de synthèse pure |
| Moteur | Tone.js, copié dans `src/vendor/` |
| Orientation | Adaptative : paysage sur iPad et Mac, portrait sur iPhone |
| Scène | 6 emplacements maximum, 13 instruments en réserve |
| Hébergement | GitHub Pages sur `symphony.kinefitlabs.com` |
| Morceaux | Fichiers JSON dans `songs/`, plus `songs/index.json` qui donne l'ordre, plus import local depuis l'appareil |
| Trois morceaux de la phase 1 | Ah ! vous dirai-je maman, Row Your Boat, **Frère Jacques**. Alouette était prévue et n'est pas écrite : sa mélodie n'a pas pu être vérifiée depuis ce conteneur (Wikipédia et les sites de partitions sont bloqués par le mandataire de sortie), et l'écrire de mémoire approximative serait un défaut sur une chanson que les garçons connaissent |
| Trois morceaux de la phase 3 | Au clair de la lune (le remplaçant de The Wheels on the Bus prévu au cadrage), La Lettre à Élise, Cinquième Symphonie (thème). Choisis sur un seul critère : **je suis sûr de leur matière**. Voir la règle ci-dessous |

## Architecture audio

C'est le coeur du projet. À lire deux fois.

Une horloge unique, le `Tone.Transport`, fait tourner le morceau en boucle. Au chargement d'un morceau, **les 13 parties sont programmées d'un coup** sur cette horloge, avec un `Tone.Part` par instrument. Elles tournent toutes en permanence, y compris celles des instruments restés en réserve.

Poser un instrument sur la scène **ne lance rien**. Ça ouvre son canal : le gain passe de 0 à son niveau de mixage. Le retirer referme le canal. C'est ce qui garantit que tout reste calé à la note près quel que soit le moment où l'enfant agit. Ne jamais démarrer ou arrêter une partie individuelle pour gérer l'audibilité.

Chaîne par instrument : `Tone.Sampler` vers `Tone.Gain` (le mute) vers `Tone.Gain` (le niveau de mixage du morceau) vers le bus général.

Scène vide, aucun son : les 13 canaux sont fermés, l'horloge continue de tourner.

Transition de mute : une rampe très courte (5 à 10 ms) pour éviter le clic, pas un saut brutal ni un fondu long qui ferait rater l'attaque.

**Où vit ce moteur, depuis la phase 1 :**

| Fichier | Rôle |
|---|---|
| `src/moteur.js` | le graphe, l'horloge, les 13 canaux, le tempo, le volume, l'anticipation |
| `src/echantillons.js` | pour chaque instrument, son nom General MIDI et les notes réellement rapatriées |
| `src/format-morceau.js` | `valide(morceau)`, partagé avec l'import de la phase 2 |
| `src/app.js` | l'interaction : l'état, le toucher, le glisser-déposer, les animations |
| `src/app.css` | la mise en page, **feuille unique** partagée par l'app et la maquette |
| `index.html` | l'app. Les bancs d'essai sont dans `test/` |
| `src/bibliotheque.js`, `src/parent.js`, `src/midi.js` | la bibliothèque, la zone parent, l'import MIDI, voir leur section |
| `sw.js`, `manifest.webmanifest` | le hors ligne et l'installation, voir leur section |
| `test/phase1.html` | le banc d'écoute, interface minimale, gardé pour le diagnostic |

**L'app ne touche jamais à `Tone` directement.** Tout passe par `src/moteur.js`, y compris la synchronisation visuelle : `surNote(rappel)` et `surMesure(rappel)` enveloppent le rappel dans `Tone.Draw`, pour que l'animation tombe sur le temps **audio** et pas sur celui du navigateur. Avec une anticipation de 20 ms, un `setTimeout` tomberait à côté.

Les chemins des échantillons sont résolus depuis l'emplacement du **module** (`import.meta.url`), pas depuis celui de la page. Une page à la racine et une page dans `test/` chargent donc les mêmes fichiers sans que le moteur sache d'où on l'appelle.

**Mesuré en phase 0 :** la rampe de 8 ms fait son travail, le gain atteint zéro en 11 ms. Mais le son ne s'arrête que 125 ms après l'appui, parce que `Tone.getContext().lookAhead` vaut 0,1 s par défaut en mode `interactive`. La réaction perçue à un geste est donc d'environ 110 ms, pas de 8.

**Tranché : l'anticipation est à 20 ms.** Choisie à l'oreille par Mathieu sur l'iPad le 15 septembre 2026, contre 100 et 50 ms. La réaction perçue tombe à **28 ms, mesuré**, soit quatre fois plus vif. La constante est `ANTICIPATION` dans `src/moteur.js`, posée dès le chargement du module.

**Réserve à garder en tête :** descendre l'anticipation accélère la réaction au prix d'un risque d'accrocs audio sur les appareils faibles. Testé sur l'iPad, **pas sur l'iPhone**. Si un accroc apparaît sur un appareil plus faible, `anticipation()` reste exportée et `test/phase1.html` garde ses trois boutons pour retester.

**Piège des mesures composées.** Tone compte en **noires**, pas en unités de la signature : il ramène `[n, d]` à `n / (d / 4)`, donc une mesure de **6/8 vaut 3 temps, pas 6**. Les positions se notent en noires et en doubles-croches, jamais en croches de 6/8, et le `bpm` d'un morceau en 6/8 reste un tempo à la noire. Row Your Boat est en 6/8 précisément pour exercer ce chemin.

**Piège de programmation :** `Tone.Part` exige que la clé du temps d'un événement s'appelle `time`. Le format de morceau du projet utilise `t`. La conversion se fait à la frontière, dans le moteur. Sans elle, `Part` programme tout au tick 0 avec une valeur indéfinie, le rappel plante, et on n'entend rien sans voir aucune erreur : l'exception se perd dans l'horloge audio. Entourer les rappels de partie d'un garde-fou qui remonte l'erreur.

## Banques de sons

Source principale : `midi-js-soundfonts`, rendu MP3 du soundfont FluidR3_GM, qui couvre les 128 programmes General MIDI. Vérifié : les 11 instruments mélodiques de la scène y sont, koto, sitar et accordéon compris. La batterie et les cymbales n'y sont pas, voir plus bas. Une seule source, donc des timbres cohérents entre eux.

Base : `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/<instrument>-mp3/`
Liste des noms : `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/names.json`

Miroir équivalent, à utiliser dans les scripts parce qu'il traverse davantage de réseaux :
`https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/<instrument>-mp3/<note>.mp3`

Correspondance à utiliser :

| Instrument de la scène | Nom General MIDI |
|---|---|
| Violon | `violin` |
| Guitare | `acoustic_guitar_nylon` |
| Koto | `koto` |
| Sitar | `sitar` |
| Trompette | `trumpet` |
| Tuba | `tuba` |
| Flûte | `flute` |
| Clarinette | `clarinet` |
| Accordéon | `accordion` |
| Xylophone | `xylophone` |
| Piano | `acoustic_grand_piano` |

**La percussion est tranchée : la banque de percussion du FluidR3_GM lui-même.** Choisie à l'écoute par Mathieu le 15 septembre 2026, contre Virtuosity Drums et VCSL. Raison décisive : elle vient de la même banque et de la même prise de son que les 11 instruments mélodiques, donc elle se marie. Les deux concurrents étaient des prises de salle, qui sonnaient étrangères à côté d'un soundfont. Le comparatif complet est dans `docs/points-ouverts.md`.

Conséquence agréable : **une seule licence et un seul crédit pour toute la banque de sons**, Creative Commons Attribution 3.0. Et la couverture est complète, les neuf frappes existent sans transposition, y compris trois toms distincts.

Le rendu MP3 pré-fabriqué ne contient que les 128 programmes mélodiques : vérifié le 13 septembre 2026, `percussion-mp3/`, `drums-mp3/` et `standard_kit-mp3/` renvoient 404. La percussion s'extrait donc du `.sf2` lui-même, banque 128 programme 0, preset « Standard ». C'est ce que fait `scripts/extract-kit-fluidr3.py`, sans aucune dépendance, appelé par `scripts/fetch-percussion.sh`. Les 9 fichiers WAV sont committés, ces scripts n'ont pas à être relancés. Vérifié : ils reproduisent les 9 fichiers au bit près.

Correspondance note General MIDI vers frappe du projet, à ne pas changer sans réextraire :

| Instrument | Frappe | Note GM | Échantillon FluidR3 |
|---|---|---|---|
| Batterie | `kick` | 36 | Std Kick |
| Batterie | `snare` | 38 | Std Snr 1 |
| Batterie | `tom_bas` | 41 | Low Flr Studio |
| Batterie | `tom_med` | 45 | Low Studio |
| Batterie | `tom_haut` | 50 | Hi Studio |
| Cymbales | `charley` | 42 | Hi-Hat Closed |
| Cymbales | `charley_ouvert` | 46 | Hi-Hat Half-Open |
| Cymbales | `crash` | 49 | Crsh 1 |
| Cymbales | `ride` | 51 | Ride1 |

**La batterie et les cymbales sont deux instruments distincts de la scène**, avec leurs propres emplacements et leurs propres niveaux de mixage. Les fichiers vivent donc dans `assets/samples/batterie/` et `assets/samples/cymbales/`, et le moteur leur ouvre deux canaux séparés. L'enfant peut poser l'un sans l'autre.

Ne pas se rabattre sur `taiko_drum` ou `synth_drum`, ce ne sont pas des kits.

**Convention de nommage, confirmée fichier par fichier le 13 septembre 2026.** Lettre majuscule, bémol en `b` minuscule, numéro d'octave, extension `.mp3` : `C4.mp3`, `Db4.mp3`, `Bb3.mp3`. Les dièses n'existent pas, `Cs4.mp3` et `C#4.mp3` renvoient 404. 88 notes par instrument, de `A0` à `C8`, chromatique. MP3 stéréo 44 100 Hz à débit variable, 3,16 s par note quel que soit l'instrument, 25 Ko au maximum.

`scripts/fetch-samples.sh` rapatrie uniquement les notes retenues dans `assets/samples/<instrument>/`. Ne prends pas toutes les notes : 4 à 6 par instrument suffisent au `Tone.Sampler`, qui transpose le reste. C'est ce qui garde le poids total sous 10 Mo.

Une réserve à connaître : la note 46 du General MIDI s'appelle « Open Hi-Hat », mais l'échantillon que FluidR3 y place est un charley **à demi ouvert**. Affiché dans la page de test, à ne pas oublier en écrivant les arrangements.

**Contrainte à garder en tête en écrivant les arrangements :** l'échantillon s'arrête à 3,16 s, et il sonne jusqu'au bout (aucun silence de queue, mesuré à -60 dB). À 100 à la noire, une ronde tient (2,4 s), une note de plus de cinq temps est coupée. Sans conséquence pour les comptines, mais à vérifier si un morceau lent arrive.

## Format d'un morceau

Contrat entre les fichiers de `songs/`, l'import et le moteur. Ne pas le changer sans mettre à jour `docs/format-morceau.md`.

Positions en notation Tone.js `mesure:temps:doubles-croches`, durées en notation Tone.js (`4n`, `8n`, `2n`, `8t`), vélocités entre 0 et 1, niveaux de mixage en décibels.

```json
{
  "id": "ah-vous-dirai-je-maman",
  "titre": "Ah ! vous dirai-je, maman",
  "compositeur": "Traditionnel",
  "source": "Domaine public",
  "couleur": "#F2A65A",
  "bpm": 100,
  "mesure": "4/4",
  "longueur": 8,
  "mix": { "violon": -3, "tuba": -6, "batterie": -8 },
  "parties": {
    "violon": [
      { "t": "0:0:0", "note": "C4", "duree": "4n", "vel": 0.8 }
    ],
    "batterie": [
      { "t": "0:0:0", "frappe": "kick", "vel": 0.9 }
    ]
  }
}
```

Les 13 clés de `parties` sont toujours présentes, éventuellement vides. Frappes autorisées : `kick`, `snare`, `tom_bas`, `tom_med`, `tom_haut` pour la batterie ; `charley`, `charley_ouvert`, `crash`, `ride` pour les cymbales.

## La bibliothèque, l'import et l'export

Deux origines de morceaux, et l'app n'a besoin de rien savoir de plus :

| Origine | Où | Portée |
|---|---|---|
| `depot` | `songs/` plus `songs/index.json` | les mêmes sur tous les appareils, mis à jour par un déploiement |
| `importe` | `localStorage`, une clé par morceau | seulement sur l'appareil où l'import a eu lieu |

| Fichier | Rôle |
|---|---|
| `src/bibliotheque.js` | la liste, l'ordre, les masques, l'ajout, la suppression, l'export. Ne touche ni au DOM ni au moteur |
| `src/midi.js` | lecture d'un MIDI standard et conversion au format du projet |
| `src/parent.js` | les trois pages de la zone parent : bibliothèque, import, à propos |

**Une clé de rangement par morceau importé**, pas un seul gros objet : un morceau pèse 30 à
60 Ko, tout réécrire à chaque changement d'ordre gaspillerait le quota, et un quota dépassé
ne fait ainsi perdre que le morceau qu'on ajoute.

**Deux invariants que l'interface tient, et qui sont dans les tests :**

1. **Jamais zéro morceau visible.** Masquer le dernier est refusé, avec un message. Sinon
   l'enfant se retrouve devant une app muette sans savoir pourquoi.
2. **Un morceau du dépôt ne se supprime pas**, il se masque. Il reviendrait au prochain
   déploiement de toute façon.

Le morceau en cours est suivi par son **identifiant** et non par son rang : la liste se
réordonne et se masque, donc un rang enregistré désignerait un autre morceau au lancement
suivant.

**L'import MIDI.** `analyse(octets)` lit le fichier et rend des **voix** sans rien décider ;
l'écran de correspondance montre la proposition ; `construis()` applique le choix du parent.
Ce qu'il faut savoir :

- la proposition vient des **numéros de programme General MIDI**, par famille (cordes vers le
  violon, basses vers le tuba, flûtes vers la flûte). C'est mon estimation, pas une vérité
- le **canal 10 donne deux voix**, une batterie et une cymbales, parce que ce sont deux
  instruments distincts de la scène. Une seule voix en perdrait la moitié
- les positions sont calées sur la **double-croche** et les durées ramenées à la notation de
  Tone la plus proche, parce que le format n'accepte que celle-là
- les hauteurs hors de la tessiture rapatriée (`A0` à `C8`) sont **ramenées par octaves**, et
  le compte rendu le dit. Une note à 40 demi-tons du plus proche échantillon ne serait qu'un
  grondement
- pas de dièses : la banque n'en a pas, les noms s'écrivent en bémols
- **les notes restées ouvertes sont fermées à la fin de la piste.** Un `note on` sans
  `note off` arrive pour de vrai (fichier tronqué, export bâclé) et les jeter ferait
  disparaître une mélodie sans aucune erreur
- refusés avec un motif lisible : division SMPTE, format 2, fichier qui n'est pas un MIDI

Le contrôle qui compte, et qui ne se remplace pas par une inspection d'état : **un morceau
importé doit sortir du haut-parleur**, mesuré au `Tone.Meter` après l'avoir importé et choisi
au clic dans le DOM.

**Point d'honnêteté à répéter à Mathieu** (il est déjà dans le cadrage section 7.2) : un MIDI
trouvé sur le web n'a pas été écrit pour cette scène. Ça jouera, mais rarement aussi bien
qu'un arrangement où chaque instrument a un rôle pensé pour toutes les combinaisons.

## Écrire un morceau : la règle que je me donne

Elle vient de la décision sur Alouette, et elle vaut pour tous les morceaux à venir.

**Je n'écris que des phrases dont je suis sûr.** Quand je ne suis pas sûr de la suite d'un
morceau, la boucle s'arrête à ce que je sais au lieu d'être complétée de mémoire
approximative. Une comptine que Grégoire et Louis connaissent, dont une phrase sonne faux,
est un défaut et pas un détail. Conséquences concrètes :

- **Au clair de la lune** ne prend que les deux premières lignes. La troisième
  (« Ma chandelle est morte ») monte à la dominante et je ne suis pas certain de son contour
  exact : elle n'est pas écrite. Huit mesures qui tournent, c'est exactement ce que fait une
  boîte à musique
- **La Lettre à Élise** : je suis sûr de la suite de hauteurs de la section A. Le rythme exact
  de la partition est reconstruit, pas recopié, et c'est dit dans le générateur
- **Cinquième Symphonie** : les deux énoncés du motif, deux fois à la hauteur d'origine puis
  deux fois à l'octave. La suite du mouvement part en développement et n'est pas écrite.
  L'octave et la reprise sont des choix d'arrangement assumés, pas une citation. Huit mesures
  et non quatre : mesuré, une boucle de quatre ne laissait que quatre notes à la plupart des
  instruments, et un enfant qui pose la clarinette seule n'entendait presque rien

Deux détails techniques appris en écrivant ces trois-là :

1. **La flûte ne double pas toujours à l'octave.** Son plus haut échantillon est `C6`, et
   au-delà de 5 demi-tons de transposition le timbre change pour de bon. Quand l'octave
   supérieure sortirait de la tessiture, elle double à l'unisson. Le validateur signalait
   trois réserves sur la Cinquième avant cette correction
2. **La gamme du koto est un paramètre du morceau.** `do ré mi sol la` jure avec un morceau
   en do mineur, où le mi est bémol

Et un garde-fou ajouté au validateur : **un instrument qui joue mais qui n'est pas dans
`mix` sort à 0 dB**, donc plus fort que tout le reste (voir `niveau()` dans `src/moteur.js`).
C'est une omission invisible dans le fichier et qui s'entend tout de suite.

## Rôles des instruments

Règle de fond : chaque instrument garde le même rôle d'un morceau à l'autre, pour que **n'importe quel sous-ensemble de 1 à 6 instruments sonne juste**. Deux instruments d'une même famille ne jouent jamais la même chose.

| Instrument | Rôle |
|---|---|
| Violon | Mélodie principale |
| Flûte | Mélodie à l'octave aiguë, ornements |
| Trompette | Mélodie franche, réponses |
| Clarinette | Contre-chant |
| Xylophone | Mélodie détachée, ponctuations |
| Piano | Accords main droite, basse main gauche |
| Guitare | Accords arpégés |
| Accordéon | Accords tenus, pompe |
| Koto | Broderies pentatoniques |
| Sitar | Bourdon et ornements |
| Tuba | Basse |
| Batterie | Grosse caisse, caisse claire, toms |
| Cymbales | Charley, crash, ride |

Test à faire passer à chaque nouveau morceau : le violon seul doit être écoutable, le tuba seul doit être écoutable, et violon + tuba + batterie doit sonner comme un vrai petit arrangement.

## Pièges qui ont mordu le 15 septembre 2026

### Amorcer n'est pas jouer

**Le premier appui sur le bouton de lecture ne lançait rien.** Le `pointerdown` global
amorçait (iOS n'ouvre le contexte audio que dans un geste), l'amorçage lançait la lecture, et
le `click` qui suivait **basculait ce qu'il venait de lancer**. Un enfant qui appuie d'abord
sur lecture, le geste le plus naturel du monde, obtenait le silence, et il fallait appuyer
deux fois. Mesuré : horloge `paused`, crête SILENCE, 0 échantillon audible sur 120.

Aucune erreur, aucune trace, et les deux morceaux de code étaient justes séparément. La
correction n'est pas un correctif d'ordre d'événements mais une séparation :

| | |
|---|---|
| **Amorcer** | ouvrir le contexte, construire le graphe, charger le morceau. N'importe quel geste, une seule fois |
| **Vouloir jouer** | une intention qui vit dans l'app (`veutJouer`), appliquée au moteur dès qu'il existe et réappliquée à chaque changement |

Un état voulu ne dépend pas de l'ordre d'arrivée des événements, une bascule si. Conséquence
agréable : l'icône montre ce que l'enfant a **demandé**, pas l'état de l'horloge, donc le
bouton répond dans le geste au lieu d'attendre la fin du chargement des treize instruments.

Le **premier geste qui exprime une intention** lance la lecture. Deux endroits n'en expriment
aucune : le bouton de lecture (il bascule, c'est son rôle) et la zone parent (un parent qui
importe un morceau n'appelle pas de musique). La condition porte donc sur « une intention
a-t-elle déjà été dite », et **pas** sur « est-ce le premier geste » : écrite comme ça, elle
laissait l'app muette dès qu'un parent avait touché au panneau avant de jouer, parce que
l'amorçage avait déjà eu lieu et que le geste suivant n'était plus le premier. Deuxième fois
que ce même piège mord au même endroit.

### Un appui long de 2 s, trois façons de le rater

**« Marche pas »**, rapporté par Mathieu sur l'iPad le 15 septembre 2026, sur l'appui long de
l'engrenage. Rien ne se voyait dans un navigateur sans tête, et il y avait **trois défauts
empilés** sur un seul geste :

1. **Rien ne se voyait pendant l'appui.** Deux secondes sans retour visuel, on lâche avant la
   fin, et il ne se passe rien. Un anneau se remplit maintenant sur l'engrenage, et sa durée
   vient de `APPUI_LONG` par la variable CSS `--appui`, donc le CSS et le JS ne peuvent pas
   dériver.
2. **iOS prenait la main sur le geste.** `touch-action: none`, `-webkit-touch-callout: none` et
   `user-select: none` ne portaient que sur `.jeton` et `.place`. Un doigt posé deux secondes
   sur un élément sélectionnable déclenche le menu système, donc un `pointercancel`, donc
   l'annulation du minuteur. La règle porte maintenant sur `.rond`.
3. **Le minuteur pouvait arriver après le doigt.** Le premier geste de la session déclenche
   aussi l'amorçage audio : 2,6 Mo à télécharger et à décoder, ce qui retarde un `setTimeout`.
   Si le doigt se levait avant que le minuteur ne tire, l'ancien code annulait tout. **On décide
   donc sur le temps écoulé**, pas sur l'ordre des rappels. Troisième fois que ce même principe
   corrige un bug dans ce projet, après l'intention de lecture.

Deux ajouts de robustesse, parce qu'un parent enfermé dehors n'a plus accès aux crédits, au
hors ligne ni à la bibliothèque : un **appui trop court affiche quoi faire** au lieu de ne
rien dire, et **trois appuis de suite en moins de 1,5 s ouvrent aussi**. Le triple appui ne
dépend d'aucun maintien, donc d'aucun comportement système, et reste hors de portée d'un geste
de jeu. Il donne en plus un diagnostic : si les trois appuis marchent et que le maintien non,
c'est le maintien qui est mangé.

Le dérapage se mesure depuis le point de départ (16 px) et plus par `movementX`, qui n'est pas
fiable sur un événement tactile de Safari et qui comparait de toute façon un pas entre deux
événements, pas une distance parcourue.

### `hidden` en CSS, et `hidden` sur un SVG

**L'attribut `hidden` n'est qu'un `display: none` de la feuille du navigateur : la moindre
règle d'auteur qui pose un `display` le bat.** Les boutons de l'import restaient visibles
malgré `hidden`, parce qu'ils vivent dans un `.menu` en `display: flex`. Corrigé une fois pour
toutes en haut de `src/app.css` par `[hidden] { display: none !important; }`.

**Et `hidden` est une propriété de `HTMLElement`, pas de `SVGElement`.** Poser `svg.hidden = true` ne fait **absolument rien** : la propriété est créée sur l'objet JS, l'attribut n'est pas écrit, et l'élément reste visible. Le bouton de lecture affichait donc les icônes play **et** pause en même temps.

Rien dans le code ne le laissait voir, et aucune erreur n'était levée. C'est une capture d'écran qui l'a montré. Deux leçons : basculer une icône SVG passe par une **classe** et du CSS, jamais par `hidden`, et **regarder l'image reste la seule vérification qui attrape ce genre de chose.**

## Illustrations

Source unique : **`src/instruments.js`**. Le module exporte `FAMILLES` (la palette, six
familles, trois tons plus un ton crème), `INSTRUMENTS` (les 13 avec leur famille et leur
libellé), `SPRITE` (le balisage des 13 symboles SVG) et `injecteSprite()`.

**Contrainte technique à connaître, c'est elle qui dicte la forme du module.** Un
`<use href="fichier.svg#id">` externe **ne reçoit pas les variables CSS du document hôte**,
dans aucun navigateur courant : le contenu référencé vit dans un document séparé, l'héritage
des propriétés personnalisées ne le traverse pas. Un fichier `assets/img/instruments.svg`
séparé rendrait donc la teinte par famille impossible. D'où le sprite injecté à l'exécution
dans le document courant : `var(--base)` résout alors normalement à travers le shadow tree de
`<use>`. Compatible avec la règle « modules ES natifs, pas d'étape de compilation ».

Style : à plat, sans contour ni dégradé, boîte `viewBox="0 0 100 100"`, aucune couleur en
dur (tout passe par `--base`, `--clair`, `--sombre`, `--fil`), lisible à 64 px.

Familles, conformes au tableau de `docs/cadrage.md` section 6 : cordes (violon, guitare,
koto, sitar), bois (flûte, clarinette), cuivres (trompette, tuba), claviers (xylophone,
piano), vent (accordéon), percussions (batterie, cymbales).

**Méthode qui a fait ses preuves, et qui n'est pas négociable : dessiner, rendre en image,
regarder, corriger.** Le tuba lisait comme un cor, le xylophone comme un diagramme en barres
puis comme une pile d'assiettes, la trompette comme un gramophone. Aucune de ces trois erreurs
n'était visible dans le code, les trois sautaient aux yeux sur l'image.

**L'icône de l'app vit dans le même module**, exportée sous `ICONE` : le violon et son
archet posés sur la scène de l'app (rideaux, frise festonnée, plancher clair), donc l'écran
d'accueil et la page se ressemblent. Les quatre PNG d'`assets/img/` en sont le rendu et sont
committés ; `test/icone.html` les montre aux tailles réelles et sous les deux masques qui
rognent vraiment, le coin arrondi d'iOS et le masque rond d'Android. Vérifié : le rendu
reproduit les quatre fichiers **au bit près** depuis `ICONE`, donc la source est bien unique.

Même méthode, même résultat : la première version avait le violon trop petit dans un cadre de
scène trop grand, illisible à 32 px. Trois variantes rendues côte à côte, celle où le violon
domine retenue. Ça ne se voyait pas dans le code.

**Le vrai critère de lisibilité n'est pas l'instrument seul, c'est la paire.** Six paires
sont à risque parce que les deux instruments sont de la même famille, donc de la même
couleur : flûte / clarinette, trompette / tuba, guitare / violon, cymbales / batterie,
piano / xylophone, guitare / sitar. Elles se vérifient côte à côte à 64 px, sur le bleu nuit
et sur le bois clair.

## Interface

Trois zones : contrôles en haut (sélecteur de morceau, play/pause, tempo, volume), scène au centre (6 emplacements), réserve autour en paysage et en dessous en portrait.

- Deux gestes équivalents, **faits** : l'appui simple envoie vers la scène ou en ramène, le glisser-déposer fait la même chose. Un glisser ne commence qu'après **8 px** de mouvement, sinon il avalerait l'appui simple et les deux gestes s'excluraient au lieu d'être équivalents. Différence voulue entre les deux : l'appui pose sur le **premier emplacement libre**, le glisser pose **là où le doigt vise**.
- Scène pleine : l'instrument touché tremble, les 6 emplacements clignotent une fois. Pas de remplacement automatique.
- Glisser sur un emplacement occupé : échange.
- Changement de morceau : les instruments restent en place, le nouveau morceau repart du début dans le même état de lecture.
- **Scène en demi-cercle en paysage**, tranché le 15 septembre 2026 contre une grille 3x2 : six emplacements en arc face au public, extrémités basses et milieu haut. Coût mesuré, l'emplacement passe de 275 px à 129 px sur l'iPad. La grille 3x2 reste en portrait, faute de largeur.
- **Réserve portrait à cinq colonnes**, pas les quatre du cadrage. Mesuré : en quatre colonnes les 13 jetons prennent une rangée de plus, soit 148 px pris à la scène, et l'emplacement tombe à 67 px sur un iPhone 390 et à 16 px sur un SE. La cible tactile de 64 px gagne contre le nombre de colonnes.
- Tempo de 60 % à 140 %, aimanté sur trois repères illustrés : **tortue, noire, lapin**, dessinés dans `src/instruments.js` sous les identifiants `r-lent`, `r-normal`, `r-rapide`. Ce ne sont pas des instruments, ils ne sont donc pas dans `INSTRUMENTS`. Vérifiés lisibles à 26 px.
- Cibles tactiles de 64 px minimum. Aucun texte nécessaire pour jouer.
- Dans la **zone parent**, les actions d'une ligne de bibliothèque font aussi 64 px de haut, ce qui dicte la forme de la ligne : titre sur une ligne, actions en dessous. Cinq boutons de 64 px et un titre ne tiennent pas côte à côte sur la largeur d'un iPhone (mesuré : 344 px nécessaires pour 310 px utiles). Les onglets et les boutons secondaires descendent à 56 px, seul écart assumé, et c'est du texte qu'un adulte lit.
- Zone parent derrière un appui long de 2 s sur un engrenage : bibliothèque, import, export, licences. **Trois appuis de suite l'ouvrent aussi**, porte de secours assumée : voir le piège ci-dessous.
- **Trois sorties de la zone parent**, et ce n'est pas du luxe : le bouton du bas, le voile, la touche d'échappement. Mesuré : sur un iPhone le panneau fait 743 px pour une vue de 664, donc le bouton « Retour au jeu » est hors de l'écran, et comme `html` et `body` sont en `overflow: hidden`, la zone parent était un **cul-de-sac** dont on ne sortait qu'en rechargeant. Le voile défile maintenant, et le centrage passe par `margin: auto` : `place-items: center` rogne le **haut** du contenu dès qu'il dépasse, sans barre de défilement pour le rattraper.

## Pièges iOS, à traiter en phase 1

1. Le contexte audio ne démarre qu'après un geste utilisateur. `Tone.start()` dans le gestionnaire du bouton Play, pas au chargement.
2. Le bouton silencieux de l'iPhone coupe l'audio web par défaut. Contournement connu par un élément audio silencieux qui bascule la session. À tester tôt, c'est bloquant si ça échoue.
3. Le verrouillage de l'écran arrête la musique. Acceptable, ne pas chercher à contourner.
4. Les données d'une PWA installée sur l'écran d'accueil persistent ; celles d'un simple onglet Safari peuvent être purgées après sept jours. D'où l'importance d'installer.
5. Tester sur l'iPad réel, pas dans le simulateur responsive de Safari sur Mac.

## Hors ligne et installation

L'app s'installe sur l'écran d'accueil et marche sans réseau. C'est la garantie mécanique de
la règle dure n° 4 (aucun appel réseau au moment de jouer), et c'est ce qui rend les données
persistantes sur iOS, voir le piège n° 4 ci-dessus.

| Fichier | Rôle |
|---|---|
| `manifest.webmanifest` | nom, `start_url`, `display: standalone`, les icônes dont une `maskable` |
| `sw.js` | le service worker : deux caches, la stratégie, la mise en cache à la demande |
| `assets/img/icone-{32,180,192,512}.png` | rendus de `ICONE`, voir la section Illustrations |

**Trois caches, et c'est volontaire :** chacun change à un rythme différent, donc chacun a sa
propre version.

| Cache | Contenu | Quand monter sa version |
|---|---|---|
| `orchestre-coque-vN` | le code, les pages, `songs/index.json` | à chaque livraison qui touche un fichier de la coque |
| `orchestre-morceaux-vN` | les JSON de `songs/` | quand un morceau est **corrigé** (ajouter un morceau n'a pas besoin de bump : c'est une URL neuve) |
| `orchestre-sons-vN` | les 2,6 Mo d'échantillons | quand un échantillon change, autant dire jamais |

Tout mettre ensemble ferait retélécharger 2,6 Mo à chaque correction d'une ligne de CSS.
Et mettre les morceaux avec les sons ferait l'inverse : comme la stratégie est « cache
d'abord, sans revalidation », **un morceau corrigé ne redescendrait jamais** sur un appareil
qui l'a déjà.

**La liste des 76 échantillons n'est pas dans `sw.js`, et ne doit pas y arriver.** Elle vit
dans `src/echantillons.js`, qui l'expose par `urlsDesEchantillons()`. La page, qui importe ce
module, l'envoie au service worker par `postMessage` quand on demande « Tout garder hors
ligne ». Raison : un service worker Safari **ne peut pas être un module ES**, il ne peut donc
pas importer ce fichier, et recopier la liste créerait un troisième miroir à garder d'accord.
Un miroir qui dérive donne un 404 hors ligne, donc un instrument muet sans aucune erreur
visible.

**La persistance** tient dans `localStorage` sous la clé `orchestre` : les six emplacements,
le morceau choisi, le tempo et le volume. Tout ce qui revient est **revalidé** au chargement
(un identifiant d'instrument inconnu, un morceau supprimé, un tempo hors bornes sont
ignorés), parce que la clé est modifiable à la main et qu'une donnée pourrie ne doit pas
casser l'app au démarrage. Écriture à la fin du geste seulement pour les curseurs, pas à
chaque pixel parcouru.

L'état du hors ligne affiché dans la zone parent est **compté**, pas annoncé : la page
regarde combien des 76 échantillons sont réellement dans le cache. Dire « prêt » sans
compter serait afficher une intention.

**Règle de livraison, à ne pas oublier : monter `VERSION_COQUE` dans `sw.js` dès qu'un
fichier de la coque change.** La stratégie est « cache d'abord » sans revalidation, donc un
appareil qui a déjà la coque continuerait de servir l'**ancien** code indéfiniment : la
correction serait en ligne et n'arriverait jamais chez l'enfant. Monter le numéro change
aussi les octets de `sw.js`, ce qui est précisément ce qui déclenche l'installation du
nouveau service worker. Et l'installation demande le réseau (`cache: "reload"`), sinon la
nouvelle coque pourrait se remplir d'anciens fichiers gardés par le cache HTTP du
navigateur.

**Mesuré, et corrigé :** monter le numéro ne suffisait pas, il fallait **trois ouvertures**
de l'app pour qu'une correction arrive. La première ne déclenche même pas la vérification, la
deuxième installe le nouveau service worker pendant que la page tourne déjà sur l'ancien
code, la troisième seulement sert le nouveau. Deux ajouts côté page : `reg.update()` au
chargement, et un rechargement automatique quand le nouveau service worker prend la main.
**Une seule ouverture suffit maintenant**, vérifié sur une copie du dépôt servie à part.

Ce rechargement automatique est **conditionné à ce que rien n'ait commencé** : couper la
musique sous les doigts d'un enfant pour appliquer une correction serait pire que la
correction. Si ça joue, la mise à jour attend le prochain lancement. Les deux comportements
sont vérifiés.

## Déploiement

GitHub Pages, branche `main`, racine. Le fichier `CNAME` à la racine porte `symphony.kinefitlabs.com`, GitHub le lit tout seul.

Côté DNS, un enregistrement CNAME `symphony` vers `<utilisateur>.github.io`. Le domaine `kinefitlabs.com` est déjà utilisé pour `app.kinefitlabs.com`, qui pointe vers Clever Cloud : aucun conflit, ce sont deux sous-domaines indépendants.

Une fois le certificat émis, cocher « Enforce HTTPS » dans les réglages Pages.

**Conséquence de méthode :** Pages ne sert que `main`. Le développement se fait sur une
branche, et toute mise en ligne passe par une fusion vers `main`. **Je fusionne vers `main` à
chaque livraison terminée et vérifiée**, sans le demander : sinon rien n'est testable sur
l'iPad, et l'iPad est le seul juge. Autorisé explicitement par Mathieu le 15 septembre 2026.
Une fusion en avance rapide, jamais un rebase, et l'invariant vérifié après coup.

Ce qui reste interdit sans son accord : réécrire l'historique de la branche (elle est
publiée, il l'a en local), pousser sur une autre branche que celle désignée, et fusionner une
livraison que je n'ai pas vérifiée moi-même.

**Piège qui a mordu le 14 septembre 2026.** Toute action dans l'interface web de GitHub
écrit un commit **directement sur `main`** : les réglages Pages, l'édition d'un fichier en
ligne. La manipulation qui force l'émission du certificat en a produit deux à 30 secondes
d'intervalle, `Delete CNAME` puis `Create CNAME`. `main` s'est donc retrouvé avec des
commits que la branche de travail n'avait pas, les deux lignes ont divergé, et le `git pull`
suivant a échoué chez Mathieu sur `Need to specify how to reconcile divergent branches`.

L'invariant à tenir : **la branche de travail est toujours en avance sur `main`**, sinon la
mise en ligne n'est plus une avance rapide. Après toute action dans l'interface, ramener
`main` dans la branche tout de suite :

```bash
git fetch origin main && git merge origin/main
```

Une fusion, jamais un rebase : la branche est publiée et Mathieu l'a en local, réécrire son
historique casserait sa copie. Vérification formelle que l'invariant est rétabli :

```bash
git merge-base --is-ancestor origin/main HEAD    # doit retourner 0
```

Et chez Mathieu, `git config pull.ff only`, pour qu'un `git pull` échoue bruyamment au lieu
de fabriquer un commit de fusion en silence.

Détail sans conséquence, à ne pas corriger : l'interface réécrit `CNAME` sans saut de ligne
final, 24 octets au lieu de 25. Pages s'en moque, et le remettre ferait réapparaître la
différence à la prochaine manipulation.

**État constaté le 14 septembre 2026.** DNS correct, domaine bien enregistré côté Pages, le
site répond en `http://`. Mais le certificat TLS n'est pas émis : la poignée de main réussit
et GitHub présente son joker `*.github.io`, qui ne couvre pas le domaine (`curl` erreur 60).
Signe croisé : `tieurk.github.io/symphony/` redirige vers `http://` et non `https://`, donc
« Enforce HTTPS » est inactive faute de certificat. Cloudflare est écarté, `dig` renvoie
directement les adresses de GitHub.

Deux causes à écarter dans cet ordre, la première rendant la seconde inopérante :

1. **Écarté.** Un enregistrement CAA qui interdirait Let's Encrypt, l'autorité de Pages.
   `dig +short CAA kinefitlabs.com` ne renvoie rien, donc aucune restriction d'émission.
   Attention au piège de lecture : `dig +short CAA symphony.kinefitlabs.com` renvoie six
   enregistrements, mais ce sont ceux de `github.io`, retournés parce que dig suit le CNAME.
   Ils autorisent Let's Encrypt de toute façon.
2. **Cause retenue.** GitHub n'a pas revérifié le DNS depuis que l'enregistrement existe.
   Déblocage manuel dans les réglages Pages : retirer le domaine personnalisé, enregistrer,
   le ressaisir, enregistrer. Attention, retirer le domaine supprime le fichier `CNAME` du
   dépôt, et le ressaisir le recrée. Vérifier qu'il est bien revenu.

Web Audio n'exige pas de contexte sécurisé, donc l'absence de certificat ne bloque pas
l'écoute. Elle bloque la phase 2 : pas d'installation sur l'écran d'accueil sans HTTPS, donc
pas de persistance des données (voir piège iOS n° 4).

## Phases

- **Phase 0** : choix du kit de percussion, écoute comparée des timbres, maquette fixe des deux mises en page, chaîne de déploiement vérifiée de bout en bout. Fait : le son sur iOS, le kit (FluidR3_GM), le déploiement en HTTPS, le nom, les 13 illustrations et les deux maquettes fixes. **Reste le jugement de Mathieu**, sur les illustrations (`test/svg.html`) et sur les maquettes (`test/maquette.html`).
- **Phase 1** : **finie**, reste à la tester avec Grégoire et Louis. Ordre fixé par Mathieu : le son d'abord (moteur dans `src/`, 13 instruments échantillonnés, trois morceaux en 13 parties, arrangements validés à l'oreille le 15 septembre 2026), puis l'interaction (l'app à la racine, les deux gestes, le minimum vivant). Deux écarts au tableau des phases, tranchés par Mathieu : le **glisser-déposer** et les **animations** sont montés en phase 1 au lieu de la 2, parce que l'objectif de la phase est de valider la sensation de jeu et qu'une interface figée la sous-vend.
- **Phase 2** : **finie.** Mise en page adaptative, glisser-déposer, animations, illustrations, crédits (règle dure n° 3, exigés dès que l'app est la porte d'entrée), **hors ligne** (manifeste, service worker, icônes, installation, persistance de la scène, du morceau, du tempo et du volume) et **zone parent complète** : bibliothèque (masquer, réordonner, supprimer), import d'un fichier du projet ou d'un MIDI avec écran de correspondance des pistes, export par la feuille de partage. Voir « Hors ligne et installation » et « La bibliothèque, l'import et l'export ».
- **Phase 3** : en cours. Trois morceaux ajoutés (Au clair de la lune, La Lettre à Élise, Cinquième Symphonie), six en tout. Restent ceux du tableau 7.4 dont je ne suis pas sûr de la mélodie (Le Cancan, la Berceuse de Brahms, B-I-N-G-O, L'araignée Gipsy, Baby Bumblebee, Pop! Goes the Weasel, l'Entrée des gladiateurs) et la deuxième série du 7.5, que Mathieu doit cocher. Voir `docs/points-ouverts.md`.
- **Phase 4** : réglage des mixages morceau par morceau, retours des enfants.

Chaque phase se termine par une version en ligne testable.

## Interdits

- Ne pas partir d'un MP3 de morceau complet : l'app joue des partitions instrument par instrument.
- Ne pas démarrer ou arrêter les parties pour gérer l'audibilité (voir Architecture audio).
- Ne pas charger les 128 instruments General MIDI, seulement les 13.
- Ne pas ajouter d'emoji dans l'interface finale, le rendu varie selon les appareils.
- Ne pas introduire d'outil de build, de bundler ou de dépendance npm à l'exécution.
