# Points ouverts

À trancher avec Mathieu. Les réponses vont dans `CLAUDE.md`, pas ici.

## À trancher en phase 0

### 1. Les illustrations. Test SVG livré, en attente de jugement.

SVG dessinés en code, ou images générées puis détourées. Les 13 instruments, plus la scène
et l'icône.

Mathieu a demandé à voir un test SVG avant de trancher. Livré : `test/svg.html`, quatre
instruments dessinés en code, choisis pour couvrir l'éventail de difficulté.

| Instrument | Famille | Ce qu'il teste |
|---|---|---|
| Violon | Cordes | la taille de guêpe, qui distingue un violon d'une guitare |
| Tuba | Cuivres | le cas le plus dur, pavillon évasé et tube enroulé |
| Xylophone | Claviers | le cas facile, purement géométrique |
| Batterie | Percussions | le multi-objet, quatre fûts et une cymbale |

Chacun est montré à 64, 96 et 140 px (64 px est la cible tactile minimale du cahier des
charges), puis en jeton de réserve sur le bleu nuit, puis sur la scène en bois clair avec
les rideaux rouges. Un seul jeu de symboles SVG, teinté par famille en CSS via des variables
qui traversent le shadow tree de `<use>`. C'est le mécanisme que l'app utiliserait.

Deux passes de correction ont été nécessaires, et c'est instructif : **le tuba de la
première version lisait comme un cor**, pavillon trop petit et boucle trop serrée. Ce qui
fait un tuba pour un enfant, c'est un pavillon énorme tourné vers le haut. Le violon a
gagné les pointes de sa taille, sans quoi il lisait « ukulélé ». Le xylophone n'occupait que
la moitié de la hauteur de sa boîte, donc il gaspillait la cible tactile.

Les trois questions posées à Mathieu, dans l'ordre d'importance :

1. **Un enfant de 6 ans reconnaît-il les quatre à 64 px, sans étiquette ?** Si oui, les neuf
   autres se dessinent de la même main. Si non, il faut passer aux images générées puis
   détourées, et il faudra les produire, les détourer et les optimiser.
2. La palette des six familles tient-elle ensemble, et tient-elle sur le bois clair de la
   scène autant que sur le bleu nuit ?
3. Le style à plat, sans dégradé ni contour, est-il trop sec pour des enfants de 6 et 8 ans ?

Palette provisoire, à valider avec le reste : cordes `#E2724A`, bois `#63C88A`, cuivres
`#F4C844`, claviers `#6FB3D8`, vent `#B98BD9`, percussions `#E05C5C`.

**Contradiction du cadrage à trancher au passage** : la section 8 annonce cinq familles
(cordes, bois, cuivres, claviers, percussions), le tableau de la section 6 en utilise six,
avec l'accordéon seul dans « Vent ». Soit six couleurs, soit l'accordéon rejoint les bois.
Ça change une couleur, pas l'architecture.

Une dernière chose que je n'ai pas faite et qui viendra si le style est validé :
l'équilibrage optique entre les 13. Un violon est naturellement étroit et une batterie
large, donc à taille de boîte égale ils ne pèsent pas pareil à l'oeil. Ça se règle instrument
par instrument, et ça ne se juge qu'une fois les 13 côte à côte.

## À trancher avant la phase 2

2. **Import MIDI.** Confirmer que le bouton Importer accepte aussi les fichiers `.mid` avec écran de correspondance des pistes, ou seulement les fichiers au format du projet.

3. **Accès à la zone parent.** Appui long de 2 s sur l'engrenage, ou un autre geste.

## À trancher avant la phase 3

