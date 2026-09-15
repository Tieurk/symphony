# Points ouverts

À trancher avec Mathieu. Les réponses vont dans `CLAUDE.md`, pas ici.

## À trancher en phase 0

### 1. Les illustrations. Les 13 livrés, en attente de jugement.

SVG dessinés en code, ou images générées puis détourées. Tu avais demandé à voir un test
avant de trancher : quatre instruments ont été livrés le 15 septembre, tu as dit d'avancer,
**les treize sont maintenant dessinés**. Page à ouvrir : `test/svg.html`.

Source unique, `src/instruments.js`. Un seul jeu de symboles, teinté par famille en CSS.
Une contrainte technique dicte cette forme et vaut d'être connue : un
`<use href="fichier.svg#id">` externe **ne reçoit pas les variables CSS du document hôte**,
dans aucun navigateur courant, parce que le contenu référencé vit dans un document séparé.
Un fichier `.svg` séparé rendrait donc la teinte par famille impossible. Le sprite est donc
injecté à l'exécution par un module ES, sans étape de compilation.

**Ce qui se juge, et ce n'est pas instrument par instrument.** Six paires posent un risque
de confusion, et chaque paire est formée de deux instruments de la même famille, donc de la
même couleur : seule la forme peut les séparer. Elles sont montrées côte à côte à 64 px dans
la section 2 de la page, sur les deux fonds de l'app.

| Paire | Ce qui les sépare, et c'est discutable |
|---|---|
| Flûte / clarinette | la flûte est **en biais**, la clarinette **debout avec son pavillon** |
| Trompette / tuba | pavillon **couché vers la droite** contre pavillon **debout vers le haut** |
| Guitare / violon | le violon a reçu un **archet**, voir plus bas |
| Cymbales / batterie | les cymbales n'ont **aucun fût**, rien que des disques sur pied |
| Piano / xylophone | le piano a un **clavier crème**, le xylophone des lames bleues dégressives |
| Guitare / sitar | la calebasse du sitar est un **disque plein**, ses chevilles sortent sur les côtés |

**L'archet du violon mérite une explication.** À 64 px, la rosace ronde de la guitare et la
taille de guêpe du violon ne suffisaient pas : deux caisses orange avec un manche. L'archet
change la **silhouette** au lieu du détail, le violon devient une croix et la guitare reste
un I, et aucun des douze autres n'a de bâton en travers. C'est la seule licence prise avec
le principe « un instrument, un objet ».

Trois dessins ont demandé plusieurs passes, et c'est instructif :

- **Le tuba** de la première version lisait comme un cor, pavillon trop petit et boucle trop
  serrée. Ce qui fait un tuba pour un enfant, c'est un pavillon énorme tourné vers le haut.
- **Le xylophone** a demandé trois versions. En lames debout de hauteur presque égale, il
  lisait comme un diagramme en barres. En vue de dessus avec un cadre plein, comme une pile
  d'assiettes, parce que le cadre sombre comblait les creux entre les lames. La version
  retenue a des rails fins et un écart franc : six lames redeviennent six objets.
- **La trompette** n'occupait que 55 % de la hauteur de sa boîte, la seule des 13 à gaspiller
  sa cible tactile. Agrandie, son pavillon lisait alors comme un gramophone : il a fallu le
  réduire et poser l'instrument en biais.

