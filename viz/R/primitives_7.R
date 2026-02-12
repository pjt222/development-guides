# primitives_7.R - Glyph library part 7: Gardening domain (5) + general (1)
# Sourced by build-icons.R

# ══════════════════════════════════════════════════════════════════════════════
# Gardening domain glyphs (5) + general domain additions (1)
# ══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════════════
# General domain additions
# ══════════════════════════════════════════════════════════════════════════════

# ── glyph_memory_file: document index with linked topic files ────────────────
glyph_memory_file <- function(cx, cy, s, col, bright) {
  # Main document (MEMORY.md) — larger rectangle with folded corner
  doc <- data.frame(
    xmin = cx - 16 * s, xmax = cx + 16 * s,
    ymin = cy - 24 * s, ymax = cy + 24 * s
  )
  # Folded corner triangle (top-right)
  fold <- data.frame(
    x = c(cx + 8 * s, cx + 16 * s, cx + 16 * s),
    y = c(cy + 24 * s, cy + 24 * s, cy + 16 * s)
  )
  # Index lines (short dashes representing concise entries)
  lines <- list()
  y_positions <- c(16, 10, 4, -2, -8)
  line_widths <- c(20, 16, 18, 14, 20) # varying lengths
  for (i in seq_along(y_positions)) {
    ln <- data.frame(
      x = c(cx - 10 * s, cx - 10 * s + line_widths[i] * s),
      y = rep(cy + y_positions[i] * s, 2)
    )
    alpha <- if (i <= 2) 0.7 else 0.4
    lines[[i]] <- ggplot2::geom_path(data = ln, .aes(x, y),
      color = hex_with_alpha(bright, alpha), linewidth = .lw(s, 1.8))
  }
  # Link arrow (bottom-right, pointing to topic file)
  arrow_shaft <- data.frame(
    x = c(cx + 4 * s, cx + 14 * s),
    y = c(cy - 16 * s, cy - 22 * s)
  )
  arrow_head <- data.frame(
    x = c(cx + 10 * s, cx + 14 * s, cx + 12 * s),
    y = c(cy - 18 * s, cy - 22 * s, cy - 24 * s)
  )
  # Small linked file (topic file, offset bottom-right)
  topic <- data.frame(
    xmin = cx + 10 * s, xmax = cx + 24 * s,
    ymin = cy - 28 * s, ymax = cy - 16 * s
  )
  # Topic file content lines
  tl1 <- data.frame(
    x = c(cx + 13 * s, cx + 21 * s),
    y = rep(cy - 19 * s, 2)
  )
  tl2 <- data.frame(
    x = c(cx + 13 * s, cx + 19 * s),
    y = rep(cy - 23 * s, 2)
  )
  c(
    list(
      # Main document
      ggplot2::geom_rect(data = doc,
        .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
        fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 2)),
      # Folded corner
      ggplot2::geom_polygon(data = fold, .aes(x, y),
        fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.2)),
      # Link arrow
      ggplot2::geom_path(data = arrow_shaft, .aes(x, y),
        color = col, linewidth = .lw(s, 1.5)),
      ggplot2::geom_polygon(data = arrow_head, .aes(x, y),
        fill = col, color = col, linewidth = .lw(s, 0.5)),
      # Topic file
      ggplot2::geom_rect(data = topic,
        .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
        fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.5)),
      ggplot2::geom_path(data = tl1, .aes(x, y),
        color = hex_with_alpha(bright, 0.5), linewidth = .lw(s, 1.2)),
      ggplot2::geom_path(data = tl2, .aes(x, y),
        color = hex_with_alpha(bright, 0.4), linewidth = .lw(s, 1.2))
    ),
    lines
  )
}

# ══════════════════════════════════════════════════════════════════════════════
# Gardening domain glyphs (5)
# ══════════════════════════════════════════════════════════════════════════════

