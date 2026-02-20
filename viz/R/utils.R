# utils.R - Colors, CLI parsing, manifest I/O
# Part of the R-based icon generation pipeline

# ── Cyberpunk domain color palette ────────────────────────────────────────
DOMAIN_COLORS <- list(
  "alchemy"            = "#ffaa33",
  "animal-training"    = "#ff9944",
  "bushcraft"          = "#88cc44",
  "citations"          = "#66bbff",
  "compliance"         = "#ff3366",
  "containerization"   = "#44ddff",
  "crafting"           = "#cc8855",
  "data-serialization" = "#44aaff",
  "defensive"          = "#ff4444",
  "design"             = "#ff88dd",
  "devops"             = "#00ff88",
  "entomology"         = "#77cc33",
  "esoteric"           = "#dd44ff",
  "gardening"          = "#44bb66",
  "general"            = "#ccccff",
  "git"                = "#66ffcc",
  "intellectual-property" = "#33ccff",
  "jigsawr"            = "#22ddaa",
  "lapidary"           = "#88ccee",
  "library-science"    = "#8B7355",
  "linguistics"        = "#cc99ff",
  "mcp-integration"    = "#00ccaa",
  "mlops"              = "#aa66ff",
  "observability"      = "#ffaa00",
  "project-management" = "#ff8844",
  "r-packages"         = "#00f0ff",
  "reporting"          = "#ffdd00",
  "shiny"              = "#3399ff",
  "review"             = "#ff66aa",
  "morphic"            = "#bb88ff",
  "mycology"           = "#aa77cc",
  "number-theory"      = "#bbaaff",
  "prospecting"        = "#ddaa33",
  "swarm"              = "#aadd44",
  "tcg"                = "#ff5577",
  "versioning"         = "#44ddaa",
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
    glow_sigma    = 4,
    size_px       = 512,
    workers       = max(1, parallel::detectCores() - 1),
    no_cache      = FALSE,
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
    } else if (arg == "--size" && i < length(args)) {
      i <- i + 1
      opts$size_px <- as.integer(args[i])
    } else if (arg == "--workers" && i < length(args)) {
      i <- i + 1
      opts$workers <- as.integer(args[i])
    } else if (arg == "--no-cache") {
      opts$no_cache <- TRUE
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
  cat("  --size <n>          Output dimension in pixels (default: 512)\n")
  cat("  --glow-sigma <n>    Glow blur radius (default: 4)\n")
  cat(sprintf("  --workers <n>       Parallel workers (default: %d = detectCores()-1)\n",
              max(1, parallel::detectCores() - 1)))
  cat("  --no-cache          Ignore content-hash cache, re-render everything\n")
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
  required <- c("ggplot2", "ggforce", "ggfx", "ragg", "jsonlite", "magick",
                 "future", "furrr", "digest")
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

# ── Content-hash cache for incremental rendering ─────────────────────────
# Hash inputs per icon: glyph function body + glow_sigma + size_px
# Stored at viz/.icon-cache.json

#' Compute a render hash for a single icon configuration
#'
#' @param glyph_fn_name Name of the glyph function
#' @param glow_sigma Glow blur sigma
#' @param size_px Output size in pixels
#' @return Character string hash (MD5)
compute_render_hash <- function(glyph_fn_name, glow_sigma, size_px) {
  fn_body <- tryCatch(
    paste(deparse(match.fun(glyph_fn_name)), collapse = "\n"),
    error = function(e) glyph_fn_name
  )
  input_str <- paste(fn_body, glow_sigma, size_px, sep = "|")
  digest::digest(input_str, algo = "md5", serialize = FALSE)
}

#' Read the icon cache from disk
#'
#' @param cache_path Path to .icon-cache.json
#' @return Named list of entity_id -> hash
read_icon_cache <- function(cache_path) {
  if (!file.exists(cache_path)) return(list())
  tryCatch(
    jsonlite::fromJSON(cache_path, simplifyVector = FALSE),
    error = function(e) list()
  )
}

#' Write the icon cache to disk
#'
#' @param cache Named list of entity_id -> hash
#' @param cache_path Path to .icon-cache.json
write_icon_cache <- function(cache, cache_path) {
  dir.create(dirname(cache_path), recursive = TRUE, showWarnings = FALSE)
  jsonlite::write_json(cache, cache_path, pretty = TRUE, auto_unbox = TRUE)
}
