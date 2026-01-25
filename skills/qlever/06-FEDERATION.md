# QLever Federated Queries Guide

Combine data from multiple SPARQL endpoints in a single query using the SERVICE clause. Query QLever alongside Wikidata, DBpedia, and other endpoints.

---

## Overview

SPARQL 1.1 Federation allows a single query to retrieve and join data from multiple remote SPARQL endpoints. QLever fully supports this feature.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Federated Query** | Single query accessing multiple endpoints |
| **SERVICE Clause** | SPARQL keyword for remote execution |
| **Endpoint** | Remote SPARQL server URL |
| **Join Variables** | Variables shared between local and remote patterns |

---

## Basic Federation Syntax

### SERVICE Clause

```sparql
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>

SELECT ?item ?itemLabel
WHERE {
  # Local pattern (executed on QLever)
  ?localEntity ex:wikidataId ?wikidataId .

  # Remote pattern (executed on Wikidata)
  SERVICE <https://query.wikidata.org/sparql> {
    ?item wdt:P31 wd:Q5 ;
          rdfs:label ?itemLabel .
    FILTER(LANG(?itemLabel) = "en")
  }

  # Join on shared identifier
  FILTER(STR(?item) = ?wikidataId)
}
```

### Multiple SERVICE Calls

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT ?entity ?wikidataLabel ?dbpediaAbstract
WHERE {
  # Local data
  ?entity ex:type ex:Person .

  # Wikidata enrichment
  SERVICE <https://query.wikidata.org/sparql> {
    ?wdEntity rdfs:label ?wikidataLabel .
    FILTER(LANG(?wikidataLabel) = "en")
  }

  # DBpedia enrichment
  SERVICE <https://dbpedia.org/sparql> {
    ?dbpEntity dbo:abstract ?dbpediaAbstract .
    FILTER(LANG(?dbpediaAbstract) = "en")
  }
}
LIMIT 10
```

---

## Practical Federation Examples

### QLever OSM + Wikidata

Enrich OpenStreetMap data with Wikidata information:

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>

SELECT ?museum ?osmName ?wikidataId ?inception ?architect
WHERE {
  # OSM local data
  ?museum osmkey:tourism "museum" ;
          osmkey:name ?osmName ;
          osmkey:wikidata ?wikidataId .

  # Wikidata remote data
  SERVICE <https://query.wikidata.org/sparql> {
    ?wdItem wdt:P571 ?inception .
    OPTIONAL { ?wdItem wdt:P84 ?architect }
  }

  FILTER(STR(?wdItem) = ?wikidataId)
}
LIMIT 50
```

### Cross-Dataset Entity Resolution

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>

SELECT ?city ?osmName ?population ?abstract
WHERE {
  # OSM cities
  ?city osmkey:place "city" ;
        osmkey:name ?osmName ;
        osmkey:wikipedia ?wikiLink .

  # DBpedia enrichment
  SERVICE <https://dbpedia.org/sparql> {
    ?dbpCity dbo:populationTotal ?population ;
             dbo:abstract ?abstract .
    FILTER(LANG(?abstract) = "en")
  }

  # Match via Wikipedia link
  FILTER(CONTAINS(STR(?dbpCity), REPLACE(?osmName, " ", "_")))
}
ORDER BY DESC(?population)
LIMIT 20
```

---

## Federation with QLever Endpoints

### Query Multiple QLever Instances

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

SELECT ?protein ?gene ?organism
WHERE {
  # QLever UniProt endpoint
  SERVICE <https://qlever.dev/api/uniprot> {
    ?protein up:encodedBy ?gene ;
             up:organism ?organism .
  }

  # QLever Wikidata endpoint
  SERVICE <https://qlever.dev/api/wikidata> {
    ?organism wdt:P31 wd:Q16521 .  # Taxon
  }
}
LIMIT 100
```

