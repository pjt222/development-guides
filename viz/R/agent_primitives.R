# agent_primitives.R - Glyph library for 28 agent persona icons
# Each glyph: glyph_agent_xxx(cx, cy, s, col, bright) -> list of ggplot2 layers
# cx, cy = center; s = scale (1.0 = fill ~70% of 100x100 canvas)
# col = agent color; bright = brightened agent color
#
# Uses helpers .lw, .aes, hex_with_alpha, brighten_hex from utils.R / primitives.R

# ── glyph_agent_r_dev: hexagonal R badge with terminal cursor ──────────────
glyph_agent_r_dev <- function(cx, cy, s, col, bright) {
  # hexagon
  t <- seq(0, 2 * pi, length.out = 7)
  r <- 28 * s
  hex <- data.frame(x = cx + r * cos(t + pi / 6), y = cy + r * sin(t + pi / 6))
  # R letter strokes
  r_vert <- data.frame(x = c(cx - 10 * s, cx - 10 * s), y = c(cy - 14 * s, cy + 14 * s))
  r_top <- data.frame(
    x = c(cx - 10 * s, cx + 4 * s, cx + 8 * s, cx + 8 * s, cx + 4 * s, cx - 10 * s),
    y = c(cy + 14 * s, cy + 14 * s, cy + 10 * s, cy + 4 * s, cy + 2 * s, cy + 2 * s)
  )
  r_leg <- data.frame(x = c(cx - 2 * s, cx + 10 * s), y = c(cy + 2 * s, cy - 14 * s))
  # terminal cursor blink
  cursor <- data.frame(
    xmin = cx + 14 * s, xmax = cx + 18 * s,
    ymin = cy - 16 * s, ymax = cy - 10 * s
  )
  list(
    ggplot2::geom_polygon(data = hex, .aes(x, y),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s)),
    ggplot2::geom_path(data = r_vert, .aes(x, y), color = bright, linewidth = .lw(s, 3)),
    ggplot2::geom_polygon(data = r_top, .aes(x, y),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = r_leg, .aes(x, y), color = bright, linewidth = .lw(s, 3)),
    ggplot2::geom_rect(data = cursor,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = bright, color = NA)
  )
}

# ── glyph_agent_code_review: magnifier over diff +/- lines ────────────────
glyph_agent_code_review <- function(cx, cy, s, col, bright) {
  # document background
  doc <- data.frame(
    xmin = cx - 20 * s, xmax = cx + 14 * s,
    ymin = cy - 22 * s, ymax = cy + 22 * s
  )
  # diff lines: + green, - red (using col shades)
  layers <- list(
    ggplot2::geom_rect(data = doc,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.08), color = col, linewidth = .lw(s, 1))
  )
  offsets <- c(12, 4, -4, -12) * s
  for (i in seq_along(offsets)) {
    y <- cy + offsets[i]
    is_add <- i %% 2 == 1
    line_col <- if (is_add) bright else hex_with_alpha(col, 0.6)
    line_df <- data.frame(x = c(cx - 16 * s, cx + 8 * s), y = c(y, y))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line_df, .aes(x, y),
      color = line_col, linewidth = .lw(s, 2))
    # +/- marker
    mark <- data.frame(x = cx - 18 * s, y = y)
    layers[[length(layers) + 1]] <- ggplot2::geom_point(data = mark, .aes(x, y),
      color = if (is_add) bright else col, size = 3 * s)
  }
  # magnifier circle
  lens <- data.frame(x0 = cx + 14 * s, y0 = cy - 10 * s, r = 12 * s)
  handle <- data.frame(x = c(cx + 22 * s, cx + 30 * s), y = c(cy - 18 * s, cy - 26 * s))
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = lens,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(col, 0.05), color = bright, linewidth = .lw(s, 2.5))
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = handle, .aes(x, y),
    color = bright, linewidth = .lw(s, 3.5))
  layers
}

# ── glyph_agent_security: shield with radar eye ──────────────────────────
glyph_agent_security <- function(cx, cy, s, col, bright) {
  w <- 34 * s; h <- 42 * s
  shield <- data.frame(
    x = c(cx - w / 2, cx - w / 2, cx - w * 0.25, cx, cx + w * 0.25, cx + w / 2, cx + w / 2),
    y = c(cy + h * 0.38, cy - h * 0.05, cy - h * 0.42, cy - h * 0.48, cy - h * 0.42, cy - h * 0.05, cy + h * 0.38)
  )
  # radar eye in center
  eye_outer <- data.frame(x0 = cx, y0 = cy, r = 12 * s)
  eye_inner <- data.frame(x0 = cx, y0 = cy, r = 5 * s)
  # scan line
  scan_t <- seq(0, pi / 2, length.out = 15)
  scan_r <- 12 * s
  scan <- data.frame(x = cx + scan_r * cos(scan_t), y = cy + scan_r * sin(scan_t))
  list(
    ggplot2::geom_polygon(data = shield, .aes(x, y),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s, 2)),
    ggforce::geom_circle(data = eye_outer, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.1), color = col, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = eye_inner, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_polygon(data = scan, .aes(x, y),
      fill = hex_with_alpha(bright, 0.2), color = NA)
  )
}

