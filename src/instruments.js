// Les 13 instruments : la palette par famille, la table, et le sprite SVG.
//
// POURQUOI LE SPRITE EST DANS UN MODULE JS ET PAS DANS UN FICHIER .svg
// Un `<use href="fichier.svg#id">` externe ne recoit PAS les variables CSS du
// document hote, dans aucun navigateur courant : le contenu reference vit dans
// un document separe, l'heritage des proprietes personnalisees ne le traverse
// pas. La teinte par famille serait donc impossible avec un sprite externe.
// Injecte a l'execution dans le document courant, le sprite est dans le meme
// arbre, et `var(--base)` resout normalement a travers le shadow tree de
// `<use>`. C'est compatible avec la regle du projet : modules ES natifs, aucune
// etape de compilation.

export const FAMILLES = {
  cordes:      { nom: "Cordes",      base: "#e2724a", clair: "#f0a07c", sombre: "#8e3f24", fil: "#f5e9d7" },
  bois:        { nom: "Bois",        base: "#63c88a", clair: "#9fe3bc", sombre: "#2c7a4e", fil: "#f5e9d7" },
  cuivres:     { nom: "Cuivres",     base: "#f4c844", clair: "#ffe79a", sombre: "#9c7511", fil: "#f5e9d7" },
  claviers:    { nom: "Claviers",    base: "#6fb3d8", clair: "#a9d8ee", sombre: "#2f6b8c", fil: "#f5e9d7" },
  vent:        { nom: "Vent",        base: "#b98bd9", clair: "#dcbcec", sombre: "#6d4585", fil: "#f5e9d7" },
  percussions: { nom: "Percussions", base: "#e05c5c", clair: "#f5a0a0", sombre: "#8e2b2b", fil: "#f5e9d7" },
};

// L'ordre est celui du tableau des roles de CLAUDE.md, groupe par famille pour
// la reserve. Les familles suivent docs/cadrage.md section 6.
export const INSTRUMENTS = [
  { id: "violon",      nom: "Violon",      famille: "cordes" },
  { id: "guitare",     nom: "Guitare",     famille: "cordes" },
  { id: "koto",        nom: "Koto",        famille: "cordes" },
  { id: "sitar",       nom: "Sitar",       famille: "cordes" },
  { id: "flute",       nom: "Flute",       famille: "bois" },
  { id: "clarinette",  nom: "Clarinette",  famille: "bois" },
  { id: "trompette",   nom: "Trompette",   famille: "cuivres" },
  { id: "tuba",        nom: "Tuba",        famille: "cuivres" },
  { id: "xylophone",   nom: "Xylophone",   famille: "claviers" },
  { id: "piano",       nom: "Piano",       famille: "claviers" },
  { id: "accordeon",   nom: "Accordeon",   famille: "vent" },
  { id: "batterie",    nom: "Batterie",    famille: "percussions" },
  { id: "cymbales",    nom: "Cymbales",    famille: "percussions" },
];