# ── glyph_bonsai_tree: stylized bonsai silhouette in pot ──────────────────────
glyph_bonsai_tree <- function(cx, cy, s, col, bright) {
  # Pot / base rectangle
  pot <- data.frame(
    xmin = cx - 10 * s, xmax = cx + 10 * s,
    ymin = cy - 26 * s, ymax = cy - 16 * s
  )
  pot_rim <- data.frame(
    xmin = cx - 13 * s, xmax = cx + 13 * s,
    ymin = cy - 16 * s, ymax = cy - 13 * s
  )
  # Trunk (vertical with slight curve via path)
  trunk <- data.frame(
    x = c(cx, cx - 1 * s, cx + 1 * s, cx),
    y = c(cy - 13 * s, cy - 4 * s, cy + 4 * s, cy + 8 * s)
  )
  # Canopy: 3 overlapping circles forming rounded crown
  canopy1 <- data.frame(x0 = cx - 8 * s, y0 = cy + 12 * s, r = 10 * s)
  canopy2 <- data.frame(x0 = cx + 8 * s, y0 = cy + 12 * s, r = 10 * s)
  canopy3 <- data.frame(x0 = cx, y0 = cy + 18 * s, r = 11 * s)
  # Left branch
  branch_l <- data.frame(
    x = c(cx - 1 * s, cx - 12 * s),
    y = c(cy + 2 * s, cy + 10 * s)
  )
  # Right branch
  branch_r <- data.frame(
    x = c(cx + 1 * s, cx + 10 * s),
    y = c(cy + 5 * s, cy + 12 * s)
  )
  list(
    ggplot2::geom_rect(data = pot,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_rect(data = pot_rim,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = trunk, .aes(x, y),
      color = bright, linewidth = .lw(s, 3)),
    ggplot2::geom_path(data = branch_l, .aes(x, y),
      color = col, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = branch_r, .aes(x, y),
      color = col, linewidth = .lw(s, 2)),
    ggforce::geom_circle(data = canopy1, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = canopy2, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = canopy3, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_pruning_shears: bypass secateurs in profile ─────────────────────────
glyph_pruning_shears <- function(cx, cy, s, col, bright) {
  # Left blade (arc)
  t_l <- seq(pi / 6, pi * 0.7, length.out = 25)
  blade_l <- data.frame(
    x = cx - 4 * s + 22 * s * cos(t_l),
    y = cy + 6 * s + 18 * s * sin(t_l)
  )
  # Right blade (arc, mirrored)
  t_r <- seq(pi * 0.3, pi * 5 / 6, length.out = 25)
  blade_r <- data.frame(
    x = cx + 4 * s - 22 * s * cos(t_r),
    y = cy + 6 * s + 18 * s * sin(t_r)
  )
  # Pivot circle
  pivot <- data.frame(x0 = cx, y0 = cy + 6 * s, r = 4 * s)
  # Left handle
  handle_l <- data.frame(
    x = c(cx - 3 * s, cx - 14 * s),
    y = c(cy + 2 * s, cy - 24 * s)
  )
  # Right handle
  handle_r <- data.frame(
    x = c(cx + 3 * s, cx + 10 * s),
    y = c(cy + 2 * s, cy - 24 * s)
  )
  # Grip bumps on handles
  grip_l <- data.frame(
    x = cx + c(-7, -9, -11) * s,
    y = cy + c(-8, -14, -20) * s
  )
  grip_r <- data.frame(
    x = cx + c(5, 7, 9) * s,
    y = cy + c(-8, -14, -20) * s
  )
  list(
    ggplot2::geom_path(data = blade_l, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = blade_r, .aes(x, y),
      color = col, linewidth = .lw(s, 2.5)),
    ggforce::geom_circle(data = pivot, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = handle_l, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = handle_r, .aes(x, y),
      color = col, linewidth = .lw(s, 2.5)),
    ggplot2::geom_point(data = grip_l, .aes(x, y),
      color = hex_with_alpha(bright, 0.6), size = 2.5 * s),
    ggplot2::geom_point(data = grip_r, .aes(x, y),
      color = hex_with_alpha(col, 0.5), size = 2.5 * s)
  )
}

# ── glyph_moon_calendar: crescent moon over calendar grid ─────────────────────
glyph_moon_calendar <- function(cx, cy, s, col, bright) {
  # Crescent moon (two overlapping circles)
  moon_outer <- data.frame(x0 = cx, y0 = cy + 16 * s, r = 12 * s)
  # Inner circle offset to create crescent
  moon_inner <- data.frame(x0 = cx + 6 * s, y0 = cy + 18 * s, r = 10 * s)
  # Calendar grid below (3x4 grid of small squares)
  layers <- list(
    # Moon (outer filled, then inner cuts out)
    ggforce::geom_circle(data = moon_outer, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.25), color = bright, linewidth = .lw(s, 2)),
    ggforce::geom_circle(data = moon_inner, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha("#000000", 0.85), color = NA)
  )
  # Calendar frame
  cal_frame <- data.frame(
    xmin = cx - 18 * s, xmax = cx + 18 * s,
    ymin = cy - 26 * s, ymax = cy + 2 * s
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_rect(data = cal_frame,
    .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
    fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s, 1.5))
  # Grid cells (4 rows x 3 cols)
  cell_w <- 10 * s; cell_h <- 6 * s
  for (row in 0:3) {
    for (col_i in 0:2) {
      cell <- data.frame(
        xmin = cx - 16 * s + col_i * (cell_w + 2 * s),
        xmax = cx - 16 * s + col_i * (cell_w + 2 * s) + cell_w,
        ymin = cy - 24 * s + row * (cell_h + 1 * s),
        ymax = cy - 24 * s + row * (cell_h + 1 * s) + cell_h
      )
      alpha <- if (row == 1 && col_i == 1) 0.35 else 0.12
      layers[[length(layers) + 1]] <- ggplot2::geom_rect(data = cell,
        .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
        fill = hex_with_alpha(col, alpha),
        color = hex_with_alpha(col, 0.3), linewidth = .lw(s, 0.6))
    }
  }
  layers
}

# ── glyph_soil_layers: soil horizon cross-section with roots ──────────────────
glyph_soil_layers <- function(cx, cy, s, col, bright) {
  # Three horizontal bands with wavy top edges
  # Top layer (topsoil) - darkest, most organic
  t_wave <- seq(-1, 1, length.out = 30)
  wave_x <- cx + t_wave * 24 * s

  # Topsoil band (top)
  top_wave_y <- cy + 10 * s + 3 * s * sin(t_wave * pi * 2)
  top_poly <- data.frame(
    x = c(wave_x, rev(wave_x)),
    y = c(top_wave_y, rep(cy + 28 * s, length(wave_x)))
  )
  # Subsoil band (middle)
  mid_wave_y <- cy - 6 * s + 2 * s * sin(t_wave * pi * 1.5 + 1)
  mid_poly <- data.frame(
    x = c(wave_x, rev(wave_x)),
    y = c(mid_wave_y, rev(top_wave_y))
  )
  # Bedrock band (bottom)
  bed_poly <- data.frame(
    x = c(wave_x, rev(wave_x)),
    y = c(rep(cy - 28 * s, length(wave_x)), rev(mid_wave_y))
  )
  # Root filaments in top layer
  root1 <- data.frame(
    x = c(cx - 4 * s, cx - 6 * s, cx - 2 * s, cx - 8 * s),
    y = c(cy + 26 * s, cy + 20 * s, cy + 16 * s, cy + 12 * s)
  )
  root2 <- data.frame(
    x = c(cx + 6 * s, cx + 4 * s, cx + 8 * s, cx + 3 * s),
    y = c(cy + 26 * s, cy + 22 * s, cy + 18 * s, cy + 14 * s)
  )
  root3 <- data.frame(
    x = c(cx, cx + 2 * s, cx - 2 * s),
    y = c(cy + 26 * s, cy + 18 * s, cy + 12 * s)
  )
  list(
    ggplot2::geom_polygon(data = bed_poly, .aes(x, y),
      fill = hex_with_alpha(col, 0.1), color = NA),
    ggplot2::geom_polygon(data = mid_poly, .aes(x, y),
      fill = hex_with_alpha(col, 0.18), color = NA),
    ggplot2::geom_polygon(data = top_poly, .aes(x, y),
      fill = hex_with_alpha(col, 0.28), color = NA),
    # Wavy boundary lines
    ggplot2::geom_path(
      data = data.frame(x = wave_x, y = top_wave_y), .aes(x, y),
      color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(
      data = data.frame(x = wave_x, y = mid_wave_y), .aes(x, y),
      color = col, linewidth = .lw(s, 1.2)),
    # Roots
    ggplot2::geom_path(data = root1, .aes(x, y),
      color = hex_with_alpha(bright, 0.6), linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = root2, .aes(x, y),
      color = hex_with_alpha(bright, 0.5), linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = root3, .aes(x, y),
      color = hex_with_alpha(bright, 0.7), linewidth = .lw(s, 1.3))
  )
}

# ── glyph_garden_eye: eye merged with leaf (observation) ──────────────────────
glyph_garden_eye <- function(cx, cy, s, col, bright) {
  # Almond eye outline (upper lid)
  t_up <- seq(0, pi, length.out = 40)
  eye_up <- data.frame(
    x = cx + 26 * s * cos(t_up),
    y = cy + 10 * s * sin(t_up)
  )
  # Lower lid
  t_lo <- seq(pi, 2 * pi, length.out = 40)
  eye_lo <- data.frame(
    x = cx + 26 * s * cos(t_lo),
    y = cy + 10 * s * sin(t_lo)
  )
  # Iris circle
  iris <- data.frame(x0 = cx, y0 = cy, r = 9 * s)
  # Pupil
  pupil <- data.frame(x0 = cx, y0 = cy, r = 4 * s)
  # Leaf veins radiating from iris (6 veins)
  layers <- list(
    # Eye shape
    ggplot2::geom_path(data = eye_up, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = eye_lo, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5)),
    # Iris
    ggforce::geom_circle(data = iris, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2)),
    # Pupil
    ggforce::geom_circle(data = pupil, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.4), color = bright, linewidth = .lw(s, 1.5))
  )
  # Leaf veins radiating from pupil center outward through iris
  n_veins <- 6
  for (i in seq_len(n_veins)) {
    angle <- (i - 1) * pi / 3 + pi / 6
    vein_r <- 14 * s
    vein <- data.frame(
      x = c(cx + 4 * s * cos(angle), cx + vein_r * cos(angle)),
      y = c(cy + 4 * s * sin(angle), cy + vein_r * sin(angle))
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = vein, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1))
  }
  # Central midrib (vertical through eye)
  midrib <- data.frame(
    x = c(cx, cx),
    y = c(cy - 12 * s, cy + 12 * s)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = midrib, .aes(x, y),
    color = hex_with_alpha(col, 0.3), linewidth = .lw(s, 0.8))
  layers
}
