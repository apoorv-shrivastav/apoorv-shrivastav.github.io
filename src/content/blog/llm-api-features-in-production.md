---
title: "The LLM API features that matter in production"
description: "Tool calls, structured outputs, streaming and prompt caching: what each one does, and the gotchas that show up once real users arrive."
date: 2026-11-30
mode: professional
---

Getting a model to answer a question takes one API call. Getting it to do that reliably, quickly and cheaply for thousands of people a day comes down to four features that every major provider now offers in some form: tool calls, structured outputs, streaming and prompt caching.

None of them are hard to turn on. Each one has a gotcha that tends to show up only after launch.

## Tool calls: the model asks, your code acts

Tool use is simpler than it sounds. You describe a set of functions to the model: a name, a sentence on what it does, and a JSON schema for its arguments. Instead of answering in prose, the model can reply with "call `search_orders` with these arguments". Your code runs the function, sends the result back, and the model carries on. Repeat until it gives a final answer.

That loop is the core of every agent. Three things are worth knowing:

- **The model can ask for several tools at once.** Most current models support parallel tool calls, which saves round trips when the calls don't depend on each other.
- **Picking the tool is the easy part.** The common failure is the right tool with the wrong arguments: a date range off by a month, a filter on the wrong field. Validate arguments before you execute them.
- **Always set a stop condition.** A maximum number of steps, or a budget, or both. Without one, a confused model will happily call tools forever.

## Structured outputs: three levels of strictness

When code is going to read the model's output, "usually valid JSON" isn't good enough. Providers offer roughly three levels of help:

1. **JSON mode.** You're guaranteed valid JSON, but not JSON in *your* shape. Fields can be missing or renamed.
2. **Schema-constrained output.** The provider forces the output to match a JSON schema you supply, often by restricting which tokens the model is allowed to produce. Valid and on-schema.
3. **Extraction through a tool call.** Define the shape you want as a tool's arguments, and read the arguments back. Works on nearly every provider.

Whichever you use, validate the result in your own code too (Pydantic in Python, Zod in TypeScript) and have a plan for when validation fails, usually one retry with the error message included. And remember that a perfectly shaped object can still be wrong. Schema checks tell you the format is right, not the content.

## Streaming: time to first token is what people feel

Without streaming, the user stares at a spinner until the whole response is done. With streaming (usually over Server-Sent Events), words start appearing almost immediately. A ten-second answer that starts in half a second feels fast. The same answer delivered all at once after ten seconds feels broken.

The metric to watch is **time to first token**, not total latency.

Streaming also helps agents: you can show "searching orders…" while a tool runs, so a long multi-step task looks like progress instead of a hang. Some SDKs can even stream structured objects, filling in fields as they arrive.

The cost is complexity. Errors can now happen halfway through a response, after you've already shown half an answer. Decide up front what the user sees when that happens.

## Prompt caching: the biggest lever most apps ignore

This is the one I'd learn first.

Before a model writes anything, it has to process your entire prompt. For a long system prompt, a dozen tool definitions and a few retrieved documents, that processing is a big share of both the cost and the wait. Prompt caching lets the provider save that work for the beginning of the prompt (the *prefix*) and reuse it on the next request that starts the same way. The model still writes a fresh answer every time. It just skips re-reading the part it has already seen.

The savings are real. On Anthropic's API, for example, reading from the cache costs a tenth of the normal input price on most models. Writing to the cache costs a bit more than normal (25% extra for the five-minute cache, double for the one-hour option), so it pays off as soon as a prefix gets reused once or twice. OpenAI and Google offer their own versions, some fully automatic, with different discounts and rules. Prices change, so check the current docs before planning around exact numbers: [Anthropic](https://docs.claude.com/en/docs/build-with-claude/prompt-caching), [OpenAI](https://platform.openai.com/docs/guides/prompt-caching), [Google](https://ai.google.dev/gemini-api/docs/caching).

Latency improves too, and the longer the cached prefix, the bigger the improvement.

### The rules that make or break it

- **It's an exact prefix match.** Everything up to the cache point has to be identical, byte for byte.
- **Put stable things first.** System prompt, tool definitions, examples and long reference documents go at the top. The user's message goes at the end.
- **One dynamic value ruins it.** A timestamp, a request ID or a user's name in the system prompt makes every prefix unique, and your hit rate drops to zero. This is the most common way caching silently stops working.
- **Tool definitions count.** Adding, removing or reordering a tool changes the prefix and invalidates the cache.
- **Measure the hit rate.** Providers report cached tokens in the response. If you never look, you won't notice when a harmless-looking change turns caching off.

Some teams add a second layer on top: a *semantic cache* that returns a stored answer when a new question is close enough to one already answered. That saves the whole call, but it can return a stale or subtly wrong answer, so it fits FAQ-style traffic better than anything personalized.

## Comparing providers honestly

If you use more than one provider, a few comparisons trip people up:

- **Tokens aren't the same size everywhere.** The same text can turn into noticeably different token counts on different models, so a lower price per token doesn't always mean a cheaper request. Compare cost per task, measured with each provider's own token counter.
- **Features don't line up exactly.** Caching rules, batch discounts, how strict structured outputs are, and which built-in tools exist all differ. They can even differ for the same model depending on whether you call the provider directly or through a cloud platform.
- **Every family has a cheap tier and an expensive tier,** often far apart in price. Sending easy requests to the cheap model is usually the biggest cost win after caching.
- **Reasoning modes trade time for quality.** A model that "thinks" first can be much better on hard problems and much slower on easy ones.

## The short version

Validate tool arguments and always set a step limit. Validate structured output even when the provider promises a schema. Stream, and measure time to first token. Put stable content at the front of your prompts, keep anything dynamic out of the prefix, and check your cache hit rate. None of it is exotic, and together it's often the difference between a demo and something you can afford to run.
