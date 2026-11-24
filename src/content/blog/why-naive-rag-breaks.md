---
title: "Why naive RAG breaks, and how to fix it"
description: "Most RAG failures happen before the model sees anything. A tour of chunking, hybrid search, reranking and query rewriting."
date: 2026-10-19
mode: professional
---

The first version of a RAG system is easy to build. Split your documents into chunks, embed them, store the vectors, retrieve the closest few for each question, and paste them into the prompt. It works well enough in a demo.

Then real questions arrive, and answers start going wrong. The natural reaction is to tweak the prompt. Usually that's the wrong place to look. Very often the model is doing a reasonable job with what it was given. It was just given the wrong text.

## Name the failure first

"RAG is giving bad answers" isn't a diagnosis. It helps to sort failures into a few buckets, because each one has a different fix:

- **The right document never comes back.** That's a recall problem.
- **It comes back, but ranked below worse matches.** That's a ranking problem.
- **The right chunk is there, buried among eight irrelevant ones.** That's a precision problem. Models get distracted by noise, and research like [Lost in the Middle](https://arxiv.org/abs/2307.03172) shows they're worse at using information placed in the middle of a long context.
- **The words don't match.** Someone asks "how do I cancel my subscription?" and the answer lives in a document called "Account Termination Policy".
- **Exact terms get blurred.** Embeddings are good at meaning and bad at precise strings. Error codes, part numbers, product names and acronyms often get lost.

Once you know which bucket you're in, the fix is usually obvious.

## Chunking: the unglamorous part that matters most

Fixed-size chunks (say, a thousand characters with some overlap) are a fine way to start and a common ceiling. They cut through the middle of tables, separate headings from the text they introduce, and split code blocks in half.

Better options, roughly in order of payoff:

- **Split along the document's own structure.** Break at headings and sections, keep tables and code blocks whole. This is often the single biggest upgrade.
- **Split where the meaning changes.** Embed sentence by sentence and start a new chunk when one sentence is suddenly much less similar to the last.
- **Search small, read big.** Match against small, precise chunks, but hand the model the larger passage around the match.

[Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) is a clever twist on this. Before embedding a chunk, you ask a model to write one or two sentences placing it in context ("This is from the Q3 report's section on operating margins"), and you embed that along with the chunk. Anthropic reported this cut retrieval failures by 35% on its own, and by 67% when combined with keyword search and reranking.

## Choosing an embedding model

The [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) is a good place to shortlist models, but a leaderboard score isn't your data. Take your top few candidates and measure recall on a set of real questions where you know which chunks hold the answer. Also weigh vector size (bigger means more storage and slower search), maximum input length, language support and price.

If off-the-shelf models stall on your domain's vocabulary, fine-tuning an embedding model on your own question-and-passage pairs is a reasonable next step.

## Hybrid search: meaning plus exact words

Embedding search (dense retrieval) understands that "cancel" and "terminate" are related. Keyword search (sparse retrieval, usually BM25) understands that "ERR_4012" means exactly "ERR_4012". Each one covers the other's blind spot.

So run both and merge the results. The standard way to merge is [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf): each document gets points based on its rank in each list, and you sort by the total. It's simple, needs almost no tuning, and works well, which is why it shows up everywhere.

## Reranking: cast wide, then be picky

Embedding search scores the question and each passage separately, then compares the two vectors. That's what makes it fast, and also what makes it a bit coarse.

A **reranker** (usually a cross-encoder) reads the question and a passage *together* and scores how well the passage answers it. It's much more accurate, and much too slow to run over your whole collection. So you split the job:

1. Retrieve broadly, maybe the top 30 to 50 candidates from hybrid search. This step is about not missing anything.
2. Rerank those candidates.
3. Keep the top five to eight. This step is about cutting the noise.

## Query rewriting: fix the question before searching

Sometimes the question itself is the problem. "What about the second one?" means nothing to a search index without the conversation around it. A short model call before retrieval can help:

- **Rewrite** the question so it stands on its own.
- **Fan out** into several phrasings and search for all of them.
- **Split** a multi-part question into separate searches.
- **Search with a hypothetical answer.** [HyDE](https://arxiv.org/abs/2212.10496) has the model draft an answer first, then searches for passages similar to that draft, since answers tend to look more like documents than questions do.

Each of these adds cost and latency, and loose rewrites can drift from what the user meant. Use them where the questions actually need it.

## Putting it together

A solid pipeline ends up looking like this:

```
documents → structure-aware chunks → (optional) contextual summaries
          → index in both a keyword index and a vector store

question  → (optional) rewrite
          → keyword search + vector search, in parallel
          → merge with reciprocal rank fusion
          → rerank, keep the top 5–8
          → dedupe, order, apply filters (tenant, date, permissions)
          → generate an answer with citations
```

Filtering on metadata like date, document type or which customer the data belongs to is worth doing early, because it shrinks the pool before the expensive steps. For permissions it isn't optional.

## Measure every change

Every one of these upgrades can make things worse on your particular data. A new chunking scheme that helps long reports might hurt short FAQ entries. The only way to know is to measure retrieval directly: keep a set of around a hundred real questions with the chunks that answer them, and check recall@k and MRR every time you change something. Then check end-to-end answer quality as well.

[Searching for Best Practices in RAG](https://arxiv.org/abs/2407.01219) is a useful paper here, because it tests many of these choices against each other rather than in isolation.

## What about huge context windows?

Long context windows didn't make retrieval obsolete. Filling a million-token window on every request is slow and expensive, and the precision problems above get worse, not better. A good middle ground: use retrieval to find the best 5 to 20 passages, and use the large window when a task genuinely needs a whole document or codebase at once.

Retrieval finds. Long context reads.
