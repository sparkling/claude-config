# QLever Skill

A comprehensive skill for querying, configuring, and optimizing QLever—the high-performance open-source RDF triplestore developed by Hannah Bast's team at the University of Freiburg.

## Contents

| File | Description |
|------|-------------|
| `SKILL.md` | Main entry point with quick reference and guide router |
| `02-INSTALLATION-CLI.md` | Installation, Qleverfile configuration, CLI commands |
| `03-QUERY-PATTERNS.md` | SPARQL query forms, patterns, and examples |
| `04-TEXT-SEARCH.md` | SPARQL+Text with ql:contains-word/entity |
| `05-GEOSPARQL.md` | Spatial queries, ogc:sfContains, distance |
| `06-FEDERATION.md` | SERVICE clause, multi-endpoint queries |
| `07-PUBLIC-ENDPOINTS.md` | Demo instances, datasets, UI access |
| `08-PERFORMANCE.md` | Benchmarks, optimization, troubleshooting |

## Why QLever?

> "QLever represents the next generation of knowledge graph infrastructure—where SPARQL meets scale without compromise." — Kurt Cagle

QLever stands apart from other triplestores:

### Performance at Scale

- **100+ billion triples** on a single commodity machine
- **5-10x faster** than Blazegraph/Virtuoso on most queries
- **Sub-second response** for typical Wikidata queries
- Indexing at **1.7 million triples/second**

### Complete SPARQL 1.1

- Full query language compliance
- SPARQL Update (INSERT/DELETE)
- Federated queries (SERVICE)
- Named graphs
- Graph Store HTTP Protocol

### Unique Features

- **Text Search**: `ql:contains-word` and `ql:contains-entity` predicates
- **GeoSPARQL**: `ogc:sfContains`, `ogc:sfIntersects`, distance functions
- **Autocompletion**: Context-sensitive suggestions while typing queries
- **Visualization**: Interactive maps with millions of geometric objects
- **Query Analysis**: Live execution plans and performance insights

## Quick Start

```bash
# Install CLI
pip install qlever

# Get sample dataset
qlever setup-config olympics
qlever get-data
qlever index
qlever start

# Run a query
qlever query "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# Launch web UI
qlever ui
```

## Key Use Cases

1. **Large-Scale Knowledge Graphs**: Wikidata, UniProt, PubChem at full scale
2. **Geospatial Analysis**: OpenStreetMap with 40 billion triples
3. **Scientific Research**: Protein databases, chemical compounds
4. **Semantic Search**: Combined SPARQL + full-text queries
5. **Enterprise Knowledge Graphs**: Via QLeverize commercial support

## The QLever Ecosystem

### Open Source Core

- **QLever Engine**: C++ SPARQL processor (Apache 2.0)
- **qlever CLI**: Python command-line tool
- **qlever-ui**: Web-based query interface

### Commercial (QLeverize)

- Enterprise support and consulting
- Managed cloud deployments
- Embedded/edge solutions
- Priority features and SLAs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      QLever Engine                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Indexer    │ Query Engine │  Text Index  │ Geo Index  │
├──────────────┴──────────────┴──────────────┴────────────┤
│                  Permutation-Based Index                 │
│                  (Compressed, Memory-Mapped)             │
├─────────────────────────────────────────────────────────┤
│                   Storage (NVMe SSD)                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
├──────────────┬──────────────┬───────────────────────────┤
│  qlever CLI  │  qlever-ui   │    HTTP/SPARQL Clients    │
└──────────────┴──────────────┴───────────────────────────┘
```

## Resources

### Official

- **Documentation**: https://docs.qlever.dev/
- **GitHub**: https://github.com/ad-freiburg/qlever
- **Demo UI**: https://qlever.dev/
- **QLeverize**: https://www.qleverize.com/

### Academic Background

QLever is developed at the Chair of Algorithms and Data Structures, University of Freiburg, led by Professor Hannah Bast. Key publications:

- CIKM 2017: Original QLever paper
- CIKM 2022: Autocompletion system
- ISWC 2025: Sparqloscope benchmark

### Community

- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/QLever)
- [Wikidata WDQS Backend Discussion](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/WDQS_backend_update)
- [DBLP SPARQL Service](https://sparql.dblp.org/)

## Philosophy

This skill embodies practical wisdom from:

- **Hannah Bast & Team** — QLever creators, academic rigor meets practical performance
- **Kurt Cagle** — Enterprise knowledge graphs, AI integration patterns
- **Adrian Gschwend** — QLeverize founder, RDF-Star co-chair at W3C
- **W3C Specifications** — SPARQL 1.1, GeoSPARQL, RDF standards
