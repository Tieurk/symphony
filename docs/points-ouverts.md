# Points ouverts

À trancher avec Mathieu. Les réponses vont dans `CLAUDE.md`, pas ici.

## À trancher maintenant

### 1. Ce qui bloque les morceaux, et ce n'est plus ce qu'on croyait

**Douze morceaux sont en ligne** : Ah ! vous dirai-je maman, Row Your Boat, Frère Jacques, Au
clair de la lune, La Lettre à Élise, Cinquième Symphonie, Berceuse de Brahms, Pop! Goes the
Weasel, Arkansas Traveler, et depuis le 20 septembre **Dans la ferme de Mathurin**, **Mary
Had a Little Lamb** et **Three Blind Mice**.

**Le Roi lion et Le Livre de la jungle ne peuvent pas entrer dans le dépôt.** Elton John, Tim
Rice, Hans Zimmer, les frères Sherman, Terry Gilkyson : tous sous droits, et le site est
public sur ton domaine. C'est la règle dure n° 2. Elles s'importent en revanche très bien sur
ton appareil, où elles restent, voir `docs/importer-un-morceau.md`.

**Pour tout le reste, le problème n'est pas juridique.** Ta liste du 20 septembre est
entièrement dans le domaine public, dates comprises, Holst et Dukas inclus. Le problème est
que **je ne peux lire aucune partition depuis mon conteneur.** Mesuré ce jour-là :

| Source | État |
|---|---|
| mutopiaproject.org, IMSLP, abcnotation.com, kern.ccarh.org | bloqués |
| partitions-domaine-public.fr, comptines.tv, thesession.org | bloqués |
| API GitHub et pages d'arborescence | 403, et la liste des compositeurs de Mutopia s'arrête à F |
| fichiers bruts de GitHub, **sur un chemin connu** | accessibles, et c'est la seule porte |

Une bonne nouvelle quand même : **le corpus Joplin de `craigsapp` est lisible**, en notation
Humdrum, avec les dates du compositeur dans l'en-tête du fichier. `The Entertainer` et
`Maple Leaf Rag` sont donc à portée, et c'est exactement l'esprit ragtime que tu décrivais.
Ils ne sont pas encore écrits : réduire une main droite de ragtime à une ligne de chant est
un travail d'arrangement, et je préfère le faire bien que vite.

**Ce qui attend, et qui n'attend qu'une partition :**

| Ce que tu as demandé | Ce qui manque |
|---|---|
| Marche royale du lion, Dans l'antre du roi de la montagne, L'Apprenti sorcier, Jupiter, Guillaume Tell, Trépak, Lac des cygnes, Fée Dragée | une partition lisible. Je ne suis pas sûr de leur contour note à note, et je n'écris pas de mémoire approximative |
| Une souris verte, Promenons-nous dans les bois, Un crocodile, Il court le furet | pareil, et ce sont justement celles que les garçons reconnaîtraient |
| Alouette, B-I-N-G-O, L'araignée Gipsy, Le Cancan, l'Entrée des gladiateurs | pareil, depuis le début |

**Deux façons de débloquer n'importe lequel, et les deux sont rapides pour toi :**

1. **Tu en importes un MIDI** (`docs/importer-un-morceau.md`). Tu écoutes. Si le résultat te
   plaît et que le morceau est dans le domaine public, tu me l'exportes par la feuille de
   partage et **je le reprends en vrai arrangement à 13 parties**, avec ses notes sous les
   yeux
2. **Tu me confirmes la mélodie**, en notes ou en solfège, une ligne par phrase

### 2. Le test avec les enfants.

La phase 1 est finie. Son objectif n'est pas technique, il est là : **valider la sensation de
jeu avec Grégoire et Louis.** L'app est à la racine, `https://symphony.kinefitlabs.com`.

Ce qui se juge, et que je ne peux pas mesurer :