### OSM Planet + OpenHistoricalMap

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX ogc: <http://www.opengis.net/rdf#>

# Compare current and historical data
SELECT ?currentPlace ?historicalPlace ?name
WHERE {
  # Current OSM data (local)
  ?currentPlace osmkey:historic "castle" ;
                osmkey:name ?name .

  # Historical data (federated)
  SERVICE <https://qlever.dev/api/ohm-planet> {
    ?historicalPlace osmkey:historic "castle" ;
                     osmkey:name ?name .
  }
}
LIMIT 50
```

---

## Public SPARQL Endpoints

### Commonly Used Endpoints

| Endpoint | URL | Notes |
|----------|-----|-------|
| **Wikidata** | `https://query.wikidata.org/sparql` | Rate limited |
| **DBpedia** | `https://dbpedia.org/sparql` | |
| **QLever Wikidata** | `https://qlever.dev/api/wikidata` | Often faster |
| **QLever OSM** | `https://qlever.dev/api/osm-planet` | |
| **QLever UniProt** | `https://qlever.dev/api/uniprot` | |
| **DBLP** | `https://sparql.dblp.org/sparql` | QLever-powered |
| **WikiPathways** | `https://sparql.wikipathways.org/` | |
| **ChEMBL** | `https://www.ebi.ac.uk/rdf/services/sparql` | |

### Endpoint-Specific Tips

**Wikidata:**
```sparql
SERVICE <https://query.wikidata.org/sparql> {
  # Always filter language for labels
  ?item rdfs:label ?label .
  FILTER(LANG(?label) = "en")

  # Use direct properties (wdt:) for simple values
  ?item wdt:P31 wd:Q5 .  # Instance of human
}
```

**DBpedia:**
```sparql
SERVICE <https://dbpedia.org/sparql> {
  # DBpedia uses dbo: ontology
  ?item dbo:birthDate ?date ;
        dbo:abstract ?abstract .
  FILTER(LANG(?abstract) = "en")
}
```

---

## Federation Patterns

### 1. Lookup Pattern

Local IDs → Remote details:

```sparql
SELECT ?localItem ?remoteDetails
WHERE {
  ?localItem ex:externalId ?extId .

  SERVICE <http://remote.endpoint/sparql> {
    ?remoteItem ex:id ?extId ;
                ex:details ?remoteDetails .
  }
}
```

### 2. Enrichment Pattern

Add properties from remote source:

```sparql
SELECT ?entity ?localProp ?remoteProp
WHERE {
  ?entity ex:localProperty ?localProp ;
          owl:sameAs ?remoteEntity .

  SERVICE <http://remote.endpoint/sparql> {
    ?remoteEntity ex:extraProperty ?remoteProp .
  }
}
```

### 3. Validation Pattern

Cross-check data across sources:

```sparql
SELECT ?item ?localValue ?remoteValue
WHERE {
  ?item ex:property ?localValue ;
        owl:sameAs ?remoteItem .

  SERVICE <http://remote.endpoint/sparql> {
    ?remoteItem ex:property ?remoteValue .
  }

  FILTER(?localValue != ?remoteValue)  # Find discrepancies
}
```

### 4. Aggregation Pattern

Combine counts from multiple sources:

```sparql
SELECT ?type ?localCount ?remoteCount (?localCount + ?remoteCount AS ?total)
WHERE {
  {
    SELECT ?type (COUNT(?x) AS ?localCount)
    WHERE { ?x a ?type }
    GROUP BY ?type
  }

  SERVICE <http://remote.endpoint/sparql> {
    SELECT ?type (COUNT(?x) AS ?remoteCount)
    WHERE { ?x a ?type }
    GROUP BY ?type
  }
}
```

---

## Performance Considerations

### 1. Minimize Remote Queries

