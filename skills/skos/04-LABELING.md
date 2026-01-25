# SKOS Labeling Properties

> "Labels are the human interface to the knowledge graph—the bridge between URIs and human understanding."

---

## Labeling Overview

SKOS provides three core labeling properties, each serving a distinct purpose:

| Property | Purpose | Display? | Cardinality |
|----------|---------|----------|-------------|
| `skos:prefLabel` | Primary display label | Yes | One per language |
| `skos:altLabel` | Synonyms, abbreviations | Sometimes | Multiple |
| `skos:hiddenLabel` | Search terms, misspellings | No | Multiple |

All labeling properties are subproperties of `rdfs:label`.

---

## Preferred Labels (skos:prefLabel)

The primary, canonical label for a concept.

### Basic Usage

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;
    skos:prefLabel "Katze"@de ;
    skos:prefLabel "Chat"@fr ;
    skos:prefLabel "Gato"@es .
```

### Key Constraints

**One per language**: Each concept should have exactly one `skos:prefLabel` per language tag.

```turtle
# CORRECT
ex:Cat skos:prefLabel "Cat"@en ;
       skos:prefLabel "Domestic Cat"@en-US .  # Different language tag

# INCORRECT - integrity violation
ex:Cat skos:prefLabel "Cat"@en ;
       skos:prefLabel "Feline"@en .  # Two English prefLabels!
```

**Recommended uniqueness within scheme**: While not required, each concept in a scheme should ideally have a unique `skos:prefLabel`.

```turtle
# Potentially confusing (but valid SKOS)
ex:Mercury skos:prefLabel "Mercury"@en .  # The planet
ex:Mercury2 skos:prefLabel "Mercury"@en . # The element
```

### Label without Language Tag

Plain literals (without language tags) are allowed:

```turtle
ex:Cat skos:prefLabel "Cat" .  # No language tag
```

**Best practice**: Always use language tags for multilingual vocabularies.

---

## Alternative Labels (skos:altLabel)

Synonyms, near-synonyms, abbreviations, and variant forms.

### Common Use Cases

```turtle
ex:UnitedStates a skos:Concept ;
    skos:prefLabel "United States of America"@en ;

    # Synonyms
    skos:altLabel "USA"@en ;
    skos:altLabel "US"@en ;
    skos:altLabel "America"@en ;

    # Formal name
    skos:altLabel "The United States"@en ;

    # Historical
    skos:altLabel "The Colonies"@en .
```

### Abbreviations and Acronyms

```turtle
ex:ArtificialIntelligence a skos:Concept ;
    skos:prefLabel "Artificial Intelligence"@en ;
    skos:altLabel "AI"@en ;
    skos:altLabel "A.I."@en ;
    skos:altLabel "Machine Intelligence"@en .
```

### Trade Names and Variants

```turtle
ex:Acetaminophen a skos:Concept ;
    skos:prefLabel "Acetaminophen"@en ;
    skos:altLabel "Paracetamol"@en ;      # International name
    skos:altLabel "Tylenol"@en ;          # Brand name
    skos:altLabel "APAP"@en .             # Medical abbreviation
```

---

## Hidden Labels (skos:hiddenLabel)

Labels used for search/retrieval but never displayed to users.

### Misspellings

```turtle
ex:Necessary a skos:Concept ;
    skos:prefLabel "Necessary"@en ;
    skos:hiddenLabel "Neccessary"@en ;    # Common misspelling
    skos:hiddenLabel "Necessery"@en ;
    skos:hiddenLabel "Neccesary"@en .
```

### Deprecated Terms

```turtle
ex:IntellectualDisability a skos:Concept ;
    skos:prefLabel "Intellectual Disability"@en ;
    # Outdated terms users might search for
    skos:hiddenLabel "Mental Retardation"@en ;
    skos:hiddenLabel "Mentally Handicapped"@en .
```

### Technical Codes

```turtle
ex:Aspirin a skos:Concept ;
    skos:prefLabel "Aspirin"@en ;
    skos:hiddenLabel "ASA"@en ;           # Chemical abbrev
    skos:hiddenLabel "C9H8O4"@en .        # Molecular formula
```

---

## Label Integrity Constraints

### No Overlap Between Label Types

The W3C defines pairwise disjointness:

```
skos:prefLabel ∩ skos:altLabel = ∅
skos:prefLabel ∩ skos:hiddenLabel = ∅
skos:altLabel ∩ skos:hiddenLabel = ∅
```

For any single concept, no literal value should appear in more than one label property.

```turtle
# INVALID - same value in prefLabel and altLabel
ex:Cat skos:prefLabel "Cat"@en ;
       skos:altLabel "Cat"@en .  # Integrity violation!
```

### Unique Language for prefLabel

```turtle
# INVALID - two English prefLabels
ex:Dog skos:prefLabel "Dog"@en ;
       skos:prefLabel "Canine"@en .  # Violation!

# VALID - one is altLabel
ex:Dog skos:prefLabel "Dog"@en ;
       skos:altLabel "Canine"@en .
```

---

## Notations (skos:notation)

Classification codes and identifiers:

```turtle
ex:Laptop a skos:Concept ;
    skos:prefLabel "Laptop"@en ;
    skos:notation "ELEC-COMP-LAP" ;              # Local code
    skos:notation "004.16"^^ex:DeweyDecimal ;   # DDC
    skos:notation "Q68"^^ex:WikidataID .        # Wikidata