- est-ce qu'ils comprennent tout seuls qu'on pose un instrument sur la scène, sans explication
- est-ce qu'ils trouvent le glisser-déposer ou seulement l'appui simple
- est-ce que le tressaut de l'instrument qui joue se voit et fait plaisir, ou passe inaperçu
- est-ce qu'ils touchent au tempo, et est-ce que la tortue et le lapin leur parlent
- combien de temps ils jouent avant de se lasser

### 3. L'installation sur l'iPad, et l'icône.

L'app s'installe maintenant sur l'écran d'accueil et marche sans réseau. Deux choses qui sont
de ton côté, pas du mien.

Installer, sur l'iPad, dans Safari, sur `https://symphony.kinefitlabs.com` :

1. le bouton Partager, puis **Sur l'écran d'accueil**
2. ouvrir l'app depuis l'icône, plus depuis Safari
3. appui long de 2 s sur l'engrenage, puis **Tout garder hors ligne** (2,6 Mo, une fois)
4. couper le wifi et rouvrir : ça doit jouer

Ça vaut le détour même si le réseau marche : les données d'un simple onglet Safari peuvent
être purgées après sept jours, celles d'une PWA installée restent. C'est ce qui fait que la
scène, le morceau, le tempo et le volume sont encore là le lendemain.

**L'icône est un jugement de goût, donc le tien.** Un violon et son archet sur la scène de
l'app. `test/icone.html` la montre aux tailles réelles et sous les deux masques qui rognent.
J'ai corrigé une seule chose, qui était un défaut de lisibilité et pas de goût : le violon
était trop petit dans un cadre de scène trop grand, illisible à 32 px.

### 4. La correspondance des pistes MIDI, et le mixage des imports.

L'import MIDI est fait, écran de correspondance compris. Deux choses dedans sont **mes
estimations**, et il n'y a que l'usage qui les jugera.

- **La proposition d'instrument** part des numéros de programme General MIDI, par famille :
  cordes vers le violon, basses vers le tuba, flûtes vers la flûte, canal 10 vers la batterie
  et les cymbales. Si sur un fichier réel la proposition tombe systématiquement à côté,
  dis-le moi avec le fichier, la table est facile à corriger
- **Le mixage d'un morceau importé** part d'une table par défaut, la même pour tous. Le
  réglage à l'oreille morceau par morceau est la phase 4, et c'est toi qui entends

Et le rappel du cadrage, qui vaut d'être répété : un MIDI trouvé sur le web n'a pas été écrit
pour cette scène. Ça jouera, mais rarement aussi bien qu'un arrangement où chaque instrument
a un rôle pensé pour toutes les combinaisons de 1 à 6.

### 5. L'accès à la zone parent, à confirmer à l'usage.

L'appui long de 2 s sur l'engrenage est en place, comme le prévoit le cadrage. Deux choses à
vérifier avec les garçons dans la pièce : un enfant de 8 ans qui cherche ne doit pas tomber
dessus par hasard, et toi tu ne dois pas avoir à t'y reprendre à trois fois.

## À trancher avant la phase 3

6. **Le dernier remplacement.** The Wheels on the Bus est remplacé et écrit (Au clair de la lune), Alphabet Song est remplacé et écrit (Frère Jacques). Reste **Come Little Leaves**, dont le statut est à vérifier : musique attribuée à Thomas J. Crawford, date incertaine, donc je ne l'écris pas. Le cadrage propose Une souris verte à la place. À confirmer.
7. **La deuxième série de morceaux.** Voir `docs/cadrage.md` section 7.5. Tu coches, je fais, avec la même règle : seulement ce dont je suis sûr, le reste par un MIDI que tu importes.

## Tranché en phase 1

### L'anticipation audio : 20 ms. Tranché à l'oreille le 15 septembre 2026.

`CLAUDE.md` réservait explicitement ce réglage à l'oreille de Mathieu sur l'iPad, « pas à
l'aveugle ». Trois boutons sur le banc d'écoute, 100, 50 et 20 ms. Il a retenu le plus court.

