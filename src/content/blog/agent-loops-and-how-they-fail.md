---
title: "Agent loops, and how they fail"
description: "ReAct, plan-and-execute, reflection and routers, plus the ways long agent runs go wrong and how to debug them."
date: 2026-12-21
mode: professional
---

Strip away the frameworks and an agent is a loop. The model looks at the situation, decides on an action (usually a tool call), sees the result, and decides again. It stops when it thinks it's done, or when you make it stop.

Most of the design choices are about how to structure that loop. Most of the problems show up when the loop runs for a long time.

## The main patterns

### ReAct: think, act, look, repeat

[ReAct](https://arxiv.org/abs/2210.03629) interleaves reasoning and action. The model writes a short thought ("I need the customer's recent orders"), takes an action (calls the orders tool), reads the observation (the result), and thinks again. This is the default loop behind most agent frameworks.

It's flexible, because the agent can change course after every step, and easy to follow, because the reasoning is right there in the trace. The downside is the same flexibility: with no plan, it can wander, repeat itself, or call tools it doesn't need.

### Plan, then execute

[Plan-and-Solve](https://arxiv.org/abs/2305.04091) and the plan-and-execute pattern separate thinking from doing. One step writes a plan up front. Then the steps are carried out, often by a cheaper model, with an option to re-plan if something goes wrong.

This tends to be more predictable and uses fewer expensive model calls on long tasks. The risk is the plan itself: if it's wrong from the start, every step after it is wasted work, unless you check progress and re-plan.

### Reflection: learn from the last attempt

[Reflexion](https://arxiv.org/abs/2303.11366) adds a review step. After an attempt, the agent critiques what it did, writes down the lesson, and tries again with that note in hand. Related ideas include having a separate evaluator model check the output and send it back for another round.

It helps on hard tasks where a first attempt often fails. It also costs more calls, and it only works if the critique is actually catching real problems.

### Routers and teams of agents

A router reads the request and hands it to a specialist: a billing agent, a technical-support agent, a research agent. Bigger setups add a supervisor that splits work across several workers and combines their results.

This keeps each agent's prompt and toolset small and focused. It also adds new ways to fail: the router can pick the wrong specialist, and information can get lost when work passes from one agent to another. It's worth testing the router on its own, like any classifier, before testing the whole system.

### Start simpler than you think

Anthropic's [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) makes a point I agree with: many problems don't need an agent at all. A fixed sequence of model calls (a workflow) is easier to test, cheaper and more predictable. Reach for an open-ended loop when the steps genuinely can't be known in advance.

## How long runs go wrong

Short agent runs mostly work. The interesting failures happen twenty steps in, and they tend to come in a few recognizable shapes.

**Loops.** The agent calls the same tool with the same arguments again, gets the same result, and tries once more. Fixes: a hard step limit, detecting repeated identical calls, and telling the model plainly when it's repeating itself.

**A context window that keeps growing.** Every step adds the tool call and its result to the conversation. Eventually the context is huge, the model starts losing track of earlier details, and each step gets slower and more expensive. Fixes: summarize or trim older steps, and keep bulky tool output (full web pages, large query results) out of the conversation, passing a short summary or a reference instead. Note that rewriting earlier history changes the prompt prefix, which breaks prompt caching, so it's a trade-off.

**One bad result poisons the rest.** A tool returns an error, an empty list or something malformed, and the agent treats it as real data. Every step after that builds on the mistake. Fixes: validate tool outputs, return errors as clear messages the model can react to ("no orders found for that customer ID") rather than raw stack traces or silent empty results, and allow retries on flaky tools.

**Forgetting the goal.** Deep into a long task, the agent drifts toward whatever the last tool result was about and loses sight of what the user actually asked. Fixes: restate the goal periodically, keep an explicit checklist or plan in the agent's state, and save checkpoints so a run can be resumed or inspected.

**Quietly running up the bill.** Nothing errors, but the run takes forty steps and a lot of tokens to do something that should take five. Fixes: budgets on steps, tokens and time, plus tracking cost per task, not just per call.

## Debugging needs traces

The hard thing about long runs is that small differences compound. A slightly different tool result at step 3 changes what the model writes at step 4, which changes the next tool call, and by step 20 you're looking at a completely different run. You can't debug that from the final answer, and you can't reproduce it reliably by running it again.

What you need is a trace: every model call, tool call and state change, recorded with its inputs, outputs, timing and token counts, and viewable as a timeline. Tools like [Langfuse](https://langfuse.com/), [Arize Phoenix](https://phoenix.arize.com/) and [LangSmith](https://docs.smith.langchain.com/) are built around this, and most agent frameworks can send traces to them through OpenTelemetry.

With a trace, the question changes from "why did the agent fail?" to "which step went wrong first?" That second question is usually answerable. Once you've found the step, the fix is often small: a clearer tool description, a better error message, an argument check, a tighter step limit.

The failing traces are also worth keeping. Each one is a ready-made test case for the next version.
