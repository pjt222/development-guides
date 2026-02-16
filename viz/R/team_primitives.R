# team_primitives.R - Glyph library for team persona icons
# Each glyph: glyph_team_xxx(cx, cy, s, col, bright) -> list of ggplot2 layers
# cx, cy = center; s = scale (1.0 = fill ~70% of 100x100 canvas)
# col = team color; bright = brightened team color
#
# Uses helpers .lw, .aes, hex_with_alpha, brighten_hex from utils.R / primitives.R

# ── glyph_team_r_package_review: hub-and-spoke pentagon with 4 member nodes ──
glyph_team_r_package_review <- function(cx, cy, s, col, bright) {
  layers <- list()

  # Central pentagon (echoes team node shape on graph)
  t_pent <- seq(0, 2 * pi, length.out = 6)
  pent_r <- 14 * s
  pent <- data.frame(
    x = cx + pent_r * cos(t_pent - pi / 2),
    y = cy + pent_r * sin(t_pent - pi / 2)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = pent, .aes(x, y),
    fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2.5))

  # 4 member nodes arranged around the hub
  member_r <- 24 * s
  node_r <- 5 * s
  angles <- c(-pi / 4, pi / 4, 3 * pi / 4, -3 * pi / 4)

  for (angle in angles) {
    mx <- cx + member_r * cos(angle)
    my <- cy + member_r * sin(angle)

    # Connection line from center to member
    line <- data.frame(x = c(cx, mx), y = c(cy, my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1.5))

    # Member node circle
    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.8))
  }

  # Cross-connections between adjacent member nodes (team coordination)
  for (i in seq_along(angles)) {
    j <- if (i == length(angles)) 1L else i + 1L
    x1 <- cx + member_r * cos(angles[i])
    y1 <- cy + member_r * sin(angles[i])
    x2 <- cx + member_r * cos(angles[j])
    y2 <- cy + member_r * sin(angles[j])
    line <- data.frame(x = c(x1, x2), y = c(y1, y2))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.25), linewidth = .lw(s, 1))
  }

  # Central dot inside pentagon (coordination hub)
  center <- data.frame(x0 = cx, y0 = cy, r = 3 * s)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = center,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(bright, 0.4), color = bright, linewidth = .lw(s, 1.5))

  layers
}
