# Symphony

Orchestre interactif pour enfants, en PWA. On pose des instruments sur la scène, l'arrangement du morceau se transforme en direct.

En ligne : https://symphony.kinefitlabs.com

## État

Phase 0 en cours. Pas encore d'app : ce qui existe est de l'outillage et une page de test
audio, `test/phase0.html`, à ouvrir sur un iPad pour valider la sortie son sous iOS et
choisir le kit de percussion à l'oreille.

## Où regarder

- `CLAUDE.md` : le contrat de travail, à lire avant de coder
- `docs/cadrage.md` : le cadrage complet
- `docs/format-morceau.md` : le format des fichiers de `songs/`
- `docs/points-ouverts.md` : les décisions qui restent à prendre

## Structure

```
src/       le code de l'app (modules ES natifs, pas de build)
src/vendor/  Tone.js 15.1.22, copié tel quel, plus sa licence MIT
songs/     un fichier JSON par morceau
assets/    samples/ les sons, img/ les illustrations
scripts/   outillage (téléchargement des samples, etc.)
test/      page de test de phase 0 et kits de percussion candidats, temporaire
docs/      cadrage et spécifications
```

## Tester sur l'iPad

Le plus court, rien à lancer, ouvrir directement sur l'iPad :

```
http://symphony.kinefitlabs.com/test/phase0.html
```

En `http://` et pas en `https://` pour l'instant : le certificat du domaine n'est pas
encore émis, voir la section Déploiement. Web Audio n'a pas besoin d'un contexte sécurisé,
donc le son sort quand même.

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

Dans les deux cas, la page ne fait aucun bruit avant l'appui sur « Demarrer l'audio » : le
contexte audio d'iOS ne démarre qu'après un geste. Un bandeau de diagnostic est affiché en
permanence, c'est lui qu'il faut recopier si le son ne sort pas.

Le dossier `test/` est temporaire. Il disparaît quand le kit de percussion est choisi : le
kit retenu migre vers `assets/samples/`, les deux autres et la page de test sont
supprimés.

## Outillage

```bash
bash scripts/fetch-samples.sh   # les notes des instruments mélodiques, curl seul
bash scripts/fetch-kits.sh      # les trois kits candidats, demande ffmpeg
```

Le premier est relançable sans rien installer. Le second n'a pas à être relancé : ses 27
fichiers sont déjà dans le dépôt, il est là pour documenter leur provenance.

## Déploiement

GitHub Pages sert la branche `main` à la racine. Toute mise en ligne passe donc par une
fusion vers `main`, le développement se fait sur une branche.

État au 14 septembre 2026 :

- DNS correct, `symphony` pointe sur `tieurk.github.io`
- domaine bien enregistré côté Pages, le site répond en `http://`
- **certificat TLS pas encore émis**, donc `https://` échoue et « Enforce HTTPS » est
  inactive. Sans conséquence pour l'écoute, mais bloquant avant la phase 2 : l'installation
  sur l'écran d'accueil et le service worker exigent HTTPS

## Licences

Code sous licence MIT. Les banques de sons ont leurs propres licences, créditées dans la
page « à propos » de l'app :

- **FluidR3_GM** (instruments mélodiques), Creative Commons Attribution 3.0, via le projet
  `midi-js-soundfonts`
- **Tone.js** 15.1.22, licence MIT, copié dans `src/vendor/`
- Kits de percussion candidats, en attente de décision : **Virtuosity Drums** (Versilian
  Studios et Karoryfer Samples, CC0 1.0), **VCSL** (Versilian Studios, CC0 1.0), et la
  banque de percussion de **FluidR3_GM** (CC-BY 3.0)