Ce que je peux affirmer, mesuré : les 13 remplissent leur boîte (aucun sous 72 % de la
hauteur disponible, mesuré par `getBBox` sur l'encre réelle), les six paires sont distinctes
à mes yeux sur les deux fonds, et la teinte par famille traverse bien l'injection du sprite
sur les 13. **Ce que je ne peux pas affirmer : qu'un enfant de 6 ans les reconnaît.** Le
verdict est à toi, et tu l'as déjà, les garçons sont là.

Les trois questions restent celles-ci, dans l'ordre d'importance :

1. **Un enfant de 6 ans reconnaît-il les treize à 64 px, sans étiquette ?** Si non, il faut
   passer aux images générées puis détourées, et il faudra les produire, les détourer et les
   optimiser.
2. La palette des six familles tient-elle ensemble, et tient-elle sur le bois clair de la
   scène autant que sur le bleu nuit ? Une chose vue en regardant les 13 sur le bois : **le
   jaune des cuivres est la couleur la plus proche du bois de la scène**, donc la moins
   contrastée des six. Lisible, mais c'est celle qui bougerait en premier.
3. Le style à plat, sans dégradé ni contour, est-il trop sec pour des enfants de 6 et 8 ans ?

Palette : cordes `#E2724A`, bois `#63C88A`, cuivres `#F4C844`, claviers `#6FB3D8`, vent
`#B98BD9`, percussions `#E05C5C`.

**Le koto est celui dont je suis le moins sûr**, et pas pour une raison de dessin : un enfant
de 6 ans ne connaît pas l'objet, il ne le nommera pas. Ce que je cherchais, c'est qu'il ne le
confonde avec rien d'autre, d'où la silhouette la plus singulière du lot, une longue table
posée en biais.

**Contradiction du cadrage, maintenant à trancher** : la section 8 annonce cinq familles
(cordes, bois, cuivres, claviers, percussions), le tableau de la section 6 en utilise six,
avec l'accordéon seul dans « Vent ». J'ai dessiné les six. Soit on les garde, soit
l'accordéon rejoint les bois. Ça change une couleur, pas l'architecture.

Reste à faire si le style est validé : l'équilibrage optique entre les 13. Un violon est
naturellement étroit et une batterie large, donc à taille de boîte égale ils ne pèsent pas
pareil à l'oeil. Ça se règle instrument par instrument, et ça ne se juge qu'une fois les 13
côte à côte, ce qui est maintenant le cas.

### 2. La maquette fixe des deux mises en page. Livrée, en attente de jugement.

C'est l'ordre de travail que tu as fixé : les deux mises en page en fixe avant la tranche
verticale. Deux pages à ouvrir :

- `test/maquette.html` : la coque de l'app en plein écran, qui bascule au point de rupture
  de 900 px. C'est celle à ouvrir sur l'iPad **puis** sur l'iPhone.
- `test/maquettes.html` : les deux mises en page côte à côte dans deux cadres aux tailles
  exactes, réduites à l'échelle, pour les juger d'un coup.

Rien ne fonctionne, c'est le sens du mot « fixe » : aucun son, aucune interaction, aucun
glisser-déposer, aucune animation. Une seule chose bouge, un interrupteur en CSS pur (trois
radios) qui montre les **trois états du cahier des charges** sans recharger : scène vide,
scène à 3 instruments, scène pleine à 6. Le seul JavaScript de la page injecte le sprite et
écrit les jetons depuis `src/instruments.js`, pour qu'il n'existe qu'un seul jeu de dessins
dans le dépôt.

Mesuré en plein écran, sur quatre tailles (iPad 1180 x 820, Mac 1440 x 900, iPhone
390 x 844, iPhone SE 375 x 667) et dans les trois états : rien ne sort de l'écran, rien n'est
rogné, la frise ne recouvre aucun emplacement, et **posés + réserve = 13 partout**.
L'emplacement de scène fait 275 px sur l'iPad et 71 px au plus serré sur un SE, le jeton de
réserve 81 px et 64 px : le plancher de 64 px du cahier des charges tient partout.

Trois choix de mise en page sont à valider, et ce sont des choix, pas des évidences :

1. **La réserve garde un creux** à la place de l'instrument posé, au lieu de se refermer. Un
   enfant de 6 ans retrouve son instrument à la même position, ce qui me semble plus
   important que de gagner de la place. À vérifier à l'usage.
2. **La coupure des deux colonnes latérales tombe sur une frontière de famille**, pas au
   milieu du tas : cordes et bois à gauche (6), cuivres, claviers, vent et percussions à
   droite (7). Le cadrage disait 7 et 6, mais couper 7 aurait séparé les deux cuivres.
3. **Le sélecteur de morceau défile** horizontalement, avec un fondu à droite qui dit qu'il y
   a une suite. Il y aura quinze morceaux, ils ne tiennent pas de front.

Deux réserves que je signale plutôt que de les cacher :

- **La zone sensible des curseurs.** La piste fait 18 px de haut à l'écran. C'est bien
  visuellement, mais ça ne s'attrape pas au doigt. En phase 1 il faudra une zone sensible
  haute autour d'une piste fine, pas une piste épaisse.
- **Les repères de tempo sont des chevrons** (un, deux, trois), pas des illustrations. Le
  cadrage dit « repères illustrés ». Trois petits dessins feraient mieux, mais c'est trois
  dessins de plus et ça ne bloque pas le jugement de la mise en page.

## À trancher avant la phase 2

3. **Import MIDI.** Confirmer que le bouton Importer accepte aussi les fichiers `.mid` avec écran de correspondance des pistes, ou seulement les fichiers au format du projet.

4. **Accès à la zone parent.** Appui long de 2 s sur l'engrenage, ou un autre geste.

## À trancher avant la phase 3

5. **Les trois remplacements** dans la liste des 15 morceaux du jouet : The Wheels on the Bus (encore protégé en Europe), Alphabet Song (même mélodie qu'Ah ! vous dirai-je maman), Come Little Leaves (statut à vérifier). Voir `docs/cadrage.md` section 7.4.
6. **La deuxième série de morceaux.** Voir `docs/cadrage.md` section 7.5.

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
