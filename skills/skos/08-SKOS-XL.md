# SKOS-XL: Extended Labeling

> "SKOS-XL treats labels as first-class resources, enabling rich metadata about terms themselves."

---

## Why SKOS-XL?

Standard SKOS labeling uses simple literals:

```turtle
ex:Cat skos:prefLabel "Cat"@en .
```

But sometimes you need to say more **about the label itself**:
- Who created this term?
- What's its etymology?
- How does it relate to other labels?
- What's its usage history?

SKOS-XL (eXtension for Labels) addresses this by making labels into **resources**.

---

## SKOS-XL Vocabulary

```turtle
@prefix skosxl: <http://www.w3.org/2008/05/skos-xl#> .
```

### Core Classes

| Class | Purpose |
|-------|---------|
| `skosxl:Label` | A label as a resource |

### Core Properties

| Property | Domain | Range | Purpose |
|----------|--------|-------|---------|
| `skosxl:prefLabel` | — | `skosxl:Label` | Preferred label resource |
| `skosxl:altLabel` | — | `skosxl:Label` | Alternative label resource |
| `skosxl:hiddenLabel` | — | `skosxl:Label` | Hidden label resource |
| `skosxl:literalForm` | `skosxl:Label` | Literal | The actual string |
| `skosxl:labelRelation` | `skosxl:Label` | `skosxl:Label` | Label-to-label relation |

---

## Basic SKOS-XL Pattern

### Standard SKOS

```turtle
ex:Cat skos:prefLabel "Cat"@en ;
       skos:altLabel "Feline"@en .
```

### SKOS-XL Equivalent

```turtle
ex:Cat skosxl:prefLabel ex:CatLabel_en ;
       skosxl:altLabel ex:FelineLabel_en .

ex:CatLabel_en a skosxl:Label ;
    skosxl:literalForm "Cat"@en .

ex:FelineLabel_en a skosxl:Label ;
    skosxl:literalForm "Feline"@en .
```

---

## Adding Metadata to Labels

### Provenance

```turtle
@prefix dct: <http://purl.org/dc/terms/> .
@prefix prov: <http://www.w3.org/ns/prov#> .

ex:CatLabel_en a skosxl:Label ;
    skosxl:literalForm "Cat"@en ;
    dct:creator <http://example.org/people/taxonomist1> ;
    dct:created "2020-01-15"^^xsd:date ;
    dct:source <http://example.org/references/oxford-english-dictionary> ;
    prov:wasAttributedTo ex:TaxonomyProject .
```

### Etymology

```turtle
ex:DemocracyLabel_en a skosxl:Label ;
    skosxl:literalForm "Democracy"@en ;
    ex:etymology """From Greek 'demokratia': demos (people) +
                    kratos (rule, power)"""@en ;
    ex:firstRecorded "1570s" ;
    ex:languageOfOrigin "Greek" .
```

### Usage Status

```turtle
ex:DeprecatedTerm a skosxl:Label ;
    skosxl:literalForm "Eskimo"@en ;
    ex:usageStatus ex:Deprecated ;
    ex:deprecatedDate "2020-01-01"^^xsd:date ;
    ex:replacedBy ex:InuitLabel_en ;
    skos:note "Term now considered inappropriate; use specific group names"@en .
```

---

## Label Relationships

### skosxl:labelRelation

Connect labels to each other:

```turtle
ex:AILabel a skosxl:Label ;
    skosxl:literalForm "AI"@en ;
    skosxl:labelRelation ex:ArtificialIntelligenceLabel .

ex:ArtificialIntelligenceLabel a skosxl:Label ;
    skosxl:literalForm "Artificial Intelligence"@en ;
    skosxl:labelRelation ex:AILabel .
```

### Custom Label Relations

Extend with subproperties:

```turtle
# Define specific label relationships
ex:isAbbreviationOf rdfs:subPropertyOf skosxl:labelRelation .
ex:isAcronymOf rdfs:subPropertyOf skosxl:labelRelation .
ex:isTranslationOf rdfs:subPropertyOf skosxl:labelRelation .
ex:isSpellingVariantOf rdfs:subPropertyOf skosxl:labelRelation .

# Usage
ex:USALabel a skosxl:Label ;
    skosxl:literalForm "USA"@en ;
    ex:isAcronymOf ex:UnitedStatesLabel .

ex:UnitedStatesLabel a skosxl:Label ;
    skosxl:literalForm "United States"@en .

ex:ColorLabel_en a skosxl:Label ;
    skosxl:literalForm "Color"@en-US ;
    ex:isSpellingVariantOf ex:ColourLabel_en .

ex:ColourLabel_en a skosxl:Label ;
    skosxl:literalForm "Colour"@en-GB .
```

### Translation Relationships

```turtle
ex:CatLabel_en a skosxl:Label ;
    skosxl:literalForm "Cat"@en ;
    ex:isTranslationOf ex:CatLabel_de, ex:CatLabel_fr .

ex:CatLabel_de a skosxl:Label ;
    skosxl:literalForm "Katze"@de ;
    ex:isTranslationOf ex:CatLabel_en .

ex:CatLabel_fr a skosxl:Label ;
    skosxl:literalForm "Chat"@fr ;
    ex:isTranslationOf ex:CatLabel_en .
```

---

