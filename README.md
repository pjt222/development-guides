# Development Guides

A comprehensive collection of guides for development work using WSL, Windows, and various development tools. These guides provide practical, tested solutions for common development environment setup and workflow challenges.

## Available Guides

### 🚀 [WSL-RStudio-Claude Code Integration](wsl-rstudio-claude-integration.md)
Complete setup guide for using Claude Code from WSL with RStudio on Windows:
- MCP server configuration with acquaint package
- Understanding the client-server relationship (Claude Code and Claude Desktop as independent MCP clients)
- Environment variable setup (.Renviron, .Rprofile)
- Path management between WSL and Windows
- Troubleshooting common issues
- Best practices for development workflow

### ⚙️ [General Development Setup](general-development-setup.md)
Essential setup for development across multiple environments:
- WSL2 configuration and optimization
- Shell environment (bash/zsh) setup
- Git configuration and SSH keys
- Essential development tools (tmux, fzf, etc.)
- Directory structure organization
- Language-specific setups (Node.js, Python, R)

### 📦 [R Package Development Best Practices](r-package-development-best-practices.md)
Comprehensive guide for developing high-quality R packages:
- Package structure and organization
- Documentation standards (roxygen2, vignettes)
- Testing strategies with testthat
- CRAN submission workflow
- CI/CD setup with GitHub Actions
- Common patterns and troubleshooting

### 📚 [Quick Reference](quick-reference.md)
Essential commands and shortcuts for daily development:
- WSL-Windows path conversions
- R package development commands
- Git operations
- Shell commands and file operations
- System monitoring and troubleshooting
- Keyboard shortcuts for various tools

## Getting Started

1. **New to this setup?** Start with [General Development Setup](general-development-setup.md)
2. **Working with R?** Follow [WSL-RStudio-Claude Code Integration](wsl-rstudio-claude-integration.md)
3. **Building R packages?** Use [R Package Development Best Practices](r-package-development-best-practices.md)
4. **Need quick commands?** Keep [Quick Reference](quick-reference.md) handy

## Key Principles

These guides follow several key principles:

- **Reproducibility**: Instructions that work consistently across different setups
- **Best Practices**: Based on successful real-world projects
- **Future-Proof**: Designed to work with upcoming projects
- **WSL-Centric**: Optimized for WSL-Windows hybrid development
- **Tool Integration**: Seamless workflow between different development tools

## Contributing

Contributions are welcome! If you have improvements or additional tips:

1. Fork the repository and create a feature branch
2. Update the relevant guides with your discoveries
3. Test your instructions on a fresh environment
4. Submit a pull request with clear descriptions of changes
5. Share solutions to common problems you've encountered

Please maintain the existing structure and style when contributing.

## Directory Structure

```
development-guides/
├── README.md                              # This file
├── wsl-rstudio-claude-integration.md     # Claude Code + R setup
├── general-development-setup.md          # Basic development environment
├── r-package-development-best-practices.md # R package development
└── quick-reference.md                    # Command cheat sheet
```

## Proven Approaches

These guides are based on successful implementations including:

- **R package development**: Complete WSL-RStudio integration workflows
- **AI-assisted development**: Using Claude Code for enhanced productivity
- **Multi-platform testing**: CRAN submission and CI/CD workflows
- **Reproducible environments**: Clean, documented development setups
- **Cross-platform compatibility**: Seamless Windows-WSL workflows

## Future Enhancements

Consider adding guides for:
- Python package development
- Web development with Node.js/React
- Docker containerization
- Database integration
- Specific domain workflows (data science, web apps, etc.)

## License

These guides are provided under the MIT License. Feel free to use, modify, and distribute them as needed.

## Feedback and Support

If you encounter issues or have suggestions:

1. Check the troubleshooting sections in relevant guides
2. Search existing issues on the repository
3. Create a new issue with detailed information about your environment
4. Consider contributing a solution if you find one

---

*These guides are living documents. They evolve based on community feedback and new discoveries.*