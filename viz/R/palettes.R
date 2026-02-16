# palettes.R - Multi-palette color generation using viridisLite
# Generates domain and agent colors for 9 palettes: cyberpunk + 8 viridis variants.
# Single source of truth for palette colors shared by R rendering and JS themes.

# ── Palette names ─────────────────────────────────────────────────────────
PALETTE_NAMES <- c(
  "cyberpunk", "viridis", "magma", "inferno",
  "plasma", "cividis", "mako", "rocket", "turbo"
)

# ── Domain order (alphabetical, 32 domains) ──────────────────────────────
PALETTE_DOMAIN_ORDER <- c(
  "alchemy", "animal-training", "bushcraft", "compliance", "containerization",
  "crafting", "data-serialization", "defensive", "design", "devops", "esoteric",
  "gardening", "general", "git", "intellectual-property", "jigsawr", "library-science",
  "mcp-integration", "mlops", "morphic", "mycology", "observability", "project-management",
  "prospecting", "r-packages", "reporting", "review", "shiny", "swarm", "tcg", "web-dev",
  "workflow-visualization"
)

# ── Agent order (alphabetical, 34 agents) ─────────────────────────────────
PALETTE_AGENT_ORDER <- c(
  "alchemist", "auditor", "code-reviewer", "designer", "dog-trainer", "devops-engineer",
  "gardener", "gxp-validator", "ip-analyst", "jigsawr-developer", "librarian",
  "martial-artist", "mlops-engineer", "mycologist", "mystic", "polymath",
  "project-manager", "prospector", "putior-integrator", "quarto-developer",
  "r-developer", "security-analyst", "shaman", "senior-data-scientist",
  "senior-researcher", "senior-software-developer", "senior-ux-ui-specialist",
  "senior-web-designer", "shapeshifter", "shiny-developer", "survivalist",
  "swarm-strategist", "tcg-specialist", "web-developer"
)

# ── Team order (alphabetical, 6 teams) ────────────────────────────────────
PALETTE_TEAM_ORDER <- c(
  "ai-self-care", "devops-platform-engineering", "fullstack-web-dev",
  "gxp-compliance-validation", "ml-data-science-review", "r-package-review"
)

# ── viridisLite option mapping ────────────────────────────────────────────
VIRIDIS_OPTIONS <- list(
  viridis = "D",
  magma   = "A",
  inferno = "B",
  plasma  = "C",
  cividis = "E",
  mako    = "F",
  rocket  = "G",
  turbo   = "H"
)

#' Get palette colors for a given palette name
#'
#' @param name Palette name (one of PALETTE_NAMES)
#' @return List with $domains, $agents, and $teams (named lists of id->hex)
get_palette_colors <- function(name) {
  if (!name %in% PALETTE_NAMES) {
    stop("Unknown palette: ", name, ". Must be one of: ",
         paste(PALETTE_NAMES, collapse = ", "), call. = FALSE)
  }

  if (name == "cyberpunk") {
    return(get_cyberpunk_colors())
  }

  get_viridis_colors(name)
}

