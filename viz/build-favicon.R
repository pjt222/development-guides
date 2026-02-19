#!/usr/bin/env Rscript
# build-favicon.R - Generate favicon suite from glyph pipeline
#
# Produces:
#   public/favicon.ico     (32x32)
#   public/favicon.svg     (scalable, via svglite)
#   public/apple-touch-icon.png (180x180)
#   public/favicon-192.png (192x192)
#   public/favicon-512.png (512x512)
#
# Usage: Rscript build-favicon.R

# ── Setup ────────────────────────────────────────────────────────────────
script_dir <- if (nzchar(Sys.getenv("RSCRIPT_DIR"))) {
  Sys.getenv("RSCRIPT_DIR")
} else {
  tryCatch(dirname(normalizePath(sys.frame(1)$ofile)), error = function(e) ".")
}
source(file.path(script_dir, "R", "utils.R"))
source(file.path(script_dir, "R", "primitives.R"))

out_dir <- file.path(script_dir, "public")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

# ── Colors ───────────────────────────────────────────────────────────────
BG_COLOR  <- "#0a0a0f"
CYAN      <- "#00f0ff"
CYAN_BRIGHT <- brighten_hex(CYAN, 1.4)

# ── Glyph: 3-node network motif ─────────────────────────────────────────
# A minimal triangle of 3 nodes with connecting edges — reads as a
# "network" even at 16px. Centered on a 100x100 canvas.
glyph_skillnet_logo <- function(cx, cy, s, col, bright) {
  r <- 32 * s         # triangle radius
  node_r <- 5.5 * s   # node circle radius

  # Triangle vertices (top, bottom-left, bottom-right)
  angles <- c(pi / 2, pi / 2 + 2 * pi / 3, pi / 2 + 4 * pi / 3)
  vx <- cx + r * cos(angles)
  vy <- cy + r * sin(angles)

  nodes <- data.frame(x = vx, y = vy)

  # Edges: 1-2, 2-3, 3-1
  edges <- data.frame(
    x    = vx[c(1, 2, 3)],
    y    = vy[c(1, 2, 3)],
    xend = vx[c(2, 3, 1)],
    yend = vy[c(2, 3, 1)]
  )

  list(
    # Edges
    ggplot2::geom_segment(
      data = edges, .aes(x = x, y = y, xend = xend, yend = yend),
      color = hex_with_alpha(col, 0.6), linewidth = .lw(s, 2.0)
    ),
    # Nodes (filled circles)
    ggplot2::geom_point(
      data = nodes, .aes(x = x, y = y),
      color = bright, fill = hex_with_alpha(col, 0.4),
      shape = 21, size = node_r * 2, stroke = .lw(s, 1.2)
    )
  )
}

# ── Render master PNG at 512px ───────────────────────────────────────────
log_msg <- function(...) {
  msg <- paste0("[", format(Sys.time(), "%H:%M:%S"), "] ", ...)
  message(msg)
}

log_msg("Rendering favicon glyph at 512px...")

master_png <- tempfile(fileext = ".png")
on.exit(unlink(master_png), add = TRUE)

# Draw glyph on transparent background at 512px
glyph_layers <- glyph_skillnet_logo(
  cx = 50, cy = 50, s = 1.0,
  col = CYAN, bright = CYAN_BRIGHT
)

p <- ggplot2::ggplot() +
  ggplot2::coord_fixed(xlim = c(0, 100), ylim = c(0, 100), expand = FALSE) +
  ggplot2::theme_void() +
  ggplot2::theme(
    plot.background  = ggplot2::element_rect(fill = "transparent", color = NA),
    panel.background = ggplot2::element_rect(fill = "transparent", color = NA),
    plot.margin      = ggplot2::margin(0, 0, 0, 0)
  )

for (layer in glyph_layers) p <- p + layer
p <- ggfx::with_outer_glow(p, colour = CYAN, sigma = 4, expand = 3)

ragg::agg_png(master_png, width = 512, height = 512,
              background = "transparent", res = 150)
print(p)
grDevices::dev.off()

# ── Composite onto dark background & resize ─────────────────────────────
master <- magick::image_read(master_png)

# Create dark background helper
make_bg <- function(size) {
  magick::image_blank(size, size, color = BG_COLOR)
}

compose_icon <- function(size) {
  bg <- make_bg(size)
  fg <- magick::image_resize(master, paste0(size, "x", size))
  magick::image_composite(bg, fg, operator = "over")
}

# 32px -> favicon.ico
log_msg("Writing favicon.ico (32x32)...")
ico <- compose_icon(32)
magick::image_write(ico, path = file.path(out_dir, "favicon.ico"), format = "ico")

# 180px -> apple-touch-icon.png
log_msg("Writing apple-touch-icon.png (180x180)...")
apple <- compose_icon(180)
magick::image_write(apple, path = file.path(out_dir, "apple-touch-icon.png"),
                    format = "png")

# 192px -> favicon-192.png
log_msg("Writing favicon-192.png (192x192)...")
f192 <- compose_icon(192)
magick::image_write(f192, path = file.path(out_dir, "favicon-192.png"),
                    format = "png")

# 512px -> favicon-512.png
log_msg("Writing favicon-512.png (512x512)...")
f512 <- compose_icon(512)
magick::image_write(f512, path = file.path(out_dir, "favicon-512.png"),
                    format = "png")

# ── SVG via svglite ──────────────────────────────────────────────────────
log_msg("Writing favicon.svg...")
svg_path <- file.path(out_dir, "favicon.svg")

# Build SVG with dark background baked in
p_svg <- ggplot2::ggplot() +
  ggplot2::coord_fixed(xlim = c(0, 100), ylim = c(0, 100), expand = FALSE) +
  ggplot2::theme_void() +
  ggplot2::theme(
    plot.background  = ggplot2::element_rect(fill = BG_COLOR, color = NA),
    panel.background = ggplot2::element_rect(fill = BG_COLOR, color = NA),
    plot.margin      = ggplot2::margin(0, 0, 0, 0)
  )
for (layer in glyph_layers) p_svg <- p_svg + layer

svglite::svglite(svg_path, width = 1, height = 1, bg = BG_COLOR)
print(p_svg)
grDevices::dev.off()

# ── Done ─────────────────────────────────────────────────────────────────
files <- c("favicon.ico", "favicon.svg", "apple-touch-icon.png",
           "favicon-192.png", "favicon-512.png")
for (f in files) {
  fp <- file.path(out_dir, f)
  sz <- round(file.info(fp)$size / 1024, 1)
  log_msg(sprintf("  %s (%.1f KB)", f, sz))
}
log_msg("Favicon build complete.")