// Le sprite. Un symbole par instrument, boite 0 0 100 100, a plat, sans
// contour, trois tons par famille plus un ton creme pour les fils tendus
// (cordes, baguettes). Aucune couleur en dur : tout passe par les variables,
// c'est ce qui permet un seul jeu de dessins pour six familles.
export const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" id="sprite-instruments">
<defs>

  <!-- ================= CORDES ================= -->

  <!-- VIOLON. Le difficile : la taille de guepe doit rester lisible quand la
       caisse ne fait plus que 40 px de large. Les pointes de la taille sont ce
       qui l'empeche de lire « ukulele ». -->
  <symbol id="i-violon" viewBox="0 0 100 100">
    <rect x="45" y="12" width="10" height="30" rx="3" fill="var(--sombre)"/>
    <path d="M50 4c-5 0-8 3-8 7 0 3 2 5 4 5h8c2 0 4-2 4-5 0-4-3-7-8-7z" fill="var(--sombre)"/>
    <circle cx="50" cy="9" r="2.5" fill="var(--base)"/>
    <path d="M50 37c12 0 19 6 19 15 0 4-3 6-6 8l6 3-7 2c4 4 10 10 10 17 0 9-10 14-22 14
             S28 90 28 82c0-7 6-13 10-17l-7-2 6-3c-3-2-6-4-6-8 0-9 7-15 19-15z" fill="var(--base)"/>
    <path d="M50 41c9 0 15 5 15 11 0 3-3 5-6 7 3 3 8 9 8 15 0 7-8 11-17 11
             S33 84 33 77c0-6 5-12 8-15-3-2-6-4-6-7 0-6 6-11 15-11z" fill="var(--clair)"/>
    <path d="M41 63c-2 3-2 8 0 11M59 63c2 3 2 8 0 11" stroke="var(--sombre)"
          stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <rect x="42" y="70" width="16" height="4" rx="1.5" fill="var(--sombre)"/>
    <path d="M46 14v58M48.7 14v58M51.3 14v58M54 14v58" stroke="var(--fil)"
          stroke-width="1.1" opacity=".85"/>
    <!-- archet : la mèche en creme, la baguette en sombre juste derriere -->
    <path d="M6 88L94 58" stroke="var(--sombre)" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M6 84.5L94 54.5" stroke="var(--fil)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M5 83l3 8" stroke="var(--sombre)" stroke-width="4" stroke-linecap="round"/>
  </symbol>

  <!-- GUITARE. Piege : confusion avec le violon, meme famille donc meme
       couleur. Trois choses l'en separent, et elles sont voulues grosses :
       la rosace ronde au centre, la tete plate a six chevilles (le violon a
       une volute), et une caisse bien plus pleine, sans pointes de taille. -->
  <symbol id="i-guitare" viewBox="0 0 100 100">
    <!-- tete plate, six chevilles : signature contre la volute du violon -->
    <rect x="38" y="4" width="24" height="16" rx="3" fill="var(--sombre)"/>
    <g fill="var(--fil)">
      <circle cx="43" cy="9" r="2"/><circle cx="43" cy="15" r="2"/>
      <circle cx="50" cy="9" r="2"/><circle cx="50" cy="15" r="2"/>
      <circle cx="57" cy="9" r="2"/><circle cx="57" cy="15" r="2"/>
    </g>
    <!-- manche, avec ses frettes -->
    <rect x="43" y="19" width="14" height="27" fill="var(--sombre)"/>
    <g stroke="var(--clair)" stroke-width="1.6" opacity=".7">
      <path d="M43 25h14"/><path d="M43 31h14"/><path d="M43 37h14"/><path d="M43 43h14"/>
    </g>
    <!-- caisse : epaules rondes, taille douce, bas tres large -->
    <path d="M50 40c14 0 21 7 21 14 0 5-5 9-5 14 0 8 11 12 11 21 0 9-12 14-27 14
             s-27-5-27-14c0-9 11-13 11-21 0-5-5-9-5-14 0-7 7-14 21-14z" fill="var(--base)"/>
    <path d="M50 44c11 0 16 6 16 11 0 4-5 8-5 13 0 7 10 11 10 19 0 7-10 11-21 11
             s-21-4-21-11c0-8 10-12 10-19 0-5-5-9-5-13 0-5 5-11 16-11z" fill="var(--clair)"/>
    <!-- rosace, grosse et centrale : c'est elle qu'un enfant voit d'abord -->
    <circle cx="50" cy="71" r="13" fill="var(--sombre)"/>
    <circle cx="50" cy="71" r="10" fill="var(--base)"/>
    <circle cx="50" cy="71" r="7" fill="var(--sombre)"/>
    <!-- chevalet -->
    <rect x="39" y="86" width="22" height="5" rx="2" fill="var(--sombre)"/>
    <!-- six cordes -->
    <g stroke="var(--fil)" stroke-width="1.1" opacity=".85">
      <path d="M45 18v68"/><path d="M47 18v68"/><path d="M49 18v68"/>
      <path d="M51 18v68"/><path d="M53 18v68"/><path d="M55 18v68"/>
    </g>
  </symbol>

  <!-- KOTO. Le plus dur des 13, et pas pour une raison de dessin : un enfant
       de 6 ans ne connait pas l'objet. Le but n'est donc pas qu'il le nomme,
       c'est qu'il ne le confonde avec rien d'autre. D'ou la silhouette la plus
       singuliere du lot : une longue table basse posee en biais, treize cordes
       tendues sur toute la longueur, et les chevalets mobiles en creme. -->
  <symbol id="i-koto" viewBox="0 0 100 100">
    <g transform="rotate(-34 50 50)">
      <rect x="3" y="36" width="94" height="28" rx="5" fill="var(--sombre)"/>
      <rect x="3" y="36" width="94" height="21" rx="5" fill="var(--base)"/>
      <rect x="9" y="38" width="82" height="17" rx="3" fill="var(--clair)"/>
      <g stroke="var(--sombre)" stroke-width="1.3" opacity=".8">
        <path d="M9 41h82"/><path d="M9 43.8h82"/><path d="M9 46.6h82"/>
        <path d="M9 49.4h82"/><path d="M9 52.2h82"/>
      </g>
      <g fill="var(--fil)">
        <path d="M25 37h6l2.5 19h-11z"/>
        <path d="M47 37h6l2.5 19h-11z"/>
        <path d="M69 37h6l2.5 19h-11z"/>
      </g>
    </g>
  </symbol>

  <!-- SITAR. Ce qui le separe de la guitare : la calebasse est un disque
       PLEIN, sans taille, le manche est deux fois plus long et plus large, et
       les chevilles sortent sur les cotes au lieu d'etre groupees sur une tete.
       C'est cette rangee de chevilles laterales qui signe l'instrument. -->
  <symbol id="i-sitar" viewBox="0 0 100 100">
    <!-- manche, tres long et large -->
    <rect x="38" y="10" width="24" height="52" rx="4" fill="var(--sombre)"/>
    <!-- chevilles laterales, la signature -->
    <g fill="var(--base)">
      <rect x="26" y="15" width="12" height="5" rx="2.5"/>
      <rect x="26" y="26" width="12" height="5" rx="2.5"/>
      <rect x="26" y="37" width="12" height="5" rx="2.5"/>
      <rect x="62" y="20" width="12" height="5" rx="2.5"/>
      <rect x="62" y="31" width="12" height="5" rx="2.5"/>
      <rect x="62" y="42" width="12" height="5" rx="2.5"/>
    </g>
    <!-- tete recourbee -->
    <path d="M38 12c0-6 5-9 12-9s12 3 12 9z" fill="var(--base)"/>
    <!-- frettes courbes -->
    <g stroke="var(--clair)" stroke-width="1.8" fill="none" opacity=".75">
      <path d="M39 24q11 4 22 0"/><path d="M39 36q11 4 22 0"/><path d="M39 48q11 4 22 0"/>
    </g>
    <!-- calebasse, un disque plein -->
    <circle cx="50" cy="75" r="23" fill="var(--base)"/>
    <circle cx="50" cy="75" r="17" fill="var(--clair)"/>
    <circle cx="50" cy="75" r="7" fill="var(--sombre)"/>
    <!-- cordes, jusqu'au cordier -->
    <g stroke="var(--fil)" stroke-width="1.1" opacity=".85">
      <path d="M46 12v82"/><path d="M48.7 12v82"/><path d="M51.3 12v82"/><path d="M54 12v82"/>
    </g>
    <rect x="43" y="92" width="14" height="5" rx="2" fill="var(--sombre)"/>
  </symbol>

  <!-- ================= BOIS ================= -->

  <!-- FLUTE. Deux pieges d'un coup : elle lit comme un baton si rien ne
       depasse, et elle se confond avec la clarinette puisque c'est la meme
       famille donc la meme couleur. Reponse : la flute est POSEE EN BIAIS et
       son bout est ouvert et droit, la clarinette est DEBOUT avec un pavillon
       evase. L'orientation fait le tri avant meme la forme. Plus la plaque
       d'embouchure, qui deborde du tube. -->
  <symbol id="i-flute" viewBox="0 0 100 100">
    <g transform="rotate(-38 50 50)">
      <!-- corps -->
      <rect x="6" y="43" width="88" height="14" rx="7" fill="var(--base)"/>
      <!-- tete, un peu plus epaisse -->
      <rect x="6" y="41" width="30" height="18" rx="9" fill="var(--base)"/>
      <!-- reflet sur le dessus du tube -->
      <rect x="10" y="44.5" width="80" height="4" rx="2" fill="var(--clair)"/>
      <!-- plaque d'embouchure, qui deborde : sans elle, c'est un baton -->
      <ellipse cx="22" cy="39" rx="9" ry="5" fill="var(--clair)"/>
      <ellipse cx="22" cy="39" rx="4" ry="2.4" fill="var(--sombre)"/>
      <!-- bouchon, bout ferme a gauche -->
      <rect x="3" y="42" width="6" height="16" rx="3" fill="var(--sombre)"/>
      <!-- cles, en relief au dessus et en dessous -->
      <path d="M42 50h46" stroke="var(--sombre)" stroke-width="2.4" stroke-linecap="round"/>
      <g fill="var(--sombre)">
        <circle cx="46" cy="50" r="5"/><circle cx="58" cy="50" r="5"/>
        <circle cx="70" cy="50" r="5"/><circle cx="82" cy="50" r="5"/>
      </g>
      <g fill="var(--sombre)">
        <rect x="50" y="34" width="5" height="9" rx="2.5"/>
        <rect x="64" y="57" width="5" height="9" rx="2.5"/>
        <rect x="76" y="34" width="5" height="9" rx="2.5"/>
      </g>
      <!-- bout ouvert -->
      <ellipse cx="93" cy="50" rx="3" ry="7" fill="var(--sombre)"/>
    </g>
  </symbol>

  <!-- CLARINETTE. Debout, bec biseaute en haut, pavillon evase en bas, et les
       bagues sombres aux raccords. C'est le pavillon qui la separe de la flute,
       et la verticalite qui la separe de tout le reste. -->
  <symbol id="i-clarinette" viewBox="0 0 100 100">
    <!-- bec biseaute -->
    <path d="M44 4h12l-1.5 11h-9z" fill="var(--sombre)"/>
    <!-- barillet -->
    <rect x="42" y="15" width="16" height="8" rx="2" fill="var(--sombre)"/>
    <!-- corps, legerement conique -->
    <path d="M43 23h14l4 48H39z" fill="var(--base)"/>
    <!-- reflet vertical -->
    <path d="M45 24h4l2 46h-6z" fill="var(--clair)" opacity=".8"/>
    <!-- bagues -->
    <g fill="var(--sombre)">
      <rect x="41.5" y="40" width="17" height="4" rx="1.5"/>
      <rect x="40" y="66" width="21" height="5" rx="2"/>
    </g>
    <!-- pavillon evase : la signature contre la flute -->
    <path d="M39 71h22c1 10 5 17 12 22H27c7-5 11-12 12-22z" fill="var(--base)"/>
    <ellipse cx="50" cy="93" rx="24" ry="5" fill="var(--clair)"/>
    <ellipse cx="50" cy="93" rx="15" ry="3" fill="var(--sombre)"/>
    <!-- cles et anneaux -->
    <g fill="var(--sombre)">
      <circle cx="50" cy="31" r="4"/><circle cx="50" cy="52" r="4"/><circle cx="50" cy="60" r="4"/>
      <rect x="58" y="27" width="8" height="4" rx="2"/>
      <rect x="34" y="47" width="8" height="4" rx="2"/>
      <rect x="58" y="55" width="8" height="4" rx="2"/>
    </g>
  </symbol>

  <!-- ================= CUIVRES ================= -->

  <!-- TROMPETTE. Piege : confusion avec le tuba, meme famille donc meme
       couleur. Tout est fait pour opposer les deux silhouettes : le pavillon
       de la trompette est COUCHE et pointe a droite, celui du tuba est DEBOUT
       et pointe en haut. Et les trois pistons sont posses sur un tube droit,
       pas sur un fut enroule. -->
  <symbol id="i-trompette" viewBox="0 0 100 100">
   <g transform="translate(50 50) scale(.86) translate(-50 -50) rotate(-13 50 52)">
    <!-- coulisse d'accord, un vrai U sous le tube -->
    <path d="M18 56v18a10 10 0 0 0 10 10h20" stroke="var(--base)" stroke-width="7.5"
          stroke-linecap="round" fill="none"/>
    <!-- tube principal, droit et horizontal -->
    <rect x="12" y="49" width="54" height="12" rx="6" fill="var(--base)"/>
    <!-- embouchure a gauche -->
    <path d="M13 55H7" stroke="var(--base)" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="5" cy="55" rx="4.5" ry="7" fill="var(--sombre)"/>
    <!-- pavillon couche, ouvert vers la droite, bien plus haut qu'avant -->
    <path d="M62 46c9-2 19-10 29-23v64c-10-13-20-21-29-23z" fill="var(--base)"/>
    <ellipse cx="91" cy="55" rx="6.5" ry="32" fill="var(--clair)"/>
    <ellipse cx="91" cy="55" rx="3.8" ry="22" fill="var(--sombre)"/>
    <!-- trois pistons, debout sur le tube -->
    <g fill="var(--sombre)">
      <rect x="28" y="24" width="7.5" height="27" rx="3.7"/>
      <rect x="39" y="24" width="7.5" height="27" rx="3.7"/>
      <rect x="50" y="24" width="7.5" height="27" rx="3.7"/>
    </g>
    <g fill="var(--clair)">
      <circle cx="31.7" cy="23" r="5"/><circle cx="42.7" cy="23" r="5"/>
      <circle cx="53.7" cy="23" r="5"/>
    </g>
   </g>
  </symbol>

  <!-- TUBA. Deuxieme version. La premiere lisait comme un cor : pavillon trop
       petit, boucle trop serree. Ce qui fait un tuba pour un enfant, c'est un
       pavillon ENORME tourne vers le haut qui mange la moitie de la hauteur.
       Tout le reste est secondaire. -->
  <symbol id="i-tuba" viewBox="0 0 100 100">
    <path d="M40 74c-10 6-22 2-24-8-2-9 6-16 14-14"
          stroke="var(--base)" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M36 60H20" stroke="var(--base)" stroke-width="6.5" stroke-linecap="round"/>
    <ellipse cx="18" cy="60" rx="5.5" ry="4.5" fill="var(--sombre)"/>
    <path d="M37 56h26v26a13 13 0 0 1-26 0z" fill="var(--base)"/>
    <path d="M36 58c-1-14-7-26-20-33h68c-13 7-19 19-20 33z" fill="var(--base)"/>
    <ellipse cx="50" cy="25" rx="34" ry="9.5" fill="var(--clair)"/>
    <ellipse cx="50" cy="25" rx="25" ry="6" fill="var(--sombre)"/>
    <g fill="var(--sombre)">
      <rect x="40" y="62" width="6.5" height="15" rx="3.2"/>
      <rect x="49" y="62" width="6.5" height="15" rx="3.2"/>
      <rect x="58" y="62" width="6.5" height="15" rx="3.2"/>
    </g>
  </symbol>

  <!-- ================= CLAVIERS ================= -->

  <!-- XYLOPHONE. Le cas facile, purement geometrique. Redessine pour occuper
       toute la hauteur de la boite : la premiere version n'en prenait que la
       moitie, ce qui gaspillait la cible tactile. -->
  <symbol id="i-xylophone" viewBox="0 0 100 100">
    <!-- les deux rails du chassis, fins : ils ne doivent pas combler les
         creux entre les lames, sinon tout se soude en une seule masse -->
    <g fill="var(--sombre)">
      <path d="M13 8h4l15 83h-4z"/>
      <path d="M83 8h4l-15 83h-4z"/>
    </g>
    <!-- lames, de la plus longue a la plus courte -->
    <g fill="var(--base)">
      <rect x="7"  y="8"  width="86" height="8" rx="4"/>
      <rect x="10" y="23" width="80" height="8" rx="4"/>
      <rect x="13" y="38" width="74" height="8" rx="4"/>
      <rect x="16" y="53" width="68" height="8" rx="4"/>
      <rect x="19" y="68" width="62" height="8" rx="4"/>
      <rect x="22" y="83" width="56" height="8" rx="4"/>
    </g>
    <!-- reflet sur le haut de chaque lame -->
    <g fill="var(--clair)" opacity=".5">
      <rect x="7"  y="8"  width="86" height="3" rx="1.5"/>
      <rect x="10" y="23" width="80" height="3" rx="1.5"/>
      <rect x="13" y="38" width="74" height="3" rx="1.5"/>
      <rect x="16" y="53" width="68" height="3" rx="1.5"/>
      <rect x="19" y="68" width="62" height="3" rx="1.5"/>
      <rect x="22" y="83" width="56" height="3" rx="1.5"/>
    </g>
    <!-- les deux baguettes, en creme : c'est ce qui dit « on tape dessus » -->
    <g stroke="var(--fil)" stroke-width="3.6" stroke-linecap="round">
      <path d="M44 58L80 91"/><path d="M58 50L93 77"/>
    </g>
    <circle cx="44" cy="58" r="6.5" fill="var(--fil)"/>
    <circle cx="58" cy="50" r="6.5" fill="var(--fil)"/>
  </symbol>

  <!-- PIANO. Piege non prevu au depart mais bien reel : le xylophone est de la
       meme famille, donc de la meme couleur, et c'est aussi une rangee de
       lames. Ce qui les separe : le piano a la silhouette courbe du piano a
       queue et un clavier CREME a touches noires groupees par 2 et par 3, le
       xylophone a des lames degressives et deux baguettes levees. -->
  <symbol id="i-piano" viewBox="0 0 100 100">
    <!-- corps vu de dessus, la courbe du piano a queue -->
    <path d="M9 62V28c0-9 7-16 16-16h32c19 0 34 12 34 25s-15 25-34 25H9z" fill="var(--base)"/>
    <!-- couvercle -->
    <path d="M15 56V29c0-6 4-11 11-11h31c15 0 27 9 27 19s-12 19-27 19H15z" fill="var(--clair)"/>
    <!-- cordes suggerees sous le couvercle -->
    <g stroke="var(--sombre)" stroke-width="1.2" opacity=".45">
      <path d="M22 22l50 8"/><path d="M20 30l56 6"/><path d="M20 38l54 6"/><path d="M22 46l46 4"/>
    </g>
    <!-- clavier, en creme : aucun autre instrument n'a cette bande claire -->
    <rect x="7" y="61" width="68" height="23" rx="3" fill="var(--fil)"/>
    <!-- touches noires, groupees par 2 puis par 3 comme un vrai clavier -->
    <g fill="var(--sombre)">
      <rect x="14" y="61" width="6" height="14" rx="1.5"/>
      <rect x="22.5" y="61" width="6" height="14" rx="1.5"/>
      <rect x="39.5" y="61" width="6" height="14" rx="1.5"/>
      <rect x="48" y="61" width="6" height="14" rx="1.5"/>
      <rect x="56.5" y="61" width="6" height="14" rx="1.5"/>
    </g>
    <!-- separations des touches blanches -->
    <g stroke="var(--sombre)" stroke-width="1" opacity=".5">
      <path d="M17 75v9"/><path d="M25.5 75v9"/><path d="M34 61v23"/>
      <path d="M42.5 75v9"/><path d="M51 75v9"/><path d="M59.5 75v9"/><path d="M68 61v23"/>
    </g>
    <!-- pieds -->
    <g fill="var(--sombre)">
      <rect x="12" y="84" width="8" height="11" rx="2.5"/>
      <rect x="62" y="84" width="8" height="11" rx="2.5"/>
      <rect x="74" y="60" width="9" height="14" rx="3"/>
    </g>
  </symbol>

  <!-- ================= VENT ================= -->

  <!-- ACCORDEON. Le plus facile a signer des neuf : si le soufflet en zigzag
       tient entre les deux caisses, personne ne le confond avec rien. Donc le
       soufflet est gros, ses plis sont larges, et il occupe le tiers central. -->
  <symbol id="i-accordeon" viewBox="0 0 100 100">
    <!-- soufflet, dessine d'abord pour passer derriere les caisses -->
    <path d="M30 22h40v56H30z" fill="var(--clair)"/>
    <path d="M30 22l6 4v48l-6 4zM42 22l-6 4v48l6 4zM42 22l6 4v48l-6 4zM54 22l-6 4v48l6 4z
             M54 22l6 4v48l-6 4zM66 22l-6 4v48l6 4zM66 22l4 3v50l-4 3z"
          fill="none" stroke="var(--sombre)" stroke-width="2.6"/>
    <!-- caisse gauche, les basses : boutons rondsdisposes en grille -->
    <rect x="4" y="14" width="28" height="72" rx="6" fill="var(--base)"/>
    <rect x="8" y="18" width="20" height="64" rx="4" fill="var(--sombre)"/>
    <g fill="var(--clair)">
      <circle cx="14" cy="27" r="3.4"/><circle cx="23" cy="27" r="3.4"/>
      <circle cx="14" cy="38" r="3.4"/><circle cx="23" cy="38" r="3.4"/>
      <circle cx="14" cy="49" r="3.4"/><circle cx="23" cy="49" r="3.4"/>
      <circle cx="14" cy="60" r="3.4"/><circle cx="23" cy="60" r="3.4"/>
      <circle cx="14" cy="71" r="3.4"/><circle cx="23" cy="71" r="3.4"/>
    </g>
    <!-- caisse droite, le clavier -->
    <rect x="68" y="14" width="28" height="72" rx="6" fill="var(--base)"/>
    <rect x="78" y="19" width="16" height="62" rx="3" fill="var(--fil)"/>
    <g fill="var(--sombre)">
      <rect x="78" y="25" width="10" height="4" rx="1.5"/>
      <rect x="78" y="36" width="10" height="4" rx="1.5"/>
      <rect x="78" y="47" width="10" height="4" rx="1.5"/>
      <rect x="78" y="58" width="10" height="4" rx="1.5"/>
      <rect x="78" y="69" width="10" height="4" rx="1.5"/>
    </g>
    <!-- sangle -->
    <path d="M72 20c-6 10-6 50 0 60" stroke="var(--sombre)" stroke-width="3"
          fill="none" stroke-linecap="round"/>
  </symbol>

  <!-- ================= PERCUSSIONS ================= -->

  <!-- BATTERIE. Le test du multi-objet : est-ce que quatre futs et une cymbale
       se lisent encore a 64 px. C'est la grosse caisse, ce grand disque plein,
       qui porte la lecture. -->
  <symbol id="i-batterie" viewBox="0 0 100 100">
    <path d="M78 26v46" stroke="var(--sombre)" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="78" cy="26" rx="20" ry="5" fill="var(--clair)"/>
    <ellipse cx="78" cy="25" rx="6" ry="2.4" fill="var(--sombre)"/>
    <circle cx="44" cy="66" r="27" fill="var(--base)"/>
    <circle cx="44" cy="66" r="20" fill="var(--clair)"/>
    <circle cx="44" cy="66" r="6" fill="var(--sombre)"/>
    <g>
      <rect x="26" y="26" width="22" height="18" rx="4" fill="var(--base)"/>
      <ellipse cx="37" cy="26" rx="11" ry="4" fill="var(--clair)"/>
      <rect x="52" y="30" width="20" height="16" rx="4" fill="var(--base)"/>
      <ellipse cx="62" cy="30" rx="10" ry="3.6" fill="var(--clair)"/>
    </g>
    <rect x="4" y="52" width="24" height="15" rx="4" fill="var(--base)"/>
    <ellipse cx="16" cy="52" rx="12" ry="4" fill="var(--clair)"/>
    <g stroke="var(--sombre)" stroke-width="3" stroke-linecap="round">
      <path d="M22 88l-6 8"/><path d="M66 88l6 8"/>
    </g>
  </symbol>

  <!-- CYMBALES. Piege : confusion avec la batterie, meme famille donc meme
       couleur. La regle est simple et absolue : AUCUN FUT ici. Rien que des
       disques sur pied, trois, dont le charley qui en empile deux. La batterie
       est pleine et ronde, les cymbales sont plates et vides. -->
  <symbol id="i-cymbales" viewBox="0 0 100 100">
    <!-- pied du charley, a gauche -->
    <path d="M26 54v34" stroke="var(--sombre)" stroke-width="3.4" stroke-linecap="round"/>
    <g stroke="var(--sombre)" stroke-width="3" stroke-linecap="round">
      <path d="M26 88l-11 9"/><path d="M26 88l11 9"/>
    </g>
    <!-- pedale -->
    <path d="M12 95h22" stroke="var(--sombre)" stroke-width="4" stroke-linecap="round"/>
    <!-- charley : deux disques empiles, entrouverts -->
    <ellipse cx="26" cy="58" rx="21" ry="5" fill="var(--base)"/>
    <g transform="rotate(-7 26 48)">
      <ellipse cx="26" cy="48" rx="21" ry="5" fill="var(--clair)"/>
      <ellipse cx="26" cy="47" rx="6" ry="2.2" fill="var(--sombre)"/>
    </g>
    <!-- pied de la crash, a droite, plus haut -->
    <path d="M70 30v56" stroke="var(--sombre)" stroke-width="3.4" stroke-linecap="round"/>
    <g stroke="var(--sombre)" stroke-width="3" stroke-linecap="round">
      <path d="M70 86l-10 10"/><path d="M70 86l10 10"/>
    </g>
    <!-- crash, inclinee : le grand disque du haut -->
    <g transform="rotate(-13 70 28)">
      <ellipse cx="70" cy="28" rx="27" ry="6.5" fill="var(--clair)"/>
      <ellipse cx="70" cy="26.5" rx="8" ry="3" fill="var(--sombre)"/>
    </g>
    <!-- ride : son propre pied, sinon elle flotte -->
    <path d="M48 74v20" stroke="var(--sombre)" stroke-width="3.4" stroke-linecap="round"/>
    <g stroke="var(--sombre)" stroke-width="3" stroke-linecap="round">
      <path d="M48 94l-9 5"/><path d="M48 94l9 5"/>
    </g>
    <!-- ride, plus basse et plus large, devant -->
    <g transform="rotate(5 52 72)">
      <ellipse cx="52" cy="72" rx="24" ry="6" fill="var(--base)"/>
      <ellipse cx="52" cy="71" rx="7" ry="2.6" fill="var(--sombre)"/>
    </g>
  </symbol>


  <!-- ================= REPERES DE TEMPO ================= -->
  <!-- Ce ne sont PAS des instruments : absents de INSTRUMENTS, presents ici
       pour n'avoir qu'un seul sprite et un seul mecanisme d'injection. -->

  <!-- TORTUE, le repere lent (60 %). A 26 px il ne reste que le dome et la
       tete : c'est exactement ce qu'il faut pour que ca lise. -->
  <symbol id="r-lent" viewBox="0 0 100 100">
    <!-- queue -->
    <path d="M20 60l-9 3 9 5z" fill="var(--sombre)"/>
    <!-- pattes -->
    <g fill="var(--sombre)">
      <rect x="26" y="62" width="14" height="13" rx="6"/>
      <rect x="58" y="62" width="14" height="13" rx="6"/>
    </g>
    <!-- tete -->
    <path d="M78 48c9-3 17 1 17 8s-8 11-17 8z" fill="var(--clair)"/>
    <circle cx="88" cy="54" r="2.2" fill="var(--sombre)"/>
    <!-- carapace -->
    <path d="M16 64c0-23 15-38 34-38s34 15 34 38z" fill="var(--base)"/>
    <ellipse cx="50" cy="64" rx="34" ry="5" fill="var(--sombre)"/>
    <!-- ecailles -->
    <g fill="var(--sombre)" opacity=".45">
      <path d="M50 32l13 9-5 15H42l-5-15z"/>
      <path d="M26 52l8-6 4 12-4 6h-9z"/>
      <path d="M74 52l-8-6-4 12 4 6h9z"/>
    </g>
  </symbol>

  <!-- NORMAL, le repere du milieu (100 %). Pas un animal : le tempo ecrit,
       donc une noire. -->
  <symbol id="r-normal" viewBox="0 0 100 100">
    <rect x="58" y="14" width="9" height="56" rx="3" fill="var(--base)"/>
    <ellipse cx="42" cy="68" rx="24" ry="17" fill="var(--base)"
             transform="rotate(-18 42 68)"/>
    <ellipse cx="42" cy="66" rx="14" ry="9" fill="var(--clair)" opacity=".5"
             transform="rotate(-18 42 66)"/>
  </symbol>

  <!-- LAPIN, le repere rapide (140 %). Ce qui le signe a 26 px, ce sont les
       deux longues oreilles : tout le reste est secondaire. -->
  <symbol id="r-rapide" viewBox="0 0 100 100">
    <!-- oreilles, ecartees -->
    <g fill="var(--base)">
      <ellipse cx="56" cy="24" rx="7" ry="20" transform="rotate(-14 56 24)"/>
      <ellipse cx="74" cy="26" rx="7" ry="20" transform="rotate(10 74 26)"/>
    </g>
    <g fill="var(--clair)">
      <ellipse cx="56" cy="24" rx="3.2" ry="13" transform="rotate(-14 56 24)"/>
      <ellipse cx="74" cy="26" rx="3.2" ry="13" transform="rotate(10 74 26)"/>
    </g>
    <!-- corps -->
    <ellipse cx="40" cy="68" rx="28" ry="21" fill="var(--base)"/>
    <!-- queue -->
    <circle cx="13" cy="62" r="8" fill="var(--clair)"/>
    <!-- tete -->
    <circle cx="68" cy="53" r="16" fill="var(--base)"/>
    <circle cx="74" cy="49" r="2.6" fill="var(--sombre)"/>
    <!-- pattes -->
    <g fill="var(--sombre)">
      <rect x="28" y="80" width="18" height="10" rx="5"/>
      <rect x="54" y="78" width="16" height="10" rx="5"/>
    </g>
  </symbol>