4. **Les trois remplacements** dans la liste des 15 morceaux du jouet : The Wheels on the Bus (encore protégé en Europe), Alphabet Song (même mélodie qu'Ah ! vous dirai-je maman), Come Little Leaves (statut à vérifier). Voir `docs/cadrage.md` section 7.4.
5. **La deuxième série de morceaux.** Voir `docs/cadrage.md` section 7.5.

## Tranché en phase 0

### Kit de percussion : la banque du FluidR3_GM. Tranché à l'écoute le 15 septembre 2026.

Trois candidats rapatriés, ramenés au même format et au même niveau de crête (mono
44 100 Hz, pic à -1 dBFS) pour que la comparaison porte sur le timbre et pas sur le volume,
puis comparés frappe par frappe et en contexte sur `test/phase0.html`.

| | **FluidR3_GM, retenu** | Virtuosity Drums | VCSL |
|---|---|---|---|
| Licence | CC-BY 3.0, déjà créditée | CC0 1.0 | CC0 1.0 |
| Nature | même banque que l'orchestre | vrai kit acoustique, club de jazz | percussion d'orchestre |
| Couverture des 9 frappes | **9 en direct** | 8, pas de tom médium | 6, aucun ride |
| Poids | 1,2 Mo | 1,6 Mo | 1,6 Mo |

**Ce que Mathieu a entendu :** « les instruments sont plus compressés sur FluidR3, sur
Virtuosity il y a plus d'écho, VCSL est entre deux ». Les temps de chute à -30 dB du kick le
confirment au chiffre près : **130 ms** pour FluidR3, 340 ms pour VCSL, 430 ms pour
Virtuosity. Et FluidR3 est 5,2 dB plus bas entre 0 et 120 Hz, ce qui est littéralement le
« plus compressé ».

**Pourquoi il l'a préféré, et pourquoi ma proposition était mauvaise.** Je recommandais
Virtuosity, pour sa licence CC0 franche et sa vraie prise de son. C'est passé à côté de
l'essentiel : les 11 instruments mélodiques sont des rendus de soundfont, plutôt secs. Un
kit enregistré en salle sonne étranger à côté. Le kit qui vient de la même banque se marie,
et c'est ce qui compte dans un arrangement. Bonus, une seule licence et un seul crédit
couvrent maintenant toute la banque de sons.

Ce qui a failli faire rater la décision : le motif de batterie de la page de test ne jouait
que 4 des 9 frappes, dominé par les deux moins discriminantes (snare 1,2 x d'écart entre
kits, charley 1,5 x), et ne jouait jamais les trois plus discriminantes (tom_bas 3,2 x,
ride 2,6 x). À la première écoute les trois kits semblaient identiques. Leçon retenue pour
la suite : **un banc d'essai qui n'expose pas tout ne prouve rien.**

Réserve à connaître : la note 46 du General MIDI s'appelle « Open Hi-Hat » mais
l'échantillon que FluidR3 y place est un charley à demi ouvert.

Niveau des cymbales, à valider : réglé à -10 dB, de ma main, jamais validé. Mesuré, elles
sont au même niveau que la batterie quand on les écoute seules (0,3 dB d'écart) et
n'ajoutent que 0,4 dB au mix complet, donc elles sont masquées plutôt que trop basses.
C'est l'oreille de Mathieu qui tranchera, en phase 4.

### Nom affiché aux enfants : « Mon premier orchestre ». Tranché le 15 septembre 2026.

Le dépôt et le sous-domaine restent `symphony`, ce sont deux choses différentes. Le cadrage
proposait « Mon Orchestre », « Maestro ! », « La Fosse » et « Symphonie de poche ».

### Ordre de travail : la maquette fixe d'abord. Tranché le 15 septembre 2026.

Les deux mises en page produites en fixe pour validation, puis la tranche verticale. C'est
l'inverse de ce que je recommandais (partir directement sur la tranche verticale avec des
visuels provisoires, puisque le moteur audio est déjà debout et validé à l'oreille). Décision
de Mathieu, c'est son projet.

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
  renvoyait l'erreur 60. Cause identifiée, GitHub n'avait pas revérifié le DNS. Débloqué par
  la manipulation des réglages Pages le 14 septembre à 05h18 UTC, qui a laissé deux commits
  `CNAME` sur `main`. **Certificat émis, vérifié le 15 septembre :
  `https://symphony.kinefitlabs.com/test/phase0.html` répond `HTTP/2 200`.** Reste à cocher
  « Enforce HTTPS » dans les réglages Pages, seul point encore ouvert de la chaîne.
