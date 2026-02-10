#!/usr/bin/env Rscript
# build-agent-icons.R - Generate cyberpunk neon WebP icons for 19 agents
#
# Parallel to build-icons.R (skills) but renders agent persona glyphs.
# Each agent gets a unique color + glyph; output goes to icons/agents/.
#
# Usage:
#   Rscript build-agent-icons.R                    # Full render (all 19 agents)
#   Rscript build-agent-icons.R --only mystic      # Single agent
#   Rscript build-agent-icons.R --skip-existing    # Skip already-done icons
#   Rscript build-agent-icons.R --dry-run          # List what would be generated
#   Rscript build-agent-icons.R --glow-sigma 10    # Adjust glow intensity

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
# Shared utilities (hex helpers, CLI parsing, manifest I/O, dep check)
source(file.path(script_dir, "R", "utils.R"))

# Skill primitives provides .lw and .aes helpers used by agent primitives
source(file.path(script_dir, "R", "primitives.R"))

# Agent-specific pipeline
source(file.path(script_dir, "R", "agent_colors.R"))
source(file.path(script_dir, "R", "agent_primitives.R"))
source(file.path(script_dir, "R", "agent_glyphs.R"))
source(file.path(script_dir, "R", "agent_render.R"))

# ── Check dependencies ──────────────────────────────────────────────────
check_dependencies()

# ── Parse CLI args (reuses parse_cli_args from utils.R) ─────────────────
opts <- parse_cli_args()

if (opts$help) {
  cat("Usage: Rscript build-agent-icons.R [OPTIONS]\n\n")
  cat("Options:\n")
  cat("  --only <agent-id>   Only generate icon for this agent\n")
  cat("  --skip-existing     Skip icons that already have WebP files\n")
  cat("  --dry-run           List what would be generated without rendering\n")
  cat("  --glow-sigma <n>    Glow blur radius (default: 8)\n")
  cat("  --help, -h          Show this help message\n")
  quit(status = 0)
}

# ── Load manifest ────────────────────────────────────────────────────────
manifest_path <- file.path(script_dir, "data", "agent-icon-manifest.json")
if (!file.exists(manifest_path)) {
  stop("Agent manifest not found: ", manifest_path, call. = FALSE)
}
manifest <- read_manifest(manifest_path)
icons <- manifest$icons

log_msg(sprintf("Loaded agent manifest: %d icons", length(icons)))

# ── Filter queue ─────────────────────────────────────────────────────────
queue <- icons

if (!is.null(opts$only)) {
  queue <- Filter(function(ic) ic$agentId == opts$only, queue)
  log_msg(sprintf("Filtered to agent: %s (%d icons)", opts$only, length(queue)))
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
    log_msg(sprintf("  %s -> %s", ic$agentId, ic$path))
  }
  log_msg(sprintf("Total: %d agent icons", length(queue)))
  quit(status = 0)
}

# ── Generate icons ───────────────────────────────────────────────────────
if (length(queue) == 0) {
  log_msg("No agent icons to generate.")
  quit(status = 0)
}

log_msg(sprintf("Generating %d agent icons (glow_sigma=%d)", length(queue),
                opts$glow_sigma))

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
    render_agent_icon(
      agent_id   = ic$agentId,
      out_path   = out_path,
      glow_sigma = opts$glow_sigma
    )

    kb <- file_size_kb(out_path)
    log_msg(sprintf("OK: %s (%.1fKB)", ic$agentId, kb))

    # Update manifest entry status
    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$agentId == ic$agentId) {
        manifest$icons[[j]]$status <- "done"
        manifest$icons[[j]]$lastError <- NULL
        break
      }
    }
    done_count <- done_count + 1

  }, error = function(e) {
    log_msg(sprintf("ERROR: %s: %s", ic$agentId, conditionMessage(e)))

    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$agentId == ic$agentId) {
        manifest$icons[[j]]$status <- "error"
        manifest$icons[[j]]$lastError <- conditionMessage(e)
        break
      }
    }
    error_count <<- error_count + 1
  })

  # Save manifest after each icon (progress persistence)
  write_manifest(manifest, manifest_path)
}

elapsed <- (proc.time() - start_time)["elapsed"]
log_msg(sprintf("Complete: %d succeeded, %d failed in %.1fs",
                done_count, error_count, elapsed))
