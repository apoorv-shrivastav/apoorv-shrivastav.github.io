---
title: "Taming position bias in LLM-as-judge"
description: "Why pairwise LLM judges prefer whichever answer comes first, and what llm-eval does about it."
date: 2026-11-18
mode: professional
featured: true
---

> ✏️ **Starter post.** This is an outline to write over, not finished writing. Replace it with your own words, or delete the file.

LLM-as-judge is the fastest way to score model outputs at scale, and it has a well-known flaw: in pairwise comparisons, judges tend to favour whichever answer they read first.

## The problem

- What position bias looks like in practice
- How much it moved our scores before we corrected for it

## What llm-eval does

- **Swap and re-ask:** every pair is judged in both orders
- **Self-consistency sampling:** several samples per judgement, then aggregate
- **Multi-dimensional rubrics:** score correctness, completeness and tone separately instead of one fuzzy number
- **Chain-of-thought before the verdict**

## What I'd tell a team starting out

1. …
2. …

Code: [github.com/apoorv-shrivastav/llm-eval](https://github.com/apoorv-shrivastav/llm-eval)
