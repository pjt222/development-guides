# General Development Setup Guide

This guide covers the essential setup for development work across multiple projects using WSL, Windows, and various development tools.

## Table of Contents
1. [WSL2 Setup](#wsl2-setup)
2. [Essential Tools](#essential-tools)
3. [Directory Structure](#directory-structure)
4. [Git Configuration](#git-configuration)
5. [Shell Configuration](#shell-configuration)
6. [Editor Setup](#editor-setup)
7. [Language-Specific Setup](#language-specific-setup)
8. [Productivity Tools](#productivity-tools)

## WSL2 Setup

### Installation
```powershell
# In Windows PowerShell as Administrator
wsl --install
wsl --set-default-version 2
```

### Configure WSL
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential curl wget git
```

### WSL Configuration File
Create `~/.wslconfig` in Windows home directory:
```ini
[wsl2]
memory=8GB
processors=4
localhostForwarding=true
```

## Essential Tools

### Package Managers
```bash
# APT (already installed)
sudo apt update

# Homebrew (optional)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
```

### Development Tools
```bash
# Version control
sudo apt install -y git git-lfs

# Build tools
sudo apt install -y cmake make gcc g++ 

# Utilities
sudo apt install -y htop tree jq ripgrep fd-find bat

# Create useful aliases
echo "alias fd='fdfind'" >> ~/.bashrc
echo "alias bat='batcat'" >> ~/.bashrc
```

## Directory Structure

### Recommended Project Organization
```
/path/to/your/dev/
├── personal/             # Personal projects
│   ├── project1/
│   ├── project2/
│   └── development-guides/
├── work/                 # Work projects
├── learning/             # Tutorials and courses
├── sandbox/              # Experiments
└── tools/                # Development tools
```

### Create Structure
```bash
# Create base directories (adjust path as needed)
mkdir -p /path/to/your/dev/{personal,work,learning,sandbox,tools}

# Set up quick navigation
echo 'export DEV_HOME="/path/to/your/dev"' >> ~/.bashrc
echo 'alias dev="cd $DEV_HOME"' >> ~/.bashrc
echo 'alias devp="cd $DEV_HOME/personal"' >> ~/.bashrc
```

## Git Configuration

### Global Git Config
```bash
# Set identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui auto

# Set default editor
git config --global core.editor "vim"  # or nano, code, etc.

# Useful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.last 'log -1 HEAD'
git config --global alias.unstage 'reset HEAD --'

# Line ending configuration for Windows
git config --global core.autocrlf input
```

### SSH Key Setup
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Add this to GitHub/GitLab/etc.
```

## Shell Configuration

### Bash Configuration
Add to `~/.bashrc`:
```bash
# History settings
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoredups:erasedups
shopt -s histappend

# Prompt customization
PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '

# Aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'

# Functions
mkcd() { mkdir -p "$1" && cd "$1"; }
extract() {
    if [ -f $1 ]; then
        case $1 in
            *.tar.bz2) tar xjf $1 ;;
            *.tar.gz) tar xzf $1 ;;
            *.zip) unzip $1 ;;
            *.rar) unrar x $1 ;;
            *) echo "'$1' cannot be extracted" ;;
        esac
    else
        echo "'$1' is not a valid file"
    fi
}

# Path additions
export PATH="$HOME/bin:$HOME/.local/bin:$PATH"
```

### Zsh Alternative (Optional)
```bash
# Install Zsh and Oh My Zsh
sudo apt install -y zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Set as default shell
chsh -s $(which zsh)
```

## Editor Setup

### VS Code
```bash
# Install VS Code in Windows, then:
code .  # Opens current directory in VS Code

# Useful extensions to install:
# - Remote - WSL
# - GitLens
# - EditorConfig
# - Prettier
```

### Vim/Neovim
```bash
# Install Neovim
sudo apt install -y neovim

# Basic configuration
mkdir -p ~/.config/nvim
cat > ~/.config/nvim/init.vim << 'EOF'
set number
set relativenumber
set expandtab
set tabstop=2
set shiftwidth=2
set smartindent
set ignorecase
set smartcase
set hlsearch
set incsearch
EOF
```

## Language-Specific Setup

### Node.js (via nvm)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js
nvm install --lts
nvm use --lts

# Global packages
npm install -g yarn pnpm typescript ts-node
```

### Python (via pyenv)
```bash
# Install dependencies
sudo apt install -y make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
libffi-dev liblzma-dev

# Install pyenv
curl https://pyenv.run | bash

# Add to ~/.bashrc
echo 'export PATH="$HOME/.pyenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.bashrc

# Install Python
pyenv install 3.11.0
pyenv global 3.11.0
```

### R (Using Windows R from WSL)
See `wsl-rstudio-claude-integration.md` for detailed setup.

### Docker
```bash
# Install Docker Desktop on Windows
# Enable WSL2 integration in Docker Desktop settings

# Verify in WSL
docker --version
docker compose version
```

## Productivity Tools

### Terminal Multiplexer (tmux)
```bash
# Install tmux
sudo apt install -y tmux

# Basic .tmux.conf
cat > ~/.tmux.conf << 'EOF'
# Remap prefix to Ctrl-a
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# Split panes using | and -
bind | split-window -h
bind - split-window -v

# Enable mouse mode
set -g mouse on

# Don't rename windows automatically
set-option -g allow-rename off
EOF
```

### fzf (Fuzzy Finder)
```bash
# Install fzf
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# Useful aliases with fzf
echo "alias preview='fzf --preview \"batcat --color=always {}\"'" >> ~/.bashrc
```

### Directory Navigation (z)
```bash
# Install z
curl -fsSL https://raw.githubusercontent.com/rupa/z/master/z.sh -o ~/.z.sh
echo '. ~/.z.sh' >> ~/.bashrc

# Usage: z <partial-directory-name>
```

### Claude Code CLI
```bash
# Follow official installation instructions
# Usually involves downloading and adding to PATH
```

## Environment Variables

Create `~/.env` for project-specific variables:
```bash
# Development settings
export EDITOR=vim
export BROWSER=wslview

# API Keys (example structure)
# export GITHUB_TOKEN=""
# export OPENAI_API_KEY=""

# Project paths
export PROJECTS="$DEV_HOME/personal"
export WORK="$DEV_HOME/work"

# Load in .bashrc
echo '[ -f ~/.env ] && source ~/.env' >> ~/.bashrc
```

## Backup and Sync

### Dotfiles Management
```bash
# Create dotfiles repo
mkdir -p $DEV_HOME/personal/dotfiles
cd $DEV_HOME/personal/dotfiles
git init

# Link files
ln -s ~/.bashrc bashrc
ln -s ~/.gitconfig gitconfig
ln -s ~/.tmux.conf tmux.conf

# Track with git
git add .
git commit -m "Initial dotfiles"
```

### WSL Backup
```powershell
# In PowerShell (adjust backup location as needed)
wsl --export Ubuntu C:\Backups\wsl-ubuntu-backup.tar
```

## Troubleshooting

### Common Issues

1. **Slow file access**: Use WSL2 filesystem (`~/`) instead of `/mnt/` when possible
2. **Line endings**: Configure Git and editors for LF endings
3. **Path issues**: Always use forward slashes, even for Windows paths
4. **Permission errors**: Check file ownership with `ls -la`

### Performance Tips

1. Store projects in WSL filesystem for better performance
2. Exclude WSL directories from Windows Defender
3. Use `localhost` to access services between WSL and Windows
4. Limit WSL2 memory usage in `.wslconfig` if needed

## Quick Reference Card

```bash
# Navigation
cd $DEV_HOME/personal   # Go to personal projects
z project-name          # Jump to project (after visiting once)

# Git
git st                  # Status (alias)
git last               # Show last commit

# System
htop                   # System monitor
df -h                  # Disk usage
free -h                # Memory usage

# Search
rg "pattern"           # Ripgrep search
fd "filename"          # Find files

# Tmux
tmux new -s name       # New session
tmux a -t name         # Attach to session
Ctrl-a |               # Split vertical
Ctrl-a -               # Split horizontal
```