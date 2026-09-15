# Points ouverts

À trancher avec Mathieu. Les réponses vont dans `CLAUDE.md`, pas ici.

## À trancher en phase 0

### 1. Kit de percussion. Trois candidats rapatriés, en attente d'écoute.

Le soundfont retenu pour les instruments mélodiques ne couvre pas la batterie. Trois kits
sont rapatriés dans `test/kits/`, ramenés au même format et au même niveau de crête (mono
44 100 Hz, pic à -1 dBFS), et comparables frappe par frappe sur `test/phase0.html`.

| | Virtuosity Drums | VCSL | FluidR3_GM |
|---|---|---|---|
| Licence | CC0 1.0 | CC0 1.0 | CC-BY 3.0, déjà créditée |
| Nature | vrai kit acoustique, baguettes, club de jazz | percussion d'orchestre | banque de soundfont |
| Couverture des 9 frappes | 8 en direct | 6 en direct | 9 en direct |
| Cohérence avec l'orchestre | prise de salle, à confronter | prise de salle | identique, même banque |
| Poids des 9 frappes | 1,6 Mo | 1,6 Mo | 1,2 Mo |

Réserves, toutes affichées sous les pads concernés dans la page de test :

- **Virtuosity** n'a que deux toms, `tom_med` est le tom haut transposé de trois demi-tons.
- **VCSL** n'a aucun ride (la cymbale suspendue en tient lieu), sa grosse caisse et sa
  caisse claire sont d'orchestre, son crash est une paire de cymbales frappées, et il n'a
  que deux toms lui aussi.
- **FluidR3** mappe la note 46 (charley ouvert du General MIDI) sur un échantillon de
  charley à demi ouvert.

**Proposition retenue : Virtuosity Drums.** Licence CC0 franche, comme le demandait le
contrat de travail au départ. La batterie est l'instrument le plus exposé d'un arrangement
d'enfant, c'est là qu'une vraie prise de son se paie le mieux. Et le tom manquant se règle
en une ligne.

**Le seul vrai risque est inaudible pour moi :** un kit enregistré en salle, posé à côté
d'instruments mélodiques de soundfont plutôt secs, peut ne pas se marier. La zone 3 de la
page de test existe pour ça, avec les quatre premières mesures d'« Ah ! vous dirai-je,
maman » en violon, tuba et batterie, et une bascule de kit à chaud.

Procédure :

1. Lancer le serveur local, ouvrir `test/phase0.html` sur l'iPad (voir le README).
2. Zone 2, bouton « La même frappe sur les trois kits », frappe par frappe.
3. Zone 3, lancer la boucle, ouvrir les trois instruments, basculer de kit en écoutant.
4. Dire lequel. Les deux autres dossiers et `scripts/fetch-kits.sh` disparaissent alors, et
   le kit retenu migre de `test/kits/` vers `assets/samples/batterie/` et `.../cymbales/`.

Cymbales : `crash`, `ride`, `charley` et `charley_ouvert` viendront du même kit que la
batterie, pour ne pas mélanger deux prises de son dans une même scène.

### 2. Le nom de l'app.

« Symphony » est le nom du dépôt et du sous-domaine, pas forcément celui affiché aux
enfants. Pistes : Mon Orchestre, Maestro !, La Fosse, Symphonie de poche.

### 3. Les illustrations.

SVG dessinés en code, ou images générées puis détourées. Les 13 instruments, plus la scène
et l'icône.

### 4. Maquette avant code.

Produire les deux mises en page en fixe pour validation, ou partir directement sur la
tranche verticale avec des visuels provisoires.

## À trancher avant la phase 2

5. **Import MIDI.** Confirmer que le bouton Importer accepte aussi les fichiers `.mid` avec écran de correspondance des pistes, ou seulement les fichiers au format du projet.
6. **Accès à la zone parent.** Appui long de 2 s sur l'engrenage, ou un autre geste.

## À trancher avant la phase 3

7. **Les trois remplacements** dans la liste des 15 morceaux du jouet : The Wheels on the Bus (encore protégé en Europe), Alphabet Song (même mélodie qu'Ah ! vous dirai-je maman), Come Little Leaves (statut à vérifier). Voir `docs/cadrage.md` section 7.4.
8. **La deuxième série de morceaux.** Voir `docs/cadrage.md` section 7.5.

## Tranché en phase 0

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
  renvoie l'erreur 60, et « Enforce HTTPS » est donc inactive. Cause identifiée, GitHub n'a
  pas revérifié le DNS. Marche à suivre dans `CLAUDE.md`, section Déploiement, elle passe
  par l'interface web donc elle est à Mathieu. Sans conséquence pour l'écoute, bloquant
  avant la phase 2. La manipulation a été faite le 14 septembre à 05h18 UTC (deux commits
  `CNAME` de GitHub sur `main`, vérifiés), il reste à relire la réponse HTTPS et à cocher
  « Enforce HTTPS ».