# ── glyph_agent_web_dev: browser window with angle brackets ──────────────
glyph_agent_web_dev <- function(cx, cy, s, col, bright) {
  w <- 36 * s; h <- 34 * s
  # browser frame
  frame <- data.frame(
    xmin = cx - w / 2, xmax = cx + w / 2,
    ymin = cy - h / 2, ymax = cy + h / 2
  )
  # title bar
  bar <- data.frame(
    xmin = cx - w / 2, xmax = cx + w / 2,
    ymin = cy + h / 2 - 6 * s, ymax = cy + h / 2
  )
  # three dots in title bar
  dots <- data.frame(
    x = cx + c(-14, -10, -6) * s,
    y = rep(cy + h / 2 - 3 * s, 3)
  )
  # < / > code symbol
  lt <- data.frame(x = c(cx - 2 * s, cx - 12 * s, cx - 2 * s),
                   y = c(cy + 4 * s, cy - 4 * s, cy - 12 * s))
  gt <- data.frame(x = c(cx + 2 * s, cx + 12 * s, cx + 2 * s),
                   y = c(cy + 4 * s, cy - 4 * s, cy - 12 * s))
  slash <- data.frame(x = c(cx + 3 * s, cx - 3 * s), y = c(cy + 6 * s, cy - 14 * s))
  list(
    ggplot2::geom_rect(data = frame,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s)),
    ggplot2::geom_rect(data = bar,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1)),
    ggplot2::geom_point(data = dots, .aes(x, y), color = col, size = 2.5 * s),
    ggplot2::geom_path(data = lt, .aes(x, y), color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = gt, .aes(x, y), color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = slash, .aes(x, y), color = col, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_survivalist: compass rose with flame center ──────────────
glyph_agent_survivalist <- function(cx, cy, s, col, bright) {
  r_outer <- 28 * s; r_inner <- 12 * s
  # 4 cardinal points
  pts <- data.frame(x = numeric(0), y = numeric(0))
  for (i in 0:3) {
    angle <- i * pi / 2
    pts <- rbind(pts,
      data.frame(x = cx + r_outer * cos(angle), y = cy + r_outer * sin(angle)),
      data.frame(x = cx + r_inner * cos(angle + pi / 4), y = cy + r_inner * sin(angle + pi / 4))
    )
  }
  # small flame in center
  t <- seq(0, 1, length.out = 20)
  hw <- 6 * s; h <- 14 * s
  lx <- cx - hw * sin(t * pi) * (1 - t^0.6)
  ly <- cy - h / 2 + h * t
  flame <- data.frame(
    x = c(lx, rev(cx + hw * sin(rev(t) * pi) * (1 - rev(t)^0.6))),
    y = c(ly, rev(ly))
  )
  # circle ring
  ring <- data.frame(x0 = cx, y0 = cy, r = 20 * s)
  list(
    ggplot2::geom_polygon(data = pts, .aes(x, y),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 2)),
    ggforce::geom_circle(data = ring, .aes(x0 = x0, y0 = y0, r = r),
      fill = NA, color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_polygon(data = flame, .aes(x, y),
      fill = hex_with_alpha(bright, 0.35), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_mystic: third eye with concentric mandala rings ──────────
glyph_agent_mystic <- function(cx, cy, s, col, bright) {
  layers <- list()
  # mandala rings
  for (r in c(28, 22, 16) * s) {
    ring <- data.frame(x0 = cx, y0 = cy, r = r)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = ring,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = NA, color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1.2))
  }
  # eye shape (vesica piscis)
  t <- seq(-pi / 3, pi / 3, length.out = 30)
  top_lid <- data.frame(x = cx + 20 * s * sin(t * 1.5), y = cy + 10 * s * sin(t))
  bot_lid <- data.frame(x = cx + 20 * s * sin(t * 1.5), y = cy - 10 * s * sin(t))
  eye_df <- data.frame(x = c(top_lid$x, rev(bot_lid$x)), y = c(top_lid$y, rev(bot_lid$y)))
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = eye_df, .aes(x, y),
    fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 2))
  # iris
  iris <- data.frame(x0 = cx, y0 = cy, r = 6 * s)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = iris,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 2))
  # pupil
  pupil <- data.frame(x0 = cx, y0 = cy, r = 2.5 * s)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = pupil,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = bright, color = bright, linewidth = .lw(s, 1))
  layers
}

# ── glyph_agent_martial: flowing circle with balanced figure ─────────────
glyph_agent_martial <- function(cx, cy, s, col, bright) {
  # outer flowing circle
  t <- seq(0, 2 * pi, length.out = 60)
  r <- 28 * s
  # slight wave to convey motion
  wave_r <- r + 2 * s * sin(t * 3)
  circle <- data.frame(x = cx + wave_r * cos(t), y = cy + wave_r * sin(t))
  # balanced figure: head + body line + extended arms
  head <- data.frame(x0 = cx, y0 = cy + 10 * s, r = 5 * s)
  body <- data.frame(x = c(cx, cx), y = c(cy + 5 * s, cy - 10 * s))
  arm_l <- data.frame(x = c(cx, cx - 14 * s), y = c(cy + 2 * s, cy + 8 * s))
  arm_r <- data.frame(x = c(cx, cx + 14 * s), y = c(cy + 2 * s, cy - 4 * s))
  leg_l <- data.frame(x = c(cx, cx - 10 * s), y = c(cy - 10 * s, cy - 20 * s))
  leg_r <- data.frame(x = c(cx, cx + 12 * s), y = c(cy - 10 * s, cy - 18 * s))
  list(
    ggplot2::geom_polygon(data = circle, .aes(x, y),
      fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = head, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = body, .aes(x, y), color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_path(data = arm_l, .aes(x, y), color = col, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = arm_r, .aes(x, y), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = leg_l, .aes(x, y), color = col, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = leg_r, .aes(x, y), color = col, linewidth = .lw(s, 2))
  )
}

# ── glyph_agent_designer: golden spiral inside compass circle ────────────
glyph_agent_designer <- function(cx, cy, s, col, bright) {
  # compass circle
  compass <- data.frame(x0 = cx, y0 = cy, r = 28 * s)
  # golden spiral (logarithmic approximation)
  n <- 80
  t <- seq(0, 3.5 * pi, length.out = n)
  r_sp <- 3 * s * exp(0.15 * t)
  r_sp <- pmin(r_sp, 24 * s)  # clamp
  spiral <- data.frame(x = cx + r_sp * cos(t), y = cy + r_sp * sin(t))
  # crosshairs
  ch_h <- data.frame(x = c(cx - 30 * s, cx + 30 * s), y = c(cy, cy))
  ch_v <- data.frame(x = c(cx, cx), y = c(cy - 30 * s, cy + 30 * s))
  # small diamond at compass points
  diamonds <- list()
  for (a in c(0, pi / 2, pi, 3 * pi / 2)) {
    dx <- 28 * s * cos(a); dy <- 28 * s * sin(a)
    d <- 3 * s
    diamonds[[length(diamonds) + 1]] <- data.frame(
      x = c(cx + dx, cx + dx + d * cos(a + pi / 2), cx + dx + d * 1.5 * cos(a),
            cx + dx + d * cos(a - pi / 2)),
      y = c(cy + dy, cy + dy + d * sin(a + pi / 2), cy + dy + d * 1.5 * sin(a),
            cy + dy + d * sin(a - pi / 2))
    )
  }
  layers <- list(
    ggforce::geom_circle(data = compass, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.06), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = ch_h, .aes(x, y), color = col, linewidth = .lw(s, 0.8)),
    ggplot2::geom_path(data = ch_v, .aes(x, y), color = col, linewidth = .lw(s, 0.8)),
    ggplot2::geom_path(data = spiral, .aes(x, y), color = bright, linewidth = .lw(s, 2.5))
  )
  for (d in diamonds) {
    layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = d, .aes(x, y),
      fill = bright, color = bright, linewidth = .lw(s, 1))
  }
  layers
}

