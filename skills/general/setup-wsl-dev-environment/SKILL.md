---
name: setup-wsl-dev-environment
description: >
  Set up a WSL2 development environment on Windows including shell
  configuration, essential tools, Git, SSH keys, Node.js, Python,
  and cross-platform path management.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: general
  complexity: intermediate
  language: multi
  tags: wsl, windows, linux, development, setup
---

# Set Up WSL Development Environment

Configure a complete WSL2 development environment for cross-platform work.

## When to Use

- Setting up a new Windows machine for development
- Configuring WSL2 for the first time
- Adding development tools to an existing WSL installation
- Setting up cross-platform workflows (WSL + Windows tools)

## Inputs

- **Required**: Windows 10/11 with WSL2 support
- **Optional**: Preferred Linux distribution (default: Ubuntu)
- **Optional**: Languages to set up (Node.js, Python, R)
- **Optional**: Additional tools (Docker, tmux, fzf)

## Procedure

### Step 1: Install WSL2

In PowerShell (Administrator):

```powershell
wsl --install
wsl --set-default-version 2
```

Restart if prompted. Ubuntu installs by default.

### Step 2: Configure WSL Resource Limits

Create `~/.wslconfig` in Windows home directory:

```ini
[wsl2]
memory=8GB
processors=4
localhostForwarding=true
```

### Step 3: Update and Install Essentials

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  git-lfs \
  vim \
  htop \
  tree \
  jq \
  ripgrep \
  fd-find \
  unzip \
  zip
```

Create useful aliases:

```bash
echo 'alias fd="fdfind"' >> ~/.bashrc
```

### Step 4: Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.autocrlf input
git config --global color.ui auto
git config --global core.editor vim
```

### Step 5: Set Up SSH Keys

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: Settings > SSH and GPG keys
```

Test: `ssh -T git@github.com`

### Step 6: Install Node.js (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

### Step 7: Install Python (via pyenv)

```bash
# Install build dependencies
sudo apt install -y make libssl-dev zlib1g-dev libbz2-dev \
  libreadline-dev libsqlite3-dev libncursesw5-dev xz-utils \
  tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

curl https://pyenv.run | bash

# Add to ~/.bashrc
echo 'export PATH="$HOME/.pyenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

pyenv install 3.12
pyenv global 3.12
```

### Step 8: Configure Shell

Add to `~/.bashrc`:

```bash
# History
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoredups:erasedups
shopt -s histappend

# Navigation aliases
alias ll='ls -alF'
alias la='ls -A'
alias ..='cd ..'
alias ...='cd ../..'

# Development paths
export DEV_HOME="/mnt/d/dev/p"
alias dev='cd $DEV_HOME'

# Functions
mkcd() { mkdir -p "$1" && cd "$1"; }

# PATH additions
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

### Step 9: Set Up Claude Code CLI

```bash
# Add Claude CLI to PATH (after installation)
echo 'export PATH="$HOME/.claude/local/node_modules/.bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
which claude
```

### Step 10: Cross-Platform Path Reference

| Windows | WSL |
|---------|-----|
| `C:\Users\Name` | `/mnt/c/Users/Name` |
| `D:\dev\projects` | `/mnt/d/dev/projects` |
| `%APPDATA%` | `/mnt/c/Users/Name/AppData/Roaming` |

Open Windows Explorer from WSL: `explorer.exe .`

## Validation

- [ ] WSL2 running with correct distribution
- [ ] Git configured with correct identity
- [ ] SSH key added to GitHub and connection verified
- [ ] Node.js installed and working
- [ ] Python installed and working
- [ ] Shell aliases and functions work
- [ ] Claude Code CLI accessible

## Common Pitfalls

- **Slow file access on `/mnt/`**: Store frequently accessed projects in WSL filesystem (`~/`) for better performance. Use `/mnt/` for projects shared with Windows tools.
- **Line endings**: `core.autocrlf=input` prevents CRLF issues. Configure editors to use LF.
- **Permission issues**: Files on `/mnt/` may show incorrect permissions. Add to `/etc/wsl.conf`: `[automount]\noptions = "metadata,umask=22,fmask=11"`
- **Windows Defender**: Exclude WSL directories from real-time scanning for better performance.

## Related Skills

- `configure-git-repository` - detailed Git repository setup
- `configure-mcp-server` - MCP setup requires WSL environment
- `write-claude-md` - configure AI assistant for projects
