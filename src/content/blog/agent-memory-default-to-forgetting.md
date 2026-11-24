---
title: "Agent memory: default to forgetting"
description: "Memory is a cost, not a feature. How to decide what an agent keeps, in what form, and who gets to write it."
date: 2027-01-11
mode: professional
---

Giving an agent memory sounds like an obvious upgrade. Who wouldn't want an assistant that remembers?

But every piece of memory has a cost: tokens on every call, extra latency, the risk of acting on something that's no longer true, and a new place for an attacker to hide instructions. Most systems remember far too much. A better default is to forget, and make each thing you keep earn its place.

The question to ask: **what has to survive beyond this turn, and at what fidelity?**

## Memory isn't keep-or-delete

Information doesn't have to be either kept perfectly or dropped. It can step down a ladder:

1. **Verbatim:** the exact words or data.
2. **Structured summary:** the important fields, in a fixed shape.
3. **Embedding:** findable by meaning, but no longer precise.
4. **Gone.**

For each kind of information, decide which rung it lives on and what moves it down a step. A user's exact question might stay verbatim for the current task, become a structured summary at the end of the session, and disappear a month later.

## Summarize into structure, not prose

Compare these two summaries of the same conversation:

```
The user was asking about sales of the Pro plan in the West region over the last month.

{ "region": "West", "plan": "Pro", "window": "30d", "metric": "sales" }
```

The second is shorter, unambiguous when read back, and something code can check. The first one drifts. Every time a prose summary gets summarized again, it's a paraphrase of a paraphrase, and small errors pile up until the memory says something nobody ever said.

## Storing is easy. Finding is hard.

A memory of a past episode is only useful if the agent can pull up the right one at the right moment. Before storing something, ask what would trigger looking it up. If you can't answer that, don't store it. You're not building memory, you're building a landfill.

## Who's allowed to write?

How memories get written matters as much as how they're read. If anything the agent sees can be promoted to long-term memory automatically, two things go wrong:

- **Poisoning.** An attacker plants an instruction in a document, the agent saves it, and it fires later on an unrelated request. More on that in [You can't prompt your way out of prompt injection](/blog/prompt-injection-is-architectural/).
- **Slow drift.** Small mistakes get written down, then treated as facts, then built on.

Treat writes to persistent memory as a privileged operation: deliberate, logged, and ideally checked.

## The three kinds of memory

Research on language agents, like the [CoALA](https://arxiv.org/abs/2309.02427) framework, borrows three kinds of memory from cognitive science:

- **Episodic:** what happened. "Last week we looked at churn in the West region."
- **Semantic:** facts and preferences. "This user wants numbers rounded to the nearest thousand."
- **Procedural:** how to do things. "For questions about regional conversion, use this table with this filter."

Most systems build the first two and skip the third, but procedural memory is often the most valuable. It compounds: every time the agent learns a reliable way to handle a type of request, the next request of that type gets cheaper and more accurate. It's the closest thing an agent has to the know-how an experienced colleague carries around.

## The short version

Remember less than you think you need. Decide how much detail each kind of information keeps, and when it fades. Store summaries as structured fields, not paragraphs. Don't store what you can't retrieve. Treat writing to memory as a privilege. And pay attention to procedural memory, the kind that teaches the agent how, not just what.