# ── glyph_agent_gxp: shield with document + checkmark overlay ───────────
glyph_agent_gxp <- function(cx, cy, s, col, bright) {
  w <- 34 * s; h <- 44 * s
  shield <- data.frame(
    x = c(cx - w / 2, cx - w / 2, cx - w * 0.25, cx, cx + w * 0.25, cx + w / 2, cx + w / 2),
    y = c(cy + h * 0.36, cy - h * 0.05, cy - h * 0.42, cy - h * 0.48, cy - h * 0.42, cy - h * 0.05, cy + h * 0.36)
  )
  # small document inside
  doc <- data.frame(
    xmin = cx - 8 * s, xmax = cx + 8 * s,
    ymin = cy - 6 * s, ymax = cy + 14 * s
  )
  # doc lines
  l1 <- data.frame(x = c(cx - 5 * s, cx + 5 * s), y = c(cy + 10 * s, cy + 10 * s))
  l2 <- data.frame(x = c(cx - 5 * s, cx + 5 * s), y = c(cy + 6 * s, cy + 6 * s))
  l3 <- data.frame(x = c(cx - 5 * s, cx + 3 * s), y = c(cy + 2 * s, cy + 2 * s))
  # checkmark below doc
  ck <- data.frame(
    x = c(cx - 6 * s, cx - 1 * s, cx + 8 * s),
    y = c(cy - 8 * s, cy - 14 * s, cy - 2 * s)
  )
  list(
    ggplot2::geom_polygon(data = shield, .aes(x, y),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_rect(data = doc,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.15), color = col, linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = l1, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = l2, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = l3, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = ck, .aes(x, y), color = bright, linewidth = .lw(s, 3))
  )
}

# ── glyph_agent_auditor: clipboard with magnifying glass ─────────────────
glyph_agent_auditor <- function(cx, cy, s, col, bright) {
  w <- 26 * s; h <- 36 * s
  board <- data.frame(
    xmin = cx - w / 2 - 4 * s, xmax = cx + w / 2 - 4 * s,
    ymin = cy - h / 2, ymax = cy + h / 2 - 4 * s
  )
  clip <- data.frame(
    xmin = cx - 8 * s, xmax = cx + 4 * s,
    ymin = cy + h / 2 - 6 * s, ymax = cy + h / 2
  )
  # lines on clipboard
  layers <- list(
    ggplot2::geom_rect(data = board,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s)),
    ggplot2::geom_rect(data = clip,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 1.5))
  )
  for (i in 1:4) {
    y <- cy + (2 - i) * 8 * s
    line_df <- data.frame(x = c(cx - w / 2 + 2 * s, cx + w / 2 - 10 * s), y = c(y, y))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line_df, .aes(x, y),
      color = col, linewidth = .lw(s, 1.2))
  }
  # magnifier overlay (bottom-right)
  lens <- data.frame(x0 = cx + 12 * s, y0 = cy - 8 * s, r = 10 * s)
  handle <- data.frame(x = c(cx + 19 * s, cx + 28 * s), y = c(cy - 15 * s, cy - 24 * s))
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = lens,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(col, 0.05), color = bright, linewidth = .lw(s, 2))
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = handle, .aes(x, y),
    color = bright, linewidth = .lw(s, 3))
  layers
}

# ── glyph_agent_researcher: open book with magnifier ─────────────────────
glyph_agent_researcher <- function(cx, cy, s, col, bright) {
  # left page
  lp <- data.frame(
    x = c(cx - 24 * s, cx - 24 * s, cx, cx),
    y = c(cy - 16 * s, cy + 16 * s, cy + 12 * s, cy - 16 * s)
  )
  # right page
  rp <- data.frame(
    x = c(cx, cx, cx + 24 * s, cx + 24 * s),
    y = c(cy - 16 * s, cy + 12 * s, cy + 16 * s, cy - 16 * s)
  )
  # spine
  spine <- data.frame(x = c(cx, cx), y = c(cy - 16 * s, cy + 12 * s))
  # text lines on left page
  layers <- list(
    ggplot2::geom_polygon(data = lp, .aes(x, y),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_polygon(data = rp, .aes(x, y),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = spine, .aes(x, y), color = bright, linewidth = .lw(s, 2))
  )
  for (i in 1:3) {
    y <- cy + 6 * s - i * 6 * s
    l_df <- data.frame(x = c(cx - 20 * s, cx - 4 * s), y = c(y, y))
    r_df <- data.frame(x = c(cx + 4 * s, cx + 20 * s), y = c(y, y))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = l_df, .aes(x, y),
      color = col, linewidth = .lw(s, 1))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = r_df, .aes(x, y),
      color = col, linewidth = .lw(s, 1))
  }
  # magnifier in top-right
  lens <- data.frame(x0 = cx + 16 * s, y0 = cy + 14 * s, r = 8 * s)
  handle <- data.frame(x = c(cx + 22 * s, cx + 28 * s), y = c(cy + 8 * s, cy + 2 * s))
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = lens,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(bright, 0.1), color = bright, linewidth = .lw(s, 2))
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = handle, .aes(x, y),
    color = bright, linewidth = .lw(s, 2.5))
  layers
}

