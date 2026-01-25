---
name: qlever
description: Query, configure, and optimize QLever—the high-performance open-source RDF triplestore. Covers SPARQL queries, GeoSPARQL, text search, CLI operations, and public endpoints. Informed by Kurt Cagle's semantic web expertise.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch
---

# QLever Skill

Master QLever, the high-performance open-source RDF graph database developed by Hannah Bast's team at the University of Freiburg. QLever handles hundreds of billions of triples on commodity hardware, implements full SPARQL 1.1, and offers unique features for text search, GeoSPARQL, and context-sensitive autocompletion.

---

## Core Philosophy (Cagle's Perspective)

> "QLever represents the next generation of knowledge graph infrastructure—where SPARQL meets scale without compromise."

**Why QLever Matters:**

1. **Scale without sacrifice**: Handle Wikidata's 18+ billion triples on a single machine with sub-second query times
2. **SPARQL 1.1 complete**: Full standard compliance including federated queries, named graphs, and SPARQL Update
3. **Beyond plain SPARQL**: Integrated text search (`ql:contains-word`, `ql:contains-entity`) and GeoSPARQL support
4. **Developer experience**: Context-sensitive autocompletion makes query writing accessible to non-experts
5. **Open source excellence**: Apache 2.0 licensed, active development, strong academic foundation

---

## Guide Router

Load **only ONE guide** per request. Match user intent to the most specific keywords:

| User Intent | Load Guide | Content |
|-------------|------------|---------|
| Installation, CLI, Qleverfile setup | 02-INSTALLATION-CLI.md | pip install, docker, configuration |
| Basic SPARQL queries, SELECT, CONSTRUCT | 03-QUERY-PATTERNS.md | Query forms, patterns, examples |
| Text search, ql:contains-word, full-text | 04-TEXT-SEARCH.md | SPARQL+Text predicates |
| GeoSPARQL, spatial queries, OSM data | 05-GEOSPARQL.md | ogc:sfContains, sfIntersects |
| Federated queries, SERVICE, Wikidata | 06-FEDERATION.md | Multi-endpoint queries |
| Public endpoints, demos, datasets | 07-PUBLIC-ENDPOINTS.md | Wikidata, OSM, UniProt |
| Performance, optimization, benchmarks | 08-PERFORMANCE.md | Tuning, comparisons |
| HTTP API, JSON results, curl | 09-HTTP-API.md | REST endpoints, formats |
| SPARQL Update, INSERT, DELETE | 10-UPDATES.md | Data modification |

**Default behavior**: If intent is unclear, start with this entry point's quick reference.

---

## QLever Quick Reference

### What is QLever?

QLever (pronounced "clever") is:

- **Graph database**: Implements RDF and SPARQL standards
- **High-performance**: 5-10x faster than Blazegraph/Virtuoso on most queries
- **Scalable**: Handles 100+ billion triples, tested to 1 trillion
- **Feature-rich**: Text search, GeoSPARQL, autocompletion, live query analysis
- **Open source**: Apache 2.0 license, active development

### Key Capabilities

| Feature | Description |
|---------|-------------|
| SPARQL 1.1 | Full compliance including UPDATE, federated queries, named graphs |
| Text Search | `ql:contains-word`, `ql:contains-entity` for combined semantic+text queries |
| GeoSPARQL | `ogc:sfContains`, `ogc:sfIntersects`, distance calculations |
| Autocompletion | Context-sensitive suggestions for entities, predicates, objects |
| Visualization | Map rendering of millions of geometric objects |
| Query Analysis | Live execution plans and performance insights |

---

## Installation

### Quick Start with pip

```bash
# Install qlever CLI (recommended: use pipx or uv)
pip install qlever
# or
pipx install qlever
# or
uv tool install qlever

# Get a preconfigured dataset
qlever setup-config olympics
qlever get-data
qlever index
qlever start

# Test with a query
qlever query "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# Launch the web UI
qlever ui
```

### Available Configurations

```bash
# List available preconfigured datasets
qlever setup-config --list

# Popular options:
qlever setup-config wikidata      # Complete Wikidata (18B+ triples)
qlever setup-config osm-planet    # OpenStreetMap (40B+ triples)
qlever setup-config olympics      # Small demo (2M triples)
qlever setup-config dblp          # Computer science bibliography
qlever setup-config uniprot       # Protein database
```

---

## The Qleverfile

All QLever operations are controlled by a single configuration file called `Qleverfile`:

