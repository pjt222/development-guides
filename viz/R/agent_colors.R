# agent_colors.R - Per-agent cyberpunk neon color palette
# Each of 34 agents gets a unique color for glyph rendering.
# Follows the same hex format as DOMAIN_COLORS in utils.R.

AGENT_COLORS <- list(
  # ── Development ─────────────────────────────────────────────────────────
  "r-developer"             = "#00f0ff",   # cyan
  "code-reviewer"           = "#ff66aa",   # rose
  "web-developer"           = "#ff6633",   # coral
  "jigsawr-developer"       = "#22ddaa",   # teal-green

  # ── Security & Compliance ───────────────────────────────────────────────
  "security-analyst"        = "#ff3333",   # bright red
  "gxp-validator"           = "#ff3399",   # hot pink
  "auditor"                 = "#ff7744",   # burnt orange

  # ── Senior Reviewers ────────────────────────────────────────────────────
  "senior-researcher"       = "#ffaa00",   # amber
  "senior-data-scientist"   = "#aa66ff",   # violet
  "senior-software-developer" = "#44ddff", # sky blue
  "senior-web-designer"     = "#ffdd00",   # yellow
  "senior-ux-ui-specialist" = "#66ffcc",   # mint

  # ── Management & Infrastructure ─────────────────────────────────────────
  "project-manager"         = "#ff8844",   # orange
  "devops-engineer"         = "#00ff88",   # neon green
  "mlops-engineer"          = "#bb77ff",   # lavender violet

  # ── Alchemy, TCG & IP ──────────────────────────────────────────────────
  "alchemist"               = "#ffaa33",   # amber-gold
  "polymath"                = "#eedd44",   # golden-yellow
  "tcg-specialist"          = "#ff5577",   # card-red
  "ip-analyst"              = "#33ccff",   # ice-blue

  # ── Specialty ───────────────────────────────────────────────────────────
  "survivalist"             = "#88cc44",   # olive green
  "mystic"                  = "#dd44ff",   # magenta
  "martial-artist"          = "#ff4466",   # crimson
  "designer"                = "#ff88dd",   # pink
  "gardener"                = "#44bb66",   # spring green
  "librarian"               = "#8B7355",   # leather brown
  "putior-integrator"       = "#66dd88",   # spring green
  "swarm-strategist"        = "#aadd44",   # lime
  "shapeshifter"            = "#bb88ff",   # lavender
  "dog-trainer"             = "#ff9944",   # warm orange
  "mycologist"              = "#aa77cc",   # mushroom purple
  "prospector"              = "#ddaa33",   # gold
  "shaman"                  = "#9944ff",   # deep violet

  # ── Documentation & Shiny ──────────────────────────────────────────────
  "quarto-developer"        = "#33ddcc",   # teal
  "shiny-developer"         = "#3399ff"    # electric blue
)