## Complete SKOS-XL Example

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix skosxl: <http://www.w3.org/2008/05/skos-xl#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .

# The concept
ex:ArtificialIntelligence a skos:Concept ;
    skos:inScheme ex:ComputerScienceTaxonomy ;
    skos:broader ex:ComputerScience ;

    # SKOS-XL labels (as resources)
    skosxl:prefLabel ex:AILabel_full_en ;
    skosxl:altLabel ex:AILabel_abbrev_en ;
    skosxl:altLabel ex:AILabel_de .

# Full preferred label
ex:AILabel_full_en a skosxl:Label ;
    skosxl:literalForm "Artificial Intelligence"@en ;
    dct:creator <http://example.org/people/taxonomist1> ;
    dct:created "2020-01-15"^^xsd:date ;
    ex:etymology "Coined at the Dartmouth Conference, 1956"@en ;
    ex:coinedBy "John McCarthy" .

# Abbreviation
ex:AILabel_abbrev_en a skosxl:Label ;
    skosxl:literalForm "AI"@en ;
    ex:isAbbreviationOf ex:AILabel_full_en ;
    ex:commonUsageSince "1970s" ;
    dct:created "2020-01-15"^^xsd:date .

# German translation
ex:AILabel_de a skosxl:Label ;
    skosxl:literalForm "Künstliche Intelligenz"@de ;
    ex:isTranslationOf ex:AILabel_full_en ;
    dct:created "2020-02-01"^^xsd:date .
```

---

## Inference: SKOS-XL to SKOS

The W3C defines property chains that derive standard SKOS labels from SKOS-XL:

```turtle
# These inferences are defined in the SKOS-XL spec:
# If: ex:Cat skosxl:prefLabel ex:CatLabel .
#     ex:CatLabel skosxl:literalForm "Cat"@en .
# Then: ex:Cat skos:prefLabel "Cat"@en .
```

This means SKOS-XL is **backward compatible** with standard SKOS queries.

---

## Disjointness

Key constraint: `skosxl:Label` is disjoint from:
- `skos:Concept`
- `skos:ConceptScheme`
- `skos:Collection`

A label cannot be a concept, and vice versa.

---

## SPARQL Patterns

### Get Labels with Metadata

```sparql
PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?concept ?literal ?creator ?created
WHERE {
    ?concept skosxl:prefLabel ?label .
    ?label skosxl:literalForm ?literal .
    OPTIONAL { ?label dct:creator ?creator }
    OPTIONAL { ?label dct:created ?created }
}
```

### Find Abbreviation Relationships

```sparql
SELECT ?abbreviation ?fullForm
WHERE {
    ?abbrevLabel skosxl:literalForm ?abbreviation ;
                 ex:isAbbreviationOf ?fullLabel .
    ?fullLabel skosxl:literalForm ?fullForm .
}
```

### Get All Translations of a Label

```sparql
SELECT ?sourceLabel ?targetLabel ?targetLang
WHERE {
    ex:CatLabel_en ex:isTranslationOf ?target .
    ?target skosxl:literalForm ?targetLabel .
    BIND (lang(?targetLabel) AS ?targetLang)
}
```

### Find Labels by Creator

```sparql
SELECT ?concept ?label ?creator
WHERE {
    ?concept skosxl:prefLabel|skosxl:altLabel ?labelResource .
    ?labelResource skosxl:literalForm ?label ;
                   dct:creator ?creator .
}
```

---

## SHACL Validation

```turtle
ex:LabelShape a sh:NodeShape ;
    sh:targetClass skosxl:Label ;

    # Must have exactly one literal form
    sh:property [
        sh:path skosxl:literalForm ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:message "Label must have exactly one literalForm"
    ] ;

    # Literal form should have language tag
    sh:property [
        sh:path skosxl:literalForm ;
        sh:datatype rdf:langString ;
        sh:severity sh:Warning ;
        sh:message "Label literal should have language tag"
    ] .

ex:ConceptWithXLShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # If using SKOS-XL, prefer it consistently
    sh:sparql [
        sh:severity sh:Warning ;
        sh:message "Concept mixes SKOS and SKOS-XL labeling" ;
        sh:select """
            SELECT $this
            WHERE {
                $this skosxl:prefLabel ?xlLabel ;
                      skos:prefLabel ?skosLabel .
            }
        """
    ] .
```

---

## When to Use SKOS-XL

**Use SKOS-XL when you need:**
- Label provenance (who created, when)
- Term etymology and history
- Relationships between labels (acronyms, translations)
- Label-specific status (deprecated, preferred, regional)
- Rich audit trails on terminology

**Use standard SKOS when:**
- Simple labeling is sufficient
- Performance is critical (fewer triples)
- Interoperability with basic SKOS tools matters
- Label metadata isn't needed

---

## Best Practices

1. **Be consistent** — Don't mix SKOS and SKOS-XL for same concept
2. **Use meaningful URIs** — `ex:Cat_prefLabel_en` not `ex:label123`
3. **Define custom relations** — Extend `skosxl:labelRelation` for clarity
4. **Document label status** — Track deprecated/replaced terms
5. **Consider query performance** — SKOS-XL adds triple count
6. **Leverage inference** — Let reasoners derive SKOS from SKOS-XL
7. **Validate literalForm cardinality** — Exactly one per label
