# Cadrage : « Mon Orchestre » (nom provisoire)

PWA d'orchestre interactif pour Grégoire et Louis, inspirée du jouet Symphony in B. de B. toys.
Cadrage v1 du 5 septembre 2026, à valider avant la première ligne de code.

## 1. Objectif et périmètre

L'application reproduit le principe du jouet : l'enfant pose des instruments sur une scène et entend l'arrangement du morceau se transformer instantanément. Elle est installable comme une app (PWA) sur le Mac, l'iPad et l'iPhone, fonctionne hors ligne une fois chargée, et vit sur un sous-domaine d'un de tes noms de domaine.

C'est un projet familial, pas un produit. Le nom, les illustrations et l'interface sont originaux : aucune marque, aucun logo ni visuel de B. toys n'est repris. Seul le principe de jeu est emprunté.

## 2. Décisions prises

| Sujet | Choix | Ce que ça implique |
|---|---|---|
| Rendu sonore | Instruments échantillonnés | Banques de sons libres de droits embarquées dans l'app (environ 8 à 12 Mo au premier chargement, puis en cache). Les enfants reconnaissent chaque instrument à l'oreille. Synthèse Tone.js seulement en secours pour la batterie et les cymbales si aucun kit satisfaisant n'est trouvé. |
| Sources des morceaux | Arrangements demandés à Claude, et import direct depuis l'iPad | Deux circuits : les morceaux « officiels » vivent dans le dépôt et sont disponibles partout ; les morceaux importés dans l'app restent sur l'appareil où ils ont été importés, avec un bouton Exporter pour les faire passer d'un circuit à l'autre. |
| Hébergement | Dépôt GitHub + Pages | Le code vit dans un dépôt GitHub à ton nom, publié automatiquement sur ton sous-domaine en HTTPS. Une mise à jour ou un nouveau morceau = un push, visible sur tous les appareils dans la minute. |
| Orientation | Adaptative | Paysage sur iPad et Mac (scène au centre, réserve autour, comme le jouet), portrait sur iPhone (scène en haut, réserve en bas). Un seul code, la mise en page s'adapte. |

## 3. Le jouet de référence

D'après la fiche officielle B. toys, le jouet comporte 13 instruments (clarinette, flûte, tuba, trompette, xylophone, batterie, cymbales, piano, accordéon, koto, guitare, violon, sitar), une scène de 6 emplacements, 15 morceaux, un bouton PLAY qui enchaîne les morceaux, un réglage de tempo, un réglage de volume et une scène qui s'illumine de plusieurs couleurs. Sa liste officielle de morceaux figure en section 7.

Ce que l'app reproduit : les 13 instruments, la scène à 6 places, le silence quand la scène est vide, la lecture en boucle synchronisée, le tempo, le volume, le changement de morceau. Ce que l'app transpose : les lumières deviennent une scène qui pulse et change de couleur au rythme du morceau, et les instruments posés sur scène s'animent sur les temps.

## 4. Expérience utilisateur

### 4.1 Écran principal

Trois zones. En haut, le panneau de contrôle : le sélecteur de morceau (une vignette colorée et un titre par morceau, avec une flèche « suivant » qui enchaîne comme le PLAY du jouet), le gros bouton Play / Pause, le curseur de tempo et le curseur de volume. Au centre, la scène : six emplacements marqués en pointillés, la scène pulse quand la musique joue. Autour (paysage) ou en dessous (portrait), la réserve : les 13 instruments, groupés par famille avec une couleur par famille.

L'interaction se fait de deux façons équivalentes, au doigt ou à la souris. Toucher un instrument de la réserve l'envoie sur le premier emplacement libre de la scène ; toucher un instrument sur scène le renvoie dans la réserve. Le glisser-déposer fonctionne aussi dans les deux sens, parce que c'est le geste du jouet. Quand la scène est pleine, l'instrument touché tremble et les six emplacements clignotent une fois : il faut d'abord en retirer un, exactement comme avec le jouet où il n'y a plus de place. Glisser un instrument directement sur un emplacement occupé fait l'échange.

Dès qu'un instrument arrive sur scène, sa piste devient audible à la note suivante, sans jamais perdre le fil du morceau. Dès qu'il repart, elle se tait. Scène vide, aucun son, avec une petite animation d'invitation sur les emplacements.

