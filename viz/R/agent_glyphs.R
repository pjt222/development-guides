# agent_glyphs.R - Agent-to-glyph mapping
# Maps each of 28 agent IDs to a specific glyph drawing function.
#
# Each entry: agentId = "glyph_function_name"
# The glyph function must accept (cx, cy, s, col, bright) and return
# a list of ggplot2 layers.

AGENT_GLYPHS <- list(
  # ── Development ─────────────────────────────────────────────────────────
  "r-developer"               = "glyph_agent_r_dev",
  "code-reviewer"             = "glyph_agent_code_review",
  "web-developer"             = "glyph_agent_web_dev",

  # ── Jigsawr ────────────────────────────────────────────────────────────
  "jigsawr-developer"         = "glyph_agent_jigsawr",

  # ── Security & Compliance ───────────────────────────────────────────────
  "security-analyst"          = "glyph_agent_security",
  "gxp-validator"             = "glyph_agent_gxp",
  "auditor"                   = "glyph_agent_auditor",

  # ── Senior Reviewers ────────────────────────────────────────────────────
  "senior-researcher"         = "glyph_agent_researcher",
  "senior-data-scientist"     = "glyph_agent_data_sci",
  "senior-software-developer" = "glyph_agent_architect",
  "senior-web-designer"       = "glyph_agent_web_design",
  "senior-ux-ui-specialist"   = "glyph_agent_ux",

  # ── Management & Infrastructure ─────────────────────────────────────────
  "project-manager"           = "glyph_agent_pm",
  "devops-engineer"           = "glyph_agent_devops",
  "mlops-engineer"            = "glyph_agent_mlops",

  # ── Alchemy, TCG & IP ──────────────────────────────────────────────────
  "alchemist"                 = "glyph_agent_alchemist",
  "polymath"                  = "glyph_agent_polymath",
  "tcg-specialist"            = "glyph_agent_tcg",
  "ip-analyst"                = "glyph_agent_ip",

  # ── Specialty ───────────────────────────────────────────────────────────
  "survivalist"               = "glyph_agent_survivalist",
  "mystic"                    = "glyph_agent_mystic",
  "martial-artist"            = "glyph_agent_martial",
  "designer"                  = "glyph_agent_designer",
  "gardener"                  = "glyph_agent_gardener",
  "putior-integrator"         = "glyph_agent_putior",
  "swarm-strategist"          = "glyph_agent_swarm",
  "shapeshifter"              = "glyph_agent_shifter",

  # ── Documentation ──────────────────────────────────────────────────────
  "quarto-developer"          = "glyph_agent_quarto"
)
