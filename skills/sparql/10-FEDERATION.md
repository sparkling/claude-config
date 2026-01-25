# Federated Queries and Data Integration

Query across multiple SPARQL endpoints and integrate diverse data sources.

---

## SPARQL 1.1 Federation

### SERVICE Keyword

Delegate query execution to remote endpoints:

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dbpedia: <http://dbpedia.org/resource/>
PREFIX dbo: <http://dbpedia.org/ontology/>

# Query local data enriched with DBpedia
SELECT ?person ?name ?birthPlace ?birthPlaceLabel
WHERE {
  # Local data
  ?person a ex:Author ;
          ex:dbpediaLink ?dbpediaUri .

  # Remote DBpedia query
  SERVICE <http://dbpedia.org/sparql> {
    ?dbpediaUri dbo:birthPlace ?birthPlace .
    ?birthPlace rdfs:label ?birthPlaceLabel .
    FILTER (lang(?birthPlaceLabel) = "en")
  }
}
```

### Multiple Services

```sparql
# Combine data from multiple endpoints
SELECT ?entity ?localLabel ?wikidataLabel
WHERE {
  # Local endpoint
  ?entity rdfs:label ?localLabel .

  # Wikidata
  SERVICE <https://query.wikidata.org/sparql> {
    ?entity rdfs:label ?wikidataLabel .
    FILTER (lang(?wikidataLabel) = "en")
  }
}
```

### SERVICE SILENT

Continue execution even if remote fails:

```sparql
SELECT ?item ?localData ?remoteData
WHERE {
  ?item ex:id ?localData .

  # Won't fail query if endpoint is down
  OPTIONAL {
    SERVICE SILENT <http://maybe-down.example.org/sparql> {
      ?item ex:extra ?remoteData .
    }
  }
}
```

### Pushing Filters to Remote

```sparql
# Efficient: Filter pushed to remote endpoint
SELECT ?person ?abstract
WHERE {
  VALUES ?person { dbpedia:Kurt_Cagle dbpedia:Tim_Berners-Lee }

  SERVICE <http://dbpedia.org/sparql> {
    ?person dbo:abstract ?abstract .
    FILTER (lang(?abstract) = "en")
  }
}

# Less efficient: Filter evaluated locally
SELECT ?person ?abstract
WHERE {
  SERVICE <http://dbpedia.org/sparql> {
    ?person a dbo:Person ;
            dbo:abstract ?abstract .
  }
  FILTER (lang(?abstract) = "en")  # Local filter
}
```

---

## Common Public Endpoints

| Endpoint | URL | Content |
|----------|-----|---------|
| **Wikidata** | `https://query.wikidata.org/sparql` | Structured Wikipedia data |
| **DBpedia** | `http://dbpedia.org/sparql` | Wikipedia extractions |
| **UniProt** | `https://sparql.uniprot.org/sparql` | Protein data |
| **LinkedGeoData** | `http://linkedgeodata.org/sparql` | OpenStreetMap as RDF |
| **Getty** | `http://vocab.getty.edu/sparql` | Art vocabularies |

### Wikidata Example

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Find knowledge graph tools
SELECT ?item ?itemLabel ?website
WHERE {
  SERVICE <https://query.wikidata.org/sparql> {
    ?item wdt:P31 wd:Q7397 .  # Instance of: software
    ?item wdt:P366 wd:Q33002955 .  # Use: knowledge graph
    OPTIONAL { ?item wdt:P856 ?website }
    ?item rdfs:label ?itemLabel .
    FILTER (lang(?itemLabel) = "en")
  }
}
LIMIT 20
```

### DBpedia Example

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>

# Find semantic web researchers
SELECT ?person ?name ?affiliation
WHERE {
  SERVICE <http://dbpedia.org/sparql> {
    ?person dbo:field dbr:Semantic_Web ;
            foaf:name ?name .
    OPTIONAL { ?person dbo:affiliation ?affiliation }
  }
}
LIMIT 50
```

---

## SPARQL-Anything

> "A game changer for knowledge graphs" — Kurt Cagle

SPARQL-Anything enables querying non-RDF data sources using SPARQL.

### Supported Formats

- JSON, XML, CSV, HTML
- YAML, Markdown
- Excel, Word documents
- ZIP/TAR archives
- Binary files (EXIF extraction)
- Text with regex patterns

### Basic Usage

```sparql
PREFIX xyz: <http://sparql.xyz/facade-x/data/>
PREFIX fx: <http://sparql.xyz/facade-x/ns/>

# Query a JSON file
SELECT ?name ?email
WHERE {
  SERVICE <x-sparql-anything:location=data.json> {
    ?root xyz:users ?userList .
    ?userList fx:anySlot ?user .
    ?user xyz:name ?name ;
          xyz:email ?email .
  }
}

# Query a CSV file
SELECT ?column1 ?column2
WHERE {
  SERVICE <x-sparql-anything:location=data.csv,csv.headers=true> {
    ?row xyz:Column1 ?column1 ;
         xyz:Column2 ?column2 .
  }
}
```

### Remote Data Sources

