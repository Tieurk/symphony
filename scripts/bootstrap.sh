#!/usr/bin/env bash
# Crée le dépôt GitHub, le pousse et prépare GitHub Pages sur le domaine du fichier CNAME.
# Deux chemins : automatique si gh est installé, guidé sinon. gh n'est PAS obligatoire.
# À lancer depuis la racine du projet : bash scripts/bootstrap.sh
set -euo pipefail

DEPOT="${DEPOT:-symphony}"
VISIBILITE="${VISIBILITE:-public}"

cd "$(dirname "$0")/.."
[ -f CNAME ] || { echo "Fichier CNAME absent à la racine."; exit 1; }
DOMAINE="$(tr -d '[:space:]' < CNAME)"
SOUSDOMAINE="${DOMAINE%%.*}"

command -v git >/dev/null || { echo "git absent. Installe les outils Xcode : xcode-select --install"; exit 1; }

# --- 1. Dépôt local ---------------------------------------------------------
if [ ! -d .git ]; then
  git init -q -b main
  git add -A
  git commit -qm "Cadrage et squelette du projet"
  echo "Dépôt local créé, premier commit fait."
else
  echo "Dépôt local déjà présent."
  if [ -n "$(git status --porcelain)" ]; then
    git add -A && git commit -qm "Mise à jour du cadrage"
    echo "Modifications commitées."
  fi
fi

# --- 2. Compte GitHub -------------------------------------------------------
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  AUTO=1
  UTILISATEUR="$(gh api user --jq .login)"
  echo "gh détecté, compte $UTILISATEUR. Chemin automatique."
else
  AUTO=0
  echo
  echo "gh absent ou non authentifié. Chemin guidé, ça marche aussi bien."
  read -rp "Ton pseudo GitHub : " UTILISATEUR
  [ -n "$UTILISATEUR" ] || { echo "Pseudo vide, on s'arrête."; exit 1; }
fi

# --- 3. Dépôt distant -------------------------------------------------------
if [ "$AUTO" = "1" ]; then
  if gh repo view "$UTILISATEUR/$DEPOT" >/dev/null 2>&1; then
    git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$UTILISATEUR/$DEPOT.git"
    git push -u origin main
  else
    gh repo create "$DEPOT" "--$VISIBILITE" --source=. --remote=origin --push \
      --description "Orchestre interactif pour enfants, en PWA"
  fi
  gh api -X POST "repos/$UTILISATEUR/$DEPOT/pages" \
    -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
    && echo "GitHub Pages activé." \
    || echo "Pages déjà actif, ou à activer à la main (voir plus bas)."
else
  URL="https://github.com/new?name=$DEPOT&visibility=$VISIBILITE"
  echo
  echo "Crée le dépôt dans ton navigateur, SANS README, SANS .gitignore, SANS licence :"
  echo "  $URL"
  command -v open >/dev/null && open "$URL" 2>/dev/null || true
  echo
  read -rp "Appuie sur Entrée une fois le dépôt créé... " _
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$UTILISATEUR/$DEPOT.git"
  echo "Envoi en cours (GitHub demandera un jeton d'accès si ton Mac n'a pas déjà tes identifiants)..."
  git push -u origin main
fi

# --- 4. Ce qui reste ---------------------------------------------------------
cat <<FIN

================================================================
DÉPÔT EN LIGNE : https://github.com/$UTILISATEUR/$DEPOT

Il reste deux choses, dans l'ordre.

1. ACTIVER GITHUB PAGES
   https://github.com/$UTILISATEUR/$DEPOT/settings/pages
   Source : Deploy from a branch
   Branche : main, dossier : / (root), puis Save.
   Le fichier CNAME du dépôt renseignera le domaine tout seul.

2. CRÉER L'ENREGISTREMENT DNS
   Type   : CNAME
   Nom    : $SOUSDOMAINE
   Valeur : $UTILISATEUR.github.io
   TTL    : automatique

   (Derrière Cloudflare, laisse le nuage GRIS le temps que le
   certificat soit émis, tu l'activeras ensuite.)

Puis, 10 à 60 minutes plus tard, coche "Enforce HTTPS" sur la même
page de réglages, et vérifie :

   curl -sI https://$DOMAINE | head -1
================================================================
FIN
