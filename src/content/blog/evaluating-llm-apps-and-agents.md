---
title: "Eight habits for evaluating LLM apps and agents"
description: "Read the traces first, let code grade what it can, test your judges, and put error bars on everything."
date: 2026-10-19
mode: professional
featured: true
---

Testing normal software is mostly a solved problem. You write a function, you know what it should return, you assert it. LLM apps break that. Ask the same question twice and you can get two different answers, both fine. Ask an agent to do a task and it might get there in three tool calls, or twelve, or wander off and confidently report success anyway.

So evaluation stops being "does the test pass" and turns into a measurement problem. What does good mean here? Can I measure it reliably? Will I notice when it gets worse?

Here are eight habits that help. Very little of this is original. A lot comes from Hamel Husain and Shreya Shankar's writing, the LMSYS team's work on LLM judges, and plenty of time staring at traces. Writing it down helps me keep it straight.

## 1. Read the traces before you write a metric

The most common mistake is starting with a list of metrics. Helpfulness, coherence, relevance. They feel rigorous, but they usually aren't measuring the thing that's actually going wrong.

Start by reading. Pull 50 or so real traces and write a quick note on each one that looks off. Don't categorize yet, just describe what happened: "ignored the date filter", "used search when it should have queried the database", "made up a column name". After a while the notes start repeating, and you can group them into a short list of failure modes. Rank those by how often they happen and how much damage they do.

Now you know what to measure. Each failure mode gets its own check, and that check is far more useful than a generic 1–10 score, because when it drops you know exactly what broke. Hamel's [evals FAQ](https://hamel.dev/blog/posts/evals-faq/) is the best write-up of this loop I know of.

It's slower on day one. It's much faster by week three.

## 2. If code can grade it, let code grade it

There's a pecking order for scorers, and I try to stay as high up it as I can:

1. **Code.** Exact match, regex, schema validation, unit tests, "did it call `get_orders` with `status='open'`". Free, instant, and the same input always gets the same score.
2. **Semantic similarity.** Embeddings, BERTScore. Cheap but shallow. I rarely trust these on their own.
3. **An LLM judge.** Flexible, and it can track human judgment well, but only if you've checked that it does.
4. **People.** The ground truth everything else gets calibrated against. Too expensive to use everywhere, so use it where it counts.

A surprising amount of what looks open-ended is actually checkable: structured extraction, classification, tool arguments, a SQL query that should return a specific row count. Those deserve deterministic checks. Save the judge for summaries, chat and RAG answers, where exact match would punish a perfectly good paraphrase.

## 3. An LLM judge is a model too, so test it

