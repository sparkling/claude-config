# SPARQL Patterns for SKOS Taxonomies

> "Nearly all SPARQL operations are set operations—SKOS queries are about finding and traversing concept sets."

---

## Essential Prefixes

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
```

---

## Basic Retrieval

### Get All Concepts in a Scheme

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
ORDER BY ?label
```

### Get Concept with All Labels

```sparql
SELECT ?concept ?prefLabel
       (GROUP_CONCAT(DISTINCT ?altLabel; separator=", ") AS ?altLabels)
WHERE {
    BIND (ex:ArtificialIntelligence AS ?concept)

    ?concept skos:prefLabel ?prefLabel .
    OPTIONAL { ?concept skos:altLabel ?altLabel }

    FILTER (lang(?prefLabel) = "en")
    FILTER (!BOUND(?altLabel) || lang(?altLabel) = "en")
}
GROUP BY ?concept ?prefLabel
```

### Get Concept with Full Context

```sparql
SELECT ?concept ?label ?definition ?broader ?narrower ?related
WHERE {
    BIND (ex:MachineLearning AS ?concept)

    ?concept skos:prefLabel ?label .

    OPTIONAL { ?concept skos:definition ?definition
               FILTER (lang(?definition) = "en") }
    OPTIONAL { ?concept skos:broader/skos:prefLabel ?broader
               FILTER (lang(?broader) = "en") }
    OPTIONAL { ?concept skos:narrower/skos:prefLabel ?narrower
               FILTER (lang(?narrower) = "en") }
    OPTIONAL { ?concept skos:related/skos:prefLabel ?related
               FILTER (lang(?related) = "en") }

    FILTER (lang(?label) = "en")
}
```

---

## Hierarchy Navigation

### Get Top Concepts

```sparql
SELECT ?concept ?label
WHERE {
    ?scheme skos:hasTopConcept ?concept .
    ?concept skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
ORDER BY ?label
```

### Get Direct Children

```sparql
SELECT ?child ?label
WHERE {
    ex:Electronics skos:narrower ?child .
    ?child skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
ORDER BY ?label
```

### Get All Descendants (Transitive)

```sparql
SELECT ?descendant ?label ?depth
WHERE {
    ex:Electronics skos:narrower+ ?descendant .
    ?descendant skos:prefLabel ?label .

    # Calculate depth
    {
        SELECT ?descendant (COUNT(?mid) AS ?depth)
        WHERE {
            ex:Electronics skos:narrower+ ?mid .
            ?mid skos:narrower* ?descendant .
        }
        GROUP BY ?descendant
    }

    FILTER (lang(?label) = "en")
}
ORDER BY ?depth ?label
```

### Get Ancestor Path (Breadcrumb)

```sparql
SELECT ?concept (GROUP_CONCAT(?ancestorLabel; separator=" > ") AS ?path)
WHERE {
    BIND (ex:GamingLaptops AS ?concept)

    ?concept skos:broader+ ?ancestor .
    ?ancestor skos:prefLabel ?ancestorLabel .
    FILTER (lang(?ancestorLabel) = "en")
}
GROUP BY ?concept
```