```sparql
# Query remote JSON API
SELECT ?title ?author
WHERE {
  SERVICE <x-sparql-anything:location=https://api.example.org/books.json> {
    ?root fx:anySlot ?book .
    ?book xyz:title ?title ;
          xyz:author ?author .
  }
}
```

### Transform to RDF

```sparql
# CONSTRUCT RDF from JSON
CONSTRUCT {
  ?bookIRI a ex:Book ;
           ex:title ?title ;
           ex:author ?authorIRI .
  ?authorIRI a ex:Person ;
             rdfs:label ?author .
}
WHERE {
  SERVICE <x-sparql-anything:location=books.json> {
    ?root fx:anySlot ?book .
    ?book xyz:title ?title ;
          xyz:author ?author ;
          xyz:isbn ?isbn .
    BIND (IRI(CONCAT("http://example.org/book/", ?isbn)) AS ?bookIRI)
    BIND (IRI(CONCAT("http://example.org/person/", ENCODE_FOR_URI(?author))) AS ?authorIRI)
  }
}
```

---

## Tarql (CSV to RDF)

Convert CSV files to RDF using SPARQL CONSTRUCT:

```sparql
# tarql mapping file
PREFIX ex: <http://example.org/>

CONSTRUCT {
  ?personIRI a ex:Person ;
             ex:name ?name ;
             ex:email ?email ;
             ex:department ?deptIRI .
  ?deptIRI a ex:Department ;
           rdfs:label ?department .
}
FROM <employees.csv>
WHERE {
  BIND (IRI(CONCAT("http://example.org/person/", ?id)) AS ?personIRI)
  BIND (IRI(CONCAT("http://example.org/dept/", ENCODE_FOR_URI(?department))) AS ?deptIRI)
}
```

```bash
# Run tarql
tarql mapping.sparql employees.csv > employees.ttl
```

---

## Federation Patterns

### Entity Reconciliation

```sparql
# Match local entities with external identifiers
SELECT ?localEntity ?localLabel ?externalEntity
WHERE {
  ?localEntity rdfs:label ?localLabel .

  SERVICE <http://external.org/sparql> {
    ?externalEntity rdfs:label ?externalLabel .
    FILTER (LCASE(?externalLabel) = LCASE(?localLabel))
  }
}
```

### Data Enrichment

```sparql
# Enrich local data with external metadata
INSERT {
  ?product ex:categoryLabel ?categoryLabel ;
           ex:wikidata ?wikidataEntity .
}
WHERE {
  ?product ex:category ?categoryCode .

  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataEntity wdt:P528 ?categoryCode ;  # External ID
                    rdfs:label ?categoryLabel .
    FILTER (lang(?categoryLabel) = "en")
  }
}
```

### Cross-Dataset Analytics

```sparql
# Combine metrics from multiple sources
SELECT ?region (SUM(?salesLocal) AS ?sales) (AVG(?gdpExternal) AS ?avgGDP)
WHERE {
  # Local sales data
  ?sale ex:region ?region ;
        ex:amount ?salesLocal .

  # External economic data
  SERVICE <http://economics.example.org/sparql> {
    ?region econ:gdp ?gdpExternal .
  }
}
GROUP BY ?region
```

---

## Performance Considerations

### Network Latency

- Federation adds round-trip time per SERVICE call
- Batch requests where possible
- Cache frequently-accessed remote data

### Query Planning

```sparql
# GOOD: Push filters to remote
SELECT ?item ?label
WHERE {
  VALUES ?item { ex:Item1 ex:Item2 ex:Item3 }
  SERVICE <http://remote.org/sparql> {
    ?item rdfs:label ?label .
  }
}

# BAD: Retrieve all, filter locally
SELECT ?item ?label
WHERE {
  SERVICE <http://remote.org/sparql> {
    ?item rdfs:label ?label .
  }
  FILTER (?item IN (ex:Item1, ex:Item2, ex:Item3))
}
```

### Timeout Handling

```sparql
# Use SERVICE SILENT for non-critical enrichment
SELECT ?local ?extra
WHERE {
  ?s ex:local ?local .
  OPTIONAL {
    SERVICE SILENT <http://slow-endpoint.org/sparql> {
      ?s ex:extra ?extra .
    }
  }
}
```

### Local Caching

```sparql
# Periodic sync to local cache graph
INSERT {
  GRAPH ex:WikidataCache {
    ?item ?p ?o .
  }
}
WHERE {
  VALUES ?item { ... items to cache ... }
  SERVICE <https://query.wikidata.org/sparql> {
    ?item ?p ?o .
  }
}
```

---

## Troubleshooting Federation

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Timeout | Large result set | Add LIMIT, push filters |
| Empty results | Endpoint down | Use SERVICE SILENT |
| CORS errors | Browser restrictions | Use server-side proxy |
| Rate limiting | Too many requests | Add delays, cache results |

### Debug Pattern

```sparql
# Test remote endpoint separately
SELECT *
WHERE {
  SERVICE <http://remote.org/sparql> {
    SELECT * WHERE { ?s ?p ?o } LIMIT 5
  }
}
```
