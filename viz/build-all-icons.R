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
  cat("  --hd                Build both standard (512px) and high-res (1024px) icons\n")
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

# Extract --hd flag (dual-pass: standard + high-res)
hd_mode <- "--hd" %in% args
if (hd_mode) {
  args <- args[args != "--hd"]
}

# ── Build each type ──────────────────────────────────────────────────────
scripts <- list(
  skill = file.path(script_dir, "build-icons.R"),
  agent = file.path(script_dir, "build-agent-icons.R"),
  team  = file.path(script_dir, "build-team-icons.R")
)

# Define passes: standard always runs; HD pass added when --hd is set
passes <- list(
  list(label = "standard", size = "512", sigma = "4", extra_args = character(0))
)
if (hd_mode) {
  passes[[2]] <- list(label = "high-res", size = "1024", sigma = "8",
                      extra_args = c("--hd"))
}

overall_start <- proc.time()

for (pass in passes) {
  if (length(passes) > 1) {
    message(sprintf("\n>>>>>>>>>> Pass: %s (%spx, sigma=%s) <<<<<<<<<<\n",
                    pass$label, pass$size, pass$sigma))
  }

  for (type in build_types) {
    script_path <- scripts[[type]]
    if (!file.exists(script_path)) {
      message(sprintf("[WARN] Script not found: %s, skipping %s icons", script_path, type))
      next
    }

    message(sprintf("\n========== Building %s icons (%s) ==========\n",
                    toupper(type), pass$label))

    # Build args: base args + size/sigma overrides + extra args (--hd)
    pass_args <- c(args, "--size", pass$size, "--glow-sigma", pass$sigma,
                   pass$extra_args)
    arg_str <- paste(shQuote(pass_args), collapse = " ")
    cmd <- sprintf("Rscript %s %s", shQuote(script_path), arg_str)
    message(sprintf("Running: %s", cmd))
    exit_code <- system(cmd)
    if (exit_code != 0) {
      message(sprintf("[ERROR] %s icon build (%s) exited with code %d",
                      type, pass$label, exit_code))
    }
  }
}

overall_elapsed <- (proc.time() - overall_start)["elapsed"]
message(sprintf("\n========== All builds complete in %.1fs ==========", overall_elapsed))
