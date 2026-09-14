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
| Sons | Instruments échantillonnés, pas de synthèse pure |
| Moteur | Tone.js, copié dans `src/vendor/` |
| Orientation | Adaptative : paysage sur iPad et Mac, portrait sur iPhone |
| Scène | 6 emplacements maximum, 13 instruments en réserve |
| Hébergement | GitHub Pages sur `symphony.kinefitlabs.com` |
| Morceaux | Fichiers JSON dans `songs/`, plus import local depuis l'appareil |

## Architecture audio

C'est le coeur du projet. À lire deux fois.

Une horloge unique, le `Tone.Transport`, fait tourner le morceau en boucle. Au chargement d'un morceau, **les 13 parties sont programmées d'un coup** sur cette horloge, avec un `Tone.Part` par instrument. Elles tournent toutes en permanence, y compris celles des instruments restés en réserve.

Poser un instrument sur la scène **ne lance rien**. Ça ouvre son canal : le gain passe de 0 à son niveau de mixage. Le retirer referme le canal. C'est ce qui garantit que tout reste calé à la note près quel que soit le moment où l'enfant agit. Ne jamais démarrer ou arrêter une partie individuelle pour gérer l'audibilité.

Chaîne par instrument : `Tone.Sampler` vers `Tone.Gain` (le mute) vers `Tone.Gain` (le niveau de mixage du morceau) vers le bus général.

Scène vide, aucun son : les 13 canaux sont fermés, l'horloge continue de tourner.

Transition de mute : une rampe très courte (5 à 10 ms) pour éviter le clic, pas un saut brutal ni un fondu long qui ferait rater l'attaque.

**Mesuré en phase 0 :** la rampe de 8 ms fait son travail, le gain atteint zéro en 11 ms. Mais le son ne s'arrête que 125 ms après l'appui, parce que `Tone.getContext().lookAhead` vaut 0,1 s par défaut en mode `interactive`. La réaction perçue à un geste est donc d'environ 110 ms, pas de 8. Descendre `lookAhead` accélère la réaction au prix d'un risque d'accrocs audio sur les appareils faibles. À trancher à la main sur l'iPad, pas à l'aveugle.

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

**La percussion vient d'ailleurs.** Ce dépôt ne rend que les 128 programmes mélodiques : vérifié le 13 septembre 2026, `percussion-mp3/`, `drums-mp3/` et `standard_kit-mp3/` renvoient 404. Batterie et cymbales ont donc besoin d'une source séparée, un kit en CC0 ou en CC-BY (`docs/cadrage.md` section 10 admet les deux). Ne pas se rabattre sur `taiko_drum` ou `synth_drum` comme substituts, ce ne sont pas des kits.

Trois candidats sont rapatriés dans `test/kits/` et comparés à l'écoute sur `test/phase0.html`. Le tableau et les réserves de chacun sont dans `docs/points-ouverts.md`. Décision en attente de l'oreille de Mathieu.

**Convention de nommage, confirmée fichier par fichier le 13 septembre 2026.** Lettre majuscule, bémol en `b` minuscule, numéro d'octave, extension `.mp3` : `C4.mp3`, `Db4.mp3`, `Bb3.mp3`. Les dièses n'existent pas, `Cs4.mp3` et `C#4.mp3` renvoient 404. 88 notes par instrument, de `A0` à `C8`, chromatique. MP3 stéréo 44 100 Hz à débit variable, 3,16 s par note quel que soit l'instrument, 25 Ko au maximum.

`scripts/fetch-samples.sh` rapatrie uniquement les notes retenues dans `assets/samples/<instrument>/`. Ne prends pas toutes les notes : 4 à 6 par instrument suffisent au `Tone.Sampler`, qui transpose le reste. C'est ce qui garde le poids total sous 10 Mo.

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

## Interface

Trois zones : contrôles en haut (sélecteur de morceau, play/pause, tempo, volume), scène au centre (6 emplacements), réserve autour en paysage et en dessous en portrait.

- Deux gestes équivalents : le clic ou le toucher simple envoie vers la scène ou en ramène, le glisser-déposer fait la même chose. Les deux doivent marcher.
- Scène pleine : l'instrument touché tremble, les 6 emplacements clignotent une fois. Pas de remplacement automatique.
- Glisser sur un emplacement occupé : échange.
- Changement de morceau : les instruments restent en place, le nouveau morceau repart du début dans le même état de lecture.
- Tempo de 60 % à 140 %, aimanté sur trois repères illustrés.
- Cibles tactiles de 64 px minimum. Aucun texte nécessaire pour jouer.
- Zone parent derrière un appui long de 2 s sur un engrenage : bibliothèque, import, export, licences.

## Pièges iOS, à traiter en phase 1

1. Le contexte audio ne démarre qu'après un geste utilisateur. `Tone.start()` dans le gestionnaire du bouton Play, pas au chargement.
2. Le bouton silencieux de l'iPhone coupe l'audio web par défaut. Contournement connu par un élément audio silencieux qui bascule la session. À tester tôt, c'est bloquant si ça échoue.
3. Le verrouillage de l'écran arrête la musique. Acceptable, ne pas chercher à contourner.
4. Les données d'une PWA installée sur l'écran d'accueil persistent ; celles d'un simple onglet Safari peuvent être purgées après sept jours. D'où l'importance d'installer.
5. Tester sur l'iPad réel, pas dans le simulateur responsive de Safari sur Mac.

## Déploiement

GitHub Pages, branche `main`, racine. Le fichier `CNAME` à la racine porte `symphony.kinefitlabs.com`, GitHub le lit tout seul.

Côté DNS, un enregistrement CNAME `symphony` vers `<utilisateur>.github.io`. Le domaine `kinefitlabs.com` est déjà utilisé pour `app.kinefitlabs.com`, qui pointe vers Clever Cloud : aucun conflit, ce sont deux sous-domaines indépendants.

Une fois le certificat émis, cocher « Enforce HTTPS » dans les réglages Pages.

**Conséquence de méthode :** Pages ne sert que `main`. Le développement se fait sur une
branche, et toute mise en ligne passe par une fusion vers `main`. Ne jamais fusionner sans
que Mathieu l'ait demandé explicitement.

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

- **Phase 0** : choix du kit de percussion, écoute comparée des timbres, maquette fixe des deux mises en page, chaîne de déploiement vérifiée de bout en bout.
- **Phase 1** : tranche verticale. Moteur audio complet, trois morceaux (Ah ! vous dirai-je maman, Alouette, Row Your Boat), scène et réserve au toucher, visuels provisoires, testée sur l'iPad. Objectif : valider la sensation de jeu avec les enfants avant d'aller plus loin.
- **Phase 2** : mise en page adaptative, glisser-déposer, animations, illustrations finales, zone parent, import et export, PWA hors ligne.
- **Phase 3** : le reste de la bibliothèque.
- **Phase 4** : réglage des mixages morceau par morceau, retours des enfants.

Chaque phase se termine par une version en ligne testable.

## Interdits

- Ne pas partir d'un MP3 de morceau complet : l'app joue des partitions instrument par instrument.
- Ne pas démarrer ou arrêter les parties pour gérer l'audibilité (voir Architecture audio).
- Ne pas charger les 128 instruments General MIDI, seulement les 13.
- Ne pas ajouter d'emoji dans l'interface finale, le rendu varie selon les appareils.
- Ne pas introduire d'outil de build, de bundler ou de dépendance npm à l'exécution.
