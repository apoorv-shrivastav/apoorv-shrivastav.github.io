---
title: "Human review that isn't a rubber stamp"
description: "Putting a person in the loop only works if they actually read what they approve. How to design approvals, handoffs and the flows around them."
date: 2026-12-21
mode: professional
---

"Add a human in the loop" shows up in almost every agent design as the safety net. It's usually written as a single box on a diagram. The design of that box is where it succeeds or fails.

## Where to stop and ask

Good places for an approval step:

- Before anything that can't be undone.
- Before anything leaves your systems: emails, messages, posts, payments.
- Before anything expensive.
- When the agent is unsure, for example when retrieval came back weak or a check failed.
- When untrusted content is in the context and the agent wants to take a consequential action. (More on why in [You can't prompt your way out of prompt injection](/blog/prompt-injection-is-architectural/).)

## The failure mode: approval fatigue

If someone approves two hundred things a day, they stop reading them. At that point you've built a rubber stamp, and that's worse than no review at all: it creates false confidence and an audit trail that says a person checked.

So the real design constraint is this: **the number of approvals has to be small enough that each one gets real attention.** That means filtering hard by risk, batching routine items, and auto-approving what's genuinely low stakes.

If the review queue keeps growing, that's not a staffing problem. It's a design problem.

## Make approving easy and informed

- Show **what will happen**, not just what the agent decided.
- Show **what changed** compared with the default or the last version.
- Show the agent's **reasoning and sources**.
- Offer **approve, reject or edit**, not just yes or no.

## Edits are the best data you'll get

When a reviewer edits instead of rejecting, they're telling you exactly what was wrong *and* exactly what right looks like. That's the most valuable signal in the whole system. Save edits as structured before-and-after differences, not just the final version. Most teams throw this away.

## Pausing needs real state

An agent that stops for approval has to be able to pick up where it left off, possibly hours later, with everything intact. That means durable checkpoints, not a paused process sitting in memory.

This is one of the strongest arguments for building agents as explicit flows rather than open-ended loops. If you define the steps yourself and let the model fill them in, every step boundary is a natural place to save state, pause for review and resume.

## Use the most constrained design that works

That points to a broader rule for how agents plan. A quick comparison (I covered the first three in more detail in [Agent loops, and how they fail](/blog/agent-loops-and-how-they-fail/)):

| Pattern | Good at | Weak at |
|---|---|---|
| Reason-act loop (ReAct) | Adapting to surprises | Predictability, auditing |
| Plan, then execute | Cost, predictability | Recovering when the plan is wrong |
| Self-critique | Quality on hard tasks | Cost and latency |
| Explicit flow you define | Determinism, auditing, pausing for review | Only works when you know the flow |
| Try several, pick the best | Hard single decisions | Cost |

Open-ended loops are the default in demos and rarely the best choice in production. If you know the flow, write it down as a flow. You get predictability, auditability and easy checkpoints, and you give up flexibility you probably weren't using. The honest reason people reach for open loops is that they're less work up front. That's a fair trade early on and a poor one once the system matters.

A common middle ground: a fixed flow for the overall structure, with a small, bounded loop inside the one step that genuinely needs to explore.

## Handing off to a person

When the agent escalates, what does the person receive? The worst case is a handoff where they start from zero and the user has to explain everything again. A good handoff carries the original question, what the agent tried, what it found, and why it stopped.

## The short version

Ask for approval rarely enough that people actually read it. Make each request easy to judge. Keep the edits, since they're your best training data. Build on explicit flows so pausing and resuming is easy. And when you hand off, hand off everything.