Le changement de morceau garde les instruments en place sur la scène et repart du début du nouveau morceau, dans le même état (en lecture ou en pause). La pause fige la position, Play reprend au même endroit.

### 4.2 Tempo et volume

Le curseur de tempo va de 60 % à 140 % de la vitesse d'origine, avec trois repères illustrés (tortue, normal, lapin) sur lesquels il s'aimante. Comme l'app joue des partitions et non des enregistrements, changer le tempo ne change pas la hauteur des notes : le violon reste un violon à toutes les vitesses. Le curseur de volume règle le volume général ; le volume matériel de l'appareil reste actif par-dessus.

### 4.3 Pensé pour des enfants

Aucun texte n'est nécessaire pour jouer : tout passe par les illustrations, les couleurs et le son. Les cibles tactiles font au moins 64 pixels. Une fois installée sur l'écran d'accueil, l'app s'ouvre en plein écran, sans barre Safari ni risque de navigation accidentelle. Pour verrouiller un enfant dans l'app sur iPad, l'Accès guidé d'iOS (réglage côté parent) suffit, l'app n'a pas besoin de le réinventer.

### 4.4 Zone parent

Un petit engrenage dans un coin, qui s'ouvre sur un appui long de deux secondes (pas un verrou, juste hors de portée d'un geste de jeu). On y trouve la bibliothèque (masquer ou réordonner les morceaux), l'import d'un morceau, l'export ou le partage d'un morceau, la suppression d'un morceau importé, la réinitialisation, et une page « à propos » avec la version et les licences des sons.

### 4.5 Mise en page adaptative

En paysage (iPad, Mac), la scène occupe le centre, large, avec ses six emplacements en demi-cercle face au public ; la réserve entoure la scène sur les côtés, les contrôles restent en haut. En portrait (iPhone), les contrôles sont en haut, la scène au milieu sur deux rangées de trois emplacements, la réserve en bas en grille de quatre colonnes. Sur Mac, la fenêtre se redimensionne librement et bascule d'une mise en page à l'autre selon sa forme.

## 5. Architecture audio

Le moteur repose sur Web Audio via Tone.js. Une horloge unique (le Transport de Tone.js) fait tourner le morceau en boucle. Les 13 parties du morceau sont programmées sur cette horloge dès le lancement ; chaque instrument a son propre canal avec un état muet ou audible. Poser un instrument sur scène ne lance rien, ça ouvre le canal : la partie tournait déjà, calée à la note près sur les autres. C'est ce qui garantit la synchronisation parfaite, quel que soit le moment où l'enfant agit.

Chaque instrument mélodique est un Sampler Tone.js : quelques notes réelles enregistrées, transposées pour couvrir toute la tessiture. La batterie et les cymbales jouent des frappes isolées (grosse caisse, caisse claire, toms, charleston, crash, ride). Chaque morceau embarque son mixage : un niveau par instrument, réglé pour que le tuba n'écrase pas la flûte et que n'importe quelle combinaison de six instruments reste équilibrée.

Les 13 banques de sons se chargent au démarrage derrière un écran d'attente animé, puis sont mises en cache par le service worker : le deuxième lancement est immédiat et hors ligne.

Banques retenues après vérification (13 septembre 2026) : le rendu MP3 du soundfont FluidR3_GM couvre les 128 programmes General MIDI, donc les 13 instruments de la scène, koto, sitar et accordéon compris. Une seule source, donc des timbres cohérents entre eux et une seule licence à respecter, Creative Commons Attribution 3.0, qui impose de créditer la banque dans la page « à propos ». Un point reste ouvert : ce rendu ne couvre que les programmes mélodiques, pas le kit de percussion General MIDI. La batterie et les cymbales ont donc besoin d'une source séparée, un kit en CC0, à choisir en phase 0. VSCO 2 Community Edition, en CC0, reste l'alternative si le rendu FluidR3 déçoit à l'écoute sur les instruments principaux.

