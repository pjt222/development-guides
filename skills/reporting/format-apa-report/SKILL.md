---
name: format-apa-report
description: >
  Format a Quarto or R Markdown report following APA 7th edition style.
  Covers apaquarto/papaja packages, title page, abstracts, citations,
  tables, figures, and reference formatting.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: reporting
  complexity: intermediate
  language: R
  tags: apa, academic, psychology, quarto, papaja
---

# Format APA Report

Create an APA 7th edition formatted report using Quarto (apaquarto) or R Markdown (papaja).

## When to Use

- Writing an academic paper in APA format
- Creating a psychology or social science research report
- Generating reproducible manuscripts with embedded analysis
- Preparing a thesis or dissertation chapter

## Inputs

- **Required**: Analysis code and results
- **Required**: Bibliography file (.bib)
- **Optional**: Co-authors and affiliations
- **Optional**: Manuscript type (journal article, student paper)

## Procedure

### Step 1: Choose Framework

**Option A: apaquarto (Quarto, recommended)**

```r
install.packages("remotes")
remotes::install_github("wjschne/apaquarto")
```

**Option B: papaja (R Markdown)**

```r
remotes::install_github("crsh/papaja")
```

### Step 2: Create Document (apaquarto)

Create `manuscript.qmd`:

```yaml
---
title: "Effects of Variable X on Outcome Y"
shorttitle: "Effects of X on Y"
author:
  - name: First Author
    corresponding: true
    orcid: 0000-0000-0000-0000
    email: author@university.edu
    affiliations:
      - name: University Name
        department: Department of Psychology
  - name: Second Author
    affiliations:
      - name: Other University
abstract: |
  This study examined the relationship between X and Y.
  Using a sample of N = 200 participants, we found...
  Results are discussed in terms of theoretical implications.
keywords: [keyword1, keyword2, keyword3]
bibliography: references.bib
format:
  apaquarto-docx: default
  apaquarto-pdf:
    documentmode: man
---
```

### Step 3: Write APA Content

````markdown
# Introduction

Previous research has established that... [@smith2023; @jones2022].
@smith2023 found significant effects of X on Y.

# Method

## Participants

We recruited `r nrow(data)` participants (*M*~age~ = `r mean(data$age)`,
*SD* = `r sd(data$age)`).

## Materials

The study used the Measurement Scale [@author2020].

## Procedure

Participants completed... (see @fig-design for the study design).

# Results

```{r}
#| label: fig-results
#| fig-cap: "Mean scores by condition with 95% confidence intervals."
#| fig-width: 6
#| fig-height: 4

ggplot(summary_data, aes(x = condition, y = mean, fill = condition)) +
  geom_col() +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2) +
  theme_apa()
```

A two-way ANOVA revealed a significant main effect of condition,
*F*(`r anova_result$df1`, `r anova_result$df2`) = `r anova_result$F`,
*p* `r format_pvalue(anova_result$p)`, $\eta^2_p$ = `r anova_result$eta`.

# Discussion

The findings support the hypothesis that...

# References
````

### Step 4: Format Tables in APA Style

```r
#| label: tbl-descriptives
#| tbl-cap: "Descriptive Statistics by Condition"

library(gt)

descriptive_table <- data |>
  group_by(condition) |>
  summarise(
    M = mean(score),
    SD = sd(score),
    n = n()
  )

gt(descriptive_table) |>
  fmt_number(columns = c(M, SD), decimals = 2) |>
  cols_label(
    condition = "Condition",
    M = "*M*",
    SD = "*SD*",
    n = "*n*"
  )
```

### Step 5: Manage Citations

Create `references.bib`:

```bibtex
@article{smith2023,
  author = {Smith, John A. and Jones, Mary B.},
  title = {Effects of intervention on outcomes},
  journal = {Journal of Psychology},
  year = {2023},
  volume = {45},
  pages = {123--145},
  doi = {10.1000/example}
}
```

APA citation styles:
- Parenthetical: `[@smith2023]` -> (Smith & Jones, 2023)
- Narrative: `@smith2023` -> Smith and Jones (2023)
- Multiple: `[@smith2023; @jones2022]` -> (Jones, 2022; Smith & Jones, 2023)

### Step 6: Render

```bash
# Word document (common for journal submission)
quarto render manuscript.qmd --to apaquarto-docx

# PDF (for preprint or review)
quarto render manuscript.qmd --to apaquarto-pdf
```

**Expected**: Properly formatted APA document with title page, running head, references.

## Validation

- [ ] Title page formatted correctly (title, authors, affiliations, author note)
- [ ] Abstract present with keywords
- [ ] In-text citations match reference list
- [ ] Tables and figures numbered correctly
- [ ] Statistics formatted per APA (italicized, proper symbols)
- [ ] References in APA 7th edition format
- [ ] Page numbers and running head present (PDF)

## Common Pitfalls

- **Inline R code formatting**: Use backtick-r syntax for inline statistics, not hardcoded values
- **Citation key mismatches**: Ensure .bib keys match exactly in the text
- **Figure placement**: APA manuscripts typically place figures at the end; set `documentmode: man`
- **Missing CSL file**: apaquarto includes the APA CSL; papaja users may need to specify `csl: apa.csl`
- **Special characters in abstracts**: Avoid markdown formatting in the YAML abstract block

## Related Skills

- `create-quarto-report` - general Quarto document creation
- `generate-statistical-tables` - publication-ready tables
- `build-parameterized-report` - batch report generation
