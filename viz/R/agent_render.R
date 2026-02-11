# agent_render.R - Agent icon rendering (thin wrapper over render_glyph)
# Uses AGENT_COLORS and AGENT_GLYPHS; delegates to shared render_glyph()
# in render.R for canvas setup, glow, and PNG-to-WebP conversion.

#' Render a single agent icon to WebP
#'
#' @param agent_id Agent identifier (determines both color and glyph)
#' @param out_path Output file path (WebP)
#' @param glow_sigma Glow blur radius (default 8)
#' @param size_px Output dimension in pixels (default 1024)
#' @return Invisible TRUE on success
render_agent_icon <- function(agent_id, out_path, glow_sigma = 8,
                               size_px = 1024) {
  color <- AGENT_COLORS[[agent_id]]
  if (is.null(color)) {
    stop("Unknown agent: ", agent_id, call. = FALSE)
  }

  glyph_fn_name <- AGENT_GLYPHS[[agent_id]]
  if (is.null(glyph_fn_name)) {
    stop("No glyph mapped for agent: ", agent_id, call. = FALSE)
  }

  render_glyph(color = color, glyph_fn_name = glyph_fn_name,
               entity_id = agent_id, out_path = out_path,
               glow_sigma = glow_sigma, size_px = size_px)
}
