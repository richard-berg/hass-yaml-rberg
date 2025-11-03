#!/usr/bin/env bash
# 
# Reverts `setup_symlink.sh`, i.e. converts symlinks under /config that point 
# into your HA Git repo back to real files with copied content.  Safe and idempotent.
#
# Usage: ./revert_symlinks.sh [path-to-repo]

set -euo pipefail

# --- 1️⃣ Determine repo and config paths ---
REPO_DIR="${1:-$(dirname "$(realpath "${BASH_SOURCE[0]}")")}"
CONFIG_DIR="/config"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "ERROR: $REPO_DIR is not a Git repo"
  exit 1
fi

echo "Reverting symlinks under $CONFIG_DIR that point into $REPO_DIR ..."
echo

# --- 2️⃣ Confirm we’re running inside HA config tree ---
if [ ! -d "$CONFIG_DIR" ]; then
  echo "ERROR: Config directory $CONFIG_DIR not found."
  exit 1
fi

cd "$CONFIG_DIR"

# --- 3️⃣ Process all symlinks ---
find . -type l -print0 | while IFS= read -r -d '' link; do
  abs_target=$(realpath -m "$link" 2>/dev/null || true)

  # Skip broken symlinks
  if [ ! -e "$abs_target" ]; then
    echo "⚠️  Skipping broken link: $link"
    continue
  fi

  # Skip symlinks outside the repo
  case "$abs_target" in
    "$REPO_DIR"/*) ;;  # ok
    *) 
      echo "⏩  Skipping external link: $link -> $abs_target"
      continue
      ;;
  esac

  # Backup existing symlink before replacing
  ts=$(date +%Y%m%d%H%M%S)
  backup="${link}.bak.${ts}"
  echo "🔁  Replacing $link (target=$abs_target)"
  echo "     → backing up original symlink to $backup"
  cp -P "$link" "$backup"

  # Replace with real file
  if cp "$abs_target" "$link.tmp.$$" 2>/dev/null; then
    mv -f "$link.tmp.$$" "$link"
  else
    echo "❌  Failed to copy target for $link; skipping."
    rm -f "$link.tmp.$$"
    continue
  fi
done

echo
echo "✅ All symlinks pointing into $REPO_DIR have been replaced with real files."
