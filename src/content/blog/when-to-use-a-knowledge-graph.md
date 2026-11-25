---
title: "When a knowledge graph is the right answer (and when it isn't)"
description: "Graphs answer one kind of question that tables and document search both handle badly. How to tell if your problem is that kind."
date: 2026-11-30
mode: professional
---

Tables answer "how many, how much, when". Document search answers "what does it say". Knowledge graphs answer a third kind of question: **how is X connected to Y?**

That sounds like a small variation. It isn't. Connection questions are their own class, and the other two approaches handle them poorly.

## Is your problem graph-shaped?

You need most of these, not just one or two:

1. **The relationships are the point.** If you'd draw the domain as a network on a whiteboard rather than as a table, that's the signal.
2. **Questions take several hops.** The answer requires chaining A to B to C, and no single record or document contains the whole chain.
3. **You don't know how many hops in advance.** "Anything connected within three steps" is a different question from a fixed join.
4. **The entities are well defined.** You can name the types of things and the types of relationships, and there's a shared vocabulary for them.

One more often settles it: **provenance is required.** If you need to say *which source* claimed a relationship and how strong the evidence is, a graph edge can carry that directly. An embedding can't.

## Why document search fails on multi-hop questions

This is the key mechanism. Vector search ranks passages by how similar they are to the question. But in a multi-hop question, the passages that connect the steps often don't resemble the question at all.

Say you ask about a drug. The passage that links it to the answer describes a biological pathway and never mentions the drug. Similarity to the question is simply the wrong signal for finding that middle step, so it never shows up.

A graph doesn't have this problem. Traversal follows edges, not similarity. You reach the pathway because it's *connected*, not because it reads like your question.

## Why SQL struggles too

- **Lots of sparse relationship types.** Dozens of kinds of relationships, each with few entries, means dozens of nearly empty join tables, and a schema change every time a new kind appears.
- **Paths of unknown length.** "Any connection within three hops" is one line in a graph query language like Cypher. In SQL it's recursive queries that are painful to write and worse to tune.
- **Changing schemas.** Graphs are designed to take new relationship types without a migration.

Two flavors of graph are worth knowing apart. **Property graphs** (like Neo4j, queried with Cypher) store nodes and edges that can both carry properties; they're the usual choice for applications. **RDF triple stores** (queried with SPARQL) store subject-predicate-object facts with formal semantics; they dominate where shared formal vocabularies already exist, as in much of biomedicine.

## GraphRAG in brief

The modern approach builds a graph *from* documents and then retrieves over the graph. Microsoft's [GraphRAG](https://arxiv.org/abs/2404.16130) is the reference version:

**Building it (offline, expensive):** split documents into chunks, extract entities, extract relationships, merge duplicate entities, record the source of every edge, then cluster the graph into communities and write a summary of each.

**Using it (online):** *local search* starts from the entities in the question and explores their neighborhood. *Global search* works over the community summaries, which lets it answer "what are the main themes across all these documents?", something flat retrieval can't do at all.

There's a family of related approaches: [HippoRAG](https://arxiv.org/abs/2405.14831) borrows ideas from how memory works in the brain to reach distant but relevant nodes, [LightRAG](https://arxiv.org/abs/2410.05779) aims for cheaper indexing, and [RAPTOR](https://arxiv.org/abs/2401.18059) builds a tree of summaries rather than a true graph.

The step that usually breaks is **entity resolution**: deciding that "EGFR", "epidermal growth factor receptor" and "ERBB1" are the same thing. Get that wrong and the graph is quietly wrong everywhere.

## Two places graphs clearly win

**Biomedicine.** Every condition above holds. Knowing a gene exists is worthless; knowing that a variant in it makes a tumor respond to a particular drug, except when another mutation is present, is the whole value. Real questions chain many hops: variant, gene, resistance mechanism, alternative target, drug, open trial, eligibility. The vocabularies already exist (standard ontologies for genes, diseases, drugs and literature), which removes the biggest barrier to building a graph. And provenance is essential: whether a link comes from a drug label, a large trial or a single lab study changes what anyone should do with it. The knowledge is also scattered across many specialist databases, so much of the graph's value is simply connecting them.

**Infrastructure and dependencies.** Service maps, network topology, cloud permissions, software bills of materials and data lineage. The questions are naturally multi-hop: what breaks if this fails, what could have caused this outage, what's reachable from the internet, which of our systems depend on this vulnerable library? The last one is exactly the question many organizations struggled to answer quickly when the Log4j vulnerability hit in 2021.

A useful idea from this world: **blast radius** (everything downstream of a node) and **root cause** (everything upstream) are the same traversal in opposite directions. Any domain with dependencies, from supply chains to financial exposure, gets both for the price of one graph.

## When not to use a graph

Knowing when a tool is wrong matters as much as knowing when it's right.

- **Single-hop lookups.** Document search is cheaper and faster.
- **Counting and aggregating.** Use SQL. Graphs are bad at it.
- **Dense, uniform relationships.** That's a table.
- **Constantly changing content.** Rebuilding the graph may cost more than it's worth.
- **No clear ontology.** If you can't name your node and relationship types, you're not ready. A vague graph is worse than none.
- **Entity matching you can't solve.** If duplicates can't be merged reliably, the graph will be wrong everywhere, and unlike a broken SQL query, nothing will error.

## Evaluating one

Check three layers, not just the final answer:

1. **The graph itself:** are entities merged correctly, are edges accurate against a hand-checked sample, is coverage complete? This is the layer people skip, and it quietly poisons everything downstream.
2. **Retrieval:** did it return the right subgraph and the right path?
3. **The answer:** is it faithful to the path it was given, and does every claim keep its source?

For freshness, version the graph, tie updates to changes in the source systems, and watch the count of each edge type over time. A sudden drop usually means an extraction pipeline broke.

## The graph you may already have

A data catalog, with its tables, columns, lineage, owners and metric definitions, is already a knowledge graph. Using it as context for an agent ("which table should I query, what does this column mean, what feeds it?") is graph retrieval, whether or not anyone calls it that. It's often the best place to start before building anything new.

## The short version

Graphs are for connection questions with several hops, clear entities, and a need for provenance. They have the highest build cost of the three approaches and the narrowest set of problems where they're clearly right. When they're right, nothing else works. When they're wrong, they're an expensive table.
