#!/usr/bin/env Rscript
# build-icons.R - R-based programmatic icon generation for cyberpunk skillnet
#
# Generates 115 unique WebP icons using ggplot2 + ggfx neon glow effects.
# Each skill gets a unique pictogram glyph; domain color provides cohesion.
#
# Usage:
#   Rscript build-icons.R                      # Full render (all 115 icons)
#   Rscript build-icons.R --only bushcraft     # Single domain
#   Rscript build-icons.R --skip-existing      # Skip already-done icons
#   Rscript build-icons.R --dry-run            # List what would be generated
#   Rscript build-icons.R --glow-sigma 10      # Adjust glow intensity

# ── Determine script directory ───────────────────────────────────────────
get_script_dir <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("--file=", args, value = TRUE)
  if (length(file_arg) > 0) {
    return(normalizePath(dirname(sub("--file=", "", file_arg[1]))))
  }
  # Fallback: try to use the working directory's viz/ if it exists
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
source(file.path(script_dir, "R", "glyphs.R"))
source(file.path(script_dir, "R", "render.R"))

# ── Check dependencies ──────────────────────────────────────────────────
check_dependencies()

# ── Parse CLI args ───────────────────────────────────────────────────────
opts <- parse_cli_args()

if (opts$help) {
  print_usage()
  quit(status = 0)
}

# ── Load manifest ────────────────────────────────────────────────────────
manifest_path <- file.path(script_dir, "data", "icon-manifest.json")
if (!file.exists(manifest_path)) {
  stop("Manifest not found: ", manifest_path, call. = FALSE)
}
manifest <- read_manifest(manifest_path)
icons <- manifest$icons

log_msg(sprintf("Loaded manifest: %d icons", length(icons)))

# ── Filter queue ─────────────────────────────────────────────────────────
queue <- icons

if (!is.null(opts$only)) {
  queue <- Filter(function(ic) ic$domain == opts$only, queue)
  log_msg(sprintf("Filtered to domain: %s (%d icons)", opts$only,
                  length(queue)))
}

if (opts$skip_existing) {
  queue <- Filter(function(ic) {
    if (identical(ic$status, "done")) {
      out_path <- file.path(script_dir, ic$path)
      return(!file.exists(out_path))
    }
    TRUE
  }, queue)
  log_msg(sprintf("After skip-existing filter: %d icons", length(queue)))
}

# ── Dry run ──────────────────────────────────────────────────────────────
if (opts$dry_run) {
  log_msg("DRY RUN - would generate:")
  for (ic in queue) {
    log_msg(sprintf("  %s/%s -> %s (seed=%d)", ic$domain, ic$skillId,
                    ic$path, ic$seed))
  }
  log_msg(sprintf("Total: %d icons", length(queue)))
  quit(status = 0)
}

# ── Generate icons ───────────────────────────────────────────────────────
if (length(queue) == 0) {
  log_msg("No icons to generate.")
  quit(status = 0)
}

log_msg(sprintf("Generating %d icons (glow_sigma=%d)", length(queue),
                opts$glow_sigma))

# Suppress ggplot warnings about missing aesthetics
suppressWarnings({
  library(ggplot2, quietly = TRUE, warn.conflicts = FALSE)
})

start_time <- proc.time()
done_count <- 0
error_count <- 0

for (idx in seq_along(queue)) {
  ic <- queue[[idx]]
  out_path <- file.path(script_dir, ic$path)

  tryCatch({
    render_icon(
      domain     = ic$domain,
      skill_id   = ic$skillId,
      seed       = ic$seed,
      out_path   = out_path,
      glow_sigma = opts$glow_sigma
    )

    kb <- file_size_kb(out_path)
    log_ok(ic$domain, ic$skillId, ic$seed, kb)

    # Update manifest entry status
    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$skillId == ic$skillId &&
          manifest$icons[[j]]$domain == ic$domain) {
        manifest$icons[[j]]$status <- "done"
        manifest$icons[[j]]$lastError <- NULL
        break
      }
    }
    done_count <- done_count + 1

  }, error = function(e) {
    log_error(ic$domain, ic$skillId, conditionMessage(e))

    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$skillId == ic$skillId &&
          manifest$icons[[j]]$domain == ic$domain) {
        manifest$icons[[j]]$status <- "error"
        manifest$icons[[j]]$lastError <- conditionMessage(e)
        break
      }
    }
    error_count <<- error_count + 1
  })

  # Save manifest after each icon (progress persistence)
  write_manifest(manifest, manifest_path)

  # Progress report every 10 icons
  if (idx %% 10 == 0) {
    log_msg(sprintf("Progress: %d/%d (%d done, %d errors)",
                    idx, length(queue), done_count, error_count))
  }
}

elapsed <- (proc.time() - start_time)["elapsed"]
log_msg(sprintf("Complete: %d succeeded, %d failed in %.1fs",
                done_count, error_count, elapsed))