Particularités iOS à intégrer dès le départ : le son ne peut démarrer qu'après un premier geste de l'utilisateur (le bouton Play s'en charge) ; le bouton silencieux de l'iPhone coupe l'audio web par défaut, un contournement connu existe (un élément audio silencieux qui bascule la session en mode lecture) et sera testé en premier ; le verrouillage de l'écran arrête la musique, ce qui est acceptable pour un jeu.

## 6. Rôles des instruments

Pour que n'importe quel sous-ensemble sonne bien, chaque instrument garde un rôle stable d'un morceau à l'autre. Les instruments d'une même famille ne jouent jamais exactement la même chose : deux mélodiques ensemble donnent une mélodie à l'octave ou ornée, pas un doublon.

| Instrument | Famille | Rôle par défaut |
|---|---|---|
| Violon | Cordes | Mélodie principale |
| Flûte | Bois | Mélodie à l'octave aiguë, ornements |
| Trompette | Cuivres | Mélodie, phrasé plus franc, réponses |
| Clarinette | Bois | Contre-chant |
| Xylophone | Claviers | Mélodie doublée en notes détachées, ponctuations |
| Piano | Claviers | Accords main droite, basse main gauche |
| Guitare | Cordes | Accords arpégés |
| Accordéon | Vent | Accords tenus, pompe |
| Koto | Cordes | Broderies pentatoniques sur les accords |
| Sitar | Cordes | Bourdon et ornements |
| Tuba | Cuivres | Basse |
| Batterie | Percussions | Grosse caisse, caisse claire, toms |
| Cymbales | Percussions | Charleston, crash, ride |

Chaque morceau définit ses 13 parties sur cette base, avec des variations propres au style (une berceuse n'a pas la batterie d'une marche).

## 7. Morceaux

### 7.1 Format des morceaux

Un morceau est un fichier texte au format du projet (JSON) qui contient : l'identité (titre, compositeur, source, vignette), le tempo d'origine et la mesure, la longueur de la boucle en mesures, le mixage (niveau par instrument), et les 13 parties. Une partie est une liste de notes, chacune avec sa position (mesure, temps, subdivision), sa hauteur en notation classique (do4 écrit C4, etc.), sa durée et sa nuance. Pour la batterie et les cymbales, la hauteur est remplacée par le nom de la frappe. Une boucle typique fait 8 à 16 mesures, soit 20 à 40 secondes.

Ce format est celui que je produis quand tu me demandes un morceau, celui que l'app importe et exporte, et celui du dossier des morceaux du dépôt.

### 7.2 Les deux circuits pour ajouter un morceau

Circuit 1, tu me le demandes. Tu me donnes un titre du domaine public (comptine, air classique, chanson traditionnelle), j'écris l'arrangement en 13 parties, je l'ajoute au dépôt, il apparaît sur tous les appareils à la prochaine ouverture de l'app.

Circuit 2, import direct depuis l'iPad (ou l'iPhone, ou le Mac). Dans la zone parent, « Importer » ouvre l'app Fichiers. Deux types de fichiers sont acceptés : un fichier au format du projet (par exemple un morceau que je t'ai envoyé par AirDrop ou par mail, ajouté sans attendre un déploiement), et un fichier MIDI standard (.mid) trouvé sur le web ou exporté d'un logiciel de musique. Pour un MIDI, l'app lit les pistes et les répartit sur les 13 instruments automatiquement d'après les numéros d'instrument General MIDI (cordes vers le violon, cuivres graves vers le tuba, canal 10 vers la batterie et les cymbales, et ainsi de suite), puis affiche un écran de correspondance où tu peux réaffecter chaque piste. Les pistes sans correspondance sont proposées aux instruments restés libres. Le tempo et la mesure viennent du fichier.

Un morceau importé reste sur l'appareil où il a été importé. Le bouton « Exporter » produit le fichier au format du projet, partageable par AirDrop ou par mail : c'est aussi le moyen de me le transmettre pour que je l'ajoute au dépôt et qu'il devienne disponible partout.

Point d'honnêteté sur la qualité : un MIDI trouvé sur le web n'a pas été écrit pour ce jeu. Il sonnera correctement mais rarement aussi bien qu'un arrangement fait pour la scène, où chaque instrument a un rôle pensé pour toutes les combinaisons.

### 7.3 Ce qui n'est pas possible

Un MP3 ou un morceau Apple Music ne peut pas alimenter ce jeu : l'app joue des partitions instrument par instrument, un enregistrement mélangé ne peut pas être séparé en 13 instruments. Côté droits, je n'arrange que des œuvres du domaine public ; pour une chanson protégée que les enfants adorent, le circuit 2 avec un fichier MIDI que tu fournis est la voie.

### 7.4 Liste de départ (les 15 du jouet)

