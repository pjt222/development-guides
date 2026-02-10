# agent_render.R - Agent icon rendering pipeline
# Mirrors render.R but uses AGENT_COLORS and AGENT_GLYPHS instead of
# DOMAIN_COLORS and SKILL_GLYPHS.

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

  bright_color <- brighten_hex(color, 1.4)

  glyph_fn_name <- AGENT_GLYPHS[[agent_id]]
  if (is.null(glyph_fn_name)) {
    stop("No glyph mapped for agent: ", agent_id, call. = FALSE)
  }
  glyph_fn <- match.fun(glyph_fn_name)

  # Draw the glyph centered on a 100x100 canvas
  glyph_layers <- glyph_fn(cx = 50, cy = 50, s = 1.0,
                            col = color, bright = bright_color)

  # Build the ggplot
  p <- ggplot2::ggplot() +
    ggplot2::coord_fixed(xlim = c(0, 100), ylim = c(0, 100), expand = FALSE) +
    ggplot2::theme_void() +
    ggplot2::theme(
      plot.background = ggplot2::element_rect(fill = "transparent", color = NA),
      panel.background = ggplot2::element_rect(fill = "transparent", color = NA),
      plot.margin = ggplot2::margin(0, 0, 0, 0)
    )

  # Wrap all glyph layers with neon glow effect
  for (layer in glyph_layers) {
    if (inherits(layer, "list")) {
      for (sub_layer in layer) {
        p <- p + ggfx::with_outer_glow(sub_layer, colour = color,
                                        sigma = glow_sigma, expand = 3)
      }
    } else {
      p <- p + ggfx::with_outer_glow(layer, colour = color,
                                      sigma = glow_sigma, expand = 3)
    }
  }

  # Render to temp PNG
  tmp_png <- tempfile(fileext = ".png")
  on.exit(unlink(tmp_png), add = TRUE)

  ragg::agg_png(tmp_png, width = size_px, height = size_px,
                background = "transparent", res = 150)
  print(p)
  grDevices::dev.off()

  # Ensure output directory exists
  dir.create(dirname(out_path), recursive = TRUE, showWarnings = FALSE)

  # Convert PNG to WebP via magick
  img <- magick::image_read(tmp_png)
  magick::image_write(img, path = out_path, format = "webp", quality = 90)

  invisible(TRUE)
}