#' Get cyberpunk palette (hand-tuned neon colors)
get_cyberpunk_colors <- function() {
  domains <- list(
    "alchemy"                = "#ffaa33",
    "animal-training"        = "#ff9944",
    "bushcraft"              = "#88cc44",
    "compliance"             = "#ff3366",
    "containerization"       = "#44ddff",
    "crafting"               = "#cc8855",
    "data-serialization"     = "#44aaff",
    "defensive"              = "#ff4444",
    "design"                 = "#ff88dd",
    "devops"                 = "#00ff88",
    "esoteric"               = "#dd44ff",
    "gardening"              = "#44bb66",
    "general"                = "#ccccff",
    "git"                    = "#66ffcc",
    "intellectual-property"  = "#33ccff",
    "jigsawr"                = "#22ddaa",
    "library-science"        = "#8B7355",
    "mcp-integration"        = "#00ccaa",
    "mlops"                  = "#aa66ff",
    "morphic"                = "#bb88ff",
    "mycology"               = "#aa77cc",
    "observability"          = "#ffaa00",
    "project-management"     = "#ff8844",
    "prospecting"            = "#ddaa33",
    "r-packages"             = "#00f0ff",
    "reporting"              = "#ffdd00",
    "review"                 = "#ff66aa",
    "shiny"                  = "#3399ff",
    "swarm"                  = "#aadd44",
    "tcg"                    = "#ff5577",
    "web-dev"                = "#ff6633",
    "workflow-visualization" = "#66dd88"
  )

  agents <- list(
    "alchemist"                 = "#ffaa33",
    "auditor"                   = "#ff7744",
    "code-reviewer"             = "#ff66aa",
    "designer"                  = "#ff88dd",
    "dog-trainer"               = "#ff9944",
    "devops-engineer"           = "#00ff88",
    "gardener"                  = "#44bb66",
    "gxp-validator"             = "#ff3399",
    "ip-analyst"                = "#33ccff",
    "jigsawr-developer"         = "#22ddaa",
    "librarian"                 = "#8B7355",
    "martial-artist"            = "#ff4466",
    "mlops-engineer"            = "#bb77ff",
    "mycologist"                = "#aa77cc",
    "mystic"                    = "#dd44ff",
    "polymath"                  = "#eedd44",
    "project-manager"           = "#ff8844",
    "prospector"                = "#ddaa33",
    "putior-integrator"         = "#66dd88",
    "quarto-developer"          = "#33ddcc",
    "r-developer"               = "#00f0ff",
    "security-analyst"          = "#ff3333",
    "shaman"                    = "#9944ff",
    "senior-data-scientist"     = "#aa66ff",
    "senior-researcher"         = "#ffaa00",
    "senior-software-developer" = "#44ddff",
    "senior-ux-ui-specialist"   = "#66ffcc",
    "senior-web-designer"       = "#ffdd00",
    "shapeshifter"              = "#bb88ff",
    "shiny-developer"           = "#3399ff",
    "survivalist"               = "#88cc44",
    "swarm-strategist"          = "#aadd44",
    "tcg-specialist"            = "#ff5577",
    "web-developer"             = "#ff6633"
  )

  teams <- list(
    "ai-self-care"                = "#da70d6",   # orchid purple
    "devops-platform-engineering" = "#ff4500",   # orange-red
    "fullstack-web-dev"           = "#ffcc00",   # golden yellow
    "gxp-compliance-validation"   = "#ff6ec7",   # hot pink
    "ml-data-science-review"      = "#7b68ee",   # medium slate blue
    "r-package-review"            = "#00ccff"    # bright cyan
  )

  list(domains = domains, agents = agents, teams = teams)
}

#' Get viridis-family palette colors
#' @param name Palette name (viridis, magma, inferno, plasma, cividis, mako, rocket, turbo)
get_viridis_colors <- function(name) {
  opt <- VIRIDIS_OPTIONS[[name]]
  if (is.null(opt)) stop("Not a viridis palette: ", name, call. = FALSE)

  n_domains <- length(PALETTE_DOMAIN_ORDER)
  n_agents <- length(PALETTE_AGENT_ORDER)
  n_teams <- length(PALETTE_TEAM_ORDER)

  # Generate domain colors evenly spaced across the colormap

  domain_hexes <- viridisLite::viridis(n_domains, option = opt)

  # Generate agent colors with an offset to distinguish from domain colors
  # Use 80% of the range starting at 10% to avoid extremes
  agent_hexes <- viridisLite::viridis(n_agents, option = opt,
                                       begin = 0.1, end = 0.9)

  # Generate team colors from a distinct range to stand out
  team_hexes <- viridisLite::viridis(max(n_teams, 3), option = opt,
                                      begin = 0.3, end = 0.7)

  domains <- setNames(as.list(substr(domain_hexes, 1, 7)), PALETTE_DOMAIN_ORDER)
  agents <- setNames(as.list(substr(agent_hexes, 1, 7)), PALETTE_AGENT_ORDER)
  teams <- setNames(as.list(substr(team_hexes[seq_len(n_teams)], 1, 7)),
                    PALETTE_TEAM_ORDER)

  list(domains = domains, agents = agents, teams = teams)
}

#' Export all palette colors to JSON
#' @param out_path Output JSON file path
export_palette_json <- function(out_path) {
  palettes <- list()
  for (name in PALETTE_NAMES) {
    palettes[[name]] <- get_palette_colors(name)
  }

  result <- list(
    meta = list(
      generated = format(Sys.time(), "%Y-%m-%dT%H:%M:%S"),
      palette_count = length(PALETTE_NAMES),
      domain_count = length(PALETTE_DOMAIN_ORDER),
      agent_count = length(PALETTE_AGENT_ORDER),
      team_count = length(PALETTE_TEAM_ORDER),
      palettes = PALETTE_NAMES,
      domains = PALETTE_DOMAIN_ORDER,
      agents = PALETTE_AGENT_ORDER,
      teams = PALETTE_TEAM_ORDER
    ),
    palettes = palettes
  )

  dir.create(dirname(out_path), recursive = TRUE, showWarnings = FALSE)
  jsonlite::write_json(result, out_path, pretty = TRUE, auto_unbox = TRUE)
  log_msg(sprintf("Exported %d palettes to %s", length(PALETTE_NAMES), out_path))
  invisible(out_path)
}