Ce que ça change, mesuré : la réaction perçue à un geste passe de **108 ms à 28 ms**, quatre
fois plus vif. La rampe de mute faisait déjà son travail en 11 ms, c'était l'anticipation de
Tone qui mangeait tout le reste.

Réserve : testé sur l'iPad, **pas sur l'iPhone**. Descendre l'anticipation accélère au prix
d'un risque d'accrocs sur un appareil plus faible. Les trois boutons restent sur
`test/phase1.html` pour retester ailleurs.

### Les trois arrangements. Validés à l'écoute le 15 septembre 2026.

« J'ai fait les tests et tout est bon. » Ah ! vous dirai-je maman (4/4, 12 mesures), Row Your
Boat (6/8, 8 mesures) et Frère Jacques (4/4, 8 mesures), chacun en 13 parties pleines.

Les niveaux de mixage restent mon estimation et `CLAUDE.md` place leur réglage fin en phase 4,
à l'oreille, morceau par morceau. Un chiffre à connaître : le sitar seul est 14 dB sous le
violon, le koto 13 dB. C'est voulu, leurs rôles sont d'arrière-plan.

### Les 13 illustrations et les deux mises en page. Validées le 15 septembre 2026.

Les six paires à risque de confusion sont jugées distinctes. La scène est en demi-cercle en
paysage (décidé contre une grille 3x2), la réserve portrait reste à cinq colonnes contre les
quatre du cadrage (mesuré : à quatre, l'emplacement de scène tombe à 16 px sur un iPhone SE),
et les repères de tempo sont une tortue, une noire et un lapin.

Reste de l'équilibrage optique possible entre les 13 : un violon est naturellement étroit et
une batterie large, donc à taille de boîte égale ils ne pèsent pas pareil à l'oeil. Ça ne se
juge qu'à l'usage, et rien ne presse.

### Deux écarts au tableau des phases, tranchés le 15 septembre 2026.

Le **glisser-déposer** et les **animations** étaient prévus en phase 2. Ils sont montés en
phase 1, parce que l'objectif de cette phase est de valider la sensation de jeu avec les
enfants et qu'une interface figée la sous-vend au moment précis où on la leur montre.

Le minimum vivant tient en trois choses, toutes coupées si l'appareil demande moins de
mouvement : l'instrument posé tressaille quand **sa** partie déclenche une note (au temps
audio, via `Tone.Draw`, et bridé à un tressaut par instrument et par 150 ms sinon la guitare
et ses 96 événements clignoteraient en continu), la scène pulse à la mesure, et les
emplacements vides invitent.

## Tranché en phase 0

### Kit de percussion : la banque du FluidR3_GM. Tranché à l'écoute le 15 septembre 2026.

Trois candidats rapatriés, ramenés au même format et au même niveau de crête (mono
44 100 Hz, pic à -1 dBFS) pour que la comparaison porte sur le timbre et pas sur le volume,
puis comparés frappe par frappe et en contexte sur `test/phase0.html`.

| | **FluidR3_GM, retenu** | Virtuosity Drums | VCSL |
|---|---|---|---|
| Licence | CC-BY 3.0, déjà créditée | CC0 1.0 | CC0 1.0 |
| Nature | même banque que l'orchestre | vrai kit acoustique, club de jazz | percussion d'orchestre |
| Couverture des 9 frappes | **9 en direct** | 8, pas de tom médium | 6, aucun ride |
| Poids | 1,2 Mo | 1,6 Mo | 1,6 Mo |

**Ce que Mathieu a entendu :** « les instruments sont plus compressés sur FluidR3, sur
Virtuosity il y a plus d'écho, VCSL est entre deux ». Les temps de chute à -30 dB du kick le
confirment au chiffre près : **130 ms** pour FluidR3, 340 ms pour VCSL, 430 ms pour
Virtuosity. Et FluidR3 est 5,2 dB plus bas entre 0 et 120 Hz, ce qui est littéralement le
« plus compressé ».

