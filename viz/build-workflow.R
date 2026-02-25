#!/usr/bin/env Rscript
# build-workflow.R - Generate workflow diagram from PUT annotations via putior
#
# Scans viz/ source files for putior annotations and generates a Mermaid
# flowchart at public/data/workflow.mmd. Replaces the hardcoded Mermaid
# template that previously lived in build-workflow.js.
#
# Usage: Rscript build-workflow.R
#
# put id:"generate_diagram", label:"Generate Mermaid workflow from PUT annotations", node_type:"process"

# ── Setup ────────────────────────────────────────────────────────────────
script_dir <- if (nzchar(Sys.getenv("RSCRIPT_DIR"))) {
  Sys.getenv("RSCRIPT_DIR")
} else {
  tryCatch(dirname(normalizePath(sys.frame(1)$ofile)), error = function(e) ".")
}

output_path <- file.path(script_dir, "public", "data", "workflow.mmd")

# ── Check putior is available ────────────────────────────────────────────
if (!requireNamespace("putior", quietly = TRUE)) {
  stop(
    "putior package is required but not installed.\n",
    "Install with: renv::install('pjt222/putior')",
    call. = FALSE
  )
}

# ── Scan for PUT annotations ────────────────────────────────────────────
message("Scanning viz/ for PUT annotations...")
workflow <- putior::put(
  script_dir,
  pattern = "\\.(js|R)$",
  recursive = TRUE,
  include_line_numbers = TRUE,
  validate = TRUE
)

if (is.null(workflow) || nrow(workflow) == 0) {
  stop("No PUT annotations found in viz/", call. = FALSE)
}

# Exclude self-referential meta-pipeline files (build-workflow.js/R generate
# this diagram; including them would be circular and causes duplicate
# subgraph IDs in Mermaid)
meta_files <- c("build-workflow.js", "build-workflow.R")
workflow <- workflow[!workflow$file_name %in% meta_files, ]

message(sprintf("  Found %d annotations across %d files",
                nrow(workflow), length(unique(workflow$file_name))))

# ── Generate Mermaid diagram via putior ──────────────────────────────────
mermaid_raw <- putior::put_diagram(
  workflow,
  output = "raw",
  direction = "TD",
  theme = "dark",
  show_source_info = TRUE,
  source_info_style = "subgraph",
  show_artifacts = FALSE,
  show_workflow_boundaries = TRUE,
  node_labels = "label"
)

# ── Post-process: apply cyberpunk styling ────────────────────────────────
# putior generates standard dark theme classDefs; replace with the
# cyberpunk palette used by the skillnet viz.
cyberpunk_styles <- paste(
  "",
  "  %% ── Cyberpunk Styling ────────────────────────────────",
  "  classDef inputStyle fill:#1a1a2e,stroke:#00ff88,stroke-width:2px,color:#00ff88",
  "  classDef processStyle fill:#16213e,stroke:#44ddff,stroke-width:2px,color:#44ddff",
  "  classDef outputStyle fill:#0f3460,stroke:#ff3366,stroke-width:2px,color:#ff3366",
  "  classDef decisionStyle fill:#1a1a2e,stroke:#ffaa33,stroke-width:2px,color:#ffaa33",
  "  classDef artifactStyle fill:#0a0a1a,stroke:#888888,stroke-width:1px,color:#aaaaaa",
  "  classDef startStyle fill:#1a1a2e,stroke:#00ff88,stroke-width:3px,color:#00ff88",
  "  classDef endStyle fill:#0f3460,stroke:#ff3366,stroke-width:3px,color:#ff3366",
  sep = "\n"
)

# Strip putior's default classDef lines and class assignments, then append ours
lines <- strsplit(mermaid_raw, "\n")[[1]]
keep <- !grepl("^\\s*classDef\\s", lines) & !grepl("^\\s*class\\s+\\S+\\s", lines)
mermaid_clean <- paste(lines[keep], collapse = "\n")

# Build class assignments from the workflow data
input_ids <- workflow$id[!is.na(workflow$node_type) & workflow$node_type == "input"]
output_ids <- workflow$id[!is.na(workflow$node_type) & workflow$node_type == "output"]
decision_ids <- workflow$id[!is.na(workflow$node_type) & workflow$node_type == "decision"]
start_ids <- workflow$id[!is.na(workflow$node_type) & workflow$node_type == "start"]
end_ids <- workflow$id[!is.na(workflow$node_type) & workflow$node_type == "end"]
process_ids <- workflow$id[is.na(workflow$node_type) |
                            workflow$node_type == "process" |
                            !workflow$node_type %in% c("input", "output", "decision", "start", "end")]

# Filter to only include non-artifact nodes from the workflow
sanitize_id <- function(x) gsub("[^a-zA-Z0-9_]", "_", x)

class_lines <- character()
if (length(input_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(input_ids), collapse = ","), " inputStyle"))
}
if (length(process_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(process_ids), collapse = ","), " processStyle"))
}
if (length(output_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(output_ids), collapse = ","), " outputStyle"))
}
if (length(decision_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(decision_ids), collapse = ","), " decisionStyle"))
}
if (length(start_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(start_ids), collapse = ","), " startStyle"))
}
if (length(end_ids) > 0) {
  class_lines <- c(class_lines,
    paste0("  class ", paste(sanitize_id(end_ids), collapse = ","), " endStyle"))
}


# Assemble final diagram
mermaid_final <- paste0(
  "%% Auto-generated by build-workflow.R (putior) \u2014 do not edit manually\n",
  "%% Source: PUT annotations across viz/ codebase\n",
  mermaid_clean,
  cyberpunk_styles, "\n",
  paste(class_lines, collapse = "\n"), "\n"
)

# ── Write output ─────────────────────────────────────────────────────────
dir.create(dirname(output_path), recursive = TRUE, showWarnings = FALSE)
writeLines(mermaid_final, output_path)

message(sprintf("Generated %s", output_path))
message(sprintf("  Nodes: %d  |  Files: %d",
                nrow(workflow), length(unique(workflow$file_name))))
