#!/usr/bin/env Rscript
# build-icons.R - R-based programmatic icon generation for skillnet
#
# Generates unique WebP icons using ggplot2 + ggfx neon glow effects.
# Each skill gets a unique pictogram glyph; palette color provides cohesion.
# Supports multi-palette rendering: icons/<palette>/<domain>/<skill>.webp
#
# Usage:
#   Rscript build-icons.R                          # All palettes, all icons
#   Rscript build-icons.R --palette cyberpunk      # Single palette
#   Rscript build-icons.R --only bushcraft         # Single domain (all palettes)
#   Rscript build-icons.R --palette viridis --only git  # Single palette + domain
#   Rscript build-icons.R --skip-existing          # Skip existing WebP files
#   Rscript build-icons.R --dry-run                # List what would be generated
#   Rscript build-icons.R --palette-list           # List palette names and exit
#   Rscript build-icons.R --glow-sigma 10          # Adjust glow intensity

# ── Determine script directory ───────────────────────────────────────────
get_script_dir <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("--file=", args, value = TRUE)
  if (length(file_arg) > 0) {
    return(normalizePath(dirname(sub("--file=", "", file_arg[1]))))
  }
  if (file.exists("R/utils.R")) return(normalizePath("."))
  if (file.exists("viz/R/utils.R")) return(normalizePath("viz"))
  stop("Cannot determine script directory. Run from viz/ or project root.",
       call. = FALSE)
}

script_dir <- get_script_dir()

# ── Source supporting files ──────────────────────────────────────────────
source(file.path(script_dir, "R", "utils.R"))
source(file.path(script_dir, "R", "primitives.R"))
source(file.path(script_dir, "R", "primitives_2.R"))
source(file.path(script_dir, "R", "primitives_3.R"))
source(file.path(script_dir, "R", "primitives_4.R"))
source(file.path(script_dir, "R", "primitives_5.R"))
source(file.path(script_dir, "R", "primitives_6.R"))
source(file.path(script_dir, "R", "primitives_7.R"))
source(file.path(script_dir, "R", "primitives_8.R"))
source(file.path(script_dir, "R", "primitives_9.R"))
source(file.path(script_dir, "R", "primitives_10.R"))
source(file.path(script_dir, "R", "glyphs.R"))
source(file.path(script_dir, "R", "render.R"))
source(file.path(script_dir, "R", "palettes.R"))

# ── Check dependencies ──────────────────────────────────────────────────
check_dependencies()

# ── Parse CLI args ───────────────────────────────────────────────────────
opts <- parse_cli_args()

if (opts$help) {
  print_usage()
  quit(status = 0)
}

if (opts$palette_list) {
  cat("Available palettes:\n")
  cat(paste(" ", PALETTE_NAMES, collapse = "\n"), "\n")
  quit(status = 0)
}

# ── Resolve palette list ────────────────────────────────────────────────
if (opts$palette == "all") {
  palettes_to_render <- PALETTE_NAMES
} else {
  if (!opts$palette %in% PALETTE_NAMES) {
    stop("Unknown palette: ", opts$palette,
         ". Use --palette-list to see options.", call. = FALSE)
  }
  palettes_to_render <- opts$palette
}

# ── Load manifest ────────────────────────────────────────────────────────
manifest_path <- file.path(script_dir, "data", "icon-manifest.json")
if (!file.exists(manifest_path)) {
  stop("Manifest not found: ", manifest_path, call. = FALSE)
}
manifest <- read_manifest(manifest_path)
icons <- manifest$icons

log_msg(sprintf("Loaded manifest: %d icons", length(icons)))

# ── Filter by domain ───────────────────────────────────────────────────
queue <- icons
if (!is.null(opts$only)) {
  queue <- Filter(function(ic) ic$domain == opts$only, queue)
  log_msg(sprintf("Filtered to domain: %s (%d icons)", opts$only, length(queue)))
}

