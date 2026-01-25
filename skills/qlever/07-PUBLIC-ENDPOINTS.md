# QLever Public Endpoints Guide

Access QLever's public SPARQL endpoints for major knowledge graphs including Wikidata, OpenStreetMap, UniProt, and more.

---

## Overview

QLever provides free public access to major RDF datasets through:

- **Web UI**: Interactive query interface with autocompletion
- **SPARQL API**: Direct HTTP endpoint for programmatic access
- **Demos**: Pre-loaded example queries

Main portal: **https://qlever.dev/**

---

## Available Datasets

### General Knowledge

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **Wikidata** | [UI](https://qlever.dev/wikidata/) | `https://qlever.dev/api/wikidata` | 18B+ |
| **Freebase** | [UI](https://qlever.dev/freebase/) | `https://qlever.dev/api/freebase` | 3B+ |
| **DBpedia** | [UI](https://qlever.dev/dbpedia/) | `https://qlever.dev/api/dbpedia` | 1B+ |
| **YAGO 3** | [UI](https://qlever.dev/yago3/) | `https://qlever.dev/api/yago3` | 2B+ |
| **YAGO 4** | [UI](https://qlever.dev/yago4/) | `https://qlever.dev/api/yago4` | 2B+ |

### Geographic

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **OpenStreetMap** | [UI](https://qlever.dev/osm-planet/) | `https://qlever.dev/api/osm-planet` | 40B+ |
| **OpenHistoricalMap** | [UI](https://qlever.dev/ohm-planet/) | `https://qlever.dev/api/ohm-planet` | 500M+ |

### Life Sciences

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **UniProt** | [UI](https://qlever.dev/uniprot/) | `https://qlever.dev/api/uniprot` | 100B+ |
| **PubChem** | [UI](https://qlever.dev/pubchem/) | `https://qlever.dev/api/pubchem` | 150B+ |

### Academic

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **DBLP** | [UI](https://sparql.dblp.org/) | `https://sparql.dblp.org/sparql` | 390M |
| **DNB** | [UI](https://qlever.dev/dnb/) | `https://qlever.dev/api/dnb` | 600M+ |

### Media

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **Wikimedia Commons** | [UI](https://qlever.dev/wikicommons/) | `https://qlever.dev/api/wikicommons` | 5B+ |
| **IMDb** | [UI](https://qlever.dev/imdb/) | `https://qlever.dev/api/imdb` | 500M+ |

### Demo/Learning

| Dataset | UI | API Endpoint | Triples |
|---------|-----|--------------|---------|
| **Olympics** | [UI](https://qlever.dev/olympics/) | `https://qlever.dev/api/olympics` | 2M |

---

## Using the Web UI

### Features

1. **Context-Sensitive Autocompletion**
   - Press Tab or Ctrl+Space for suggestions
   - Suggests entities, predicates, and objects based on context
   - Filters by typed prefix

2. **Example Queries**
   - Each dataset includes 70+ pre-written examples
   - Click to load and execute
   - Great for learning patterns

3. **Result Visualization**
   - Table view for standard results
   - Map view for geographic data
   - Export to CSV/TSV

4. **Query Sharing**
   - URLs encode the query
   - Share direct links to queries

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Execute query |
| `Tab` | Trigger autocompletion |
| `Ctrl+Space` | Show suggestions |
| `Ctrl+/` | Toggle comment |

---

## HTTP API Usage

### Basic Query

```bash
# GET request with URL-encoded query
curl "https://qlever.dev/api/wikidata?query=SELECT%20*%20WHERE%20%7B%20%3Fs%20%3Fp%20%3Fo%20%7D%20LIMIT%2010"

# POST request (recommended for complex queries)
curl -X POST "https://qlever.dev/api/wikidata" \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/sparql-results+json" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

### Output Formats

```bash
# TSV (default, compact)
curl "https://qlever.dev/api/wikidata" \
  -H "Accept: text/tab-separated-values" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# CSV
curl "https://qlever.dev/api/wikidata" \
  -H "Accept: text/csv" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# JSON (W3C SPARQL Results)
curl "https://qlever.dev/api/wikidata" \
  -H "Accept: application/sparql-results+json" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# QLever Custom JSON
curl "https://qlever.dev/api/wikidata" \
  -H "Accept: application/qlever-results+json" \
  --data "SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Accept` | `application/sparql-results+json` | Request JSON output |
| `Content-Type` | `application/sparql-query` | Send SPARQL in body |

---

## Dataset-Specific Prefixes

### Wikidata

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>

SELECT ?item ?label
WHERE {
  ?item wdt:P31 wd:Q5 ;      # Instance of human
        rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}
LIMIT 10
```

### OpenStreetMap

```sparql
PREFIX osmnode: <https://www.openstreetmap.org/node/>
PREFIX osmway: <https://www.openstreetmap.org/way/>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#>

SELECT ?city ?name
WHERE {
  ?city osmkey:place "city" ;
        osmkey:name ?name .
}
LIMIT 10
```

### UniProt

```sparql
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX taxon: <http://purl.uniprot.org/taxonomy/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?protein ?name ?organism
WHERE {
  ?protein a up:Protein ;
           up:recommendedName/up:fullName ?name ;
           up:organism ?organism .
}
LIMIT 10
```

### DBLP

```sparql
PREFIX dblp: <https://dblp.org/rdf/schema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?paper ?title ?year
WHERE {
  ?paper a dblp:Publication ;
         dblp:title ?title ;
         dblp:yearOfPublication ?year .
  FILTER(?year >= 2023)
}
ORDER BY DESC(?year)
LIMIT 10
```

---

## Example Queries

### Wikidata: Cities by Population

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?city ?name ?population
WHERE {
  ?city wdt:P31 wd:Q515 ;           # Instance of city
        wdt:P1082 ?population ;      # Population
        rdfs:label ?name .
  FILTER(LANG(?name) = "en")
}
ORDER BY DESC(?population)
LIMIT 20
```

### OpenStreetMap: Airports with IATA Codes

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

SELECT ?airport ?name ?iata
WHERE {
  ?airport osmkey:aeroway "aerodrome" ;
           osmkey:name ?name ;
           osmkey:iata ?iata .
}
ORDER BY ?iata
LIMIT 100
```

### UniProt: Human Proteins

```sparql
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX taxon: <http://purl.uniprot.org/taxonomy/>

SELECT ?protein ?name ?gene
WHERE {
  ?protein a up:Protein ;
           up:organism taxon:9606 ;            # Human
           up:recommendedName/up:fullName ?name ;
           up:encodedBy/up:gene ?gene .
}
LIMIT 100
```

### DBLP: Papers by Author

```sparql
PREFIX dblp: <https://dblp.org/rdf/schema#>

SELECT ?paper ?title ?year
WHERE {
  ?paper dblp:authoredBy <https://dblp.org/pid/b/HannahBast> ;
         dblp:title ?title ;
         dblp:yearOfPublication ?year .
}
ORDER BY DESC(?year)
```

---

## Data Freshness

| Dataset | Update Frequency | Lag |
|---------|------------------|-----|
| Wikidata | Weekly | ~1 week |
| OpenStreetMap | Weekly | ~1-2 weeks |
| UniProt | Release-based | Varies |
| DBLP | Regular | ~1 week |
| Olympics | Static | N/A |

Check specific endpoints for dump dates.

---

## Rate Limits & Fair Use

### Guidelines

- **No hard rate limits** for reasonable usage
- **Add LIMIT** to exploratory queries
- **Avoid bulk downloads** via SPARQL (use data dumps instead)
- **Cache results** when possible

### Best Practices

```sparql
# GOOD: Limited, specific query
SELECT ?item ?label
WHERE {
  ?item wdt:P31 wd:Q515 ;
        rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}
LIMIT 100

# BAD: Unrestricted dump attempt
SELECT ?s ?p ?o
WHERE { ?s ?p ?o }  # Don't do this!
```

### For Large Data Needs

Use official data dumps instead of SPARQL:
- [Wikidata Dumps](https://dumps.wikimedia.org/wikidatawiki/)
- [OpenStreetMap Planet](https://planet.openstreetmap.org/)
- [UniProt FTP](https://ftp.uniprot.org/)

---

## Programmatic Access

### Python Example

```python
import requests

ENDPOINT = "https://qlever.dev/api/wikidata"

query = """
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT ?city ?population
WHERE {
  ?city wdt:P31 wd:Q515 ;
        wdt:P1082 ?population .
}
ORDER BY DESC(?population)
LIMIT 10
"""

response = requests.post(
    ENDPOINT,
    headers={
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json"
    },
    data=query
)

results = response.json()
for binding in results["results"]["bindings"]:
    print(f"{binding['city']['value']}: {binding['population']['value']}")
```

### JavaScript Example

```javascript
const ENDPOINT = "https://qlever.dev/api/wikidata";

const query = `
  PREFIX wd: <http://www.wikidata.org/entity/>
  PREFIX wdt: <http://www.wikidata.org/prop/direct/>

  SELECT ?city ?population
  WHERE {
    ?city wdt:P31 wd:Q515 ;
          wdt:P1082 ?population .
  }
  LIMIT 10
`;

fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/sparql-query",
    "Accept": "application/sparql-results+json"
  },
  body: query
})
.then(response => response.json())
.then(data => {
  data.results.bindings.forEach(binding => {
    console.log(`${binding.city.value}: ${binding.population.value}`);
  });
});
```

---

## Comparison: QLever vs Official Endpoints

### Wikidata

| Aspect | QLever | Official WDQS |
|--------|--------|---------------|
| Speed | 5-10x faster | Baseline |
| Success Rate | 98% | 79% |
| Query Timeout | Higher limits | 60 seconds |
| Features | Full SPARQL 1.1 | Full + Extensions |
| Rate Limits | Relaxed | Strict |

### When to Use QLever

- Performance-critical applications
- Complex analytical queries
- Batch processing
- Learning SPARQL (better errors)

### When to Use Official

- Need latest data (real-time)
- Wikidata-specific extensions
- Federation with Wikidata features

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Timeout | Add LIMIT, simplify query |
| No results | Check prefix URIs, filters |
| Slow query | Put restrictive patterns first |
| CORS error | Use server-side requests |

### Testing Connectivity

```bash
# Check if endpoint is up
curl -s "https://qlever.dev/api/wikidata?query=ASK%20%7B%7D"

# Expected: {"boolean": true}
```

---

## Resources

- **Portal**: https://qlever.dev/
- **Documentation**: https://docs.qlever.dev/
- **GitHub**: https://github.com/ad-freiburg/qlever
- **DBLP Service**: https://blog.dblp.org/2024/09/09/introducing-our-public-sparql-query-service/
