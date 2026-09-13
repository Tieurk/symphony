# Format d'un morceau

Un morceau est un fichier JSON dans `songs/`. C'est le contrat entre les morceaux écrits à la main, l'import depuis l'appareil et le moteur audio. Le changer impose de mettre à jour les deux côtés.

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

- `t` : position en notation Tone.js `mesure:temps:doubles-croches`, à partir de `0:0:0`
- `note` : notation anglo-saxonne avec octave, `C4` pour le do du milieu
- `duree` : notation Tone.js, `1n` ronde, `2n` blanche, `4n` noire, `8n` croche, `16n` double, `4n.` noire pointée, `8t` croche de triolet
- `vel` : vélocité entre 0 et 1, sert les nuances
- `frappe` : remplace `note` pour la batterie et les cymbales

## Frappes autorisées

Batterie : `kick`, `snare`, `tom_bas`, `tom_med`, `tom_haut`
Cymbales : `charley`, `charley_ouvert`, `crash`, `ride`

## Règle de fond

Chaque instrument garde le même rôle d'un morceau à l'autre pour que n'importe quel sous-ensemble de 1 à 6 instruments sonne juste. Le tableau des rôles est dans `CLAUDE.md`.
