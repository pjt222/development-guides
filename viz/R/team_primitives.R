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

# ── glyph_team_gxp_compliance: shield with checkmark and 4 audit nodes ──
glyph_team_gxp_compliance <- function(cx, cy, s, col, bright) {
  layers <- list()

  # Shield outline
  shield_w <- 16 * s
  shield_h <- 22 * s
  shield <- data.frame(
    x = cx + shield_w * c(0, 1, 1, 0.5, 0, -0.5, -1, -1),
    y = cy + shield_h * c(0.45, 0.45, 0, -0.5, -0.45, -0.5, 0, 0.45)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = shield, .aes(x, y),
    fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 2.2))

  # Checkmark inside shield
  check <- data.frame(
    x = cx + s * c(-5, -1, 7),
    y = cy + s * c(-2, -7, 5)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = check, .aes(x, y),
    color = bright, linewidth = .lw(s, 3))

  # 4 audit nodes in corners
  node_r <- 4 * s
  offsets <- list(c(-22, 18), c(22, 18), c(-22, -18), c(22, -18))
  for (off in offsets) {
    mx <- cx + off[1] * s
    my <- cy + off[2] * s
    line <- data.frame(x = c(cx, mx), y = c(cy, my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1.2))
    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5))
  }

  layers
}

# ── glyph_team_fullstack_web: layered chevrons (sequential pipeline) ─────
glyph_team_fullstack_web <- function(cx, cy, s, col, bright) {
  layers <- list()

  # 4 stacked chevrons representing the sequential pipeline
  chevron_w <- 18 * s
  y_offsets <- c(15, 5, -5, -15)
  alphas <- c(0.35, 0.28, 0.21, 0.14)

  for (i in seq_along(y_offsets)) {
    yy <- cy + y_offsets[i] * s
    chev <- data.frame(
      x = cx + chevron_w * c(-1, 0, 1),
      y = yy + s * c(4, -4, 4)
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = chev, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5), alpha = 1 - (i - 1) * 0.15)
  }

  # Vertical flow line connecting chevrons
  flow <- data.frame(x = c(cx, cx), y = c(cy + 19 * s, cy - 19 * s))
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = flow, .aes(x, y),
    color = hex_with_alpha(col, 0.35), linewidth = .lw(s, 1.5))

  # 4 member nodes on the right
  node_r <- 4 * s
  for (i in seq_along(y_offsets)) {
    mx <- cx + 26 * s
    my <- cy + y_offsets[i] * s
    line <- data.frame(x = c(cx + chevron_w, mx), y = c(my, my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1.2))
    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5))
  }

  layers
}

# ── glyph_team_ml_data_science: neural network hub with 4 review nodes ───
glyph_team_ml_data_science <- function(cx, cy, s, col, bright) {
  layers <- list()

  # Central brain/network: 3 interconnected inner nodes
  inner_r <- 10 * s
  inner_angles <- c(-pi / 2, pi / 6, 5 * pi / 6)
  inner_pts <- lapply(inner_angles, function(a) {
    c(cx + inner_r * cos(a), cy + inner_r * sin(a))
  })

  # Connections between inner nodes (triangle)
  for (i in 1:3) {
    j <- if (i == 3) 1 else i + 1
    line <- data.frame(
      x = c(inner_pts[[i]][1], inner_pts[[j]][1]),
      y = c(inner_pts[[i]][2], inner_pts[[j]][2])
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1.8))
  }

  # Inner nodes
  for (pt in inner_pts) {
    node <- data.frame(x0 = pt[1], y0 = pt[2], r = 3 * s)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 1.5))
  }

  # 4 outer review nodes
  outer_r <- 26 * s
  node_r <- 5 * s
  outer_angles <- c(-pi / 4, pi / 4, 3 * pi / 4, -3 * pi / 4)

  for (angle in outer_angles) {
    mx <- cx + outer_r * cos(angle)
    my <- cy + outer_r * sin(angle)

    # Connect to nearest inner node
    nearest <- inner_pts[[which.min(sapply(inner_pts, function(p) {
      (p[1] - mx)^2 + (p[2] - my)^2
    }))]]
    line <- data.frame(x = c(nearest[1], mx), y = c(nearest[2], my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.35), linewidth = .lw(s, 1.2))

    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5))
  }

  layers
}

# ── glyph_team_devops_platform: gear/cog with 4 platform nodes ──────────
glyph_team_devops_platform <- function(cx, cy, s, col, bright) {
  layers <- list()

  # Gear teeth (8 outer bumps)
  n_teeth <- 8
  outer_r <- 16 * s
  inner_r <- 12 * s
  gear_pts <- data.frame(x = numeric(0), y = numeric(0))

  for (i in seq_len(n_teeth)) {
    a1 <- (i - 1) * 2 * pi / n_teeth
    a2 <- a1 + pi / n_teeth * 0.4
    a3 <- a1 + pi / n_teeth * 0.6
    a4 <- a1 + pi / n_teeth
    gear_pts <- rbind(gear_pts,
      data.frame(x = cx + inner_r * cos(a1), y = cy + inner_r * sin(a1)),
      data.frame(x = cx + outer_r * cos(a2), y = cy + outer_r * sin(a2)),
      data.frame(x = cx + outer_r * cos(a3), y = cy + outer_r * sin(a3)),
      data.frame(x = cx + inner_r * cos(a4), y = cy + inner_r * sin(a4))
    )
  }
  gear_pts <- rbind(gear_pts, gear_pts[1, ])

  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = gear_pts, .aes(x, y),
    fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 2))

  # Central hole
  hole <- data.frame(x0 = cx, y0 = cy, r = 6 * s)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = hole,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 1.5))

  # 4 platform nodes at cardinal directions
  platform_r <- 28 * s
  node_r <- 5 * s
  card_angles <- c(0, pi / 2, pi, 3 * pi / 2)

  for (angle in card_angles) {
    mx <- cx + platform_r * cos(angle)
    my <- cy + platform_r * sin(angle)
    line <- data.frame(x = c(cx + outer_r * cos(angle), mx),
                       y = c(cy + outer_r * sin(angle), my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1.2))
    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5))
  }

  layers
}

