---
title: "Which tokens actually change the answer?"
description: "A priority order for cutting LLM cost, a one-line caching fix, and the context metrics almost nobody tracks."
date: 2026-11-16
mode: professional
---

Most cost-cutting starts in the wrong place. Someone notices the bill, asks the model for shorter answers, and saves very little. The order you tackle things in matters more than any single trick.

## The priority order

1. **Don't make the call at all.** Cache answers, route simple requests with plain code, and precompute common results.
2. **Cut the input.** In retrieval and agent workloads, the input is usually far bigger than the output.
3. **Cache the prefix.** Make the largest stable block of the prompt reusable.
4. **Use the right model for each step.** Not every step needs the biggest model.
5. **Trim the output.** The smallest lever, and where most people start.

## Prefix caching is an architecture decision

I covered how prompt caching works in [The LLM API features that matter in production](/blog/llm-api-features-in-production/). The part worth repeating: you don't bolt caching on later. You design for it.

Anything that changes from request to request (a timestamp, a user ID, a rotating instruction) breaks the cache for everything after it. So order the prompt so that the parts that change get more frequent as you go down:

```
static system instructions → tool schemas → retrieved context → conversation → current message
```

### The date trick

Models are unreliable at relative date math, so you need to tell them today's date. But if you put the date in the system prompt, the prompt changes every day and the cache goes cold.

Put the date in the latest user message instead. The model gets the same information, the prefix stays identical byte for byte, and the cache stays warm. It's a one-line change, and at volume it can be worth a real share of the bill.

## Compact objects, not words

One old technique is worth dropping: removing stop words. It comes from older keyword-based NLP, and it backfires here. Common words are single, cheap tokens. Removing them saves almost nothing and makes the text harder for the model to read.

The real savings are structural:

- Drop fields from tool results that the model never uses.
- Remove duplicate passages from retrieved content.
- Summarize old turns of the conversation.
- Trim long, wordy tool schemas.

Shrink whole objects, not individual words.

## Measure where the tokens go

Very few teams can say what share of each call goes to the system prompt, tool definitions, retrieved content, conversation history and the current message. It's worth instrumenting. It's common to discover that a big slice of every call is tool definitions the model never uses.

A few other context metrics belong on the same dashboard:

- **Retrieval quality, tracked separately from answer quality.** When an answer is wrong, you need to know whether retrieval missed or generation fumbled.
- **Cache hit rate.** Treat it as a first-class metric. If it drops, something upstream broke the stable prefix, and you'd never notice from quality numbers alone.
- **Utilization.** Is the retrieved content actually used in answers? Chunks that are never cited are pure cost.
- **Context rot.** Quality often slips as the context fills up, well before you hit the limit. Test the same tasks with the window 10%, 50% and 90% full. If quality falls off, your real limit is lower than the advertised one.

## The short version

Start at the top of the list, not the bottom. Design the prompt so the parts that change come last, and put today's date in the user message. Shrink objects, not words. And measure where your tokens go before you decide where to cut.