# ── glyph_agent_data_sci: scatter chart with brain node ──────────────────
glyph_agent_data_sci <- function(cx, cy, s, col, bright) {
  # axes
  x_axis <- data.frame(x = c(cx - 22 * s, cx + 22 * s), y = c(cy - 18 * s, cy - 18 * s))
  y_axis <- data.frame(x = c(cx - 22 * s, cx - 22 * s), y = c(cy - 18 * s, cy + 18 * s))
  # scatter dots
  dots <- data.frame(
    x = cx + c(-14, -6, 2, 8, 14, -10, 4, 12) * s,
    y = cy + c(-10, -2, 4, -6, 8, 6, 12, 2) * s
  )
  # trend line
  trend <- data.frame(x = c(cx - 18 * s, cx + 18 * s), y = c(cy - 14 * s, cy + 10 * s))
  # brain circle (top-right)
  brain <- data.frame(x0 = cx + 16 * s, y0 = cy + 14 * s, r = 7 * s)
  # brain squiggle
  bt <- seq(0, 2 * pi, length.out = 20)
  squig <- data.frame(
    x = cx + 16 * s + 4 * s * cos(bt),
    y = cy + 14 * s + 3 * s * sin(bt * 2)
  )
  list(
    ggplot2::geom_path(data = x_axis, .aes(x, y), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = y_axis, .aes(x, y), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_point(data = dots, .aes(x, y), color = bright, size = 3 * s),
    ggplot2::geom_path(data = trend, .aes(x, y), color = col, linewidth = .lw(s, 1.2)),
    ggforce::geom_circle(data = brain, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = squig, .aes(x, y), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_architect: layered blocks / architecture towers ──────────
glyph_agent_architect <- function(cx, cy, s, col, bright) {
  layers <- list()
  # three towers of different heights
  towers <- list(
    list(x = cx - 14 * s, w = 10 * s, h = 30 * s),
    list(x = cx + 2 * s,  w = 10 * s, h = 40 * s),
    list(x = cx + 18 * s, w = 10 * s, h = 24 * s)
  )
  base_y <- cy - 20 * s
  for (i in seq_along(towers)) {
    tw <- towers[[i]]
    df <- data.frame(
      xmin = tw$x - tw$w / 2, xmax = tw$x + tw$w / 2,
      ymin = base_y, ymax = base_y + tw$h
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_rect(data = df,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.1 + 0.06 * i), color = bright, linewidth = .lw(s, 1.8))
    # window dots
    for (j in 1:3) {
      wy <- base_y + j * tw$h / 4
      if (wy < base_y + tw$h - 2 * s) {
        dot <- data.frame(x = tw$x, y = wy)
        layers[[length(layers) + 1]] <- ggplot2::geom_point(data = dot, .aes(x, y),
          color = bright, size = 2 * s)
      }
    }
  }
  # connecting arrows between towers
  for (pair in list(c(1, 2), c(2, 3))) {
    t1 <- towers[[pair[1]]]; t2 <- towers[[pair[2]]]
    arr <- data.frame(
      x = c(t1$x + t1$w / 2 + 1 * s, t2$x - t2$w / 2 - 1 * s),
      y = c(base_y + min(t1$h, t2$h) * 0.6, base_y + min(t1$h, t2$h) * 0.6)
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = arr, .aes(x, y),
      color = col, linewidth = .lw(s, 1.2))
  }
  layers
}

# ── glyph_agent_web_design: layout grid with color palette ───────────────
glyph_agent_web_design <- function(cx, cy, s, col, bright) {
  # grid frame
  frame <- data.frame(
    xmin = cx - 24 * s, xmax = cx + 24 * s,
    ymin = cy - 20 * s, ymax = cy + 20 * s
  )
  # header bar
  header <- data.frame(
    xmin = cx - 24 * s, xmax = cx + 24 * s,
    ymin = cy + 14 * s, ymax = cy + 20 * s
  )
  # sidebar
  sidebar <- data.frame(
    xmin = cx - 24 * s, xmax = cx - 10 * s,
    ymin = cy - 20 * s, ymax = cy + 14 * s
  )
  # content area
  content <- data.frame(
    xmin = cx - 10 * s, xmax = cx + 24 * s,
    ymin = cy - 20 * s, ymax = cy + 14 * s
  )
  # color swatches at bottom
  swatches <- list()
  for (i in 1:4) {
    sw <- data.frame(
      xmin = cx - 4 * s + (i - 1) * 8 * s, xmax = cx + 2 * s + (i - 1) * 8 * s,
      ymin = cy - 18 * s, ymax = cy - 12 * s
    )
    swatches[[i]] <- sw
  }
  layers <- list(
    ggplot2::geom_rect(data = frame,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.06), color = bright, linewidth = .lw(s)),
    ggplot2::geom_rect(data = header,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.2), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_rect(data = sidebar,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.1), color = col, linewidth = .lw(s, 0.8)),
    ggplot2::geom_rect(data = content,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = NA, color = col, linewidth = .lw(s, 0.8))
  )
  for (i in seq_along(swatches)) {
    alpha <- 0.2 + 0.1 * i
    layers[[length(layers) + 1]] <- ggplot2::geom_rect(data = swatches[[i]],
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(bright, alpha), color = bright, linewidth = .lw(s, 1))
  }
  layers
}

# ── glyph_agent_ux: user silhouette with flow arrows ────────────────────
glyph_agent_ux <- function(cx, cy, s, col, bright) {
  # user head
  head <- data.frame(x0 = cx - 8 * s, y0 = cy + 14 * s, r = 7 * s)
  # user shoulders arc
  t <- seq(0, pi, length.out = 25)
  shoulders <- data.frame(
    x = cx - 8 * s + 14 * s * cos(t),
    y = cy + 2 * s - 8 * s * sin(t)
  )
  # flow arrows going right
  arrows <- list()
  for (i in 1:3) {
    y <- cy + (2 - i) * 10 * s - 2 * s
    arr <- data.frame(
      x = c(cx + 6 * s, cx + 20 * s),
      y = c(y, y)
    )
    # arrowhead
    ah <- data.frame(
      x = c(cx + 17 * s, cx + 22 * s, cx + 17 * s),
      y = c(y + 3 * s, y, y - 3 * s)
    )
    arrows[[length(arrows) + 1]] <- list(arr = arr, ah = ah)
  }
  # flow dots
  dots <- data.frame(
    x = cx + c(26, 26, 26) * s,
    y = cy + c(8, -2, -12) * s
  )
  layers <- list(
    ggforce::geom_circle(data = head, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = shoulders, .aes(x, y),
      color = bright, linewidth = .lw(s, 2))
  )
  for (a in arrows) {
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = a$arr, .aes(x, y),
      color = col, linewidth = .lw(s, 2))
    layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = a$ah, .aes(x, y),
      fill = bright, color = bright, linewidth = .lw(s, 1))
  }
  layers[[length(layers) + 1]] <- ggplot2::geom_point(data = dots, .aes(x, y),
    color = bright, size = 3.5 * s)
  layers
}

# ── glyph_agent_pm: Gantt bars with milestone diamond ────────────────────
glyph_agent_pm <- function(cx, cy, s, col, bright) {
  layers <- list()
  # gantt bars (staggered horizontal)
  bars <- list(
    list(y = 14, x0 = -20, w = 20),
    list(y = 4,  x0 = -10, w = 24),
    list(y = -6, x0 = -4,  w = 18),
    list(y = -16, x0 = 2,  w = 22)
  )
  for (b in bars) {
    df <- data.frame(
      xmin = cx + b$x0 * s, xmax = cx + (b$x0 + b$w) * s,
      ymin = cy + (b$y - 3) * s, ymax = cy + (b$y + 3) * s
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_rect(data = df,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 1.5))
  }
  # milestone diamond
  md <- data.frame(
    x = cx + c(0, 4, 0, -4) * s + 16 * s,
    y = cy + c(4, 0, -4, 0) * s + 4 * s
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = md, .aes(x, y),
    fill = bright, color = bright, linewidth = .lw(s, 1.5))
  # dependency arrows
  for (i in 1:3) {
    b1 <- bars[[i]]; b2 <- bars[[i + 1]]
    arr <- data.frame(
      x = c(cx + (b1$x0 + b1$w) * s, cx + b2$x0 * s),
      y = c(cy + b1$y * s, cy + b2$y * s)
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = arr, .aes(x, y),
      color = col, linewidth = .lw(s, 1))
  }
  layers
}

