# team_glyphs.R - Team-to-glyph mapping
# Maps each team ID to a specific glyph drawing function.
#
# Each entry: teamId = "glyph_function_name"
# The glyph function must accept (cx, cy, s, col, bright) and return
# a list of ggplot2 layers.

TEAM_GLYPHS <- list(
  "r-package-review" = "glyph_team_r_package_review"
)