```sparql
# GOOD: Filter locally first, then federate
SELECT ?item ?remoteData
WHERE {
  ?item a ex:RelevantType ;       # Local filter
        ex:externalId ?extId .

  SERVICE <http://remote/sparql> {
    ?remote ex:id ?extId ;
            ex:data ?remoteData .
  }
}

# BAD: Unrestricted remote query
SELECT ?item ?remoteData
WHERE {
  SERVICE <http://remote/sparql> {
    ?remote ex:data ?remoteData .  # Returns everything!
  }
  ?item ex:externalId ?extId .
}
```

### 2. Use VALUES for Small Sets

```sparql
# Efficient for known small set of items
SELECT ?item ?label
WHERE {
  VALUES ?item { wd:Q1 wd:Q2 wd:Q3 }

  SERVICE <https://query.wikidata.org/sparql> {
    ?item rdfs:label ?label .
    FILTER(LANG(?label) = "en")
  }
}
```

### 3. Handle Timeouts

```sparql
# Add LIMIT in SERVICE for large datasets
SERVICE <http://remote/sparql> {
  SELECT ?item ?data
  WHERE { ?item ex:property ?data }
  LIMIT 1000  # Prevent timeout
}
```

### 4. Consider Latency

- Overall query time = slowest SERVICE call
- Use OPTIONAL for non-critical remote data
- Cache frequently accessed remote data locally

---

## Error Handling

### SERVICE SILENT

Ignore failed remote endpoints:

```sparql
SELECT ?item ?localData ?optionalRemoteData
WHERE {
  ?item ex:property ?localData .

  # Continue even if remote fails
  OPTIONAL {
    SERVICE SILENT <http://remote/sparql> {
      ?item ex:remoteProperty ?optionalRemoteData .
    }
  }
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Timeout | Add LIMIT in SERVICE, reduce scope |
| CORS errors | Use server-side federation |
| Rate limiting | Add delays, cache results |
| Endpoint down | Use SERVICE SILENT |
| No results | Check variable binding, URIs match |

---

## Advanced: SPARQL-Anything

For non-RDF sources, consider SPARQL-Anything (separate tool):

```sparql
PREFIX fx: <http://sparql.xyz/facade-x/ns/>
PREFIX xyz: <http://sparql.xyz/facade-x/data/>

SELECT ?field
WHERE {
  SERVICE <x-sparql-anything:location=https://example.org/data.json> {
    ?s xyz:field ?field .
  }
}
```

Note: SPARQL-Anything requires its own endpoint, not native to QLever.

---

## Best Practices

### 1. Test Remote Endpoints Separately

```sparql
# Test remote query independently first
SELECT ?item ?label
WHERE {
  ?item wdt:P31 wd:Q5 ;
        rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}
LIMIT 10
```

### 2. Use Shared Identifiers

```sparql
# Good: Explicit shared ID
?localEntity ex:wikidataId ?wdId .
SERVICE ... { ?wdItem ... FILTER(STR(?wdItem) = ?wdId) }

# Better: owl:sameAs links
?localEntity owl:sameAs ?remoteEntity .
SERVICE ... { ?remoteEntity ... }
```

### 3. Document Endpoint Dependencies

```sparql
# Federation depends on:
#   - https://query.wikidata.org/sparql (Wikidata)
#   - https://qlever.dev/api/osm-planet (QLever OSM)
# Rate limits: Wikidata ~5 req/min for heavy queries
```

### 4. Consider Caching

For frequently accessed remote data:
1. Materialize remote data locally
2. Update periodically via SPARQL Update
3. Query local copies for performance

---

## Resources

### Specifications
- [SPARQL 1.1 Federated Query](https://www.w3.org/TR/sparql11-federated-query/)
- [SPARQL 1.2 Federated Query (draft)](https://w3c.github.io/sparql-federated-query/spec/)

### Tools
- [SPARQL-Anything](https://sparql-anything.cc/) - Query non-RDF sources
- [FedX](https://github.com/eclipse/rdf4j) - Federation engine
