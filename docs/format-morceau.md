# Format d'un morceau

Un morceau est un fichier JSON dans `songs/`. C'est le contrat entre les morceaux écrits à la main, l'import depuis l'appareil et le moteur audio. Le changer impose de mettre à jour les deux côtés.

**Ce contrat est vérifié par du code**, pas seulement par la relecture : `src/format-morceau.js` exporte `valide(morceau)`, qui rend la liste de ce qui cloche sans jamais lever d'exception. Le banc d'écoute `test/phase1.html` l'exécute sur les trois morceaux du dépôt et affiche son verdict, et l'import de la phase 2 l'exécutera sur le fichier choisi. Un seul validateur, deux usages.

## L'index de la bibliothèque

Une page web ne peut pas lister un dossier. `songs/index.json` donne donc la liste des morceaux, dans l'ordre d'affichage du sélecteur :

```json
{ "morceaux": ["ah-vous-dirai-je-maman", "row-your-boat", "frere-jacques"] }
```

Ajouter un morceau au dépôt, c'est donc deux gestes : poser le fichier `songs/<id>.json` et ajouter son `id` à cette liste. En phase 2, la zone parent réordonnera cette liste.

## Exemple commenté

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
      { "t": "0:0:0", "note": "C4", "duree": "4n", "vel": 0.8 },
      { "t": "0:1:0", "note": "C4", "duree": "4n", "vel": 0.7 },
      { "t": "0:2:0", "note": "G4", "duree": "4n", "vel": 0.8 }
    ],
    "tuba": [
      { "t": "0:0:0", "note": "C2", "duree": "2n", "vel": 0.9 }
    ],
    "batterie": [
      { "t": "0:0:0", "frappe": "kick", "vel": 0.9 },
      { "t": "0:1:0", "frappe": "snare", "vel": 0.7 }
    ],
    "flute": [], "trompette": [], "clarinette": [], "xylophone": [],
    "piano": [], "guitare": [], "accordeon": [], "koto": [],
    "sitar": [], "cymbales": []
  }
}
```

## Champs

| Champ | Rôle |
|---|---|
| `id` | Identifiant en minuscules sans accent, sert de nom de fichier |
| `titre` | Affiché dans le sélecteur |
| `compositeur`, `source` | Affichés dans la page « à propos », servent à tracer les droits |
| `couleur` | Couleur de la vignette du morceau |
| `bpm` | Tempo d'origine, celui du repère « normal » du curseur |
| `mesure` | Signature rythmique, `4/4`, `3/4`, `6/8` |
| `longueur` | Longueur de la boucle en mesures, typiquement 8 à 16 |
| `mix` | Niveau en décibels par instrument, valeurs négatives, 0 par défaut |
| `parties` | Les 13 clés, toujours présentes, éventuellement vides |

## Les 13 clés de `parties`

`violon`, `guitare`, `koto`, `sitar`, `trompette`, `tuba`, `flute`, `clarinette`, `accordeon`, `xylophone`, `piano`, `batterie`, `cymbales`

Sans accent ni majuscule, ce sont des clés techniques.

## Notation

- `t` : position en notation Tone.js `mesure:temps:doubles-croches`, à partir de `0:0:0`. **Un « temps » est une noire, toujours**, quelle que soit la signature, voir le piège des mesures composées plus bas
- `note` : notation anglo-saxonne avec octave, `C4` pour le do du milieu
- `duree` : notation Tone.js, `1n` ronde, `2n` blanche, `4n` noire, `8n` croche, `16n` double, `4n.` noire pointée, `8t` croche de triolet
- `vel` : vélocité entre 0 et 1, sert les nuances
- `frappe` : remplace `note` pour la batterie et les cymbales

## Frappes autorisées

Batterie : `kick`, `snare`, `tom_bas`, `tom_med`, `tom_haut`
Cymbales : `charley`, `charley_ouvert`, `crash`, `ride`

## Piège des mesures composées

**Tone compte en noires, pas en unités de la signature.** Il ramène `[n, d]` à `n / (d / 4)` : une mesure de **6/8 vaut donc 3 temps, pas 6**. Les positions se notent en noires et en doubles-croches, jamais en croches de 6/8.

Concrètement, pour les six croches d'une mesure de 6/8 :

```
0:0:0   0:0:2   0:1:0   0:1:2   0:2:0   0:2:2
```

Et le `bpm` d'un morceau en 6/8 reste un tempo **à la noire**. Pour une noire pointée à 75 à la minute, le `bpm` vaut 112.

Corollaire : `longueur` est un nombre de mesures, pas de temps. Le moteur en déduit la fin de boucle avec la notation `<longueur>m`, qui respecte la signature.

## Contraintes physiques des échantillons

Deux limites qui ne sont pas dans le format mais que le validateur signale, parce qu'elles s'entendent :

- **Aucune note ne doit dépasser 3,16 s**, la durée de l'échantillon. Il sonne jusqu'au bout, sans silence de queue : au delà, la note est coupée net. À 100 à la noire, une ronde tient (2,4 s), une note de plus de cinq temps est coupée.
- **Aucune note ne doit être à plus de 5 demi-tons du plus proche échantillon** de son instrument. Le `Tone.Sampler` transpose, mais au delà le timbre change : un violon transposé d'une octave ne sonne plus violon. Les notes réellement rapatriées sont dans `src/echantillons.js`.

## Règle de fond

Chaque instrument garde le même rôle d'un morceau à l'autre pour que n'importe quel sous-ensemble de 1 à 6 instruments sonne juste. Le tableau des rôles est dans `CLAUDE.md`.
