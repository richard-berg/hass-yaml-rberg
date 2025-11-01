#!/usr/bin/env bash
# setup_symlinks.sh
# Regenerates symlinks from a Git repo into /config
# Only mirrors Home Assistant configuration files and directories

set -euo pipefail

# --- 1️⃣ Determine repo path ---
REPO_DIR="${1:-$(dirname "$(realpath "${BASH_SOURCE[0]}")")}"
CONFIG_DIR="/config"

# --- 2️⃣ Validate the repo looks like a HA config mirror ---
# Must contain at least configuration.yaml
if [ ! -f "$REPO_DIR/configuration.yaml" ]; then
  echo "ERROR: $REPO_DIR does not appear to be a Home Assistant config mirror repository."
  echo "It must contain at least 'configuration.yaml'."
  echo
  echo "Usage: $0 [path-to-repo]"
  echo "Example: $0 /config/git/hass-yaml-rberg"
  exit 1
fi

echo "Regenerating HAOS symlink farm from repo: $REPO_DIR"

cd "$CONFIG_DIR"

# --- 3️⃣ Define which top-level HA files to mirror ---
ha_files=(
  automations.yaml
  configuration.yaml
  scripts.yaml
  scenes.yaml
  secrets.yaml
  harmony_*.conf
)

for f in "${ha_files[@]}"; do
  src="$REPO_DIR/$f"
  # Skip if file doesn't exist
  [ -e "$src" ] || continue

  # Backup existing file if it's not a symlink
  if [ -f "$f" ] && [ ! -L "$f" ]; then
    echo "Backing up existing $f -> $f.bak"
    cp "$f" "$f.bak"
  fi

  # Remove existing symlink if present
  [ -L "$f" ] && rm "$f"

  # Create symlink
  ln -s "$src" "$f"
done

# --- 4️⃣ Mirror directories ---
ha_dirs=(
  "blueprints/automation"
  "blueprints/script"
  "packages"
)

for base in "${ha_dirs[@]}"; do
  src_base="$REPO_DIR/$base"
  [ -d "$src_base" ] || continue

  # find all first-level subdirectories to link
  find "$src_base" -mindepth 1 -maxdepth 1 -type d | while read -r dir; do
    name=$(basename "$dir")
    link_path="$base/$name"

    # Backup existing directory if it's not a symlink
    if [ -d "$link_path" ] && [ ! -L "$link_path" ]; then
      echo "Backing up existing directory $link_path -> $link_path.bak"
      mv "$link_path" "$link_path.bak"
    fi

    # Remove existing symlink if present
    [ -L "$link_path" ] && rm "$link_path"

    # Ensure parent directory exists
    mkdir -p "$(dirname "$link_path")"

    # Create absolute symlink
    ln -s "$REPO_DIR/$base/$name" "$link_path"
  done
done

echo "HAOS symlink farm regenerated successfully."