### Get Leaf Concepts (No Children)

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .

    FILTER NOT EXISTS { ?concept skos:narrower ?child }
    FILTER (lang(?label) = "en")
}
ORDER BY ?label
```

---

## Search Patterns

### Search by Label (Case-Insensitive)

```sparql
SELECT ?concept ?label ?matchedOn
WHERE {
    VALUES ?searchTerm { "laptop" }

    ?concept a skos:Concept .

    {
        ?concept skos:prefLabel ?matchLabel .
        BIND ("prefLabel" AS ?matchedOn)
    } UNION {
        ?concept skos:altLabel ?matchLabel .
        BIND ("altLabel" AS ?matchedOn)
    } UNION {
        ?concept skos:hiddenLabel ?matchLabel .
        BIND ("hiddenLabel" AS ?matchedOn)
    }

    FILTER (CONTAINS(LCASE(STR(?matchLabel)), LCASE(?searchTerm)))

    ?concept skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
```

### Search with Scheme Filter

```sparql
SELECT ?concept ?label ?scheme
WHERE {
    VALUES ?searchTerm { "computer" }
    VALUES ?targetScheme { ex:ProductTaxonomy ex:TechTaxonomy }

    ?concept skos:inScheme ?targetScheme ;
             skos:prefLabel ?label .

    {
        ?concept skos:prefLabel ?match
    } UNION {
        ?concept skos:altLabel ?match
    }

    FILTER (CONTAINS(LCASE(STR(?match)), LCASE(?searchTerm)))
    FILTER (lang(?label) = "en")
}
```

### Fuzzy Search (REGEX)

```sparql
SELECT ?concept ?label
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label .

    # Match "comput" followed by any characters
    FILTER (REGEX(?label, "comput.*", "i"))
    FILTER (lang(?label) = "en")
}
```

---

## Statistics and Analytics

### Count Concepts by Scheme

```sparql
SELECT ?scheme ?schemeLabel (COUNT(?concept) AS ?conceptCount)
WHERE {
    ?scheme a skos:ConceptScheme ;
            skos:prefLabel ?schemeLabel .
    ?concept skos:inScheme ?scheme .
    FILTER (lang(?schemeLabel) = "en")
}
GROUP BY ?scheme ?schemeLabel
ORDER BY DESC(?conceptCount)
```

### Hierarchy Depth Analysis

```sparql
SELECT ?scheme (MAX(?depth) AS ?maxDepth) (AVG(?depth) AS ?avgDepth)
WHERE {
    ?concept skos:inScheme ?scheme .

    {
        SELECT ?concept (COUNT(?ancestor) AS ?depth)
        WHERE {
            ?concept skos:broader* ?ancestor .
        }
        GROUP BY ?concept
    }
}
GROUP BY ?scheme
```

### Concepts per Level

```sparql
SELECT ?level (COUNT(?concept) AS ?count)
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy .

    {
        SELECT ?concept (COUNT(?ancestor) AS ?level)
        WHERE {
            ?concept skos:broader* ?ancestor .
            ?ancestor skos:inScheme ex:ProductTaxonomy .
        }
        GROUP BY ?concept
    }
}
GROUP BY ?level
ORDER BY ?level
```

### Most Connected Concepts

```sparql
SELECT ?concept ?label
       (COUNT(DISTINCT ?broader) AS ?broaderCount)
       (COUNT(DISTINCT ?narrower) AS ?narrowerCount)
       (COUNT(DISTINCT ?related) AS ?relatedCount)
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .

    OPTIONAL { ?concept skos:broader ?broader }
    OPTIONAL { ?concept skos:narrower ?narrower }
    OPTIONAL { ?concept skos:related ?related }

    FILTER (lang(?label) = "en")
}
GROUP BY ?concept ?label
ORDER BY DESC(?narrowerCount + ?relatedCount)
LIMIT 20
```

---

## Data Quality Queries

### Find Concepts Missing Labels

```sparql
SELECT ?concept
WHERE {
    ?concept a skos:Concept .
    FILTER NOT EXISTS { ?concept skos:prefLabel ?label }
}
```

### Find Concepts Missing Definitions

```sparql
SELECT ?concept ?label
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label .
    FILTER NOT EXISTS { ?concept skos:definition ?def }
    FILTER (lang(?label) = "en")
}
```

### Find Orphan Concepts (No Scheme)

```sparql
SELECT ?concept ?label
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label .
    FILTER NOT EXISTS { ?concept skos:inScheme ?scheme }
    FILTER (lang(?label) = "en")
}
```

### Find Circular Hierarchies

```sparql
SELECT DISTINCT ?concept ?label
WHERE {
    ?concept skos:broader+ ?concept ;
             skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
```

### Find Duplicate Labels in Scheme

```sparql
SELECT ?label (COUNT(?concept) AS ?count) (GROUP_CONCAT(?concept; separator=", ") AS ?concepts)
WHERE {
    ?concept skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .
    FILTER (lang(?label) = "en")
}
GROUP BY ?label
HAVING (COUNT(?concept) > 1)
ORDER BY DESC(?count)
```

---

## Mapping Queries

### Find All Mappings

```sparql
SELECT ?concept ?label ?matchType ?target
WHERE {
    ?concept skos:inScheme ex:LocalTaxonomy ;
             skos:prefLabel ?label .

    {
        ?concept skos:exactMatch ?target
        BIND ("exact" AS ?matchType)
    } UNION {
        ?concept skos:closeMatch ?target
        BIND ("close" AS ?matchType)
    } UNION {
        ?concept skos:broadMatch ?target
        BIND ("broad" AS ?matchType)
    } UNION {
        ?concept skos:narrowMatch ?target
        BIND ("narrow" AS ?matchType)
    } UNION {
        ?concept skos:relatedMatch ?target
        BIND ("related" AS ?matchType)
    }

    FILTER (lang(?label) = "en")
}
```

### Find Unmapped Concepts

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:inScheme ex:LocalTaxonomy ;
             skos:prefLabel ?label .

    FILTER NOT EXISTS { ?concept skos:mappingRelation ?external }
    FILTER (lang(?label) = "en")
}
```

---

## Update Operations

### Add Concept

```sparql
INSERT DATA {
    ex:NewConcept a skos:Concept ;
        skos:prefLabel "New Concept"@en ;
        skos:inScheme ex:ProductTaxonomy ;
        skos:broader ex:ParentConcept ;
        skos:definition "Definition of new concept"@en .
}
```

### Deprecate Concept

```sparql
INSERT {
    ?concept tax:status tax:Deprecated ;
             dct:modified ?now ;
             dct:isReplacedBy ex:ReplacementConcept ;
             skos:changeNote ?note .
}
WHERE {
    BIND (ex:OldConcept AS ?concept)
    BIND (NOW() AS ?now)
    BIND (CONCAT("Deprecated ", STR(?now), ": Use ReplacementConcept") AS ?note)
}
```

### Move Concept in Hierarchy

```sparql
# Remove old parent
DELETE { ex:Concept skos:broader ?oldParent }
WHERE { ex:Concept skos:broader ?oldParent }
;
# Add new parent
INSERT DATA {
    ex:Concept skos:broader ex:NewParent .
}
```

### Merge Concepts

```sparql
# Copy labels and relations to target
INSERT {
    ex:TargetConcept skos:altLabel ?label ;
                     skos:narrower ?narrower ;
                     skos:related ?related .
}
WHERE {
    ex:SourceConcept skos:prefLabel|skos:altLabel ?label .
    OPTIONAL { ex:SourceConcept skos:narrower ?narrower }
    OPTIONAL { ex:SourceConcept skos:related ?related }
}
;
# Redirect children to target
DELETE { ?child skos:broader ex:SourceConcept }
INSERT { ?child skos:broader ex:TargetConcept }
WHERE { ?child skos:broader ex:SourceConcept }
;
# Mark source as deprecated
INSERT DATA {
    ex:SourceConcept tax:status tax:Deprecated ;
                     dct:isReplacedBy ex:TargetConcept .
}
```

---

## Federated Queries

### Query Wikidata for Mappings

```sparql
SELECT ?localConcept ?localLabel ?wdLabel
WHERE {
    ?localConcept skos:inScheme ex:LocalTaxonomy ;
                  skos:prefLabel ?localLabel ;
                  skos:exactMatch ?wdEntity .

    FILTER (lang(?localLabel) = "en")
    FILTER (STRSTARTS(STR(?wdEntity), "http://www.wikidata.org"))

    SERVICE <https://query.wikidata.org/sparql> {
        ?wdEntity rdfs:label ?wdLabel .
        FILTER (lang(?wdLabel) = "en")
    }
}
```

---

## Performance Tips

1. **Filter early** — Place restrictive patterns first
2. **Use BIND for constants** — More efficient than inline values
3. **Avoid unbounded paths** — `skos:broader*` on large graphs is expensive
4. **Use LIMIT for exploration** — Don't retrieve everything
5. **Consider indexes** — Full-text search indexes for labels
6. **Cache static queries** — Taxonomy structure changes infrequently
7. **Use named graphs** — Isolate taxonomies for faster queries