```ini
# Example Qleverfile for custom dataset
[data]
NAME = my-knowledge-graph
GET_DATA_CMD = curl -L -o data.ttl https://example.org/data.ttl
FORMAT = turtle

[index]
INPUT_FILES = data.ttl
SETTINGS_JSON = {"prefixes": {"": "http://example.org/"}}

[server]
PORT = 7001
MEMORY_FOR_QUERIES = 10G
CACHE_MAX_SIZE = 5G

[ui]
UI_PORT = 7000
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `qlever setup-config <name>` | Fetch preconfigured Qleverfile |
| `qlever get-data` | Download dataset |
| `qlever index` | Build index structures |
| `qlever start` | Start SPARQL server |
| `qlever stop` | Stop server |
| `qlever query "<sparql>"` | Execute query |
| `qlever ui` | Launch web interface |
| `qlever status` | Show server status |
| `qlever log` | View server logs |
| `qlever --show` | Preview command without executing |

---

## SPARQL Query Examples

### Basic Queries

```sparql
# Find all types of entities
SELECT ?type (COUNT(?s) AS ?count)
WHERE { ?s a ?type }
GROUP BY ?type
ORDER BY DESC(?count)
LIMIT 20

# Get entity with all properties
SELECT ?predicate ?object
WHERE { <http://example.org/entity1> ?predicate ?object }

# Find entities by label
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?entity ?label
WHERE {
  ?entity rdfs:label ?label .
  FILTER (CONTAINS(LCASE(STR(?label)), "example"))
}
LIMIT 100
```

### QLever Text Search

```sparql
# Find entities mentioned with specific words
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>

SELECT ?entity ?text (COUNT(?text) AS ?mentions)
WHERE {
  ?text ql:contains-entity ?entity .
  ?text ql:contains-word "artificial intelligence" .
}
GROUP BY ?entity ?text
ORDER BY DESC(?mentions)
LIMIT 20

# Wildcard text search
SELECT ?entity ?text
WHERE {
  ?text ql:contains-entity ?entity .
  ?text ql:contains-word "machine learn*" .  # Matches learning, learns, etc.
}
```

### GeoSPARQL Queries

```sparql
# Find all elements within a geographic region (e.g., France)
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

SELECT ?element ?name
WHERE {
  osmrel:2202162 ogc:sfContains ?element .  # France relation ID
  ?element osmkey:railway "station" ;
           osmkey:name ?name .
}
LIMIT 100

# Calculate distance between points
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>

SELECT ?place1 ?place2 ?distance
WHERE {
  ?place1 geo:hasGeometry/geo:asWKT ?geom1 .
  ?place2 geo:hasGeometry/geo:asWKT ?geom2 .
  BIND(geof:distance(?geom1, ?geom2, <http://www.opengis.net/def/uom/OGC/1.0/kilometre>) AS ?distance)
  FILTER(?distance < 10)
}
```

---

## HTTP API

### Query Endpoint

```bash
# Basic query (TSV output)
curl -s "https://qlever.dev/api/wikidata" \
  -H "Accept: text/tab-separated-values" \
  -H "Content-Type: application/sparql-query" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# JSON output (SPARQL Results JSON)
curl -s "https://qlever.dev/api/wikidata" \
  -H "Accept: application/sparql-results+json" \
  -H "Content-Type: application/sparql-query" \
  --data "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"

# QLever custom JSON format
curl -s "https://qlever.dev/api/wikidata" \
  -H "Accept: application/qlever-results+json" \
  -H "Content-Type: application/sparql-query" \
  --data "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
```

### Supported Media Types

| Accept Header | Format |
|---------------|--------|
| `text/csv` | CSV |
| `text/tab-separated-values` | TSV |
| `application/sparql-results+json` | W3C SPARQL JSON |
| `application/qlever-results+json` | QLever custom JSON |
| `application/sparql-results+xml` | SPARQL XML |

---

## Public Endpoints

### QLever Demo Instances

| Dataset | Endpoint | Triples |
|---------|----------|---------|
| Wikidata | https://qlever.dev/api/wikidata | 18B+ |
| OpenStreetMap | https://qlever.dev/api/osm-planet | 40B+ |
| UniProt | https://qlever.dev/api/uniprot | 100B+ |
| PubChem | https://qlever.dev/api/pubchem | 150B+ |
| DBLP | https://sparql.dblp.org/sparql | 390M |
| DBpedia | https://qlever.dev/api/dbpedia | 1B+ |
| Freebase | https://qlever.dev/api/freebase | 3B+ |

### Accessing Demo UI

Visit https://qlever.dev/ for interactive query interfaces with:
- Context-sensitive autocompletion
- Example queries (70+ per dataset)
- Map visualization for geographic data
- Result download (CSV/TSV)

---

## Performance Benchmarks

### QLever vs Other Engines (DBLP Dataset, 390M Triples)

| Engine | Index Time | Index Size | Avg Query Time |
|--------|------------|------------|----------------|
| **QLever** | 231s | 8 GB | **0.7s** |
| Virtuoso | 561s | 13 GB | 2.2s |
| GraphDB | 1,066s | 28 GB | 16s |
| Blazegraph | 6,326s | 67 GB | 4.3s |
| Apache Jena | 2,392s | 42 GB | varies |

### Wikidata Benchmark (298 queries)

| Metric | QLever | Official WDQS | Virtuoso |
|--------|--------|---------------|----------|
| Success Rate | **98%** | 79% | 89% |
| Queries <1s | **78%** | 36% | 54% |
| Avg Time | **1.38s** | 6.98s | 4.11s |
| Median Time | **0.24s** | 2.47s | 0.74s |

---

## QLeverize (Enterprise)

[QLeverize](https://www.qleverize.com/) provides commercial support from the QLever team:

| Tier | Features |
|------|----------|
| **Community** | Free, open source, GitHub Issues support |
| **Standard** | Priority support, private issue tracking, QA binaries |
| **Enterprise** | 24/7 support, SLAs, priority features, managed hosting |

Services include:
- Enterprise consulting and query optimization
- Managed cloud deployments (Azure/AWS)
- Embedded/edge solutions for automotive, medical, IoT
- Pre-loaded datasets (Wikidata, UniProt, PubChem, OSM)

---

## Common Patterns

### Wikidata Query

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Find all universities with founding date
SELECT ?university ?name ?founded
WHERE {
  ?university wdt:P31 wd:Q3918 ;      # instance of university
              rdfs:label ?name ;
              wdt:P571 ?founded .      # inception date
  FILTER (LANG(?name) = "en")
}
ORDER BY ?founded
LIMIT 100
```

### OpenStreetMap Query

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

# Find all cafes with their locations
SELECT ?cafe ?name ?geometry
WHERE {
  ?cafe osmkey:amenity "cafe" ;
        osmkey:name ?name ;
        geo:hasGeometry/geo:asWKT ?geometry .
}
LIMIT 100
```

### Federated Query

```sparql
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?item ?itemLabel ?osmElement
WHERE {
  # Local OSM data
  ?osmElement osmkey:wikidata ?wikidataId .

  # Federated query to Wikidata
  SERVICE <https://query.wikidata.org/sparql> {
    ?item wdt:P31 wd:Q515 ;       # instance of city
          rdfs:label ?itemLabel .
    FILTER (LANG(?itemLabel) = "en")
  }
  FILTER (STR(?item) = ?wikidataId)
}
LIMIT 50
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Index fails | Check disk space, increase memory in Qleverfile |
| Query timeout | Add LIMIT, simplify patterns, check index |
| Port in use | Change PORT in Qleverfile or `qlever stop` first |
| Docker permission denied | Run with `sudo` or add user to docker group |

### Debugging

```bash
# Show what command would execute
qlever index --show

# Check server status
qlever status

# View logs
qlever log

# Test with simple query
qlever query "SELECT (COUNT(*) AS ?count) WHERE { ?s ?p ?o }"
```

---

## Resources

### Official

- **Documentation**: https://docs.qlever.dev/
- **GitHub**: https://github.com/ad-freiburg/qlever
- **Public Demos**: https://qlever.dev/
- **PyPI**: https://pypi.org/project/qlever/
- **QLeverize**: https://www.qleverize.com/

### Academic

- [QLever: A Query Engine for Efficient SPARQL+Text Search](https://dl.acm.org/doi/10.1145/3132847.3132921) (CIKM 2017)
- [Efficient SPARQL Autocompletion via SPARQL](https://arxiv.org/abs/2104.14595) (CIKM 2022)
- [Sparqloscope Benchmark](https://link.springer.com/chapter/10.1007/978-3-032-09530-5_2) (ISWC 2025)

### Community

- [Hannah Bast's Research Group](https://ad.informatik.uni-freiburg.de/staff/bast)
- [QLever Wiki (OpenStreetMap)](https://wiki.openstreetmap.org/wiki/QLever)
- [DBLP SPARQL Service](https://blog.dblp.org/2024/09/09/introducing-our-public-sparql-query-service/)

### Kurt Cagle's Work

- [The Ontologist](https://ontologist.substack.com/) - Substack newsletter
- [The Cagle Report](https://thecaglereport.com/) - Enterprise data and AI
- [Why SPARQL Is Poised To Set the World on Fire](https://www.linkedin.com/pulse/why-sparql-poised-set-world-fire-kurt-cagle) - LinkedIn
