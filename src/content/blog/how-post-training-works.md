---
title: "How a base model becomes an assistant"
description: "A walk through post-training: fine-tuning on examples, reward models, reinforcement learning, the leash that keeps it honest, and where it's heading."
date: 2026-12-07
mode: professional
---

A freshly pretrained language model isn't an assistant. It's a next-token predictor. Give it "The president of the United States in 2006 was" and it may well carry on into a paragraph of trivia instead of just answering. It continues text the way text tends to continue.

Everything that turns that into something you can talk to happens in **post-training**. It used to be described as a final polish. It's now one of the most active parts of the whole field.

## Unlocking, not adding

A useful way to think about post-training is that it mostly *draws out* what the model already learned during pretraining, rather than pouring in new knowledge.

I think of it like a Formula 1 car. Pretraining builds the chassis and the engine, which is where the raw power comes from. Post-training is the aerodynamics, suspension and steering that let that power actually get around a track.

There's a long-running debate about how deep this goes. The [LIMA](https://arxiv.org/abs/2305.11206) paper argued for a "superficial alignment" view: almost all knowledge comes from pretraining, and alignment mostly teaches format and style. That's partly right. But reasoning-focused training has shown post-training can also change *how* a model uses what it knows, getting it to work through problems in ways a base model rarely does on its own. "Unlocking" undersells it a little, but it's the right starting point.

## Step 1: Learn the format from examples

**Supervised fine-tuning (SFT)** comes first. You train the model on curated conversations, often somewhere between tens of thousands and around a million examples, showing what a good assistant reply looks like.

Two details are worth knowing:

- **Chat templates.** Every conversation is flattened into one long sequence with special tokens marking who's speaking: system instructions, the user's message, then a marker that says "the assistant's turn starts here". That final marker is the cue to start answering. Users never see this structure, but the model always does.
- **Prompt masking.** You want the model to learn to write good *answers*, not to predict the user's questions. So the prompt tokens are excluded from the loss. In PyTorch-based training code that's usually done by labeling them `-100`, the value the loss function is set to ignore.

SFT's limit is obvious once you say it out loud: it can only teach what someone wrote an example for. The space of possible requests is effectively infinite, and examples alone can't cover it.

## Step 2: Train a critic

To judge answers nobody wrote an example for, you train a **reward model**. It's usually the same kind of network with the final layer swapped: instead of predicting the next token, it outputs a single score.

The trick is in how you collect the data. People are bad at giving an answer an absolute score ("is this a 6 or a 7?") but much more consistent at saying which of two answers is better. So reward models are usually trained on **pairwise comparisons**, using the Bradley-Terry model to turn lots of "A beats B" judgments into a score.

There are a few flavors:

- **Outcome reward models** judge only the final result. That works well for math and code, where the answer is checkably right or wrong. The weakness: a solution with nine good steps and one bad one gets no credit.
- **Process reward models** score each reasoning step separately, so good steps get credit even if a later one fails. OpenAI's [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) is the well-known study of this.
- **LLM judges** use a general model as the evaluator. They're cheaper to set up, though purpose-built reward models still matter when you need to score huge numbers of answers.

Whichever you use, a reward model is a *stand-in* for what people want, not the real thing. That matters a lot in step 4.

## Step 3: Practice against the critic

Now the reinforcement learning loop: the model writes an answer, the reward model scores it, and an optimizer nudges the model toward higher scores. Repeat, many times.

It's a slightly unusual kind of RL. In most RL problems your action changes the world, and the next situation depends on it. Here the prompt doesn't change based on the answer: you get one prompt, one response, one score. It's closer to a one-shot bandit problem than a game.

The algorithms:

- **PPO** trained the original [InstructGPT](https://arxiv.org/abs/2203.02155) models behind ChatGPT. It works, but it's heavy: you need four models in memory at once, the model being trained, a frozen reference copy, the reward model, and a value model that estimates how good each state is to keep training stable.
- **GRPO**, from [DeepSeekMath](https://arxiv.org/abs/2402.03300), drops the value model. For each prompt it generates a small group of answers, scores them all, and judges each one against the group's average. It's grading on a curve. Less memory, and often just as stable.
- **REINFORCE-style methods** are another simpler alternative. [Back to Basics](https://arxiv.org/abs/2402.14740) showed that much of PPO's machinery may be unnecessary for this setting.

## Step 4: Keep it on a leash

Optimize hard against an imperfect critic and the model finds the critic's blind spots. That's **reward hacking**. It might overuse a phrase the reward model happens to like. It might learn that agreeing with people scores well, and start flattering users and going along with false premises. That's sycophancy, and it's a direct result of rewarding approval. [Gao et al.](https://arxiv.org/abs/2210.10760) showed the general pattern: push harder against a learned reward and true quality rises, then falls, even as the reward keeps climbing.

The standard guardrail is a **KL penalty**. Keep a frozen copy of the model from before RL, and penalize the model being trained whenever its word choices drift too far from that reference. It's a leash: enough slack to improve, not enough to run off chasing loopholes.

## Step 5: Replace the critic with a checker

Human preferences are a limited signal. People make mistakes, get tired and disagree, and they can't judge an unsolved math problem or a large program by reading it.

**Reinforcement learning with verifiable rewards (RLVR)**, a term from [Tülu 3](https://arxiv.org/abs/2411.15124), skips the learned critic wherever there's an objective check. Does the code compile and pass the tests? Is the answer to the math problem correct? A checker like that can run millions of times with no person in the loop, and it's much harder to fool.

This is what powers the reasoning models. [DeepSeek-R1](https://arxiv.org/abs/2501.12948) showed that long, self-correcting chains of thought, where the model tries an approach, notices a mistake and backs up, can emerge from this kind of training. Post-training used to take a small fraction of the compute spent on pretraining. With reasoning RL, labs are now deliberately scaling it up.

## Step 6: Train specialists, then combine them

Instead of training one model to be great at everything at once, a growing approach is to train **specialists** from the same base (one for code, one for math, one for conversation) and then merge them into a single model. Two common ways:

- **Weight averaging:** blend the specialists' parameter changes directly.
- **Distillation:** train one student model to imitate the specialists. In *on-policy* distillation the student learns from its own attempts, corrected by the teachers, which tends to transfer behavior better. [Agarwal et al.](https://arxiv.org/abs/2306.13649) is a good introduction.

## The whole pipeline

Put together:

1. **SFT** teaches the format of being an assistant.
2. **Reward models** and **checkers** provide a signal for "better".
3. **Reinforcement learning** optimizes toward that signal.
4. A **KL penalty** stops the model from gaming it.
5. **Verifiable rewards** and **specialist merging** push the whole thing further.

## The open question

If post-training mostly unlocks what's already in the pretrained weights, then an obvious question follows: what else is in there that we just haven't found the right way to draw out yet? Finding reward signals that bring out those abilities without rewarding the wrong behavior is, as far as I can tell, the central problem of this part of the field.
