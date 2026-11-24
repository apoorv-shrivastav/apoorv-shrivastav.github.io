---
title: "When the eval becomes the reward"
description: "RLHF, DPO, GRPO and verifiable rewards, explained for people who build graders."
date: 2027-01-04
mode: professional
---

If you work on evals, you build a lot of graders: checks that look at a model's output and return a score. It's natural to think of them purely as measurement. You build the model, then you grade it.

Looking at how models are post-trained changes that picture. The same kind of grader that scores an output in an eval can reward it during training. Once that happens, the line between "evaluating a model" and "training a model" gets thin, and the quality of the grader matters a lot more.

This post is a map of how the pieces fit together, written from the eval side rather than the model-training side.

## The rough pipeline

A modern model goes through roughly these stages after pretraining:

1. **Supervised fine-tuning (SFT).** Train on examples of good responses so the model learns to follow instructions.
2. **Preference alignment.** Teach it which of two responses people prefer.
3. **Reinforcement learning on checkable tasks.** Reward it for getting verifiably correct answers on math, code and similar problems.

Each stage uses a different kind of signal, and the history of the field is mostly people finding cheaper and more reliable versions of that signal.

## From human preferences to direct optimization

**RLHF** was the original recipe, made famous by [InstructGPT](https://arxiv.org/abs/2203.02155). People compare pairs of answers and pick the better one. You train a separate *reward model* to predict those choices, then use reinforcement learning (PPO) to push the main model toward higher reward. There's also a penalty for drifting too far from the original model, which stops it from finding strange outputs that happen to fool the reward model.

**RLAIF** swaps some or all of the human judges for an AI judge. [Constitutional AI](https://arxiv.org/abs/2212.08073) is the well-known example: the model critiques and revises its own answers against a written set of principles, and those comparisons become training data. It scales far beyond what human labelers can do. The catch will sound familiar to anyone who has used LLM-as-judge: whatever biases the AI judge has get baked into the model.

**DPO** ([Direct Preference Optimization](https://arxiv.org/abs/2305.18290)) was the big simplification. The authors showed you can skip the separate reward model entirely and train directly on the preference pairs with a loss that looks a lot like classification. It's cheaper and more stable than the full RLHF loop, which is why it caught on so fast.

## Rewards you can verify

This is where post-training connects most directly to eval work.

For tasks with a checkable answer, you don't need a learned reward model at all. Run the code against the tests. Compare the math answer to the known solution. Validate the output format. Return a 1 or a 0. That's **RLVR**, reinforcement learning with verifiable rewards, a term from the [Tülu 3](https://arxiv.org/abs/2411.15124) work. [DeepSeek-R1](https://arxiv.org/abs/2501.12948) made it famous by showing that strong reasoning behaviour can emerge from this kind of training.

**GRPO**, from [DeepSeekMath](https://arxiv.org/abs/2402.03300), is the training algorithm that often goes with it. Standard PPO trains a second network to estimate how good each state is. GRPO drops that network. It generates a group of answers to the same prompt and scores each one relative to the others in its group. Answers better than the group average get pushed up; worse ones get pushed down. It's simpler and cheaper, especially for long reasoning chains.

The interesting part: a verifiable reward is the same thing as the deterministic checks that belong at the top of any eval. Unit tests, schema checks, exact-match on a tool call. A good eval check and a good reward function turn out to be close cousins.

## The catch: Goodhart's law

Once a metric becomes something you optimize, the model will find ways to score well without actually getting better. This is reward hacking, and it looks a lot like the judge biases eval people already worry about, only amplified:

- A judge that prefers longer answers produces a model that writes longer answers.
- A judge swayed by confident tone produces a model that sounds confident.
- A unit-test reward with weak tests produces code that passes weak tests.

[Gao et al.](https://arxiv.org/abs/2210.10760) measured this directly: as you optimize harder against a learned reward model, the true quality first rises, then falls, even while the reward model's score keeps climbing.

So the skill isn't just writing a grader. It's looking at a grader and asking, "if something optimized hard against this, how would it cheat?" That's a useful question for an ordinary eval too. It's how you find the gaps in your rubric before a prompt change quietly exploits them.

## Where synthetic data fits in

The last piece is where the training data comes from. A lot of it is now generated by models:

- **Self-Instruct** bootstraps thousands of instruction-and-answer pairs from a small seed set.
- **Evol-Instruct** takes those seeds and rewrites them into harder versions, adding constraints or extra reasoning steps, to build a difficulty curve.
- **Distillation** has a strong model write out answers (often with its reasoning) for a smaller model to learn from.

The lesson that came up again and again: quality beats quantity. Bad synthetic examples don't just fail to help, they add noise and contradictions. Generating is half the work; filtering is the other half. And training models repeatedly on their own unfiltered output can degrade them over generations, which researchers call [model collapse](https://www.nature.com/articles/s41586-024-07566-y).

For evals specifically, synthetic data is a good way to grow a test set: edge cases, adversarial prompts, unusual user personas. But generated test cases need checking too. A test with a wrong expected answer is worse than no test.

## The loop

Put together, it's one cycle rather than separate topics. You measure outputs. Your measurements become rewards. Models generate data to train and test the next version. Failures you find in production become new test cases and new training examples.

For anyone building evals, the takeaway is that a grader is never just a measurement. Sooner or later something optimizes against it, whether that's a training run, a prompt tweak, or a team chasing a dashboard number. Building graders that hold up under that pressure is the job.