**Pourquoi il l'a préféré, et pourquoi ma proposition était mauvaise.** Je recommandais
Virtuosity, pour sa licence CC0 franche et sa vraie prise de son. C'est passé à côté de
l'essentiel : les 11 instruments mélodiques sont des rendus de soundfont, plutôt secs. Un
kit enregistré en salle sonne étranger à côté. Le kit qui vient de la même banque se marie,
et c'est ce qui compte dans un arrangement. Bonus, une seule licence et un seul crédit
couvrent maintenant toute la banque de sons.

Ce qui a failli faire rater la décision : le motif de batterie de la page de test ne jouait
que 4 des 9 frappes, dominé par les deux moins discriminantes (snare 1,2 x d'écart entre
kits, charley 1,5 x), et ne jouait jamais les trois plus discriminantes (tom_bas 3,2 x,
ride 2,6 x). À la première écoute les trois kits semblaient identiques. Leçon retenue pour
la suite : **un banc d'essai qui n'expose pas tout ne prouve rien.**

Réserve à connaître : la note 46 du General MIDI s'appelle « Open Hi-Hat » mais
l'échantillon que FluidR3 y place est un charley à demi ouvert.

Niveau des cymbales, à valider : réglé à -10 dB, de ma main, jamais validé. Mesuré, elles
sont au même niveau que la batterie quand on les écoute seules (0,3 dB d'écart) et
n'ajoutent que 0,4 dB au mix complet, donc elles sont masquées plutôt que trop basses.
C'est l'oreille de Mathieu qui tranchera, en phase 4.

### Nom affiché aux enfants : « Mon premier orchestre ». Tranché le 15 septembre 2026.

Le dépôt et le sous-domaine restent `symphony`, ce sont deux choses différentes. Le cadrage
proposait « Mon Orchestre », « Maestro ! », « La Fosse » et « Symphonie de poche ».

### Ordre de travail : la maquette fixe d'abord. Tranché le 15 septembre 2026.

Les deux mises en page produites en fixe pour validation, puis la tranche verticale. C'est
l'inverse de ce que je recommandais (partir directement sur la tranche verticale avec des
visuels provisoires, puisque le moteur audio est déjà debout et validé à l'oreille). Décision
de Mathieu, c'est son projet.

- **Convention de nommage des échantillons FluidR3_GM.** Confirmée fichier par fichier le
  13 septembre 2026, écrite dans `CLAUDE.md`.
- **Format des frappes de percussion.** WAV et non MP3 : l'encodage MP3 ajoute un silence
  d'amorce audible sur une attaque de batterie, et les neuf fichiers sont assez courts pour
  que le surpoids soit négligeable.
- **Licence des banques de percussion.** CC0 ou CC-BY, conformément à `docs/cadrage.md`
  section 10. `CLAUDE.md` disait CC0 seul, la contradiction est levée.
- **Chaîne de déploiement, mesurée le 14 septembre 2026.** DNS correct (`symphony` vers
  `tieurk.github.io`, quatre adresses anycast de Pages). Pages activé, publication depuis
  `main` en `success`. Le site répond en `http://`, donc le domaine est bien enregistré.
  Cloudflare écarté, aucun proxy devant le domaine. CAA écarté aussi, `kinefitlabs.com` n'a
  aucun enregistrement CAA. **Reste ouvert : le certificat TLS n'est pas émis**, `curl`
  renvoyait l'erreur 60. Cause identifiée, GitHub n'avait pas revérifié le DNS. Débloqué par
  la manipulation des réglages Pages le 14 septembre à 05h18 UTC, qui a laissé deux commits
  `CNAME` sur `main`. **Certificat émis, vérifié le 15 septembre :
  `https://symphony.kinefitlabs.com/test/phase0.html` répond `HTTP/2 200`.** Reste à cocher
  « Enforce HTTPS » dans les réglages Pages, seul point encore ouvert de la chaîne.
