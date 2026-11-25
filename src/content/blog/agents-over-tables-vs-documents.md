---
title: "Agents over tables vs agents over documents"
description: "A text-to-SQL agent and a document agent look alike from the outside. Underneath, they need almost opposite designs."
date: 2026-11-23
mode: professional
---

People usually describe the difference by listing tools: SQL for structured data, a vector database for documents. That's true, but it's the surface. What really changes is three things: **what the agent retrieves, what "correct" means, and whether you can check the answer without a person.**

## Metadata vs content

A text-to-SQL agent doesn't retrieve data. It retrieves a *description* of where the data lives (which table, which column, which join, which metric definition) and then writes code that computes the answer. The truth is computed at query time.

A document agent retrieves the answer itself, as text, and rephrases it. The truth already exists in the documents. The job is finding it and staying faithful to it.

That one difference shapes everything else. It also leads to a useful rule. A schema is a bounded thing: a few curated tables can fit in a prompt. A document collection is unbounded. So:

**Retrieve when the surface is unbounded. Inline it when it's bounded.**

For a modest set of well-designed tables, you can often put the whole schema in the prompt and skip retrieval entirely. You get perfect recall and no retrieval latency, in exchange for a fixed token cost and some upkeep. You can never do that with a document collection.

## Only one side gets a free validator

SQL comes with checks at three levels, all mechanical:

1. Does the query parse?
2. Does it run (valid tables, valid columns, permissions)?
3. Does its result match the result of a known-good query?

That last check, *execution accuracy*, is how text-to-SQL benchmarks like [Spider](https://arxiv.org/abs/1809.08887) and [BIRD](https://arxiv.org/abs/2305.03111) score models. No judge model needed. And it means you can often use a smaller, cheaper model and simply retry when a check fails.

Documents have no equivalent. "Is this summary faithful to the source?" has no mechanical answer. You need a judge model or a person, and both are noisy and slower.

So the designs diverge. **Structured agents should be built around aggressive checking and cheap retries. Document agents should be built around preventing bad answers**, because you can't reliably catch them afterward.

## They fail in opposite ways

| | Tables | Documents |
|---|---|---|
| How it fails | A confident, wrong number | A confident, unsupported story |
| How visible | Almost invisible: a wrong number looks like a right one | Somewhat visible: an unsourced claim can be checked |
| Usual cause | Wrong join, wrong grain, wrong metric definition | The right passage was never retrieved |
| Where to fix it | Below the model, in the data layer | Around the model, in the retrieval pipeline |

A table agent fails by being *wrong*. A document agent fails by being *ungrounded*. They need different defenses.

The document side is mostly a retrieval problem, which I covered in [Why naive RAG breaks, and how to fix it](/blog/why-naive-rag-breaks/). The rest of this post is about tables.

## What a SQL agent needs to know

- **What columns mean, not just what they're called.** `shp_dt_actl` tells the model nothing. "Actual ship date, filled in when the order leaves the warehouse, empty until then" tells it everything.
- **Grain:** what one row represents. Most bad joins are grain mistakes.
- **Join paths:** which ones are correct, and which ones are traps.
- **Metric definitions:** the agreed formula for "conversion rate", including what's in the numerator, the denominator, and what's excluded.
- **Valid values:** the real list of categories, including old ones that no longer appear.
- **House rules:** required filters, partition columns, default row limits.

## The common failures, named

| Failure | What happens | Fix |
|---|---|---|
| Wrong join | Several joins are valid SQL; the model picks the wrong one | Build wide, pre-joined tables so the join disappears |
| Fan-out | Joining two one-to-many tables double-counts | Aggregate before joining, or forbid the pattern |
| Grain mismatch | Daily totals joined to tables that don't share a key | Curated tables at a declared grain |
| Two meanings, one word | "Active customer" means one thing to sales and another to support | Make the agent state which meaning it's using before it writes SQL |
| Unbounded scan | No date filter, full table scan, slow and expensive | Add partition filters in code |
| Probing loops | The agent explores the schema over many turns | Inline the schema; disallow exploratory queries |
| Dead values | Filtering on a category that no longer exists | List valid values explicitly, and mark retired ones |

The "two meanings, one word" problem is the sneakiest, because both answers look right. The fix is structural: require the agent to say which concept it's answering about before it writes any code, and test for that in your evals.

## Guardrails that are guarantees

- An allowlist of tables and columns, and read-only credentials.
- Filters added by code, not requested in the prompt: tenant filters, consent flags, row-level security. **A prompt is guidance. A filter added in code is a guarantee.**
- Required partition filters, and default row limits.
- Run queries as the requesting user, so the agent can't see more than they can.
- A cost ceiling per query, enforced by the database engine.

## How to evaluate it

- **Execution accuracy:** run the generated SQL and a known-good query and compare the results. Never compare the SQL text; there are many correct ways to write the same query.
- **Source compliance:** did it use the approved tables?
- **Meaning check:** did it pick the right definition of an ambiguous term?
- **Leak check:** zero tolerance for exposing personal data.
- **Cost and latency:** bytes scanned and run time, with limits.

Save the judge model for the written explanation of the results, not the query.

## Where the leverage is

Reliability is mostly decided before the model is ever called. Clean, well-documented tables, a semantic layer and agreed metric definitions do more than any prompt. Prompt tweaks move the error rate. Good data modeling removes whole categories of errors.

A useful question to ask: *what would this look like if the agent were only allowed to write very simple queries?* Then go build the tables that make that possible.

## When a question needs both

Real questions often cross over. "Why did conversion drop in the West last month?" needs the numbers and then the campaign notes or support tickets that explain them.

- **Keep them separate.** Use different sub-agents with their own context and tools, coordinated by a router, rather than one agent holding a schema and a document index at once.
- **Numbers first, then documents.** The numbers tell you which region, product and time window moved, so you search documents about exactly that instead of everything.
- **Agree on names.** If the warehouse says `region_cd = 'W'`, the documents say "West Coast" and another system says "Western", nothing connects. Matching entities across sources is usually the hardest part of these systems.
- **Label every claim by its source.** "Conversion fell 3 points (from the warehouse), around the time shipping times changed (from the operations log)." Computed numbers and written claims deserve different levels of trust, and readers should be able to tell which is which.

## The short version

Table agents retrieve metadata. Document agents retrieve content. Tables give you a free validator and documents don't. A table agent fails by being wrong, a document agent by being ungrounded. Build each one around those facts.
