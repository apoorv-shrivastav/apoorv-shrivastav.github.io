---
title: "How to tell when a model is making things up"
description: "Detecting hallucinations, measuring whether a model knows when it's unsure, and checking that citations really support the claim."
date: 2026-10-12
mode: professional
---

A lot of eval work happens at the system level: is the agent picking the right tools, is retrieval finding the right chunks, did this change make things better or worse. Underneath all of it sits a narrower question. How do you tell, from the outside, that a model is making something up? And does the model itself have any idea?

This post walks through what the research says about both, plus a related problem: checking that a citation actually supports the claim it's attached to. If something here is off, I'd like to hear about it.

## Two kinds of "wrong" that get lumped together

The first thing that cleared things up for me was separating two ideas that both get called hallucination:

- **Faithfulness**: is the answer supported by the context the model was given?
- **Factuality**: is the answer true about the world?

They come apart more often than you'd think. A model can faithfully summarize a document that is itself wrong. It can also state something true that wasn't in any of the sources it was handed. In a RAG system you mostly care about the first, because unsupported claims are unverifiable claims, even when they happen to be right.

## Three ways to catch it

The detection methods fall into roughly three families.

**Look inside the model.** If you have access to token probabilities, low confidence on key tokens is a weak but real signal. [Kadavath et al.](https://arxiv.org/abs/2207.05221) showed that models are, in their words, "mostly" aware of what they know. Researchers also train small probes on a model's internal activations to predict whether a statement is true. Interesting, but not an option when you're calling an API.

**Ask the same question several times.** This was the idea I found most elegant. [SelfCheckGPT](https://arxiv.org/abs/2303.08896) samples several answers to the same prompt and checks whether they agree. If the model actually knows a fact, it tends to state it consistently. If it's making it up, the details drift from sample to sample.

[Semantic entropy](https://www.nature.com/articles/s41586-024-07421-0) refines this in a way that clicked for me. Comparing the samples word by word is misleading, because "Paris" and "the capital is Paris" look different but mean the same thing. So you first group the samples by meaning (two answers are in the same group if each one entails the other), then measure how spread out the groups are:

```
semantic entropy = − Σ p(group) · log p(group)
```

If all ten samples land in one meaning group, entropy is zero and the model is consistent. If they split across five different meanings, entropy is high, and you probably shouldn't trust the answer. It costs several generations per question, but it works on any model, with no access to internals needed.

**Check against evidence.** [FActScore](https://arxiv.org/abs/2305.14251) breaks a long answer into small atomic facts and checks each one against a knowledge source, then reports the percentage supported. It's the same move RAG faithfulness metrics make: don't grade a paragraph as one unit; grade the claims inside it.

One thing that's easy to forget: if retrieval never fetched the relevant document, nothing downstream can save you. Check context recall before blaming the generator.

## Does the model know when it doesn't know?

This is calibration. A model is well calibrated if, across all the times it says it's 80% sure, it's right about 80% of the time.

Two numbers measure it:

- **Expected Calibration Error (ECE).** Bucket predictions by confidence, then compare the average confidence in each bucket to the actual accuracy. ECE is the weighted average gap. Zero means perfectly calibrated.
- **Brier score.** The mean squared difference between predicted probability and what actually happened (1 or 0). It rewards being both calibrated and decisive.

A reliability diagram (confidence on one axis, accuracy on the other) makes this visual. A perfectly calibrated model follows the diagonal.

A few things surprised me:

- **Asking the model how confident it is doesn't work well.** "Rate your certainty from 0 to 100" gives you a number, but it's a poor signal. I wouldn't build any routing or escalation logic on it alone.
- **Alignment can make calibration worse.** The [GPT-4 technical report](https://arxiv.org/abs/2303.08774) showed the base model was well calibrated and the post-trained model noticeably less so. The training that makes a chat model pleasant to talk to can also make it more confidently wrong.
- **The old fix still works for classification-style outputs.** [Guo et al.](https://arxiv.org/abs/1706.04599) showed modern neural networks tend to be overconfident and that temperature scaling (dividing the logits by a single learned number) fixes a lot of it.
- **Calibration and usefulness are different things.** A model can be well calibrated and still not separate right answers from wrong ones well. That's discrimination, which you measure with AUROC.

The reason this matters for agents is practical. A trustworthy uncertainty signal is what lets a system abstain, hedge, or hand off to a person instead of guessing. Semantic entropy kept coming up as one of the strongest signals in what I read, which ties these two halves together nicely.

## Citations that actually support the claim

The last piece is attribution. Faithfulness asks whether the answer is grounded somewhere in the context. Attribution asks something stricter: does the specific source the answer *cites* actually support the specific claim?

Those can disagree in both directions. An answer can be grounded but cite nothing, so a reader can't check it. Or it can cite a source that doesn't say what the answer claims, which is arguably worse, because it looks verified.

The [ALCE benchmark](https://arxiv.org/abs/2305.14627) from Princeton splits citation quality into two measures, both checked automatically with an entailment model:

- **Citation recall**: is every claim backed by the passages it cites?
- **Citation precision**: does every citation actually contribute support, or is some of it padding?

The underlying definition comes from the [AIS framework](https://arxiv.org/abs/2112.12870) ("Attributable to Identified Sources"), which is worth reading just for how carefully it defines "supported".

In regulated settings, this is often the bar that matters. It's not enough for the answer to be right. Someone needs to be able to check why.

## The takeaways

- Grade claims, not paragraphs.
- Consistency across samples is a surprisingly strong signal, especially once you compare meanings instead of wording.
- A model's stated confidence and its actual reliability are different numbers, and you have to measure the gap.
- A citation is a claim too, and it needs its own check.

If you already use an LLM judge to check faithfulness, semantic entropy is worth running alongside it. They measure different things, so it's worth seeing which failures each one catches.
