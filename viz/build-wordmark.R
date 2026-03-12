#!/usr/bin/env Rscript
# build-wordmark.R - Generate Agent Almanac wordmark SVGs
#
# Reuses glyph_polychromatic_a() from the favicon pipeline for
# geometrically exact icon + text wordmarks.
#
# Produces in docs/logos/:
#   agent-almanac-dark.svg               (200px base)
#   agent-almanac-dark-{400..1000}.svg   (size variants)
#   agent-almanac-light.svg              (200px base)
#   agent-almanac-light-{400..1000}.svg  (size variants)
#
# Usage:
#   cd viz && Rscript build-wordmark.R

# ── Setup ────────────────────────────────────────────────────────────────
script_dir <- if (nzchar(Sys.getenv("RSCRIPT_DIR"))) {
  Sys.getenv("RSCRIPT_DIR")
} else {
  tryCatch(dirname(normalizePath(sys.frame(1)$ofile)), error = function(e) ".")
}
source(file.path(script_dir, "R", "utils.R"))
source(file.path(script_dir, "R", "primitives.R"))
source(file.path(script_dir, "R", "palettes.R"))

# Resolve project root reliably (script_dir = viz/)
project_root <- normalizePath(file.path(script_dir, ".."))
out_dir <- file.path(project_root, "docs", "logos")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

# Canvas: 500x110 data units -> 4.55:1 aspect ratio -> 200x44pt base output
CANVAS_W <- 500
CANVAS_H <- 110

# ── Build wordmark plot ──────────────────────────────────────────────────
build_wordmark <- function(variant = c("dark", "light")) {
  variant <- match.arg(variant)
  colors <- get_favicon_colors("cyberpunk")

  if (variant == "light") {
    colors$c1 <- "#0891B2"   # cyan-600 (Tailwind)
    colors$c2 <- "#9333EA"   # purple-600
    colors$c3 <- "#059669"   # emerald-600
    text_color <- "#1F2937"
    almanac_alpha <- 0.55
  } else {
    text_color <- "#F0F0F5"
    almanac_alpha <- 0.65
  }

  glyph_layers <- glyph_polychromatic_a(
    cx = 55, cy = 55, s = 0.65, colors = colors
  )

  p <- ggplot2::ggplot() +
    ggplot2::coord_fixed(
      xlim = c(0, CANVAS_W), ylim = c(0, CANVAS_H),
      expand = FALSE
    ) +
    ggplot2::theme_void() +
    ggplot2::theme(
      plot.background  = ggplot2::element_rect(fill = "transparent", color = NA),
      panel.background = ggplot2::element_rect(fill = "transparent", color = NA),
      plot.margin      = ggplot2::margin(0, 0, 0, 0)
    )

  for (layer in glyph_layers) p <- p + layer

  # Text: "Agent" (bold, upper) and "Almanac" (plain, lower)
  p <- p +
    ggplot2::annotate("text",
      x = 120, y = 76, label = "Agent",
      hjust = 0, vjust = 0.5, size = 4.5,
      fontface = "bold", family = "sans",
      color = text_color
    ) +
    ggplot2::annotate("text",
      x = 120, y = 34, label = "Almanac",
      hjust = 0, vjust = 0.5, size = 4.5,
      fontface = "plain", family = "sans",
      color = hex_with_alpha(text_color, almanac_alpha)
    )

  p
}

# ── Write SVG ────────────────────────────────────────────────────────────
BASE_W <- 200  # base output width in pt
BASE_H <- BASE_W * CANVAS_H / CANVAS_W  # 44pt

write_base_svg <- function(plot, path) {
  svglite::svglite(
    path,
    width  = BASE_W / 72,
    height = BASE_H / 72,
    bg = "transparent"
  )
  print(plot)
  grDevices::dev.off()
}

# Size variants: same viewBox, different width/height attributes.
# SVG scales uniformly — text, polygons, and strokes all scale together.
write_size_variant <- function(base_path, out_path, width_pt) {
  height_pt <- round(width_pt * CANVAS_H / CANVAS_W, 2)
  svg <- readLines(base_path)
  # Replace width/height attributes (with pt suffix) but keep viewBox unchanged
  svg[2] <- sub(
    "width='[0-9.]+pt'",
    sprintf("width='%.2fpt'", width_pt),
    svg[2]
  )
  svg[2] <- sub(
    "height='[0-9.]+pt'",
    sprintf("height='%.2fpt'", height_pt),
    svg[2]
  )
  writeLines(svg, out_path)
}

# ── Generate all variants ────────────────────────────────────────────────
extra_sizes <- c(400, 600, 800, 1000)

for (variant in c("dark", "light")) {
  log_msg(sprintf("Building %s wordmarks...", variant))
  p <- build_wordmark(variant)

  # Base SVG (200pt)
  base_file <- sprintf("agent-almanac-%s.svg", variant)
  base_path <- file.path(out_dir, base_file)
  write_base_svg(p, base_path)
  sz_kb <- round(file.info(base_path)$size / 1024, 1)
  log_msg(sprintf("  %s (200px, %.1f KB)", base_file, sz_kb))

  # Size variants (rewrite width/height, keep viewBox)
  for (sz in extra_sizes) {
    filename <- sprintf("agent-almanac-%s-%d.svg", variant, sz)
    filepath <- file.path(out_dir, filename)
    write_size_variant(base_path, filepath, sz)
    sz_kb <- round(file.info(filepath)$size / 1024, 1)
    log_msg(sprintf("  %s (%dpx, %.1f KB)", filename, sz, sz_kb))
  }
}

log_msg(sprintf("Wordmark build complete. %d files in %s",
                (1 + length(extra_sizes)) * 2, out_dir))
