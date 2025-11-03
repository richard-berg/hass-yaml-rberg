
# Richard's Home Assistant Configuration
 
This repository contains my **Home Assistant (HA) configuration files**. It is designed to be a **partial mirror of the `/config` dir** in HAOS, enabling version control, safe backups, and easy deployment to new installations.

---

## Usage  

This repo can be cloned directly into `/config` if desired.  (back it up first!)  The `.gitignore` file should prevent HA internals or secrets from being inadvertently committed.

Alternatively, a safer (but slightly more annoying) workflow is supported, wherein the git clone lives in its own segregated dir, and configuration files are then pushed in/out of the live `/config` directory via scripts.

### 1. Clone the repo

On your HAOS machine:
```
mkdir -p /config/git
cd /config/git
git clone https://github.com/richard-berg/hass-yaml-rberg.git
``` 

### 2. Generate the links  

Run the included `setup_symlinks.sh` script to link files into `/config`.  Any existing file/dir/link in `/config` will be **backed up** with a `.bak.YYYYMMDDHHMMSS` suffix (unless it's already a link to the correct target).

```
cd /config
./git/hass-yaml-rberg/setup_symlinks.sh
```
By default, it assumes that symlink targets should be drawn from the same directory as the script. You can optionally provide a different path to serve as the source of truth for HA config files:
```
./git/hass-yaml-rberg/setup_symlinks.sh /path/to/dir-with-hass-yamls/
```
The script will exit early if the given dir does not appear to be a valid HA config mirror (i.e. structured like this repo).

### 3. Verify 

After running the script:
```
find . -type l -exec ls -l {} +
```
You should see **relative symlinks** pointing into your git clone.

### 4. Maintenance

You'll need to re-run this script whenever you add a new file to git.

---

## Notes

- The setup script is **idempotent** — it can be safely rerun anytime without breaking existing links or losing data in existing files.
- If you add any dirs/files to this repo that are *not* intended to live in the HA `/config` filesystem, add them to `.symlink_ignore`

### 💡 Path info
Home Assistant >= 2022.3 can consume file symlinks transparently, as if they were normal files. However, it cannot traverse into directory symlinks. So at present, we must symlink every file individually, rather than entire dirs such as `blueprints/automation/richardberg`.  This is why you have to re-run the sync each time you create a blueprint (or any other new file).

For optimal compatibility with add-ons like [VSCode](https://community.home-assistant.io/t/home-assistant-community-add-on-visual-studio-code/107863) and [Advanced SSH](https://community.home-assistant.io/t/home-assistant-community-add-on-ssh-web-terminal/33820), keep both source & target underneath `/config`.  The top-level dirs available in such containers can vary; many of them are on mounted on ephemeral filesystems and thus **wiped** on restart.

All symlinks must be relative, rather than pointing to absolute paths under `/config`, in order to resolve correctly inside the HA Core container.  Don't assume it'll "see" the same path structure as your YAML development environment!  (e.g. Studio Code Server)  However, you *may* safely assume that the entire tree beneath `/config` is part of a single filesystemthat looks & behaves the same across containers, regardless what absolute path it might be mounted at.

Warning: some UI operations will overwrite your symlinks with regular files, rather than modifying the link target in-place.  I haven't been able to nail down each circumstance.  If this gets too annoying, you may want to revert to placing this repo directly in the `/config` root (see `revert_symlinks.sh`).  Or maybe experiment with hardlinks instead of symlinks (these instructions intentionally keep everything on the same filesystem in order to facilitate that.)