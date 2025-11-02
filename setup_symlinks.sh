#!/usr/bin/env bash
# setup_symlinks.sh
#
# See README.md

set -euo pipefail

# --- 1️⃣ Determine repo path ---
REPO_DIR="${1:-$(dirname "$(realpath "${BASH_SOURCE[0]}")")}"
CONFIG_DIR="/config"
IGNORE_FILE="$REPO_DIR/.symlink_ignore"

# --- 2️⃣ Validate HA repo ---
if [ ! -f "$REPO_DIR/configuration.yaml" ] || [ ! -d "$REPO_DIR/.git" ]; then
  echo "ERROR: $REPO_DIR does not appear to be a Home Assistant Git repo mirror."
  exit 1
fi

echo "Regenerating HAOS symlinks from repo: $REPO_DIR"
cd "$CONFIG_DIR"

# --- 3️⃣ Load exclude patterns ---
declare -a EXCLUDE_PATTERNS=()
if [ -f "$IGNORE_FILE" ]; then
  while read -r line; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    EXCLUDE_PATTERNS+=("$line")
  done < "$IGNORE_FILE"
fi

matches_exclude() {
  local path="$1"
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    # Simple prefix match for "glob-like" behavior
    [[ "$path" == $pattern* ]] && return 0
  done
  return 1
}

# --- 4️⃣ Symlink creation function ---
create_symlink() {
  local src="$1"
  local dest="$2"

  rel_path=$(realpath --relative-to="$(dirname "$dest")" "$item")

  # Skip excluded paths
  matches_exclude "$rel_path" && return

  # Create parent directories if missing
  mkdir -p "$(dirname "$dest")"

  # Check existing destination
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    if [ -L "$dest" ]; then
      target=$(readlink "$dest")
      if [ "$target" == "$rel_path" ]; then
        return  # symlink already correct
      fi
    fi
    # Backup existing file/dir/link
    ts=$(date +%Y%m%d%H%M%S)
    echo "Backing up $dest -> ${dest}.bak.$ts"
    mv "$dest" "${dest}.bak.$ts"
  fi

  # Create relative symlink
  ln -s "$rel_path" "$dest"
}

# --- 5️⃣ Recursively link repo tree ---
link_repo_tree() {
  local src_dir="$1"
  local dest_dir="$2"

  find "$src_dir" -mindepth 1 -print0 | while IFS= read -r -d '' item; do
    rel_path="${item#$src_dir/}"
    dest="$dest_dir/$rel_path"

    # Skip excluded
    matches_exclude "$rel_path" && continue

    if [ -d "$item" ]; then
      mkdir -p "$dest"
    elif [ -f "$item" ]; then
      create_symlink "$item" "$dest"
    fi
  done
}

# --- 6️⃣ Execute linking ---
link_repo_tree "$REPO_DIR" "$CONFIG_DIR"

echo "HAOS symlink farm regenerated successfully."