</defs>
</svg>`;

// Les regles de teinte, generees depuis FAMILLES : une seule source pour la
// palette, pas de valeurs recopiees dans chaque page.
export const CSS_FAMILLES = (() => {
  const racine = Object.entries(FAMILLES)
    .map(([cle, f]) => `  --fam-${cle}: ${f.base};`)
    .join("\n");
  const classes = Object.entries(FAMILLES)
    .map(([cle, f]) => `.f-${cle} { --base: ${f.base}; --clair: ${f.clair}; --sombre: ${f.sombre}; --fil: ${f.fil}; }`)
    .join("\n");
  return `:root {\n${racine}\n}\n${classes}\n`;
})();

// Pose le sprite et les regles de teinte dans le document. Idempotent : deux
// appels ne posent qu'un seul sprite.
export function injecteSprite(doc = document) {
  if (doc.getElementById("sprite-instruments")) return;
  const style = doc.createElement("style");
  style.id = "style-familles";
  style.textContent = CSS_FAMILLES;
  doc.head.appendChild(style);
  const hote = doc.createElement("div");
  hote.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  hote.innerHTML = SPRITE;
  doc.body.insertBefore(hote, doc.body.firstChild);
}

// Un instrument par son identifiant.
export function instrument(id) {
  return INSTRUMENTS.find((i) => i.id === id);
}

// L'ICONE DE L'APP, en 512x512. Elle vit ici et nulle part ailleurs, pour la
// meme raison que les instruments : une seule source de dessin dans le depot.
// Elle reutilise le symbole du violon, la plus reconnaissable des treize
// marques, posee sur la scene de l'app (rideaux, frise festonnee, plancher de
// bois clair), ce qui fait que l'icone de l'ecran d'accueil et la page se
// ressemblent.
//
// Les quatre PNG d'assets/img/ en sont le rendu, committes. test/icone.html
// les montre aux tailles reelles et sous les deux masques, celui d'iOS et le
// masque rond d'Android : la verification qui compte est que rien
// d'important ne tombe dans les coins rognes.
export const ICONE = `
  <rect width="512" height="512" fill="#1e2740"/>
  <path d="M0 420h512v92H0z" fill="#d9b382"/>
  <path d="M0 420h512v16H0z" fill="#e6c79c"/>
  <rect x="0" y="0" width="52" height="512" fill="#a63d40"/>
  <rect x="460" y="0" width="52" height="512" fill="#a63d40"/>
  <rect x="0" y="0" width="18" height="512" fill="#7d2b2e"/>
  <rect x="494" y="0" width="18" height="512" fill="#7d2b2e"/>
  <rect x="0" y="0" width="512" height="46" fill="#a63d40"/>
  <g fill="#1e2740">
${Array.from({ length: 11 }, (_, i) => `    <circle cx="${(23.3 + i * 46.5).toFixed(1)}" cy="46" r="23"/>`).join("\n")}
  </g>
  <g class="f-cordes"><svg x="46" y="30" width="420" height="420"><use href="#i-violon"/></svg></g>`;
