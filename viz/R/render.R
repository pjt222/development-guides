# render.R - Shared icon rendering pipeline
# Canvas setup -> glyph layers -> glow -> PNG -> WebP

#' Core rendering engine shared by skill and agent pipelines
#'
#' @param color Hex color for the glyph and glow
#' @param glyph_fn_name Name of the glyph drawing function
#' @param entity_id Identifier for error messages
#' @param out_path Output file path (WebP)
#' @param glow_sigma Glow blur radius (default 8)
#' @param size_px Output dimension in pixels (default 1024)
#' @return Invisible TRUE on success
render_glyph <- function(color, glyph_fn_name, entity_id, out_path,
                         glow_sigma = 8, size_px = 1024) {
  bright_color <- brighten_hex(color, 1.4)

  # Resolve glyph function
  glyph_fn <- tryCatch(
    match.fun(glyph_fn_name),
    error = function(e) {
      stop("Cannot resolve glyph function '", glyph_fn_name,
           "' for: ", entity_id, call. = FALSE)
    }
  )

  # Draw the glyph centered on a 100x100 canvas
  glyph_layers <- glyph_fn(cx = 50, cy = 50, s = 1.0,
                            col = color, bright = bright_color)

  # Build the ggplot
  p <- ggplot2::ggplot() +
    ggplot2::coord_fixed(xlim = c(0, 100), ylim = c(0, 100), expand = FALSE) +
    ggplot2::theme_void() +
    ggplot2::theme(
      plot.background = ggplot2::element_rect(fill = "transparent",
                                               color = NA),
      panel.background = ggplot2::element_rect(fill = "transparent",
                                                color = NA),
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
  tryCatch({
    img <- magick::image_read(tmp_png)
    magick::image_write(img, path = out_path, format = "webp", quality = 90)
  }, error = function(e) {
    stop("Image conversion failed for ", entity_id, ": ",
         conditionMessage(e), call. = FALSE)
  })

  invisible(TRUE)
}

#' Render a single skill icon to WebP
#'
#' @param domain Domain name (determines color palette)
#' @param skill_id Skill identifier (determines glyph shape)
#' @param seed Integer seed (unused in new pipeline, kept for API compat)
#' @param out_path Output file path (WebP)
#' @param glow_sigma Glow blur radius (default 8)
#' @param size_px Output dimension in pixels (default 1024)
#' @return Invisible TRUE on success
render_icon <- function(domain, skill_id = NULL, seed = NULL, out_path,
                        glow_sigma = 8, size_px = 1024) {
  color <- DOMAIN_COLORS[[domain]]
  if (is.null(color)) {
    stop("Unknown domain: ", domain, call. = FALSE)
  }

  if (is.null(skill_id)) {
    stop("skill_id is required", call. = FALSE)
  }

  glyph_fn_name <- SKILL_GLYPHS[[skill_id]]
  if (is.null(glyph_fn_name)) {
    stop("No glyph mapped for skill: ", skill_id, call. = FALSE)
  }

  render_glyph(color = color, glyph_fn_name = glyph_fn_name,
               entity_id = skill_id, out_path = out_path,
               glow_sigma = glow_sigma, size_px = size_px)
}
