# Symphony

Orchestre interactif pour enfants, en PWA. On pose des instruments sur la scène, l'arrangement du morceau se transforme en direct.

En ligne : https://symphony.kinefitlabs.com

## État

Phase 0. Cadrage terminé, code pas encore commencé.

## Où regarder

- `CLAUDE.md` : le contrat de travail, à lire avant de coder
- `docs/cadrage.md` : le cadrage complet
- `docs/format-morceau.md` : le format des fichiers de `songs/`
- `docs/points-ouverts.md` : les décisions qui restent à prendre

## Structure

```
src/       le code de l'app (modules ES natifs, pas de build)
songs/     un fichier JSON par morceau
assets/    samples/ les sons, img/ les illustrations
scripts/   outillage (téléchargement des samples, etc.)
docs/      cadrage et spécifications
```

## Lancer en local

Un serveur statique suffit. Pour tester depuis l'iPad sur le même wifi :

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Puis ouvrir `http://<ip-du-mac>:8080` sur l'iPad.

## Licences

Code sous licence MIT. Les banques de sons ont leurs propres licences, créditées dans la page « à propos » de l'app.
