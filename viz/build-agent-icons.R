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
#   Rscript build-agent-icons.R --workers 4              # Use 4 parallel workers

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
manifest_path <- file.path(script_dir, "public", "data", "agent-icon-manifest.json")
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

# ── Setup parallel workers ───────────────────────────────────────────────
future::plan(future::multisession, workers = opts$workers)
on.exit(future::plan(future::sequential), add = TRUE)
log_msg(sprintf("Using %d parallel workers", opts$workers))

# ── Pre-compute all palette colors ───────────────────────────────────────
all_pal_colors <- lapply(
  setNames(palettes_to_render, palettes_to_render),
  get_palette_colors
)

# ── Flatten palette x agent into a single task list ──────────────────────
tasks <- list()
skipped_color <- 0
for (pal in palettes_to_render) {
  pal_colors <- all_pal_colors[[pal]]
  for (ic in queue) {
    out_path <- file.path(script_dir, "public", "icons", pal, "agents",
                          paste0(ic$agentId, ".webp"))

    # Skip existing if requested
    if (opts$skip_existing && file.exists(out_path)) next

    agent_color <- pal_colors$agents[[ic$agentId]]
    if (is.null(agent_color)) {
      log_msg(sprintf("ERROR: %s: No color in palette %s", ic$agentId, pal))
      skipped_color <- skipped_color + 1
      next
    }

    # Resolve glyph function in main process for worker access
    glyph_fn_name <- AGENT_GLYPHS[[ic$agentId]]
    glyph_fn <- if (!is.null(glyph_fn_name)) match.fun(glyph_fn_name) else NULL

    tasks[[length(tasks) + 1]] <- list(
      palette    = pal,
      agent_id   = ic$agentId,
      out_path   = out_path,
      color      = agent_color,
      glow_sigma = opts$glow_sigma,
      glyph_fn   = glyph_fn
    )
  }
}

log_msg(sprintf("Queued %d render tasks across %d palettes (%d skipped for missing color)",
                length(tasks), length(palettes_to_render), skipped_color))

# ── Parallel render ──────────────────────────────────────────────────────
start_time <- proc.time()

results <- furrr::future_map(tasks, function(task) {
  t0 <- proc.time()
  tryCatch({
    dir.create(dirname(task$out_path), recursive = TRUE, showWarnings = FALSE)

    render_agent_icon(
      agent_id   = task$agent_id,
      out_path   = task$out_path,
      glow_sigma = task$glow_sigma,
      color      = task$color,
      glyph_fn   = task$glyph_fn
    )

    kb <- file_size_kb(task$out_path)
    elapsed <- (proc.time() - t0)["elapsed"]
    list(status = "ok", palette = task$palette, agent_id = task$agent_id,
         kb = kb, elapsed = elapsed)

  }, error = function(e) {
    elapsed <- (proc.time() - t0)["elapsed"]
    list(status = "error", palette = task$palette, agent_id = task$agent_id,
         message = conditionMessage(e), elapsed = elapsed)
  })
}, .options = furrr::furrr_options(seed = TRUE))

# ── Aggregate results ────────────────────────────────────────────────────
total_rendered <- 0
total_errors <- 0
for (res in results) {
  if (res$status == "ok") {
    log_msg(sprintf("OK: [%s] %s (%.1fKB)", res$palette, res$agent_id, res$kb))
    total_rendered <- total_rendered + 1
  } else {
    log_msg(sprintf("ERROR: [%s] %s: %s", res$palette, res$agent_id, res$message))
    total_errors <- total_errors + 1
  }
}
total_errors <- total_errors + skipped_color

# Update manifest status and paths for cyberpunk palette
if ("cyberpunk" %in% palettes_to_render) {
  for (ic in queue) {
    out_path <- file.path(script_dir, "public", "icons", "cyberpunk", "agents",
                          paste0(ic$agentId, ".webp"))
    for (j in seq_along(manifest$icons)) {
      if (manifest$icons[[j]]$agentId == ic$agentId) {
        if (file.exists(out_path)) {
          manifest$icons[[j]]$status <- "done"
          manifest$icons[[j]]$lastError <- NULL
        }
        manifest$icons[[j]]$path <- sprintf("public/icons/cyberpunk/agents/%s.webp",
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
