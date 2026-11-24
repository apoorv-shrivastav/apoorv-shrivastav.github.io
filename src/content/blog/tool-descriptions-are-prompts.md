---
title: "Tool descriptions are prompts, and so are error messages"
description: "Most unreliable agents have a tool problem, not a prompt problem. How to design tools, errors and retries an agent can actually work with."
date: 2026-12-21
mode: professional
---

When an agent misbehaves, the first instinct is to open the system prompt and start adding rules. Often, that's the wrong file. A lot of what looks like "the model is unreliable" turns out to be the tool surface: descriptions that overlap, parameters the model has to guess, and errors that tell it nothing.

Tools are the agent's API to the world. Their design decides reliability at least as much as the choice of model does.

## Error messages are read by the model

The part people miss: when a tool fails, the error string goes straight back into the model's context. It becomes the instruction for what to do next.

```
✗  Error: 400 Bad Request
   The model has nothing to go on. It retries the same call, and loops.

✓  Error: date_range is longer than the 90-day maximum.
   Shorten the range, or use aggregate_history for longer periods.
   The model fixes it on the next turn.
```

Most of us write error messages for a person scanning logs. In an agent, the main reader is the model. Rewriting error strings is often the cheapest reliability win available, and it rarely happens because it doesn't feel like AI work.

## Designing the tools themselves

**One tool per meaningful action.** Wrapping a REST API one endpoint at a time gives you forty tools that all look alike. Too many narrow tools make selection hard and cost tokens on every call. Too few broad ones create huge parameter spaces the model fills in wrong. Aim for the actions a person would describe: "find a customer's recent orders", not `GET /orders` plus `GET /customers` plus a join.

**Names you can tell apart.** If you have `get_orders`, `list_orders` and `search_orders` and can't explain the difference in one sentence, the model can't either.

**Parameters that don't require thinking.**

- Use enums instead of free text wherever the options are known.
- Don't make the model compute things. Accept `"last quarter"` and parse it in code, rather than asking for a start date and an end date and hoping the arithmetic is right.
- Keep required parameters few, with sensible defaults for the rest.

**Return what the model needs, not what the API returned.** A 50-field JSON response is 50 fields of context on every call. Return structure, not prose, and include enough to self-correct: `"0 rows; filters applied: status=open, region=West"` is far more useful than `[]`.

**Count the tokens.** Every tool definition rides along on every call. A few dozen verbose schemas can add thousands of tokens per turn. At scale, teams load only the relevant subset of tools per request, which is really the routing problem again, one level down.

Anthropic's guide on [writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) goes deeper on all of this and is worth reading.

## When things break

Errors aren't all the same, and the agent needs to know which kind it's dealing with:

| Kind | Example | What to do |
|---|---|---|
| Temporary | Timeout, rate limit, 503 | Retry with backoff |
| Permanent | Permission denied, record doesn't exist | Don't retry. Say so. |
| Fixable with different input | Query too broad, range too long | Change the request and try again |
| Out of scope | A question the agent can't answer | Decline clearly, hand to a person |

The only way the model knows which row it's in is if the error message tells it. So this is the same lesson as above, from a different angle.

### Retries

- **Budget retries by cost, not just count.** Retrying an expensive query five times is a cost incident, not resilience.
- **Detect loops two ways.** The easy one is the identical call repeated. The harder and more common one is the call that changes slightly each time without getting anywhere. I wrote more about this in [Agent loops, and how they fail](/blog/agent-loops-and-how-they-fail/).
- **Cap the attempts,** and when you hit the cap, return what you have with a clear note, instead of spinning.

### Side effects

Anything that changes the world (creating a record, sending a message, kicking off a job) needs extra care.

- **Make it safe to retry,** or mark it clearly as not retryable so the framework doesn't retry it for you.
- **Know how to undo it.** If step 3 of 5 fails, what reverses steps 1 and 2? Distributed systems call this the saga pattern, and most agent frameworks don't handle it for you.
- **If you can't undo it, do it last.** Stage all side effects and commit them together at the end, so a failure halfway through leaves nothing behind.

### Partial answers

A partial answer with an honest caveat usually beats no answer. A partial answer presented as complete is the worst outcome of all. Make the difference visible in the output itself, not just in your intentions.

## The short version

Before touching the prompt, look at the tools. Name them so they're easy to tell apart, keep parameters simple, return only what's useful, and write every error message as if it were an instruction, because to the model it is.
