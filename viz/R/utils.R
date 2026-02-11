# utils.R - Colors, CLI parsing, manifest I/O
# Part of the R-based icon generation pipeline

# ── Cyberpunk domain color palette ────────────────────────────────────────
DOMAIN_COLORS <- list(
  "bushcraft"          = "#88cc44",
  "compliance"         = "#ff3366",
  "containerization"   = "#44ddff",
  "data-serialization" = "#44aaff",
  "defensive"          = "#ff4444",
  "design"             = "#ff88dd",
  "devops"             = "#00ff88",
  "esoteric"           = "#dd44ff",
  "general"            = "#ccccff",
  "git"                = "#66ffcc",
  "jigsawr"            = "#22ddaa",
  "mcp-integration"    = "#00ccaa",
  "mlops"              = "#aa66ff",
  "observability"      = "#ffaa00",
  "project-management" = "#ff8844",
  "r-packages"         = "#00f0ff",
  "reporting"          = "#ffdd00",
  "review"             = "#ff66aa",
  "morphic"            = "#bb88ff",
  "swarm"              = "#aadd44",
  "web-dev"            = "#ff6633",
  "workflow-visualization" = "#66dd88"
)

# ── Hex color utilities ──────────────────────────────────────────────────
hex_to_rgb <- function(hex) {
  hex <- sub("^#", "", hex)
  r <- strtoi(substr(hex, 1, 2), 16L)
  g <- strtoi(substr(hex, 3, 4), 16L)
  b <- strtoi(substr(hex, 5, 6), 16L)
  c(r = r, g = g, b = b)
}

hex_with_alpha <- function(hex, alpha = 1) {
  rgb_vals <- hex_to_rgb(hex)
  grDevices::rgb(rgb_vals["r"], rgb_vals["g"], rgb_vals["b"],
                 alpha = alpha * 255, maxColorValue = 255)
}

brighten_hex <- function(hex, factor = 1.3) {
  rgb_vals <- hex_to_rgb(hex)
  r <- min(255, round(rgb_vals["r"] * factor))
  g <- min(255, round(rgb_vals["g"] * factor))
  b <- min(255, round(rgb_vals["b"] * factor))
  grDevices::rgb(r, g, b, maxColorValue = 255)
}

dim_hex <- function(hex, factor = 0.4) {
  brighten_hex(hex, factor)
}

# ── CLI argument parsing ─────────────────────────────────────────────────
parse_cli_args <- function(args = commandArgs(trailingOnly = TRUE)) {
  opts <- list(
    only          = NULL,
    palette       = "all",
    palette_list  = FALSE,
    skip_existing = FALSE,
    dry_run       = FALSE,
    glow_sigma    = 8,
    help          = FALSE
  )

  i <- 1
  while (i <= length(args)) {
    arg <- args[i]
    if (arg == "--only" && i < length(args)) {
      i <- i + 1
      opts$only <- args[i]
    } else if (arg == "--palette" && i < length(args)) {
      i <- i + 1
      opts$palette <- args[i]
    } else if (arg == "--palette-list") {
      opts$palette_list <- TRUE
    } else if (arg == "--skip-existing") {
      opts$skip_existing <- TRUE
    } else if (arg == "--dry-run") {
      opts$dry_run <- TRUE
    } else if (arg == "--glow-sigma" && i < length(args)) {
      i <- i + 1
      opts$glow_sigma <- as.numeric(args[i])
    } else if (arg %in% c("--help", "-h")) {
      opts$help <- TRUE
    }
    i <- i + 1
  }
  opts
}

print_usage <- function(script_name = "build-icons.R",
                        filter_label = "<domain>",
                        filter_desc = "Only generate icons for this domain") {
  cat(sprintf("Usage: Rscript %s [OPTIONS]\n\n", script_name))
  cat("Options:\n")
  cat(sprintf("  --only %-12s %s\n", filter_label, filter_desc))
  cat("  --palette <name>    Palette to render (default: all). One of: cyberpunk,\n")
  cat("                      viridis, magma, inferno, plasma, cividis, mako, rocket, turbo\n")
  cat("  --palette-list      List available palette names and exit\n")
  cat("  --skip-existing     Skip icons marked 'done' with existing WebP files\n")
  cat("  --dry-run           List what would be generated without rendering\n")
  cat("  --glow-sigma <n>    Glow blur radius (default: 8)\n")
  cat("  --help, -h          Show this help message\n")
}

# ── Manifest I/O ─────────────────────────────────────────────────────────
read_manifest <- function(path) {
  jsonlite::fromJSON(path, simplifyVector = FALSE)
}

write_manifest <- function(manifest, path) {
  jsonlite::write_json(manifest, path, pretty = TRUE, auto_unbox = TRUE)
}

# ── Dependency check ─────────────────────────────────────────────────────
check_dependencies <- function() {
  required <- c("ggplot2", "ggforce", "ggfx", "ragg", "jsonlite", "magick")
  missing <- required[!vapply(required, requireNamespace, logical(1),
                              quietly = TRUE)]
  if (length(missing) > 0) {
    stop(
      "Missing required packages: ", paste(missing, collapse = ", "), "\n",
      "Install with: install.packages(c(",
      paste0('"', missing, '"', collapse = ", "), "))",
      call. = FALSE
    )
  }
  invisible(TRUE)
}

# ── Logging ──────────────────────────────────────────────────────────────
log_msg <- function(...) {
  msg <- paste0("[", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "] ", ...)
  message(msg)
}

# ── File utilities ─────────────────────────────────────────────────────
file_size_kb <- function(path) {
  info <- file.info(path)
  if (is.na(info$size)) return(0)
  info$size / 1024
}

log_ok <- function(domain, skill_id, seed, file_size_kb) {
  log_msg(sprintf("OK: %s/%s (seed=%d, %.1fKB)", domain, skill_id, seed,
                  file_size_kb))
}

log_error <- function(domain, skill_id, err_msg) {
  log_msg(sprintf("ERROR: %s/%s: %s", domain, skill_id, err_msg))
}
