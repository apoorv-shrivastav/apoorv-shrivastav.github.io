---
title: "Context is a budget, not a bucket"
description: "Treating the context window as a scarce resource makes isolation, offloading, ordering and trust obvious design concerns."
date: 2026-11-02
mode: professional
---

Context engineering usually gets taught as two moves: retrieve the right material, then compress it so it fits. Get the good stuff in, squeeze it small.

I find a different framing more useful. You have a fixed window. Attention across that window isn't even: the start and the end get more of it than the middle, and quality drops as the window fills, well before you hit the limit. Every token you add competes with every other token.

So context engineering is really **budget allocation under an attention constraint**. Once you see it that way, a bunch of things that look like afterthoughts become the main event.

## Ask one question per decision

Techniques are what you *can* do. A strategy is a rule for *when*. These are the questions I keep coming back to:

| Concern | The question |
|---|---|
| Memory | What has to survive beyond this turn, and at what fidelity? |
| Retrieval | What's the minimum context the answer can be derived from? |
| Isolation | What belongs in a different window, or no window at all? |
| Assembly | Where does each piece sit, and in what shape? |
| Construction | What does the model need for *this* step? |
| Integrity | Is this context trustworthy, current and traceable? |
| Tokens | Which tokens actually change the answer? |
| Observability | How do I know any of this is working? |

Memory and tokens get their own posts. This one is about the rest.

## The strongest move: a different window

Most context advice is about what goes into the window. Often the better question is what goes into a *separate* one, or into none at all.

**Isolation.** Splitting work across sub-agents isn't just an architecture choice, it's a context choice. One agent holding a 60-table schema, 50 tool definitions and the full conversation history spreads its attention across all of it. Three agents with narrow, task-specific context each see only what they need. That, more than "specialization", is why multi-agent setups often beat a single agent on complex tasks.

**Keep untrusted content apart.** Put retrieved external content in a clearly marked region, or hand it to a separate quarantined model entirely. That's a context decision before it's a security one, and it's the same containment idea I wrote about in [You can't prompt your way out of prompt injection](/blog/prompt-injection-is-architectural/).

**Offload instead of carrying.** Don't keep everything in the window. Let the agent write intermediate findings to a scratchpad and read back only what it needs. That tends to be both cheaper and better than letting everything pile up in context.

**Pass handles, not payloads.** When a tool would return 10,000 rows, return a reference, the schema and a short preview instead. The agent asks for what it actually needs. This one pattern prevents the most common way analytics agents blow through their context.

## Only what this step needs

The instinct to load everything up front works against you. Give the model what the current step requires.

- **Load tools selectively.** With dozens of tools, the schemas alone can cost thousands of tokens per turn. Picking the relevant subset is the same problem as routing, with the same trap: descriptions that overlap.
- **Pick examples that are similar *and* varied.** Retrieving the five closest examples often gets you five near-copies, which teaches one narrow pattern. Select by relevance, then make sure the set covers different shapes of the task.
- **Hiding something from the prompt isn't access control.** Leaving a rule or a field out of the prompt reduces noise. It doesn't stop anyone. If a user shouldn't see data, enforce that where the data lives: scoped credentials, row-level security, filters added in code.

## Where things sit, and in what shape

**Position matters.** Models are better at using information at the start and end of a long context than in the middle, as the [Lost in the Middle](https://arxiv.org/abs/2307.03172) study showed. A practical layout: stable, cacheable material first, the least critical material in the middle, and the most important material (usually the question and instructions) last. Anthropic's [long-context tips](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips) report that putting the query after long documents improved answer quality by up to 30% in their tests.

**Format matters.** The same information in a different shape performs differently. Use consistent delimiters (XML-style tags work well), put structured data in JSON rather than sentences, and use one clear format per kind of content. Messy formatting spends the model's effort on parsing instead of thinking.

**Say what wins.** When the system prompt, the user, a retrieved document and a tool result disagree, which one takes precedence? If you don't state it, the model decides, and it will sometimes side with the retrieved document over your instructions. That's injection showing up as a design flaw.

**Keep a record of what failed.** What has the agent already tried? Failed calls, rejected ideas, queries that went nowhere. It's not quite conversation history and not quite memory, and most frameworks throw it away. It's also the cheapest loop prevention there is.

## Can this context be trusted?

Getting context in is half the job. The other half is knowing whether to believe it.

- **Conflicts.** When two retrieved documents disagree, surface it instead of letting the model quietly pick one.
- **Staleness.** Timestamp retrieved content and favor recent sources where it matters. An agent quoting a replaced policy is worse than one that says it doesn't know.
- **Provenance.** Every piece of context should carry its source. That's what makes citations, debugging and user checks possible.
- **Coverage.** Does the model know what it *doesn't* have? An agent that knows its documents start in 2024 can say so. One that doesn't will answer confidently about 2023.

## The short version

The window is scarce, and attention within it is uneven. Spend it on purpose: move what you can to other windows or to storage, give each step only what it needs, put the important things where attention is strongest, and check that what you put in deserves to be believed. Anthropic's [guide to context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) is a good companion read.
