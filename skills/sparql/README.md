# SPARQL Skill for Claude Code

A comprehensive SPARQL 1.1 skill for querying and manipulating RDF knowledge graphs, incorporating the ontological philosophy of Kurt Cagle.

## Overview

This skill provides guidance for:
- SPARQL 1.1 query language (SELECT, CONSTRUCT, ASK, DESCRIBE)
- SPARQL UPDATE operations (INSERT, DELETE, LOAD, CLEAR)
- Named graph management and workflow patterns
- Property paths and graph traversal
- Integration with OWL, RDFS, and SHACL
- Best practices from semantic web experts

## Guides

| Guide | Purpose |
|-------|---------|
| `SKILL.md` | Entry point with essential patterns and routing |
| `01-QUERY-FUNDAMENTALS.md` | SELECT, WHERE, FILTER, BIND, VALUES |
| `02-CONSTRUCT-TRANSFORMS.md` | CONSTRUCT queries and RDF transformation |
| `03-NAMED-GRAPHS.md` | Quads, GRAPH clause, workflow patterns |
| `04-UPDATE-OPERATIONS.md` | INSERT, DELETE, LOAD, graph management |
| `10-BEST-PRACTICES.md` | Optimization, patterns, anti-patterns |

## Philosophy

This skill is informed by Kurt Cagle's work at The Ontologist and The Cagle Report:

> "Ontologists are legislators concerning the language that binds people together."

Key principles:
1. **Knowledge graphs as data hubs** - Integration, not just storage
2. **Named graphs for workflows** - State transitions without data movement
3. **SPARQL UPDATE as workflow engine** - Transactional data pipelines
4. **SHACL over OWL for validation** - Practical constraints without triple explosion
5. **Transform with CONSTRUCT** - RDF is abstract; output to any format

## Usage

When a user asks about SPARQL, the skill router in `SKILL.md` directs to the appropriate guide based on intent:

- "How do I query RDF?" → `01-QUERY-FUNDAMENTALS.md`
- "Transform data to JSON-LD" → `02-CONSTRUCT-TRANSFORMS.md`
- "Organize data with named graphs" → `03-NAMED-GRAPHS.md`
- "Update triples conditionally" → `04-UPDATE-OPERATIONS.md`
- "Optimize my SPARQL queries" → `10-BEST-PRACTICES.md`

## References

- [SPARQL 1.1 Query Language - W3C](https://www.w3.org/TR/sparql11-query/)
- [SPARQL 1.1 Update - W3C](https://www.w3.org/TR/sparql11-update/)
- [Kurt Cagle - The Ontologist](https://ontologist.substack.com/)
- [Kurt Cagle - The Cagle Report](https://thecaglereport.com/)
- [Learning SPARQL](https://learningsparql.com/)

## Version

Created: 2024-01 | SPARQL 1.1 compliant | Informed by SPARQL 1.2 working drafts
