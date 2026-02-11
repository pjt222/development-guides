#!/usr/bin/env Rscript
# build-agent-icons.R - Generate WebP icons for agents across palettes
#
# Parallel to build-icons.R (skills) but renders agent persona glyphs.
# Each agent gets a unique color per palette + glyph.
# Output: icons/<palette>/agents/<agentId>.webp
#
# Usage:
#   Rscript build-agent-icons.R                          # All palettes, all agents
#   Rscript build-agent-icons.R --palette cyberpunk      # Single palette
#   Rscript build-agent-icons.R --only mystic            # Single agent (all palettes)
#   Rscript build-agent-icons.R --skip-existing          # Skip existing WebP files
#   Rscript build-agent-icons.R --dry-run                # List what would be generated
#   Rscript build-agent-icons.R --palette-list           # List palette names
#   Rscript build-agent-icons.R --glow-sigma 10          # Adjust glow intensity

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
source(file.path(script_dir, "R", "render.R"))
source(file.path(script_dir, "R", "palettes.R"))
source(file.path(script_dir, "R", "agent_colors.R"))
source(file.path(script_dir, "R", "agent_primitives.R"))
source(file.path(script_dir, "R", "agent_glyphs.R"))
source(file.path(script_dir, "R", "agent_render.R"))

# ── Check dependencies ──────────────────────────────────────────────────
check_dependencies()

# ── Parse CLI args ───────────────────────────────────────────────────────
opts <- parse_cli_args()

if (opts$help) {
  print_usage(script_name = "build-agent-icons.R",
              filter_label = "<agent-id>",
              filter_desc = "Only generate icon for this agent")
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

# ── Dry run ──────────────────────────────────────────────────────────────
if (opts$dry_run) {
  log_msg("DRY RUN - would generate:")
  for (pal in palettes_to_render) {
    for (ic in queue) {
      out <- sprintf("icons/%s/agents/%s.webp", pal, ic$agentId)
      log_msg(sprintf("  [%s] %s -> %s", pal, ic$agentId, out))
    }
  }
  log_msg(sprintf("Total: %d agents x %d palettes = %d files",
                  length(queue), length(palettes_to_render),
                  length(queue) * length(palettes_to_render)))
  quit(status = 0)
}

# ── Generate icons ───────────────────────────────────────────────────────
if (length(queue) == 0) {
  log_msg("No agent icons to generate.")
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

  log_msg(sprintf("=== Palette: %s (%d agents) ===", pal, length(queue)))

  for (idx in seq_along(queue)) {
    ic <- queue[[idx]]
    out_path <- file.path(script_dir, "icons", pal, "agents",
                          paste0(ic$agentId, ".webp"))

    # Skip existing if requested
    if (opts$skip_existing && file.exists(out_path)) {
      next
    }

    agent_color <- pal_colors$agents[[ic$agentId]]
    if (is.null(agent_color)) {
      log_msg(sprintf("ERROR: %s: No color in palette %s", ic$agentId, pal))
      error_count <- error_count + 1
      next
    }

    tryCatch({
      render_agent_icon(
        agent_id   = ic$agentId,
        out_path   = out_path,
        glow_sigma = opts$glow_sigma,
        color      = agent_color
      )

      kb <- file_size_kb(out_path)
      log_msg(sprintf("OK: [%s] %s (%.1fKB)", pal, ic$agentId, kb))
      done_count <- done_count + 1

    }, error = function(e) {
      log_msg(sprintf("ERROR: [%s] %s: %s", pal, ic$agentId, conditionMessage(e)))
      error_count <<- error_count + 1
    })
  }

  pal_elapsed <- (proc.time() - pal_start)["elapsed"]
  log_msg(sprintf("  [%s] Complete: %d succeeded, %d failed in %.1fs",
                  pal, done_count, error_count, pal_elapsed))

  total_rendered <- total_rendered + done_count
  total_errors <- total_errors + error_count
}

# Update manifest status and paths for cyberpunk palette
if ("cyberpunk" %in% palettes_to_render) {
  for (ic in queue) {
    out_path <- file.path(script_dir, "icons", "cyberpunk", "agents",
                          paste0(ic$agentId, ".webp"))
    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$agentId == ic$agentId) {
        if (file.exists(out_path)) {
          manifest$icons[[j]]$status <- "done"
          manifest$icons[[j]]$lastError <- NULL
        }
        manifest$icons[[j]]$path <- sprintf("icons/cyberpunk/agents/%s.webp",
                                             ic$agentId)
        break
      }
    }
  }
  write_manifest(manifest, manifest_path)
}

elapsed <- (proc.time() - start_time)["elapsed"]
log_msg(sprintf("All done: %d rendered, %d errors across %d palettes in %.1fs",
                total_rendered, total_errors, length(palettes_to_render), elapsed))
