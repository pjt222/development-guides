# Quick Reference Guide

Essential commands and shortcuts for development work across different environments and tools.

## Table of Contents
1. [WSL-Windows Integration](#wsl-windows-integration)
2. [R Package Development](#r-package-development)
3. [Git Commands](#git-commands)
4. [Claude Code](#claude-code)
5. [Shell Commands](#shell-commands)
6. [File Operations](#file-operations)
7. [System Information](#system-information)
8. [Troubleshooting](#troubleshooting)

## WSL-Windows Integration

### Path Conversion
```bash
# Windows to WSL
C:\Users\Name\Documents  →  /mnt/c/Users/Name/Documents
D:\dev\projects          →  /mnt/d/dev/projects

# Access Windows R from WSL
"/mnt/c/Program Files/R/R-4.5.0/bin/R.exe"
"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe"
```

### Common Paths
```bash
# Development directory (adjust path as needed)
cd /path/to/your/projects

# Windows home from WSL
cd /mnt/c/Users/$USER

# Open current directory in Windows Explorer
explorer.exe .

# Open file with Windows default app
cmd.exe /c start filename.txt
```

## R Package Development

### Essential Commands
```r
# Development cycle
devtools::load_all()        # Load package for development
devtools::document()        # Update documentation
devtools::test()           # Run tests
devtools::check()          # Full package check
devtools::install()        # Install package

# Quick checks
devtools::test_file("tests/testthat/test-feature.R")
devtools::run_examples()
devtools::spell_check()
```

### CRAN Submission
```r
# Pre-submission checks
devtools::check_win_devel()     # Windows builder
devtools::check_win_release()   # Windows builder
rhub::rhub_check()             # R-hub multi-platform
urlchecker::url_check()        # Check URLs

# Submission
devtools::release()            # Interactive CRAN submission
```

### Common File Operations
```r
# Create files
usethis::use_r("function_name")           # New R file
usethis::use_test("function_name")        # New test file
usethis::use_vignette("guide_name")       # New vignette

# Setup functions
usethis::use_mit_license()                # Add MIT license
usethis::use_readme_md()                  # Create README
usethis::use_news_md()                    # Create NEWS
usethis::use_github_action_check_standard() # CI/CD
```

## Git Commands

### Daily Operations
```bash
# Status and changes
git status                 # Show working tree status
git diff                   # Show unstaged changes
git diff --staged          # Show staged changes
git log --oneline -10      # Recent commits

# Staging and committing
git add .                  # Stage all changes - CAUTION: Review first!
git status                 # Always review what you're staging
git add filename           # Stage specific file
git commit -m "message"    # Commit with message
git commit --amend         # Amend last commit

# Branching
git branch                 # List branches
git checkout -b new-branch # Create and switch to branch
git checkout main          # Switch to main branch
git merge feature-branch   # Merge branch
```

### Useful Aliases
```bash
# Add to ~/.gitconfig
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.last 'log -1 HEAD'
git config --global alias.unstage 'reset HEAD --'
```

### Remote Operations
```bash
git remote -v              # List remotes
git fetch origin           # Fetch changes
git pull origin main       # Pull and merge
git push origin main       # Push to remote
git push -u origin branch  # Push new branch
```

## Claude Code

### Session Management
```bash
# Start Claude Code
claude

# In R session (to enable MCP)
acquaint::mcp_session()
```

### MCP Server Management
```bash
# Check available MCP servers
cat /mnt/c/Users/phtho/AppData/Roaming/Claude/claude_desktop_config.json

# Verify R MCP server status
Rscript -e "acquaint::mcp_session()"

# List R sessions available to MCP
# (Use Claude Code tools to check)
```

### Available MCP Servers
- **r-acquaint**: R integration (data analysis, package management, help system)
- **hf-mcp-server**: Hugging Face integration (AI/ML models, datasets, transformers)

### Best Practices
- Keep `.Rprofile` with conditional acquaint loading
- Include `CLAUDE.md` in project root
- Use descriptive commit messages
- Maintain todo lists for complex tasks
- Check MCP server status when troubleshooting Claude integration

## Shell Commands

### Navigation
```bash
# Directory operations
pwd                    # Print working directory
cd /path/to/directory  # Change directory
cd ~                   # Go to home directory
cd -                   # Go to previous directory
ls -la                 # List files with details
tree                   # Show directory tree

# Quick navigation
z project-name         # Jump to frequently used directory
..                     # Go up one directory
...                    # Go up two directories
```

### File Operations
```bash
# Creating
mkdir directory        # Create directory
mkdir -p path/to/dir   # Create nested directories
touch filename         # Create empty file
cp source dest         # Copy file
cp -r source/ dest/    # Copy directory recursively
mv source dest         # Move/rename

# Viewing
cat filename           # Display file content
less filename          # Page through file
head -n 10 filename    # First 10 lines
tail -n 10 filename    # Last 10 lines
tail -f filename       # Follow file (for logs)
```

### Search and Filter
```bash
# Text search
grep "pattern" file        # Search in file
grep -r "pattern" dir/     # Recursive search
rg "pattern"              # Ripgrep (faster)
rg -t r "pattern"         # Search only R files

# File search
find . -name "*.R"        # Find R files
fd "pattern"              # User-friendly find
fd -e R                   # Find by extension

# Filter and process
cat file | grep pattern   # Filter output
sort filename            # Sort lines
uniq filename            # Remove duplicates
wc -l filename           # Count lines
```

## File Operations

### Permissions
```bash
# Check permissions
ls -la filename

# Change permissions
chmod +x script.sh     # Make executable
chmod 644 file.txt     # rw-r--r--
chmod 755 directory   # rwxr-xr-x

# Change ownership
chown user:group file  # Change owner and group
```

### Archives
```bash
# Create archives
tar -czf archive.tar.gz directory/    # Create compressed tar
zip -r archive.zip directory/         # Create zip

# Extract archives
tar -xzf archive.tar.gz               # Extract tar.gz
unzip archive.zip                     # Extract zip
```

### Disk Usage
```bash
du -sh directory       # Directory size
du -sh *               # Size of all items
df -h                  # Disk space usage
ncdu                   # Interactive disk usage analyzer
```

## System Information

### System Status
```bash
# System information
uname -a               # System information
lsb_release -a         # Linux distribution info
whoami                 # Current user
id                     # User and group IDs

# Process management
ps aux                 # List all processes
ps aux | grep process  # Find specific process
top                    # Real-time process viewer
htop                   # Better process viewer
kill PID               # Kill process by ID
killall process_name   # Kill process by name
```

### Resource Monitoring
```bash
# Memory and CPU
free -h                # Memory usage
cat /proc/cpuinfo      # CPU information
nproc                  # Number of processors

# Network
ping google.com        # Test connectivity
wget url               # Download file
curl -I url            # Get headers only
```

## Troubleshooting

### R Package Issues
```bash
# Check R installation
which R                # R location
R --version           # R version

# Environment variables
echo $RSTUDIO_PANDOC  # Check pandoc path
printenv | grep R     # All R-related variables

# Package library
Rscript -e ".libPaths()"              # Library paths
Rscript -e "installed.packages()[1:5,]" # Installed packages
```

### WSL Issues
```bash
# WSL status
wsl --list --verbose   # List WSL distributions
wsl --status          # WSL status

# File system
mount | grep mnt      # Check mounted drives
df -h /mnt/c         # Check C: drive space

# Network
ip addr               # IP addresses
cat /etc/resolv.conf  # DNS settings
```

### Git Issues
```bash
# Configuration
git config --list     # Show all config
git config user.name  # Show username
git config user.email # Show email

# Remote issues
git remote show origin    # Show remote details
git fetch --dry-run       # Test fetch without changes
git status --porcelain    # Machine-readable status
```

### Permission Issues
```bash
# File ownership
ls -la filename        # Check owner and permissions
sudo chown $USER file  # Take ownership
sudo chmod 644 file    # Set permissions

# WSL file permissions
# If Windows files show wrong permissions in WSL:
# Add to /etc/wsl.conf:
# [automount]
# options = "metadata,umask=22,fmask=11"
```

## Keyboard Shortcuts

### Terminal (Bash)
```
Ctrl+A          # Beginning of line
Ctrl+E          # End of line
Ctrl+K          # Delete to end of line
Ctrl+U          # Delete to beginning of line
Ctrl+W          # Delete previous word
Ctrl+R          # Search command history
Ctrl+L          # Clear screen
Ctrl+C          # Cancel current command
Ctrl+Z          # Suspend current command
```

### tmux
```
Ctrl+A |        # Split vertically
Ctrl+A -        # Split horizontally
Ctrl+A arrows   # Navigate panes
Ctrl+A d        # Detach session
Ctrl+A $        # Rename session
```

### VS Code
```
Ctrl+`          # Open terminal
Ctrl+Shift+`    # New terminal
F1              # Command palette
Ctrl+P          # Quick open file
Ctrl+Shift+P    # Command palette
```

## Environment Variables

### Common Variables
```bash
# View environment
printenv              # All environment variables
echo $PATH           # PATH variable
echo $HOME           # Home directory
echo $USER           # Current user

# Set temporarily
export VAR=value     # Set for current session

# Set permanently (add to ~/.bashrc)
echo 'export VAR=value' >> ~/.bashrc
source ~/.bashrc     # Reload configuration
```

## Package Managers

### APT (Ubuntu/Debian)
```bash
sudo apt update              # Update package list
sudo apt upgrade             # Upgrade packages
sudo apt install package     # Install package
sudo apt remove package      # Remove package
sudo apt search package      # Search packages
sudo apt list --installed    # List installed packages
```

### npm/yarn/pnpm
```bash
# npm
npm install                  # Install dependencies
npm install -g package       # Install globally
npm list -g --depth=0       # List global packages

# yarn
yarn install                 # Install dependencies
yarn add package            # Add package
yarn global add package     # Install globally

# pnpm
pnpm install                # Install dependencies
pnpm add package            # Add package
pnpm list -g                # List global packages
```

This quick reference covers the most commonly used commands for daily development work. Keep it handy for quick lookups!