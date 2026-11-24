---
title: "Running agents in production: traces, migrations and rollouts"
description: "How to debug something that happened once, survive your model being retired, and ship changes to a system whose outputs are supposed to vary."
date: 2027-01-18
mode: professional
---

Building an agent that works in a demo is one problem. Keeping it working for months, while the model, the data and the prompts all change underneath it, is a different one. Three practices make most of the difference.

## 1. Debugging something that happened once

A user reports a strange answer. You run the same request and get a perfectly good one. Without the right setup, that bug is gone forever.

**Traces are the main artifact.** For every turn, capture the inputs, the retrieved context, each tool call with its arguments and output, the model's output, token counts, latency for each step, and the exact model and prompt versions. For multi-agent requests, link everything into one trace. OpenTelemetry now has [conventions for generative AI](https://opentelemetry.io/docs/specs/semconv/gen-ai/) so traces can move between tools.

**Aim for replay, not reproduction.** Setting temperature to zero reduces variation but doesn't remove it: batching, hardware and provider-side changes all introduce some. Perfect reproduction isn't realistic. What you can do is capture enough to re-run a trace against a changed prompt or a different model and compare the results.

**Treat prompts as code.** Version them, review changes, ship them through the same process as any other code. If you can't say which prompt version produced an output, you can't debug it.

**"It worked yesterday" has three usual suspects:**

- **The model changed:** the provider updated something.
- **The data changed:** the underlying data or schema moved.
- **The prompt changed:** someone shipped an edit.

With version information in every trace, telling these apart is a quick query. Without it, you're guessing.

## 2. Surviving model migrations

Your most important dependency changes on someone else's schedule. Providers retire models, and even a model with the same name can behave a little differently after an update. Your prompts are tuned to one model's quirks whether you meant them to be or not.

- **Pin exact model versions in production.** Never use a floating alias. The convenience isn't worth waking up to different behavior.
- **Evaluate the new model before switching.** Run it against your test set and compare with confidence intervals. Look at the spread, not just the average: migrations often leave the mean flat while making the worst cases worse.
- **Expect to retune prompts.** A prompt tuned for one model is rarely the best prompt for its successor.
- **Plan for it as routine work,** not an emergency.

This is the strongest practical argument for investing in evaluation early. **A good test set doesn't just measure quality. It buys you options.** Without one, every model upgrade means re-checking everything by feel. With one, it's an afternoon, and you can adopt a better or cheaper model the week it comes out. The methods for that are in [Eight habits for evaluating LLM apps and agents](/blog/evaluating-llm-apps-and-agents/).

## 3. Rolling out changes safely

Your test set covers the questions you thought of. Production brings the ones you didn't. Offline evaluation catches regressions. Only live traffic shows you what you missed.

The core difficulty: for ordinary software you compare outputs. For an agent you can't, because outputs are supposed to vary from run to run. **So compare distributions of quality metrics, not individual outputs.** That shift is what makes shipping agent changes manageable.

- **Shadow mode:** run the new version alongside the old on real traffic, log both, and show users only the old one. Compare before anyone sees a difference.
- **Canary:** send a small share of traffic to the new version, watch your guardrail metrics, and roll back automatically if one breaks.
- **Gradual rollout by group:** if you roll out team by team, the teams that haven't switched yet give you a natural comparison group for free.

### Signals when you don't have labels

- **Explicit feedback:** thumbs up or down, corrections, edits.
- **The re-ask:** when a user immediately rephrases ("no, I meant per region"), that's a strong negative signal. It costs nothing to detect, and almost nobody tracks it.
- **Escalations** to a person, and people **abandoning** a session partway through.
- **Drift:** are people asking different kinds of questions? Is the agent refusing more often? Has the mix of tools it calls shifted? A change in which tools get used is often the earliest sign that something upstream broke.

## The short version

Trace everything, with versions attached, so a one-off bug can be replayed. Pin your models and keep a test set good enough that switching is routine. Ship changes through shadow and canary stages, compare distributions rather than outputs, and watch the cheap signals, especially the re-ask.
