
# Richard's Home Assistant Configuration
 
This repository contains my **Home Assistant (HA) configuration files**. It is designed to be a **partial mirror of the `/config` dir** in HAOS, enabling version control, safe backups, and easy deployment to new installations.

---

## Usage  

### 1. Clone the repo

On your HAOS machine:
```
cd /config/git
git clone https://github.com/richard-berg/hass-yaml-rberg.git
``` 

#### 💡 Path info
Home Assistant >= 2022.3 can consume symlinks transparently as if they were normal files/directories. 

For optimal compatibility with add-ons like [VSCode](https://community.home-assistant.io/t/home-assistant-community-add-on-visual-studio-code/107863) and [Advanced SSH](https://community.home-assistant.io/t/home-assistant-community-add-on-ssh-web-terminal/33820), keep both source & target underneath `/config`.  The top-level dirs available in such containers can vary; many of them are on mounted on ephemeral filesystems and thus **wiped** on restart.

### 2. Generate the symlinks  

Run the included `setup_symlinks.sh` script to link files and directories into `/config`.  Existing files or directories in `/config` will be **backed up** with a `.bak` suffix (if they are not already symlinks). 

```
/config/git/hass-yaml-rberg/setup_symlinks.sh
```
By default, it assumes that symlink targets should be drawn from the same directory as the script. You can optionally provide a different path to serve as the source of truth for HA config files:
```
./setup_symlinks.sh /path/to/dir-with-hass-yamls/
```
The script will exit early if the given dir does not appear to be a valid HA config mirror (i.e. structured like this repo).

### 3. Verify 

After running the script:
```
ls -l /config
tree /config/blueprints/automation
```
You should see **absolute symlinks** pointing into your git clone.

---

## Notes

- The setup script is **idempotent** — it can be safely rerun anytime without breaking existing symlinks.
- Only **Home Assistant-relevant files and directories** are mirrored. Non-HA files like `.vscode`, `LICENSE`, or `setup_symlinks.sh` itself are **ignored**.
