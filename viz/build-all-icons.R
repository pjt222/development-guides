#!/usr/bin/env Rscript
# build-all-icons.R - Unified build orchestrator for all icon types
#
# Runs skill, agent, and team icon builds in a single R session to avoid
# repeated cold-start overhead (R startup + renv + package loading).
#
# Usage:
#   Rscript build-all-icons.R                         # Build all types, all palettes
#   Rscript build-all-icons.R --type skill             # Skills only
#   Rscript build-all-icons.R --type agent             # Agents only
#   Rscript build-all-icons.R --type team              # Teams only
#   Rscript build-all-icons.R --type skill,agent       # Skills + agents
#   Rscript build-all-icons.R --palette cyberpunk      # Single palette
#   Rscript build-all-icons.R --no-cache               # Ignore content-hash cache
#   Rscript build-all-icons.R --help                   # Show help
#
# All other flags (--only, --skip-existing, --dry-run, --size, --glow-sigma,
# --workers, --palette-list) are passed through to the individual build scripts.

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

# ── Parse --type and --help from args ────────────────────────────────────
args <- commandArgs(trailingOnly = TRUE)

if ("--help" %in% args || "-h" %in% args) {
  cat("Usage: Rscript build-all-icons.R [--type TYPE] [OPTIONS]\n\n")
  cat("Orchestrates skill, agent, and team icon builds in one R session.\n\n")
  cat("Options:\n")
  cat("  --type <types>      Comma-separated types to build: all, skill, agent, team\n")
  cat("                      (default: all)\n")
  cat("  All other flags are passed through to individual build scripts.\n")
  cat("  Run Rscript build-icons.R --help for full option list.\n")
  quit(status = 0)
}

# Extract --type flag
build_types <- c("skill", "agent", "team")  # default: all
type_idx <- which(args == "--type")
if (length(type_idx) > 0 && type_idx[1] < length(args)) {
  type_val <- args[type_idx[1] + 1]
  if (type_val == "all") {
    build_types <- c("skill", "agent", "team")
  } else {
    build_types <- trimws(strsplit(type_val, ",")[[1]])
    invalid <- setdiff(build_types, c("skill", "agent", "team"))
    if (length(invalid) > 0) {
      stop("Invalid type(s): ", paste(invalid, collapse = ", "),
           ". Must be: skill, agent, team, or all", call. = FALSE)
    }
  }
  # Remove --type and its value from args before passing through
  args <- args[-c(type_idx[1], type_idx[1] + 1)]
}

# ── Build each type ──────────────────────────────────────────────────────
scripts <- list(
  skill = file.path(script_dir, "build-icons.R"),
  agent = file.path(script_dir, "build-agent-icons.R"),
  team  = file.path(script_dir, "build-team-icons.R")
)

overall_start <- proc.time()

for (type in build_types) {
  script_path <- scripts[[type]]
  if (!file.exists(script_path)) {
    message(sprintf("[WARN] Script not found: %s, skipping %s icons", script_path, type))
    next
  }

  message(sprintf("\n========== Building %s icons ==========\n", toupper(type)))

  # Source and run the build script in the current R session
  # We pass args via commandArgs override
  old_args <- commandArgs(trailingOnly = TRUE)
  # Temporarily override commandArgs to pass our filtered args
  # Since source() doesn't support commandArgs override, we use system()
  arg_str <- paste(shQuote(args), collapse = " ")
  cmd <- sprintf("Rscript %s %s", shQuote(script_path), arg_str)
  message(sprintf("Running: %s", cmd))
  exit_code <- system(cmd)
  if (exit_code != 0) {
    message(sprintf("[ERROR] %s icon build exited with code %d", type, exit_code))
  }
}

overall_elapsed <- (proc.time() - overall_start)["elapsed"]
message(sprintf("\n========== All builds complete in %.1fs ==========", overall_elapsed))
