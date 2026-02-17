# team_render.R - Team icon rendering (thin wrapper over render_glyph)
# Uses TEAM_COLORS and TEAM_GLYPHS; delegates to shared render_glyph()
# in render.R for canvas setup, glow, and PNG-to-WebP conversion.

#' Render a single team icon to WebP
#'
#' @param team_id Team identifier (determines both color and glyph)
#' @param out_path Output file path (WebP)
#' @param glow_sigma Glow blur radius (default 8)
#' @param size_px Output dimension in pixels (default 1024)
#' @param color Optional explicit hex color (overrides TEAM_COLORS lookup)
#' @return Invisible TRUE on success
render_team_icon <- function(team_id, out_path, glow_sigma = 8,
                              size_px = 1024, color = NULL,
                              glyph_fn = NULL) {
  if (is.null(color)) {
    color <- TEAM_COLORS[[team_id]]
    if (is.null(color)) {
      stop("Unknown team: ", team_id, call. = FALSE)
    }
  }

  glyph_fn_name <- TEAM_GLYPHS[[team_id]]
  if (is.null(glyph_fn_name)) {
    glyph_fn_name <- "unknown"
  }

  render_glyph(color = color, glyph_fn_name = glyph_fn_name,
               entity_id = team_id, out_path = out_path,
               glow_sigma = glow_sigma, size_px = size_px,
               glyph_fn = glyph_fn)
}