# ── glyph_agent_devops: infinity loop with gear ─────────────────────────
glyph_agent_devops <- function(cx, cy, s, col, bright) {
  # infinity loop (lemniscate)
  t <- seq(0, 2 * pi, length.out = 80)
  a <- 22 * s
  denom <- 1 + sin(t)^2
  inf_x <- cx + a * cos(t) / denom
  inf_y <- cy + a * sin(t) * cos(t) / denom
  infinity <- data.frame(x = inf_x, y = inf_y)
  # gear in center
  n_teeth <- 8
  gear_pts <- data.frame(x = numeric(0), y = numeric(0))
  for (i in seq_len(n_teeth * 2)) {
    angle <- (i - 1) * pi / n_teeth
    r <- if (i %% 2 == 1) 8 * s else 6 * s
    gear_pts <- rbind(gear_pts,
      data.frame(x = cx + r * cos(angle), y = cy + r * sin(angle)))
  }
  gear_center <- data.frame(x0 = cx, y0 = cy, r = 3 * s)
  list(
    ggplot2::geom_path(data = infinity, .aes(x, y),
      color = bright, linewidth = .lw(s, 3)),
    ggplot2::geom_polygon(data = gear_pts, .aes(x, y),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = gear_center, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_mlops: neural network with pipeline arrow ───────────────
glyph_agent_mlops <- function(cx, cy, s, col, bright) {
  layers <- list()
  # three columns of nodes (2-3-2 neural net)
  cols <- list(
    list(x = cx - 18 * s, ys = c(cy + 10 * s, cy - 10 * s)),
    list(x = cx,          ys = c(cy + 14 * s, cy, cy - 14 * s)),
    list(x = cx + 18 * s, ys = c(cy + 10 * s, cy - 10 * s))
  )
  # connections first (behind nodes)
  for (ci in 1:(length(cols) - 1)) {
    for (y1 in cols[[ci]]$ys) {
      for (y2 in cols[[ci + 1]]$ys) {
        line <- data.frame(
          x = c(cols[[ci]]$x, cols[[ci + 1]]$x),
          y = c(y1, y2)
        )
        layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
          color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1))
      }
    }
  }
  # nodes
  for (ci in seq_along(cols)) {
    for (y in cols[[ci]]$ys) {
      node <- data.frame(x0 = cols[[ci]]$x, y0 = y, r = 4 * s)
      layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
        .aes(x0 = x0, y0 = y0, r = r),
        fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 1.8))
    }
  }
  # pipeline arrow below
  arrow_df <- data.frame(
    x = c(cx - 22 * s, cx + 22 * s),
    y = c(cy - 24 * s, cy - 24 * s)
  )
  ah <- data.frame(
    x = c(cx + 18 * s, cx + 24 * s, cx + 18 * s),
    y = c(cy - 21 * s, cy - 24 * s, cy - 27 * s)
  )
  layers[[length(layers) + 1]] <- ggplot2::geom_path(data = arrow_df, .aes(x, y),
    color = bright, linewidth = .lw(s, 2.5))
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = ah, .aes(x, y),
    fill = bright, color = bright, linewidth = .lw(s, 1))
  layers
}

# ── glyph_agent_putior: flowchart with connected nodes ───────────────────
glyph_agent_putior <- function(cx, cy, s, col, bright) {
  layers <- list()
  # nodes: start (circle), process (rect), decision (diamond), end (rounded rect)
  # start circle
  start <- data.frame(x0 = cx, y0 = cy + 20 * s, r = 6 * s)
  # process box
  proc <- data.frame(
    xmin = cx - 12 * s, xmax = cx + 12 * s,
    ymin = cy + 2 * s, ymax = cy + 12 * s
  )
  # decision diamond
  diamond <- data.frame(
    x = cx + c(0, 10, 0, -10) * s,
    y = cy + c(-2, -10, -18, -10) * s
  )
  # connecting lines
  l1 <- data.frame(x = c(cx, cx), y = c(cy + 14 * s, cy + 12 * s))
  l2 <- data.frame(x = c(cx, cx), y = c(cy + 2 * s, cy - 2 * s))
  # side branch from diamond
  l3 <- data.frame(x = c(cx + 10 * s, cx + 22 * s), y = c(cy - 10 * s, cy - 10 * s))
  end_box <- data.frame(
    xmin = cx + 22 * s, xmax = cx + 32 * s,
    ymin = cy - 14 * s, ymax = cy - 6 * s
  )
  list(
    ggforce::geom_circle(data = start, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_path(data = l1, .aes(x, y), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_rect(data = proc,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.8)),
    ggplot2::geom_path(data = l2, .aes(x, y), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_polygon(data = diamond, .aes(x, y),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.8)),
    ggplot2::geom_path(data = l3, .aes(x, y), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_rect(data = end_box,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(bright, 0.2), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_swarm: hexagonal cell cluster with radiating connections ──
glyph_agent_swarm <- function(cx, cy, s, col, bright) {
  layers <- list()
  # central hex
  hex_r <- 10 * s
  t <- seq(0, 2 * pi, length.out = 7)
  center_hex <- data.frame(x = cx + hex_r * cos(t + pi / 6),
                           y = cy + hex_r * sin(t + pi / 6))
  layers[[1]] <- ggplot2::geom_polygon(data = center_hex, .aes(x, y),
    fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 2))
  # six surrounding hex cells
  for (i in 1:6) {
    angle <- (i - 1) * pi / 3
    hx <- cx + 18 * s * cos(angle)
    hy <- cy + 18 * s * sin(angle)
    hex <- data.frame(x = hx + hex_r * 0.7 * cos(t + pi / 6),
                      y = hy + hex_r * 0.7 * sin(t + pi / 6))
    layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = hex, .aes(x, y),
      fill = hex_with_alpha(col, 0.12), color = col, linewidth = .lw(s, 1.2))
    # connection line from center to satellite
    line <- data.frame(x = c(cx, hx), y = c(cy, hy))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(bright, 0.5), linewidth = .lw(s, 1.5))
  }
  # radiating signal lines outward
  for (i in c(1, 3, 5)) {
    angle <- (i - 1) * pi / 3
    line <- data.frame(
      x = c(cx + 24 * s * cos(angle), cx + 32 * s * cos(angle)),
      y = c(cy + 24 * s * sin(angle), cy + 32 * s * sin(angle))
    )
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = bright, linewidth = .lw(s, 2))
  }
  layers
}

# ── glyph_agent_shifter: overlapping geometric shapes transitioning ───────
glyph_agent_shifter <- function(cx, cy, s, col, bright) {
  # triangle (left side, fading)
  tri <- data.frame(
    x = c(cx - 24 * s, cx - 8 * s, cx - 16 * s),
    y = c(cy - 12 * s, cy - 12 * s, cy + 12 * s)
  )
  # square (center, mid-transition)
  sq <- data.frame(
    xmin = cx - 8 * s, xmax = cx + 8 * s,
    ymin = cy - 8 * s, ymax = cy + 8 * s
  )
  # circle (right side, full)
  circ <- data.frame(x0 = cx + 18 * s, y0 = cy, r = 10 * s)
  # transition particles between shapes
  particles <- data.frame(
    x = cx + c(-14, -4, 6, 14, -8, 2, 10) * s,
    y = cy + c(16, -16, 18, -14, -20, 20, -18) * s
  )
  # morphing arcs connecting shapes
  t <- seq(0, pi, length.out = 15)
  arc1 <- data.frame(x = cx - 16 * s + 8 * s * cos(t),
                     y = cy - 16 * s + 4 * s * sin(t))
  arc2 <- data.frame(x = cx + 2 * s + 8 * s * cos(t),
                     y = cy + 16 * s + 4 * s * sin(t))
  list(
    ggplot2::geom_polygon(data = tri, .aes(x, y),
      fill = hex_with_alpha(col, 0.15), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_rect(data = sq,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2)),
    ggforce::geom_circle(data = circ, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.25), color = bright, linewidth = .lw(s, 2.5)),
    ggplot2::geom_point(data = particles, .aes(x, y),
      color = hex_with_alpha(bright, 0.5), size = 2 * s),
    ggplot2::geom_path(data = arc1, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = arc2, .aes(x, y), color = col, linewidth = .lw(s, 1))
  )
}

