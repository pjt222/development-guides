---
name: write-validation-documentation
description: >
  Write IQ/OQ/PQ validation documentation for computerized systems
  in regulated environments. Covers protocols, reports, test scripts,
  deviation handling, and approval workflows.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: compliance
  complexity: advanced
  language: R
  tags: validation, iq-oq-pq, documentation, gxp, qualification
---

# Write Validation Documentation

Create complete IQ/OQ/PQ validation documentation for computerized systems.

## When to Use

- Validating R or other software for regulated use
- Preparing for regulatory audit
- Documenting qualification of computing environments
- Creating or updating validation protocols and reports

## Inputs

- **Required**: System/software to validate (name, version, purpose)
- **Required**: Validation plan defining scope and strategy
- **Required**: User requirements specification
- **Optional**: Existing SOP templates
- **Optional**: Previous validation documentation (for re-qualification)

## Procedure

### Step 1: Write Installation Qualification (IQ) Protocol

```markdown
# Installation Qualification Protocol
**System**: R Statistical Computing Environment
**Version**: 4.5.0
**Document ID**: IQ-PROJ-001
**Prepared by**: [Name] | **Date**: [Date]
**Reviewed by**: [Name] | **Date**: [Date]
**Approved by**: [Name] | **Date**: [Date]

## 1. Objective
Verify that R and required packages are correctly installed per specifications.

## 2. Prerequisites
- [ ] Server/workstation meets hardware requirements
- [ ] Operating system qualified
- [ ] Network access available (for package downloads)

## 3. Test Cases

### IQ-001: R Installation
| Field | Value |
|-------|-------|
| Requirement | R version 4.5.0 correctly installed |
| Procedure | Open R console, execute `R.version.string` |
| Expected Result | "R version 4.5.0 (2025-04-11)" |
| Actual Result | ______________________ |
| Pass/Fail | [ ] |
| Executed by | ____________ Date: ________ |

### IQ-002: Package Inventory
| Package | Required Version | Installed Version | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| dplyr | 1.1.4 | | [ ] |
| ggplot2 | 3.5.0 | | [ ] |
| survival | 3.7-0 | | [ ] |

## 4. Deviations
[Document any deviations from expected results and their resolution]

## 5. Conclusion
[ ] All IQ tests PASSED - system installation verified
[ ] IQ tests FAILED - see deviation section
```

### Step 2: Write Operational Qualification (OQ) Protocol

```markdown
# Operational Qualification Protocol
**Document ID**: OQ-PROJ-001

## 1. Objective
Verify that the system operates correctly under normal conditions.

## 2. Test Cases

### OQ-001: Data Import Functionality
| Field | Value |
|-------|-------|
| Requirement | System correctly imports CSV files |
| Test Data | validation/test_data/import_test.csv (MD5: abc123) |
| Procedure | Execute `read.csv("import_test.csv")` |
| Expected | Data frame with 100 rows, 5 columns |
| Actual Result | ______________________ |
| Evidence | Screenshot/log file reference |

### OQ-002: Statistical Calculations
| Field | Value |
|-------|-------|
| Requirement | t-test produces correct results |
| Test Data | Known dataset: x = c(2.1, 2.5, 2.3), y = c(3.1, 3.5, 3.3) |
| Procedure | Execute `t.test(x, y)` |
| Expected | t = -5.000, df = 4, p = 0.00753 |
| Actual Result | ______________________ |
| Tolerance | ±0.001 |

### OQ-003: Error Handling
| Field | Value |
|-------|-------|
| Requirement | System handles invalid input gracefully |
| Procedure | Execute `analysis_function(invalid_input)` |
| Expected | Informative error message, no crash |
| Actual Result | ______________________ |
```

### Step 3: Write Performance Qualification (PQ) Protocol

```markdown
# Performance Qualification Protocol
**Document ID**: PQ-PROJ-001

## 1. Objective
Verify the system performs as intended with real-world data and workflows.

## 2. Test Cases

### PQ-001: End-to-End Primary Analysis
| Field | Value |
|-------|-------|
| Requirement | Primary endpoint analysis matches reference |
| Test Data | Blinded test dataset (hash: sha256:abc...) |
| Reference | Independent SAS calculation (report ref: SAS-001) |
| Procedure | Execute full analysis pipeline |
| Expected | Estimate within ±0.001 of reference |
| Actual Result | ______________________ |

### PQ-002: Report Generation
| Field | Value |
|-------|-------|
| Requirement | Generated report contains all required sections |
| Procedure | Execute report generation script |
| Checklist | |
| | [ ] Title page with study information |
| | [ ] Table of contents |
| | [ ] Demographic summary table |
| | [ ] Primary analysis results |
| | [ ] Appendix with session info |
```

### Step 4: Write Qualification Reports

After executing protocols, document results:

```markdown
# Installation Qualification Report
**Document ID**: IQ-RPT-001
**Protocol Reference**: IQ-PROJ-001

## 1. Summary
All IQ test cases were executed on [date] by [name].

## 2. Results Summary
| Test ID | Description | Result |
|---------|-------------|--------|
| IQ-001 | R Installation | PASS |
| IQ-002 | Package Inventory | PASS |

## 3. Deviations
None observed.

## 4. Conclusion
The installation of R 4.5.0 and associated packages has been verified
and meets all specified requirements.

## 5. Approvals
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Executor | | | |
| Reviewer | | | |
| Approver | | | |
```

### Step 5: Automate Where Possible

Create automated test scripts that generate evidence:

```r
# validation/scripts/run_iq.R
sink("validation/iq/iq_evidence.txt")
cat("IQ Execution Date:", format(Sys.time()), "\n\n")

cat("IQ-001: R Version\n")
cat("Result:", R.version.string, "\n")
cat("Status:", ifelse(R.version$major == "4" && R.version$minor == "5.0",
                      "PASS", "FAIL"), "\n\n")

cat("IQ-002: Package Versions\n")
required <- renv::dependencies()
installed <- installed.packages()
# ... comparison logic
sink()
```

## Validation

- [ ] All protocols have unique document IDs
- [ ] Protocols reference the validation plan
- [ ] Test cases have clear pass/fail criteria
- [ ] Reports include all executed test results
- [ ] Deviations are documented with resolutions
- [ ] Approval signatures are obtained
- [ ] Documents follow organization's SOP templates

## Common Pitfalls

- **Vague acceptance criteria**: "System works correctly" is not testable. Specify exact expected values.
- **Missing evidence**: Every test result needs supporting evidence (screenshots, logs, output files)
- **Incomplete deviation handling**: All failures must be documented, investigated, and resolved
- **No version control for documents**: Validation docs need change control just like code
- **Skipping re-qualification**: System updates (R version, package updates) require re-qualification assessment

## Related Skills

- `setup-gxp-r-project` - project structure for validated environments
- `implement-audit-trail` - electronic records tracking
- `validate-statistical-output` - output validation methodology