| N° | Titre sur le jouet | Titre dans l'app | Auteur | Statut | Plan |
|---|---|---|---|---|---|
| 1 | Twinkle, Twinkle Little Star | Ah ! vous dirai-je, maman | Air traditionnel (variations de Mozart) | Domaine public | Phase 1 |
| 2 | Alouette | Alouette | Traditionnel | Domaine public | Phase 1 |
| 3 | Beethoven's Fifth Symphony | Cinquième Symphonie (thème) | Beethoven | Domaine public | Phase 3 |
| 4 | The Wheels on the Bus | Remplacé par Au clair de la lune | Verna Hills, 1937, décédée en 1990 | Protégé en Europe jusqu'en 2060 | Remplacé (importable en MIDI par le circuit 2 si tu y tiens) |
| 5 | B-I-N-G-O | B-I-N-G-O | Traditionnel | Domaine public | Phase 3 |
| 6 | Can Can | Le Cancan | Offenbach, 1858 | Domaine public | Phase 3 |
| 7 | Eensy, Weensy Spider | L'araignée Gipsy | Traditionnel | Domaine public | Phase 3 |
| 8 | Baby Bumblebee | Baby Bumblebee (air de The Arkansas Traveler) | Traditionnel | Domaine public | Phase 3 |
| 9 | Brahms' Lullaby | Berceuse de Brahms | Brahms, 1868 | Domaine public | Phase 3 |
| 10 | Row, Row, Row Your Boat | Row Your Boat | Traditionnel, 1852 | Domaine public | Phase 1 |
| 11 | Pop! Goes the Weasel | Pop! Goes the Weasel | Traditionnel | Domaine public | Phase 3 |
| 12 | Entry of the Gladiators | Entrée des gladiateurs | Fučík, 1897 | Domaine public | Phase 3 |
| 13 | Alphabet Song | Remplacé par Frère Jacques | Même mélodie que le n° 1 | Domaine public | Remplacé (doublon mélodique en français) |
| 14 | Come Little Leaves | À confirmer, sinon Une souris verte | Paroles George Cooper (1840-1927), musique attribuée à Thomas J. Crawford, date incertaine | Statut à vérifier | Phase 3 si confirmé |
| 15 | Für Elise | La Lettre à Élise | Beethoven, 1810 | Domaine public | Phase 3 |

### 7.5 Deuxième série proposée (domaine public)

Comptines : Sur le pont d'Avignon, Promenons-nous dans les bois, Il était un petit navire, Savez-vous planter les choux, Dansons la capucine, Une souris verte. Classique : Ode à la joie, Petite musique de nuit, Marche turque, Le Beau Danube bleu, Ouverture de Guillaume Tell, Marche de Radetzky, Le Carnaval des animaux (thème du Lion ou des Kangourous). Tu coches, je fais.

## 8. Identité visuelle

Nom provisoire « Mon Orchestre » ; alternatives : « Maestro ! », « La Fosse », « Symphonie de poche ». Sous-domaine à choisir, par exemple orchestre.tondomaine.

Style : illustrations vectorielles originales dessinées pour le projet, à plat, colorées, une couleur par famille d'instruments (cordes, bois, cuivres, claviers, percussions), fond bleu nuit, scène en bois clair avec rideaux rouges et projecteurs. Les instruments sur scène rebondissent sur les temps forts, la scène change de couleur à chaque mesure. Pas d'emoji dans la version finale (rendu différent selon les appareils), seulement comme remplaçants pendant le développement. Icône d'app et écran de lancement assortis.

## 9. Architecture technique

Site statique sans étape de compilation : une page principale, des modules JavaScript (moteur audio, bibliothèque de morceaux, interface, import et export, mise en cache), Tone.js copié dans le dépôt pour fonctionner hors ligne, un dossier de sons, un dossier de morceaux avec son index, le manifeste PWA, le service worker et les icônes. Pas de React ni d'outil de build : le déploiement est une copie de fichiers, et n'importe quel hébergeur statique convient.

Hors ligne : le service worker met tout en cache au premier chargement (application, sons, morceaux). Une nouvelle version se télécharge en arrière-plan et s'active à l'ouverture suivante.

Stockage local : les morceaux importés et les réglages de la bibliothèque vivent dans IndexedDB ; le dernier morceau, le tempo et le volume dans le stockage local. Sur iOS, une app installée sur l'écran d'accueil conserve ses données (contrairement à un simple onglet Safari qui peut être purgé après sept jours sans visite), d'où l'importance de l'installation. L'export sert de sauvegarde.