# ── glyph_agent_jigsawr: interlocking puzzle pieces in hexagonal badge ──
glyph_agent_jigsawr <- function(cx, cy, s, col, bright) {
  # hexagonal outer frame
  t <- seq(0, 2 * pi, length.out = 7)
  r <- 28 * s
  hex <- data.frame(x = cx + r * cos(t + pi / 6), y = cy + r * sin(t + pi / 6))
  # Two interlocking puzzle pieces
  # Left piece
  lp <- data.frame(
    x = cx + s * c(-16, -4, -4, -2, 0, -2, -4, -4, -16, -16),
    y = cy + s * c(12, 12, 5, 4, 0, -4, -5, -12, -12, 12)
  )
  # Right piece (interlocks with left)
  rp <- data.frame(
    x = cx + s * c(-4, 16, 16, -4, -4, -2, 0, -2, -4, -4, -2, 0, -2, -4),
    y = cy + s * c(12, 12, -12, -12, -5, -4, 0, 4, 5, 12, 12, 12, 12, 12)
  )
  # Simplified: two rectangles with a tab
  rp_simple <- data.frame(
    x = cx + s * c(0, 16, 16, 0, 0, 2, 4, 2, 0),
    y = cy + s * c(12, 12, -12, -12, -5, -4, 0, 4, 5)
  )
  # Code cursor at center
  cursor <- data.frame(
    xmin = cx + 6 * s, xmax = cx + 10 * s,
    ymin = cy - 2 * s, ymax = cy + 2 * s
  )
  list(
    ggplot2::geom_polygon(data = hex, .aes(x, y),
      fill = hex_with_alpha(col, 0.08), color = col, linewidth = .lw(s, 1.5)),
    ggplot2::geom_polygon(data = lp, .aes(x, y),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_polygon(data = rp_simple, .aes(x, y),
      fill = hex_with_alpha(bright, 0.15), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_rect(data = cursor,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = bright, color = NA)
  )
}

# ── glyph_agent_alchemist: triangular flask with inner flame + spiral ──────
glyph_agent_alchemist <- function(cx, cy, s, col, bright) {
  # Erlenmeyer flask shape (wide bottom, narrow neck)
  flask <- data.frame(
    x = c(cx - 6 * s, cx + 6 * s, cx + 20 * s, cx + 20 * s,
          cx - 20 * s, cx - 20 * s),
    y = c(cy + 24 * s, cy + 24 * s, cy - 8 * s, cy - 20 * s,
          cy - 20 * s, cy - 8 * s)
  )
  # Neck ring
  neck <- data.frame(
    xmin = cx - 8 * s, xmax = cx + 8 * s,
    ymin = cy + 22 * s, ymax = cy + 26 * s
  )
  # Inner flame
  t <- seq(0, 1, length.out = 25)
  hw <- 7 * s; h <- 18 * s
  lx <- cx - hw * sin(t * pi) * (1 - t^0.6)
  ly <- cy - 16 * s + h * t
  flame <- data.frame(
    x = c(lx, rev(cx + hw * sin(rev(t) * pi) * (1 - rev(t)^0.6))),
    y = c(ly, rev(ly))
  )
  # Transformation spiral (around flask)
  sp_t <- seq(0, 2.5 * pi, length.out = 40)
  sp_r <- 3 * s * exp(0.12 * sp_t)
  sp_r <- pmin(sp_r, 16 * s)
  spiral <- data.frame(
    x = cx + sp_r * cos(sp_t),
    y = cy - 2 * s + sp_r * sin(sp_t) * 0.5
  )
  list(
    ggplot2::geom_polygon(data = flask, .aes(x, y),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_rect(data = neck,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_polygon(data = flame, .aes(x, y),
      fill = hex_with_alpha(bright, 0.35), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = spiral, .aes(x, y),
      color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_polymath: star network spanning multiple quadrants ─────────
glyph_agent_polymath <- function(cx, cy, s, col, bright) {
  layers <- list()
  # Central hub (brain/star)
  hub <- data.frame(x0 = cx, y0 = cy, r = 8 * s)
  # Knowledge domain nodes in 5 positions (pentagon arrangement)
  n_nodes <- 5
  node_r <- 24 * s
  nodes <- list()
  for (i in seq_len(n_nodes)) {
    angle <- -pi / 2 + (i - 1) * 2 * pi / n_nodes
    nodes[[i]] <- c(cx + node_r * cos(angle), cy + node_r * sin(angle))
  }
  # Connections from hub to each node
  for (pos in nodes) {
    line <- data.frame(x = c(cx, pos[1]), y = c(cy, pos[2]))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1.5))
  }
  # Cross-connections between adjacent nodes
  for (i in seq_len(n_nodes)) {
    j <- if (i == n_nodes) 1L else i + 1L
    line <- data.frame(x = c(nodes[[i]][1], nodes[[j]][1]),
                       y = c(nodes[[i]][2], nodes[[j]][2]))
    layers[[length(layers) + 1]] <- ggplot2::geom_path(data = line, .aes(x, y),
      color = hex_with_alpha(col, 0.3), linewidth = .lw(s, 1))
  }
  # Domain nodes
  for (i in seq_along(nodes)) {
    pos <- nodes[[i]]
    node <- data.frame(x0 = pos[1], y0 = pos[2], r = 5 * s)
    layers[[length(layers) + 1]] <- ggforce::geom_circle(data = node,
      .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.8))
  }
  # Central hub (on top)
  layers[[length(layers) + 1]] <- ggforce::geom_circle(data = hub,
    .aes(x0 = x0, y0 = y0, r = r),
    fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 2.5))
  # Star in center of hub
  star_pts <- data.frame(x = numeric(0), y = numeric(0))
  for (i in 0:4) {
    outer_a <- -pi / 2 + i * 2 * pi / 5
    inner_a <- outer_a + pi / 5
    star_pts <- rbind(star_pts,
      data.frame(x = cx + 5 * s * cos(outer_a), y = cy + 5 * s * sin(outer_a)),
      data.frame(x = cx + 2.5 * s * cos(inner_a), y = cy + 2.5 * s * sin(inner_a))
    )
  }
  layers[[length(layers) + 1]] <- ggplot2::geom_polygon(data = star_pts, .aes(x, y),
    fill = bright, color = bright, linewidth = .lw(s, 1))
  layers
}

# ── glyph_agent_tcg: playing card with star rating overlay ─────────────────
glyph_agent_tcg <- function(cx, cy, s, col, bright) {
  # Main card
  card <- data.frame(
    xmin = cx - 16 * s, xmax = cx + 16 * s,
    ymin = cy - 24 * s, ymax = cy + 24 * s
  )
  # Inner border
  inner <- data.frame(
    xmin = cx - 13 * s, xmax = cx + 13 * s,
    ymin = cy - 20 * s, ymax = cy + 20 * s
  )
  # Card art area (top half of inner)
  art <- data.frame(
    xmin = cx - 13 * s, xmax = cx + 13 * s,
    ymin = cy + 2 * s, ymax = cy + 20 * s
  )
  # Star in card art
  star_pts <- data.frame(x = numeric(0), y = numeric(0))
  star_cy <- cy + 11 * s
  for (i in 0:4) {
    outer_a <- -pi / 2 + i * 2 * pi / 5
    inner_a <- outer_a + pi / 5
    star_pts <- rbind(star_pts,
      data.frame(x = cx + 10 * s * cos(outer_a),
                 y = star_cy + 10 * s * sin(outer_a)),
      data.frame(x = cx + 5 * s * cos(inner_a),
                 y = star_cy + 5 * s * sin(inner_a))
    )
  }
  # Text lines in bottom half
  l1 <- data.frame(x = c(cx - 10 * s, cx + 10 * s), y = c(cy - 6 * s, cy - 6 * s))
  l2 <- data.frame(x = c(cx - 10 * s, cx + 6 * s), y = c(cy - 12 * s, cy - 12 * s))
  # Small fanned card behind (to show deck context)
  behind <- data.frame(
    x = c(cx - 12 * s, cx + 20 * s, cx + 20 * s, cx - 12 * s),
    y = c(cy - 22 * s, cy - 22 * s, cy + 26 * s, cy + 26 * s)
  )
  list(
    ggplot2::geom_polygon(data = behind, .aes(x, y),
      fill = hex_with_alpha(col, 0.06), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_rect(data = card,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_rect(data = inner,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = NA, color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_rect(data = art,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.1), color = NA),
    ggplot2::geom_polygon(data = star_pts, .aes(x, y),
      fill = hex_with_alpha(bright, 0.35), color = bright, linewidth = .lw(s, 1.5)),
    ggplot2::geom_path(data = l1, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = l2, .aes(x, y), color = col, linewidth = .lw(s, 1))
  )
}

# ── glyph_agent_gardener: bonsai tree inside contemplative enso circle ─────
glyph_agent_gardener <- function(cx, cy, s, col, bright) {
  # Outer enso ring (incomplete circle, ~300 degrees)
  t_enso <- seq(pi / 6, pi / 6 + 5 * pi / 3, length.out = 60)
  r_enso <- 28 * s
  enso <- data.frame(
    x = cx + r_enso * cos(t_enso),
    y = cy + r_enso * sin(t_enso)
  )
  # Soil line (horizontal segment at base)
  soil <- data.frame(
    x = c(cx - 16 * s, cx + 16 * s),
    y = c(cy - 12 * s, cy - 12 * s)
  )
  # Trunk: vertical rectangle from center-bottom
  trunk <- data.frame(
    xmin = cx - 2.5 * s, xmax = cx + 2.5 * s,
    ymin = cy - 12 * s, ymax = cy + 2 * s
  )
  # Canopy: 2 overlapping filled circles forming rounded crown
  canopy1 <- data.frame(x0 = cx - 6 * s, y0 = cy + 8 * s, r = 9 * s)
  canopy2 <- data.frame(x0 = cx + 6 * s, y0 = cy + 8 * s, r = 9 * s)
  canopy3 <- data.frame(x0 = cx, y0 = cy + 14 * s, r = 8 * s)
  # Root hints: 3 short diagonal path segments below trunk
  root1 <- data.frame(
    x = c(cx - 2 * s, cx - 8 * s),
    y = c(cy - 12 * s, cy - 18 * s)
  )
  root2 <- data.frame(
    x = c(cx, cx + 2 * s),
    y = c(cy - 12 * s, cy - 20 * s)
  )
  root3 <- data.frame(
    x = c(cx + 2 * s, cx + 7 * s),
    y = c(cy - 12 * s, cy - 17 * s)
  )
  list(
    # Enso ring
    ggplot2::geom_path(data = enso, .aes(x, y),
      color = bright, linewidth = .lw(s, 2.5)),
    # Soil line
    ggplot2::geom_path(data = soil, .aes(x, y),
      color = col, linewidth = .lw(s, 1.5)),
    # Roots
    ggplot2::geom_path(data = root1, .aes(x, y),
      color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = root2, .aes(x, y),
      color = hex_with_alpha(col, 0.4), linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = root3, .aes(x, y),
      color = hex_with_alpha(col, 0.5), linewidth = .lw(s, 1.2)),
    # Trunk
    ggplot2::geom_rect(data = trunk,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.3), color = bright, linewidth = .lw(s, 1.5)),
    # Canopy
    ggforce::geom_circle(data = canopy1, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = canopy2, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = canopy3, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.12), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_ip: shield with patent document inside ─────────────────────
glyph_agent_ip <- function(cx, cy, s, col, bright) {
  w <- 36 * s; h <- 44 * s
  # Shield shape
  shield <- data.frame(
    x = c(cx - w / 2, cx - w / 2, cx - w * 0.25, cx, cx + w * 0.25,
          cx + w / 2, cx + w / 2),
    y = c(cy + h * 0.36, cy - h * 0.05, cy - h * 0.42, cy - h * 0.48,
          cy - h * 0.42, cy - h * 0.05, cy + h * 0.36)
  )
  # Document inside shield
  doc <- data.frame(
    xmin = cx - 10 * s, xmax = cx + 10 * s,
    ymin = cy - 10 * s, ymax = cy + 14 * s
  )
  # Document lines
  l1 <- data.frame(x = c(cx - 7 * s, cx + 7 * s), y = c(cy + 10 * s, cy + 10 * s))
  l2 <- data.frame(x = c(cx - 7 * s, cx + 7 * s), y = c(cy + 6 * s, cy + 6 * s))
  l3 <- data.frame(x = c(cx - 7 * s, cx + 4 * s), y = c(cy + 2 * s, cy + 2 * s))
  # Badge at top of doc
  badge <- data.frame(
    xmin = cx - 4 * s, xmax = cx + 4 * s,
    ymin = cy - 6 * s, ymax = cy - 1 * s
  )
  # Copyright symbol hint below doc
  copy_circle <- data.frame(x0 = cx, y0 = cy - 16 * s, r = 4 * s)
  list(
    ggplot2::geom_polygon(data = shield, .aes(x, y),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 2)),
    ggplot2::geom_rect(data = doc,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.15), color = col, linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = l1, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = l2, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_path(data = l3, .aes(x, y), color = col, linewidth = .lw(s, 1)),
    ggplot2::geom_rect(data = badge,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(bright, 0.3), color = bright, linewidth = .lw(s, 1.5)),
    ggforce::geom_circle(data = copy_circle, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.1), color = bright, linewidth = .lw(s, 1.5))
  )
}

# ── glyph_agent_quarto: document page with Q lettermark + code blocks ────
glyph_agent_quarto <- function(cx, cy, s, col, bright) {
  # Page outline (tall rectangle)
  page <- data.frame(
    xmin = cx - 18 * s, xmax = cx + 18 * s,
    ymin = cy - 26 * s, ymax = cy + 26 * s
  )
  # Folded corner (top-right)
  fold <- data.frame(
    x = c(cx + 10 * s, cx + 18 * s, cx + 18 * s),
    y = c(cy + 26 * s, cy + 26 * s, cy + 18 * s)
  )
  fold_tri <- data.frame(
    x = c(cx + 10 * s, cx + 18 * s, cx + 10 * s),
    y = c(cy + 26 * s, cy + 18 * s, cy + 18 * s)
  )
  # Bold Q lettermark (circle + diagonal tail)
  q_circle <- data.frame(x0 = cx, y0 = cy + 4 * s, r = 12 * s)
  q_inner <- data.frame(x0 = cx, y0 = cy + 4 * s, r = 7 * s)
  q_tail <- data.frame(
    x = c(cx + 4 * s, cx + 14 * s),
    y = c(cy - 2 * s, cy - 12 * s)
  )
  # Code block rectangles (small, below Q)
  block1 <- data.frame(
    xmin = cx - 14 * s, xmax = cx - 2 * s,
    ymin = cy - 20 * s, ymax = cy - 14 * s
  )
  block2 <- data.frame(
    xmin = cx + 2 * s, xmax = cx + 14 * s,
    ymin = cy - 20 * s, ymax = cy - 14 * s
  )
  # Tiny lines inside code blocks
  bl1 <- data.frame(x = c(cx - 12 * s, cx - 5 * s), y = c(cy - 17 * s, cy - 17 * s))
  bl2 <- data.frame(x = c(cx + 4 * s, cx + 12 * s), y = c(cy - 17 * s, cy - 17 * s))
  # CLI chevron at bottom
  chev <- data.frame(
    x = c(cx - 6 * s, cx - 2 * s, cx - 6 * s),
    y = c(cy - 22 * s, cy - 24 * s, cy - 26 * s + 2 * s)
  )
  list(
    # Page background
    ggplot2::geom_rect(data = page,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s, 1.8)),
    # Folded corner
    ggplot2::geom_polygon(data = fold_tri, .aes(x, y),
      fill = hex_with_alpha(col, 0.2), color = bright, linewidth = .lw(s, 1.2)),
    # Q lettermark
    ggforce::geom_circle(data = q_circle, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.15), color = bright, linewidth = .lw(s, 2.5)),
    ggforce::geom_circle(data = q_inner, .aes(x0 = x0, y0 = y0, r = r),
      fill = hex_with_alpha(col, 0.08), color = bright, linewidth = .lw(s, 1.8)),
    ggplot2::geom_path(data = q_tail, .aes(x, y),
      color = bright, linewidth = .lw(s, 3.5)),
    # Code blocks
    ggplot2::geom_rect(data = block1,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.18), color = col, linewidth = .lw(s, 1.2)),
    ggplot2::geom_rect(data = block2,
      .aes(xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax),
      fill = hex_with_alpha(col, 0.18), color = col, linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = bl1, .aes(x, y), color = bright, linewidth = .lw(s, 1.2)),
    ggplot2::geom_path(data = bl2, .aes(x, y), color = bright, linewidth = .lw(s, 1.2)),
    # CLI chevron
    ggplot2::geom_path(data = chev, .aes(x, y),
      color = col, linewidth = .lw(s, 1.5))
  )
}