```

### Typed Notations

Use datatypes to distinguish notation systems:

```turtle
@prefix ddc: <http://example.org/dewey/> .
@prefix lcc: <http://example.org/lcc/> .

ex:ComputerScience a skos:Concept ;
    skos:prefLabel "Computer Science"@en ;
    skos:notation "004"^^ddc:DeweyDecimal ;
    skos:notation "QA76"^^lcc:LibraryOfCongress ;
    skos:notation "68"^^ex:ACMClassification .
```

---

## Multilingual Labeling

### Complete Multilingual Example

```turtle
ex:Democracy a skos:Concept ;
    # Preferred labels (one per language)
    skos:prefLabel "Democracy"@en ;
    skos:prefLabel "Demokratie"@de ;
    skos:prefLabel "Democracia"@es ;
    skos:prefLabel "Démocratie"@fr ;
    skos:prefLabel "Democrazia"@it ;
    skos:prefLabel "民主主義"@ja ;
    skos:prefLabel "民主"@zh ;

    # Alternative labels (multiple per language OK)
    skos:altLabel "Democratic government"@en ;
    skos:altLabel "Rule by the people"@en ;
    skos:altLabel "Demokratische Regierung"@de ;

    # Documentation in multiple languages
    skos:definition "A system of government by the whole population"@en ;
    skos:definition "Ein Regierungssystem durch die gesamte Bevölkerung"@de .
```

### Language Tag Best Practices

```turtle
# Basic language tags
skos:prefLabel "Color"@en .
skos:prefLabel "Colour"@en-GB .
skos:prefLabel "Color"@en-US .

# Script variants
skos:prefLabel "中文"@zh-Hans .     # Simplified Chinese
skos:prefLabel "中文"@zh-Hant .     # Traditional Chinese

# Regional variants
skos:prefLabel "Fußball"@de-DE .   # German (Germany)
skos:prefLabel "Fussball"@de-CH .  # German (Switzerland)
```

---

## SPARQL Patterns for Labels

### Find by Label

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?concept ?prefLabel
WHERE {
    VALUES ?searchTerm { "cat" }

    ?concept a skos:Concept .
    {
        ?concept skos:prefLabel ?label
    } UNION {
        ?concept skos:altLabel ?label
    } UNION {
        ?concept skos:hiddenLabel ?label
    }

    FILTER (CONTAINS(LCASE(STR(?label)), LCASE(?searchTerm)))

    ?concept skos:prefLabel ?prefLabel .
    FILTER (lang(?prefLabel) = "en")
}
```

### Get All Labels

```sparql
SELECT ?concept ?labelType ?label
WHERE {
    ?concept a skos:Concept .
    {
        ?concept skos:prefLabel ?label
        BIND ("preferred" AS ?labelType)
    } UNION {
        ?concept skos:altLabel ?label
        BIND ("alternative" AS ?labelType)
    } UNION {
        ?concept skos:hiddenLabel ?label
        BIND ("hidden" AS ?labelType)
    }
}
ORDER BY ?concept ?labelType
```

### Language-Specific Retrieval

```sparql
SELECT ?concept ?label
WHERE {
    ?concept skos:prefLabel ?label .
    FILTER (lang(?label) IN ("en", "en-US", "en-GB"))
}
```

### Labels with Fallback

```sparql
SELECT ?concept ?label
WHERE {
    ?concept a skos:Concept .

    # Try English first, then any language
    OPTIONAL {
        ?concept skos:prefLabel ?enLabel .
        FILTER (lang(?enLabel) = "en")
    }
    OPTIONAL {
        ?concept skos:prefLabel ?anyLabel .
    }

    BIND (COALESCE(?enLabel, ?anyLabel) AS ?label)
}
```

---

## SHACL Validation

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

ex:LabelingShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # At least one prefLabel required
    sh:property [
        sh:path skos:prefLabel ;
        sh:minCount 1 ;
        sh:message "Concept must have at least one preferred label"
    ] ;

    # Unique language for prefLabel
    sh:property [
        sh:path skos:prefLabel ;
        sh:uniqueLang true ;
        sh:message "Only one preferred label per language allowed"
    ] ;

    # Labels must be language-tagged strings
    sh:property [
        sh:path skos:prefLabel ;
        sh:datatype rdf:langString ;
        sh:message "Preferred labels should have language tags"
    ] ;

    # No label overlap - prefLabel vs altLabel
    sh:sparql [
        sh:message "Label cannot be both preferred and alternative" ;
        sh:select """
            SELECT $this ?label
            WHERE {
                $this skos:prefLabel ?label ;
                      skos:altLabel ?label .
            }
        """
    ] ;

    # No label overlap - prefLabel vs hiddenLabel
    sh:sparql [
        sh:message "Label cannot be both preferred and hidden" ;
        sh:select """
            SELECT $this ?label
            WHERE {
                $this skos:prefLabel ?label ;
                      skos:hiddenLabel ?label .
            }
        """
    ] .
```

---

## Best Practices

1. **Always use language tags** — Essential for multilingual systems
2. **One prefLabel per language** — Enforced by SKOS semantics
3. **Use altLabel for synonyms** — Keep prefLabel canonical
4. **Use hiddenLabel sparingly** — For search optimization only
5. **Document label choices** — Use editorialNote to explain decisions
6. **Be consistent with casing** — Establish conventions (Title Case, lowercase)
7. **Include common misspellings** — Improve search recall with hiddenLabel
8. **Use typed notations** — Distinguish classification systems with datatypes