# ── glyph_team_ai_self_care: spiral mandala with 4 modality nodes ────────
glyph_team_ai_self_care <- function(cx, cy, s, col, bright) {
  layers <- list()

  # Spiral (Archimedean) representing the sequential inner journey
  n_pts <- 80
  t_vals <- seq(0, 3 * pi, length.out = n_pts)
  spiral_scale <- 5 * s
  spiral <- data.frame(
    x = cx + spiral_scale * t_vals / pi * cos(t_vals),
    y = cy + spiral_scale * t_vals / pi * sin(t_vals)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = spiral, .aes(x, y),
    color = bright, linewidth = .lw(s, 2), alpha = 0.7)

  # Central glow dot
  center <- data.frame(x0 = cx, y0 = cy, r = 3.5 * s)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = center,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(bright, 0.5), color = bright, linewidth = .lw(s, 1.5))

  # 4 modality nodes at cardinal directions
  outer_r <- 26 * s
  node_r <- 5 * s
  angles <- c(-pi / 2, 0, pi / 2, pi)  # top, right, bottom, left

  for (angle in angles) {
    mx <- cx + outer_r * cos(angle)
    my <- cy + outer_r * sin(angle)
    line <- data.frame(x = c(cx, mx), y = c(cy, my))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.3), linewidth = .lw(s, 1.2))
    node <- data.frame(x0 = mx, y0 = my, r = node_r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.8))
  }

  # Sequential arcs connecting adjacent modality nodes (flow direction)
  for (i in 1:3) {
    a1 <- angles[i]
    a2 <- angles[i + 1]
    arc_pts <- seq(a1, a2, length.out = 15)
    arc <- data.frame(
      x = cx + (outer_r + 4 * s) * cos(arc_pts),
      y = cy + (outer_r + 4 * s) * sin(arc_pts)
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = arc, .aes(x, y),
      color = hex_with_alpha(col, 0.2), linewidth = .lw(s, 1))
  }

  layers
}

# ── glyph_team_scrum: sprint board with 3 columns and cards ──────────────────
glyph_team_scrum <- function(cx, cy, s, col, bright) {
  # Sprint board with 3 columns
  board <- data.frame(
    x = c(cx - 22 * s, cx + 22 * s, cx + 22 * s, cx - 22 * s),
    y = c(cy + 16 * s, cy + 16 * s, cy - 16 * s, cy - 16 * s))
  col1 <- data.frame(x = c(cx - 8 * s, cx - 8 * s), y = c(cy + 16 * s, cy - 16 * s))
  col2 <- data.frame(x = c(cx + 8 * s, cx + 8 * s), y = c(cy + 16 * s, cy - 16 * s))
  # Cards in columns
  cards <- data.frame(
    xmin = cx + c(-20, -20, -6, -6, 10) * s,
    xmax = cx + c(-10, -10, 6, 6, 20) * s,
    ymin = cy + c(8, -2, 8, -6, 4) * s,
    ymax = cy + c(14, 4, 14, 0, 10) * s)
  list(
    ggplot2::geom_polygon(data = board, .aes(x, y),
      fill = hex_with_alpha(col, 0.06), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = col1, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = col2, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1)),
    ggplot2::geom_rect(data = cards,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(bright, 0.15), color = bright, linewidth = .lw(s, 1))
  )
}

# ── glyph_team_opaque: amorphous cluster of shifting nodes ───────────────────
glyph_team_opaque <- function(cx, cy, s, col, bright) {
  # Amorphous cluster of shifting nodes
  set.seed(99)
  n <- 8
  t <- seq(0, 2 * pi, length.out = n + 1)[-(n + 1)]
  r_base <- 14
  nodes <- data.frame(
    x0 = cx + (r_base + runif(n, -4, 4)) * s * cos(t),
    y0 = cy + (r_base + runif(n, -4, 4)) * s * sin(t),
    r = rep(5 * s, n))
  # Shifting connections (partial mesh)
  edges <- data.frame(
    x = nodes$x0[c(1, 2, 3, 5, 6, 8)],
    y = nodes$y0[c(1, 2, 3, 5, 6, 8)],
    xend = nodes$x0[c(4, 5, 7, 8, 1, 3)],
    yend = nodes$y0[c(4, 5, 7, 8, 1, 3)])
  list(
    ggplot2::geom_segment(data = edges,
      .aes(x = x, y = y, xend = xend, yend = yend),
      color = hex_with_alpha(col, 0.3), linewidth = .lw(s, 1)),
    ggforce::geom_circle(data = nodes, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.12), color = bright, linewidth = .lw(s, 1.5))
  )
}