# ── Dry run ──────────────────────────────────────────────────────────────
if (opts$dry_run) {
  log_msg("DRY RUN - would generate:")
  for (pal in palettes_to_render) {
    for (ic in queue) {
      out <- sprintf("icons/%s/%s/%s.webp", pal, ic$domain, ic$skillId)
      log_msg(sprintf("  [%s] %s/%s -> %s", pal, ic$domain, ic$skillId, out))
    }
  }
  log_msg(sprintf("Total: %d icons x %d palettes = %d files",
                  length(queue), length(palettes_to_render),
                  length(queue) * length(palettes_to_render)))
  quit(status = 0)
}

# ── Generate icons ───────────────────────────────────────────────────────
if (length(queue) == 0) {
  log_msg("No icons to generate.")
  quit(status = 0)
}

suppressWarnings({
  library(ggplot2, quietly = TRUE, warn.conflicts = FALSE)
})

total_rendered <- 0
total_errors <- 0
start_time <- proc.time()

for (pal in palettes_to_render) {
  pal_colors <- get_palette_colors(pal)
  pal_start <- proc.time()
  done_count <- 0
  error_count <- 0

  log_msg(sprintf("=== Palette: %s (%d icons) ===", pal, length(queue)))

  for (idx in seq_along(queue)) {
    ic <- queue[[idx]]
    out_path <- file.path(script_dir, "icons", pal, ic$domain,
                          paste0(ic$skillId, ".webp"))

    # Skip existing if requested
    if (opts$skip_existing && file.exists(out_path)) {
      next
    }

    domain_color <- pal_colors$domains[[ic$domain]]
    if (is.null(domain_color)) {
      log_error(ic$domain, ic$skillId, paste("No color for domain in palette", pal))
      error_count <- error_count + 1
      next
    }

    tryCatch({
      render_icon(
        domain     = ic$domain,
        skill_id   = ic$skillId,
        seed       = ic$seed,
        out_path   = out_path,
        glow_sigma = opts$glow_sigma,
        color      = domain_color
      )

      kb <- file_size_kb(out_path)
      log_ok(ic$domain, ic$skillId, ic$seed, kb)
      done_count <- done_count + 1

    }, error = function(e) {
      log_error(ic$domain, ic$skillId, conditionMessage(e))
      error_count <<- error_count + 1
    })

    # Progress report every 20 icons
    if (idx %% 20 == 0) {
      log_msg(sprintf("  [%s] Progress: %d/%d (%d done, %d errors)",
                      pal, idx, length(queue), done_count, error_count))
    }
  }

  pal_elapsed <- (proc.time() - pal_start)["elapsed"]
  log_msg(sprintf("  [%s] Complete: %d succeeded, %d failed in %.1fs",
                  pal, done_count, error_count, pal_elapsed))

  total_rendered <- total_rendered + done_count
  total_errors <- total_errors + error_count
}

# Update manifest status for cyberpunk palette (primary palette for manifest tracking)
if ("cyberpunk" %in% palettes_to_render) {
  for (ic in queue) {
    out_path <- file.path(script_dir, "icons", "cyberpunk", ic$domain,
                          paste0(ic$skillId, ".webp"))
    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$skillId == ic$skillId &&
          manifest$icons[[j]]$domain == ic$domain) {
        if (file.exists(out_path)) {
          manifest$icons[[j]]$status <- "done"
          manifest$icons[[j]]$lastError <- NULL
        }
        # Update path to palette-aware format
        manifest$icons[[j]]$path <- sprintf("icons/cyberpunk/%s/%s.webp",
                                             ic$domain, ic$skillId)
        break
      }
    }
  }
  write_manifest(manifest, manifest_path)
}

elapsed <- (proc.time() - start_time)["elapsed"]
log_msg(sprintf("All done: %d rendered, %d errors across %d palettes in %.1fs",
                total_rendered, total_errors, length(palettes_to_render), elapsed))
