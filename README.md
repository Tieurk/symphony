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

Rien n'est joignable depuis l'iPad sans un serveur lancé sur le Mac, sur le même wifi.
Trois commandes, à coller dans le Terminal depuis la racine du dépôt :

```bash
git fetch origin && git checkout claude/inspiring-hopper-qs9ops
ipconfig getifaddr en0
python3 -m http.server 8080 --bind 0.0.0.0
```

La deuxième affiche l'adresse du Mac sur le wifi (`en0` c'est le wifi, `en1` si c'est du
câble). Sur l'iPad, ouvrir :

```
http://<adresse-affichee>:8080/test/phase0.html
```

La page ne fait aucun bruit avant l'appui sur « Demarrer l'audio » : le contexte audio
d'iOS ne démarre qu'après un geste. Un bandeau de diagnostic est affiché en permanence,
c'est lui qu'il faut recopier si le son ne sort pas.

## Outillage

```bash
bash scripts/fetch-samples.sh   # les notes des instruments mélodiques, curl seul
bash scripts/fetch-kits.sh      # les trois kits candidats, demande ffmpeg
```

Le premier est relançable sans rien installer. Le second n'a pas à être relancé : ses 27
fichiers sont déjà dans le dépôt, il est là pour documenter leur provenance.

## Licences

Code sous licence MIT. Les banques de sons ont leurs propres licences, créditées dans la
page « à propos » de l'app :

- **FluidR3_GM** (instruments mélodiques), Creative Commons Attribution 3.0, via le projet
  `midi-js-soundfonts`
- **Tone.js** 15.1.22, licence MIT, copié dans `src/vendor/`
- Kits de percussion candidats, en attente de décision : **Virtuosity Drums** (Versilian
  Studios et Karoryfer Samples, CC0 1.0), **VCSL** (Versilian Studios, CC0 1.0), et la
  banque de percussion de **FluidR3_GM** (CC-BY 3.0)