Compatibilité visée : Safari sur iOS et iPadOS 16 et plus, Safari et Chrome sur macOS. Installation : Safari, bouton Partager, « Sur l'écran d'accueil » (iPhone, iPad) ; Safari « Ajouter au Dock » ou Chrome « Installer » (Mac).

Dépôt et publication : dépôt GitHub public (GitHub Pages gratuit) ou privé avec Cloudflare Pages (gratuit aussi) ; le code ne contient rien de personnel, le dépôt public est le plus simple. Le sous-domaine pointe sur Pages par un enregistrement CNAME chez ton registrar, HTTPS automatique. Pour que je publie moi-même depuis nos sessions, il faut un jeton d'accès GitHub limité à ce seul dépôt, que tu me colles au moment d'un déploiement (je ne le stocke nulle part) ; sinon je te fournis l'archive et tu la pousses.

## 10. Contraintes et risques

Droits : mélodies du domaine public seulement pour les arrangements que je produis ; banques de sons en CC0 ou CC-BY, créditées dans l'app ; illustrations originales ; ni nom ni visuel de B. toys.

Audio iOS : démarrage après un geste, bouton silencieux, arrêt au verrouillage. Tout est traité en phase 1, avant le reste.

Premier chargement : 8 à 12 Mo à télécharger une fois, avec écran d'attente ; ensuite tout est local.

Import MIDI : qualité variable selon les fichiers ; l'écran de correspondance et le mixage automatique limitent la casse.

Stockage : les imports vivent sur un seul appareil ; l'export et le circuit 1 servent de pont.

## 11. Hors périmètre v1, envisageable ensuite

Sauvegarder « ma symphonie » (la combinaison d'instruments posée par l'enfant, avec son nom). Écoute « solo » d'un instrument depuis la réserve par appui long. Synchronisation automatique des morceaux importés entre les appareils (par exemple via un petit point d'entrée sur ton n8n). Enregistrement d'une prestation en fichier audio. Plusieurs langues pour les titres.

## 12. Plan de réalisation

Phase 0, préparation : choix du nom et du sous-domaine, création du dépôt et du DNS, écoute comparée des banques de sons pour les 13 instruments, maquette fixe des deux mises en page (paysage, portrait) pour validation avant tout code.

Phase 1, tranche verticale : moteur audio complet, trois morceaux (Ah ! vous dirai-je, maman ; Alouette ; Row Your Boat), scène et réserve fonctionnelles au toucher, visuels provisoires, testée sur l'iPad en paysage. Objectif : valider la sensation de jeu et la synchronisation avec les enfants avant d'aller plus loin.

Phase 2, application complète : mise en page adaptative, glisser-déposer, animations, illustrations finales, zone parent, import et export, PWA hors ligne, icônes, installation sur les trois appareils.

Phase 3, bibliothèque : les morceaux du jouet restants (avec les remplacements de la section 7.4), puis la deuxième série si tu la valides.

Phase 4, finitions : tests sur Mac, iPad et iPhone, réglage des mixages morceau par morceau, retours des enfants, corrections.

Chaque phase se termine par une version en ligne que tu peux tester.

## 13. Ce qu'il reste à trancher avant de coder

1. Le nom de l'app et le sous-domaine.
2. La confirmation que l'import accepte aussi les fichiers MIDI (recommandé : sans ça, le bouton Importer ne sert qu'aux fichiers que je t'envoie).
3. Les trois remplacements dans la liste du jouet (n° 4, 13 et 14) et la deuxième série à retenir.
4. Scène pleine : refus avec tremblement (comme le jouet, recommandé) ou remplacement automatique du plus ancien.
5. Le tempo en curseur aimanté sur trois repères (recommandé) ou en trois boutons seulement.
6. L'accès à la zone parent par appui long sur l'engrenage (recommandé) ou par un autre geste.
7. Dépôt public avec GitHub Pages (recommandé) ou privé avec Cloudflare Pages, et le mode de publication (jeton limité au dépôt, ou archive que tu pousses toi-même).
8. La maquette visuelle de la phase 0 : je la produis d'abord pour validation, ou on part directement sur la tranche verticale avec des visuels provisoires.
