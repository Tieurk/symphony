# Symphony

Orchestre interactif pour enfants, en PWA. On pose des instruments sur la scène, l'arrangement du morceau se transforme en direct.

Le nom affiché aux enfants est **Mon premier orchestre**. `symphony` reste le nom du dépôt
et du sous-domaine.

En ligne : https://symphony.kinefitlabs.com

## État

Phase 1, premier batch. L'app n'a pas encore son interface au toucher, mais **le moteur audio
est complet et les trois morceaux se jouent**.

Fait en phase 0 : le son sort sur iOS, la percussion est choisie (FluidR3_GM), le déploiement
fonctionne en HTTPS, le nom est choisi, les 13 illustrations et les deux maquettes sont
livrées.

Fait en phase 1 : le moteur dans `src/`, les 13 instruments échantillonnés (2,9 Mo), trois
morceaux en 13 parties pleines, et un validateur de format partagé avec l'import de la phase 2.

Livré, en attente du jugement de Mathieu :

- **les trois arrangements**, à écouter sur `test/phase1.html`. C'est le seul risque qu'aucune
  mesure ne peut lever : aucun modèle n'entend le résultat
- **les 13 instruments en SVG**, source unique `src/instruments.js`, à juger sur
  `test/svg.html`. Le vrai critère est la section 2, les six paires à risque de confusion
  côte à côte à 64 px
- **les deux mises en page en fixe**, `test/maquette.html` en plein écran et
  `test/maquettes.html` pour les voir côte à côte

Reste à faire : l'interface au toucher, sur la maquette validée. Et Alouette, dont la mélodie
n'a pas pu être vérifiée depuis ce conteneur, voir `docs/points-ouverts.md`.

## Où regarder

- `CLAUDE.md` : le contrat de travail, à lire avant de coder
- `docs/cadrage.md` : le cadrage complet
- `docs/format-morceau.md` : le format des fichiers de `songs/`
- `docs/points-ouverts.md` : les décisions qui restent à prendre

## Structure

```
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
https://symphony.kinefitlabs.com/                      le sommaire, tous les liens
https://symphony.kinefitlabs.com/test/phase1.html      le banc d'ecoute, moteur et morceaux
https://symphony.kinefitlabs.com/test/maquette.html    la maquette, en plein ecran
https://symphony.kinefitlabs.com/test/maquettes.html   les deux mises en page cote a cote
https://symphony.kinefitlabs.com/test/svg.html         les 13 instruments en SVG
https://symphony.kinefitlabs.com/test/phase0.html      l'ancien banc audio, pour la non-regression
```

`maquette.html` s'ouvre sur l'iPad **puis** sur l'iPhone : c'est la même page, elle bascule
de mise en page au point de rupture de 900 px.

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

Les deux bancs audio (`phase1.html` et `phase0.html`) ne font aucun bruit avant l'appui sur
« Demarrer l'audio » : le contexte audio d'iOS ne démarre qu'après un geste. Un bandeau de
diagnostic est affiché en permanence, c'est lui qu'il faut recopier si le son ne sort pas. Les
maquettes et le test SVG, eux, ne font jamais de son : ils n'ont pas d'audio du tout.

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
