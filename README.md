# Symphony

Orchestre interactif pour enfants, en PWA. On pose des instruments sur la scène, l'arrangement du morceau se transforme en direct.

Le nom affiché aux enfants est **Mon premier orchestre**. `symphony` reste le nom du dépôt
et du sous-domaine.

En ligne : https://symphony.kinefitlabs.com

## État

**Phase 1 finie.** L'app existe, elle est à la racine, et elle se joue au doigt : on pose un
instrument sur la scène, l'arrangement se transforme en direct.

Ce qui reste de la phase 1 n'est pas technique : **la tester avec Grégoire et Louis.** C'est
son objectif, et c'est le seul juge de la sensation de jeu.

Fait :

- le **moteur audio** dans `src/moteur.js`, une horloge, 13 canaux, anticipation à 20 ms
- les **13 instruments échantillonnés**, 2,6 Mo, banque FluidR3_GM
- **trois morceaux** en 13 parties pleines, validés à l'écoute
- les **13 illustrations** et les **deux mises en page**, validées
- l'**interaction** : appui simple et glisser-déposer, échange sur emplacement occupé, scène
  pleine qui refuse sans remplacer
- le **minimum vivant** : l'instrument qui joue tressaille, la scène pulse à la mesure, les
  emplacements vides invitent

Un point encore ouvert : **Alouette**, dont la mélodie n'a pas pu être vérifiée depuis le
conteneur de développement. Voir `docs/points-ouverts.md`.

Reste pour la phase 2 : zone parent complète (bibliothèque, import, export), PWA hors ligne,
persistance.

## Où regarder

- `CLAUDE.md` : le contrat de travail, à lire avant de coder
- `docs/cadrage.md` : le cadrage complet
- `docs/format-morceau.md` : le format des fichiers de `songs/`
- `docs/points-ouverts.md` : les décisions qui restent à prendre

## Structure

```
index.html            l'app
src/app.js            l'interaction : l'etat, le toucher, le glisser, les animations
src/app.css           la mise en page, feuille UNIQUE partagee avec la maquette
src/moteur.js         le graphe audio, l'horloge, les 13 canaux
src/echantillons.js   quelles notes existent, pour chaque instrument
src/format-morceau.js valide(morceau), partagé avec l'import de la phase 2
src/instruments.js    les 13 instruments : palette, table, sprite SVG
src/vendor/           Tone.js 15.1.22, copié tel quel, plus sa licence MIT
songs/                un JSON par morceau, plus index.json qui donne l'ordre
assets/samples/       les sons, 2,9 Mo pour les 13 instruments
assets/silence.mp3    le contournement du bouton silencieux d'iOS
scripts/              outillage (téléchargement des samples, extraction du kit)
test/                 bancs d'essai et maquettes, temporaires
docs/                 cadrage et spécifications
```

Modules ES natifs, aucune étape de compilation, aucune dépendance npm à l'exécution.

## Tester sur l'iPad

Le plus court, rien à lancer, ouvrir directement sur l'iPad :

```
https://symphony.kinefitlabs.com/            L'APP
https://symphony.kinefitlabs.com/test/       les bancs d'essai et les maquettes
```

L'app s'ouvre sur l'iPad **puis** sur l'iPhone : c'est la même page, elle bascule de mise en
page au point de rupture de 900 px. La scène est en demi-cercle en paysage, en grille 3x2 en
portrait.

Elle ne fait **aucun bruit avant le premier geste** : le contexte audio d'iOS ne démarre
qu'après un toucher, et le bouton silencieux de l'iPhone se contourne dans le même geste.
Toucher un instrument suffit à amorcer, le bouton de lecture montre le chargement des 13
instruments pendant les premières secondes.

Les crédits des banques de sons sont derrière un **appui long de 2 s sur l'engrenage**.

En `https://`, le certificat est émis depuis le 15 septembre 2026.

Le serveur local reste utile pour écouter une modification qui n'est pas encore poussée.
Sur le Mac, à la racine du dépôt :

```bash
git checkout main && git pull
ipconfig getifaddr en0
python3 -m http.server 8080 --bind 0.0.0.0
```

La deuxième commande affiche l'adresse du Mac sur le wifi. Si elle ne renvoie rien, le wifi
n'est pas sur `en0`, et celle-ci trouve la bonne interface toute seule :

```bash
ipconfig getifaddr "$(route -n get default | awk '/interface:/{print $2}')"
```

Sur l'iPad, même wifi : `http://<adresse-affichee>:8080/test/phase0.html`

Les deux bancs audio (`test/phase1.html` et `test/phase0.html`) ne font aucun bruit avant
l'appui sur « Demarrer l'audio ». Un bandeau de diagnostic y est affiché en permanence, c'est
lui qu'il faut recopier si le son ne sort pas. Les maquettes et le test SVG ne font jamais de
son : ils n'ont pas d'audio du tout.

Le dossier `test/` est temporaire. Il disparaîtra quand l'app aura sa propre interface, en
phase 1 ou 2.

## Outillage

```bash
bash scripts/fetch-samples.sh      # les notes des instruments mélodiques, curl seul
bash scripts/fetch-percussion.sh   # les 9 frappes, extraites du .sf2, demande ffmpeg
```

Le premier est relançable sans rien installer. Le second n'a pas à être relancé : ses 9
fichiers sont déjà dans le dépôt, il est là pour documenter leur provenance. Vérifié, il les
reproduit au bit près.

## Déploiement

GitHub Pages sert la branche `main` à la racine. Toute mise en ligne passe donc par une
fusion vers `main`, le développement se fait sur une branche.

État au 15 septembre 2026 :

- DNS correct, `symphony` pointe sur `tieurk.github.io`
- domaine enregistré côté Pages, certificat TLS émis, le site répond en `HTTP/2 200`
- reste à cocher « Enforce HTTPS » dans les réglages Pages

Attention, toute action dans l'interface web de GitHub écrit un commit **directement sur
`main`** et fait diverger la branche de travail. Voir `CLAUDE.md`, section Déploiement.

## Licences

Code sous licence MIT. Les banques de sons ont leurs propres licences, créditées dans la
page « à propos » de l'app :

- **FluidR3_GM** (les 11 instruments mélodiques via le projet `midi-js-soundfonts`, la
  batterie et les cymbales extraites du `.sf2`), Creative Commons Attribution 3.0
- **Tone.js** 15.1.22, licence MIT, copié dans `src/vendor/`

La percussion vient de la même banque que les instruments mélodiques, donc **un seul crédit
couvre toute la banque de sons** : FluidR3_GM, Creative Commons Attribution 3.0.
