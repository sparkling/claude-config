# SHACL Validation for SKOS Taxonomies

> "You can think of a SHACL graph as being the encoding of a requirements specification document." — Kurt Cagle

---

## Why SHACL for Taxonomies?

SKOS provides vocabulary but not enforcement. SHACL adds:

1. **Data quality validation** — Ensure concepts have required properties
2. **Integrity constraints** — Prevent cycles, enforce disjointness
3. **Business rules** — Custom domain-specific requirements
4. **Documentation** — Self-documenting constraints

---

## Core SKOS Shapes

### Concept Shape

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ex: <http://example.org/shapes/> .

ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;
    rdfs:label "SKOS Concept Shape"@en ;
    rdfs:comment "Validates SKOS concepts for data quality"@en ;

    # Must have at least one preferred label
    sh:property [
        sh:path skos:prefLabel ;
        sh:name "preferredLabel" ;
        sh:description "Primary display label" ;
        sh:minCount 1 ;
        sh:severity sh:Violation ;
        sh:message "Concept must have at least one preferred label"
    ] ;

    # Only one preferred label per language
    sh:property [
        sh:path skos:prefLabel ;
        sh:uniqueLang true ;
        sh:message "Only one preferred label allowed per language"
    ] ;

    # Labels should have language tags
    sh:property [
        sh:path skos:prefLabel ;
        sh:datatype rdf:langString ;
        sh:severity sh:Warning ;
        sh:message "Preferred labels should have language tags"
    ] ;

    # Must belong to a scheme
    sh:property [
        sh:path skos:inScheme ;
        sh:name "inScheme" ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme ;
        sh:message "Concept must belong to a concept scheme"
    ] ;

    # Broader must be a concept
    sh:property [
        sh:path skos:broader ;
        sh:class skos:Concept ;
        sh:message "Broader must reference a SKOS Concept"
    ] ;

    # Narrower must be a concept
    sh:property [
        sh:path skos:narrower ;
        sh:class skos:Concept ;
        sh:message "Narrower must reference a SKOS Concept"
    ] ;

    # Related must be a concept
    sh:property [
        sh:path skos:related ;
        sh:class skos:Concept ;
        sh:message "Related must reference a SKOS Concept"
    ] .
```

### ConceptScheme Shape

```turtle
ex:ConceptSchemeShape a sh:NodeShape ;
    sh:targetClass skos:ConceptScheme ;
    rdfs:label "SKOS ConceptScheme Shape"@en ;

    # Must have a label
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:message "Scheme must have a preferred label"
    ] ;

    # Should have top concepts
    sh:property [
        sh:path skos:hasTopConcept ;
        sh:minCount 1 ;
        sh:class skos:Concept ;
        sh:severity sh:Warning ;
        sh:message "Scheme should have at least one top concept"
    ] .
```

### Collection Shape

```turtle
ex:CollectionShape a sh:NodeShape ;
    sh:targetClass skos:Collection ;
    rdfs:label "SKOS Collection Shape"@en ;

    # Must have a label
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:message "Collection must have a preferred label"
    ] ;

    # Must have members
    sh:property [
        sh:path skos:member ;
        sh:minCount 1 ;
        sh:message "Collection must have at least one member"
    ] ;

    # Members must be concepts or collections
    sh:property [
        sh:path skos:member ;
        sh:or (
            [ sh:class skos:Concept ]
            [ sh:class skos:Collection ]
        ) ;
        sh:message "Members must be Concepts or Collections"
    ] .
```

---

## Integrity Constraints

### No Circular Hierarchies

```turtle
ex:ConceptShape sh:sparql [
    sh:message "Concept cannot be its own ancestor (circular hierarchy)" ;
    sh:severity sh:Violation ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this WHERE {
            $this skos:broader+ $this .
        }
    """
] .
```

### Top Concepts Should Not Have Broader

```turtle
ex:TopConceptShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT ?this WHERE {
                ?scheme skos:hasTopConcept ?this .
            }
        """
    ] ;

    sh:property [
        sh:path skos:broader ;
        sh:maxCount 0 ;
        sh:message "Top concepts should not have broader concepts"
    ] .
