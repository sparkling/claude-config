# SPARQL & Semantic Web Skill

A comprehensive skill for writing, analyzing, and optimizing SPARQL queries for knowledge graphs. Informed by Kurt Cagle's ontologist perspective and grounded in W3C specifications.

## Contents

| File | Description |
|------|-------------|
| `SKILL.md` | Main entry point with quick reference and guide router |
| `02-QUERY-PATTERNS.md` | SELECT, CONSTRUCT, ASK, DESCRIBE patterns |
| `03-PROPERTY-PATHS.md` | Path operators and recursive traversal |
| `04-UPDATE-OPERATIONS.md` | INSERT, DELETE, LOAD, graph management |
| `06-SHACL-INTEGRATION.md` | Shapes, validation, SPARQL constraints |
| `07-SERIALIZATION.md` | Turtle, JSON-LD, N-Triples, format conversion |
| `09-AI-INTEGRATION.md` | LLM patterns, context-free queries, RAG |
| `10-FEDERATION.md` | SERVICE, SPARQL-Anything, remote endpoints |
| `11-OPTIMIZATION.md` | Performance tuning and debugging |

## Philosophy

> "SPARQL and SHACL are the twin pillars of modern knowledge graph work. OWL's complexity fades; shapes and queries remain." — Kurt Cagle

This skill embodies practical wisdom from:

- **Kurt Cagle** (The Ontologist, The Cagle Report) — Enterprise knowledge graphs, AI integration
- **Bob DuCharme** (Learning SPARQL) — Query patterns, efficiency, debugging
- **Allemang & Hendler** (Semantic Web for the Working Ontologist) — Modeling principles
- **W3C Specifications** — Authoritative syntax and semantics

## Key Concepts

### The Thirty-Table Threshold
Knowledge graphs outperform relational databases once you exceed ~30 interconnected tables.

### Messenger vs Canonical Models
Design ontologies considering both internal storage efficiency and external data exchange.

### SHACL as SPARQL Wrapper
"Learn SPARQL. SHACL can be thought of as a dedicated wrapper around SPARQL queries and filters."

## Quick Start

```sparql
PREFIX ex: <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?person ?name ?email
WHERE {
  ?person a ex:Person ;
          rdfs:label ?name .
  OPTIONAL { ?person ex:email ?email }
  FILTER (lang(?name) = "en")
}
ORDER BY ?name
LIMIT 100
```

## Resources

### W3C Specifications
- [SPARQL 1.1 Query](https://www.w3.org/TR/sparql11-query/)
- [SPARQL 1.1 Update](https://www.w3.org/TR/sparql11-update/)
- [RDF 1.1 Turtle](https://www.w3.org/TR/turtle/)
- [SHACL](https://www.w3.org/TR/shacl/)
- [OWL 2](https://www.w3.org/TR/owl2-overview/)

### Books
- *Learning SPARQL* by Bob DuCharme (O'Reilly)
- *Semantic Web for the Working Ontologist* by Allemang, Hendler, Gandon

### Kurt Cagle's Work
- [The Ontologist](https://ontologist.substack.com/) — Substack newsletter
- [The Cagle Report](https://thecaglereport.com/) — Enterprise data and AI