Using a strong model to grade outputs is how you scale past human labeling. It also comes with known biases, and the [MT-Bench paper](https://arxiv.org/abs/2306.05685) that popularized the approach documented the big ones:

- **Position bias.** In A-vs-B comparisons, judges tend to favour whichever answer comes first.
- **Verbosity bias.** Longer answers score higher, whether or not they're better.
- **Self-preference.** A judge tends to like text written by its own model family.

The fixes aren't complicated. Run every pairwise comparison in both orders and only count a win when the judge agrees with itself. Use a few smaller judges from different model families instead of one big one: the [juries paper](https://arxiv.org/abs/2404.18796) found that a panel often beats a single strong judge, at a fraction of the cost. Ask for reasoning before the verdict. And prefer a crisp yes/no question ("does the answer state anything that isn't in the context?") over a 1–10 scale, which drifts.

Most important of all: label a hundred or so examples yourself and measure how often the judge agrees with you. An eval you haven't checked against people is just another model you haven't tested.

## 4. For RAG, grade retrieval and generation separately

A RAG answer can be wrong for two very different reasons. Either retrieval didn't find the right information, or it did and the model fumbled it. Those have completely different fixes, so I score them separately.

For retrieval: did we fetch everything needed to answer (context recall), and how much of what we fetched was noise (context precision)? If you have relevance labels, plain old recall@k, MRR and NDCG work well and cost less than asking an LLM.

For generation: is every claim in the answer supported by the retrieved text (faithfulness), and does it actually answer the question (answer relevancy)? Faithfulness is usually measured by splitting the answer into small claims and checking each one against the context.

The payoff is diagnosis. Bad answer with high context recall? That's a prompt or generation problem. Low context recall? Look at chunking, embeddings or reranking. [RAGAS](https://docs.ragas.io/) and [DeepEval](https://github.com/confident-ai/deepeval) both implement these metrics.

## 5. With agents, how it got there matters

For a single LLM call, you mostly care about the output. Agents are different. Two runs can reach the same correct answer, where one took three tool calls and the other looped twelve times and burned through the token budget on the way. Grading only the final answer scores those the same. They aren't the same.

So I look at three things:

- **Did it finish the task?** Usually a yes or no.
- **Was the path reasonable?** Right tools, in a sensible order, with the right arguments. Arguments are the hard part. Calling the right tool with the wrong date range is still a wrong answer.
- **Is the final response any good?** Same methods as above.

You can compare each run against a reference trajectory, but writing golden trajectories doesn't scale, and there's often more than one good path. I lean more on cheap structural checks (the required tools were called, no identical calls repeated, step count under a limit) plus a judge that scores whether the path made sense.

For multi-agent setups, I treat the router as a classification problem with its own labeled set, test each sub-agent on its own, and then run end-to-end tests on top.

### pass@k vs pass^k

This one is worth knowing. **pass@k** asks whether *at least one* of k attempts succeeded. That tells you what the agent can do on a good day. **pass^k**, which [τ-bench](https://arxiv.org/abs/2406.12045) popularized, asks whether *all* k attempts succeeded. That tells you whether you can rely on it. An agent that looks solid on a single try can look a lot worse when it has to get the same task right eight times in a row. In production, the second number is the one your users experience.

## 6. Put error bars on everything

"The new prompt scores 85%, the old one scored 83%, ship it." This is a common trap, and the two points are often noise.

An eval score is an estimate from a sample, so it comes with uncertainty. A few habits help:

- **Report a confidence interval, not just the number.** Bootstrapping is the easy way: resample your eval set with replacement a few thousand times, recompute the score each time, and take the middle 95%.
- **Use paired tests to compare two versions.** Both versions ran on the same questions, so compare them question by question (a paired bootstrap, or McNemar's test for pass/fail). That's much more sensitive than comparing two averages, because it cancels out the fact that some questions are just harder.
- **Size the eval set on purpose.** If you want to detect a 3-point improvement, a 50-example set will almost never be able to tell you. A quick power calculation up front saves a lot of arguing later.
- **Don't assume temperature 0 means deterministic.** Batching, floating-point quirks and silent model updates all move scores between runs. Run important cases more than once and log the exact model version with every result.

Anthropic's [Adding Error Bars to Evals](https://www.anthropic.com/research/statistical-approach-to-model-evals) is a clear, practical guide to all of this.

## 7. Production is where you find out what you missed

Offline evals run on data you picked. Real users don't read your test set. In production you also usually don't have labels, so you need proxies: reference-free judge scores like faithfulness, plus behavioural signals like thumbs-down, retries, edits, people asking for a human, and people giving up.

An online monitor is really a classifier for "this output is bad", and its threshold is a trade-off between false alarms and missed problems. Make it too sensitive and people stop reading the alerts. Make it too loose and real failures slip through. Treat the threshold as a deliberate choice: weigh what a missed failure costs against what a false alarm costs, and pick the point on the precision-recall curve that matches. Getting this right often does more for whether anyone trusts the alerts than adding another metric.

Tracing is what makes this possible. Each request becomes a trace, and each retrieval, model call and tool call becomes a span with its inputs, outputs, latency and cost. With agents especially, you can't debug what you can't see. OpenTelemetry has become the common format, so most of the tools in this space can read the same data.

This is also where the loop closes: interesting production failures go back into the test set.

## 8. Make evals a gate, and keep the gate small

Evals earn their keep when they run on every change, the way unit tests do. A small, fast suite (30 or so cases, a handful of checks, a few minutes) that blocks a merge when something drops will catch more real regressions than a huge suite someone runs once a quarter.

Two practical notes. Set thresholds a little below perfect, or normal run-to-run variation will make the build flaky and people will learn to ignore it. And version your prompts and model choices alongside the results, so when a score drops you can tell which change caused it. A model upgrade that quietly changes behaviour still returns HTTP 200.

Safety belongs in the same gate. Keep a set of prompt-injection and data-leak attempts, including indirect ones hidden in documents or tool output the agent reads, and fail the release if the violation rate goes up. The [OWASP Top 10 for LLM applications](https://genai.owasp.org/llm-top-10/) is a good checklist of what to attack, and tools like [garak](https://github.com/NVIDIA/garak) and [PyRIT](https://github.com/Azure/PyRIT) can automate a lot of it.

## The short version

Read real outputs before deciding what to measure. Grade with code wherever you can. Test your judges against people. Split RAG into retrieval and generation. Look at the agent's path, not just its answer. Put error bars on every number. Watch production, and feed what you find back into the test set. Run all of it on every change.

None of this is glamorous. Most of the work is curating good test cases and reading a lot of traces. But it's the difference between hoping a change helped and knowing it did.