```

### Broader/Related Disjointness

```turtle
ex:ConceptShape sh:sparql [
    sh:message "Concept cannot be both hierarchically and associatively related to the same concept" ;
    sh:severity sh:Violation ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this ?other WHERE {
            $this skos:broader+ ?other .
            $this skos:related ?other .
        }
    """
] .
```

### Label Disjointness

```turtle
ex:ConceptShape
    # prefLabel and altLabel must not overlap
    sh:sparql [
        sh:message "Label cannot be both preferred and alternative" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?label WHERE {
                $this skos:prefLabel ?label ;
                      skos:altLabel ?label .
            }
        """
    ] ;

    # prefLabel and hiddenLabel must not overlap
    sh:sparql [
        sh:message "Label cannot be both preferred and hidden" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?label WHERE {
                $this skos:prefLabel ?label ;
                      skos:hiddenLabel ?label .
            }
        """
    ] ;

    # altLabel and hiddenLabel must not overlap
    sh:sparql [
        sh:message "Label cannot be both alternative and hidden" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?label WHERE {
                $this skos:altLabel ?label ;
                      skos:hiddenLabel ?label .
            }
        """
    ] .
```

---

## Scheme-Specific Constraints

### Broader Must Be in Same Scheme

```turtle
ex:ConceptShape sh:sparql [
    sh:message "Broader concept must be in the same scheme" ;
    sh:severity sh:Violation ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this ?broader ?scheme WHERE {
            $this skos:broader ?broader ;
                  skos:inScheme ?scheme .
            FILTER NOT EXISTS { ?broader skos:inScheme ?scheme }
        }
    """
] .
```

### Related Must Be in Same Scheme

```turtle
ex:ConceptShape sh:sparql [
    sh:message "Related concept should be in the same scheme" ;
    sh:severity sh:Warning ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this ?related ?scheme WHERE {
            $this skos:related ?related ;
                  skos:inScheme ?scheme .
            FILTER NOT EXISTS { ?related skos:inScheme ?scheme }
        }
    """
] .
```

---

## Documentation Constraints

### Definition Recommended

```turtle
ex:ConceptShape sh:property [
    sh:path skos:definition ;
    sh:minCount 1 ;
    sh:severity sh:Warning ;
    sh:message "Concept should have a definition"
] .
```

### Non-Empty Notes

```turtle
ex:ConceptShape sh:property [
    sh:path skos:note ;
    sh:minLength 10 ;
    sh:severity sh:Info ;
    sh:message "Notes should contain meaningful content (10+ chars)"
] .
```

### Leaf Concepts Need Scope Notes

```turtle
ex:LeafConceptShape a sh:NodeShape ;
    sh:target [
        a sh:SPARQLTarget ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT ?this WHERE {
                ?this a skos:Concept .
                FILTER NOT EXISTS { ?this skos:narrower ?child }
            }
        """
    ] ;

    sh:property [
        sh:path skos:scopeNote ;
        sh:minCount 1 ;
        sh:severity sh:Info ;
        sh:message "Leaf concepts should have scope notes for classification guidance"
    ] .
```

---

## Extended Property Validation (tax:)

### Level Consistency

```turtle
ex:ConceptShape
    sh:property [
        sh:path tax:level ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxCount 1 ;
        sh:message "Level must be a non-negative integer"
    ] ;

    sh:sparql [
        sh:message "Level must be parent level + 1" ;
        sh:severity sh:Violation ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX tax: <http://example.org/taxonomy#>
            SELECT $this ?level ?parentLevel WHERE {
                $this skos:broader ?parent ;
                      tax:level ?level .
                ?parent tax:level ?parentLevel .
                FILTER (?level != ?parentLevel + 1)
            }
        """
    ] .
```

### Valid Status

```turtle
ex:ConceptShape sh:property [
    sh:path tax:status ;
    sh:class tax:Status ;
    sh:maxCount 1 ;
    sh:in ( tax:Active tax:Deprecated tax:Proposed tax:Retired ) ;
    sh:message "Status must be a valid tax:Status"
] .
```

### Sort Order

```turtle
ex:ConceptShape sh:property [
    sh:path tax:sortOrder ;
    sh:datatype xsd:integer ;
    sh:minInclusive 1 ;
    sh:message "Sort order must be a positive integer"
] .
```

---

## Business Rule Examples

### Products Must Reference Leaf Concepts

```turtle
ex:ProductShape a sh:NodeShape ;
    sh:targetClass ex:Product ;

    sh:property [
        sh:path ex:category ;
        sh:class skos:Concept ;
        sh:minCount 1 ;
        sh:message "Product must have a category"
    ] ;

    sh:sparql [
        sh:message "Product category must be a leaf concept (no narrower terms)" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?category WHERE {
                $this ex:category ?category .
                ?category skos:narrower ?child .
            }
        """
    ] .
```

### Level-Specific Classification

```turtle
ex:ProductShape sh:sparql [
    sh:message "Product category must be at taxonomy level 3" ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX tax: <http://example.org/taxonomy#>
        SELECT $this ?category ?level WHERE {
            $this ex:category ?category .
            ?category tax:level ?level .
            FILTER (?level != 3)
        }
    """
] .
```

### Color Must Be From Approved Parent

```turtle
ex:CarShape a sh:NodeShape ;
    sh:targetClass ex:Car ;

    sh:sparql [
        sh:message "Car color must be from approved color categories (Red, Blue, Green, Black)" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?color WHERE {
                $this ex:exteriorColor ?color .
                ?color skos:broader ?parent .
                FILTER (?parent NOT IN (ex:Red, ex:Blue, ex:Green, ex:Black))
            }
        """
    ] .
```

---

## Mapping Validation

### Mappings Must Target External Schemes

```turtle
ex:ConceptShape sh:sparql [
    sh:message "exactMatch should link to external scheme, not internal" ;
    sh:severity sh:Warning ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this ?target WHERE {
            $this skos:exactMatch ?target ;
                  skos:inScheme ?scheme .
            ?target skos:inScheme ?scheme .
        }
    """
] .
```

### No exactMatch + broadMatch to Same Target

```turtle
ex:ConceptShape sh:sparql [
    sh:message "Cannot have both exactMatch and broadMatch to same concept" ;
    sh:severity sh:Violation ;
    sh:select """
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT $this ?target WHERE {
            $this skos:exactMatch ?target ;
                  skos:broadMatch ?target .
        }
    """
] .
```

---

## Complete Validation Shapes Graph

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix tax: <http://example.org/taxonomy#> .
@prefix ex: <http://example.org/shapes/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

# Concept validation
ex:ConceptShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:uniqueLang true ;
        sh:datatype rdf:langString ;
        sh:severity sh:Violation ;
        sh:message "Must have unique prefLabel per language"
    ] ;

    sh:property [
        sh:path skos:inScheme ;
        sh:minCount 1 ;
        sh:class skos:ConceptScheme
    ] ;

    sh:property [
        sh:path skos:definition ;
        sh:minCount 1 ;
        sh:severity sh:Warning
    ] ;

    sh:property [
        sh:path tax:level ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0
    ] ;

    sh:sparql [
        sh:message "Circular hierarchy detected" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this WHERE { $this skos:broader+ $this }
        """
    ] ;

    sh:sparql [
        sh:message "Broader must be in same scheme" ;
        sh:select """
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT $this ?b WHERE {
                $this skos:broader ?b ; skos:inScheme ?s .
                FILTER NOT EXISTS { ?b skos:inScheme ?s }
            }
        """
    ] .

# Scheme validation
ex:SchemeShape a sh:NodeShape ;
    sh:targetClass skos:ConceptScheme ;

    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1
    ] ;

    sh:property [
        sh:path skos:hasTopConcept ;
        sh:minCount 1 ;
        sh:severity sh:Warning
    ] .
```

---

## Running Validation

### With pySHACL

```python
from pyshacl import validate

data_graph = Graph().parse("taxonomy.ttl")
shapes_graph = Graph().parse("shapes.ttl")

conforms, results_graph, results_text = validate(
    data_graph,
    shacl_graph=shapes_graph,
    inference='rdfs'
)

print(f"Conforms: {conforms}")
print(results_text)
```

### With Apache Jena

```bash
shacl validate --shapes shapes.ttl --data taxonomy.ttl
```

---

## Best Practices

1. **Layer severity** — Use Violation/Warning/Info appropriately
2. **Descriptive messages** — Help users fix issues
3. **Version shapes** — Track changes to validation rules
4. **Test shapes** — Include both passing and failing examples
5. **Document constraints** — Explain business rationale
6. **Run continuously** — Integrate into data pipelines
