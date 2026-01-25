# SKOS Documentation Properties

> "Good taxonomies are self-documenting—every concept carries its own definition, scope, and usage guidance."

---

## Documentation Overview

SKOS provides rich documentation capabilities through a hierarchy of note properties:

```
skos:note (parent)
├── skos:definition
├── skos:scopeNote
├── skos:example
├── skos:historyNote
├── skos:editorialNote
└── skos:changeNote
```

All note properties have `skos:Concept` as their implicit domain and take literal values (typically language-tagged strings).

---

## Note Properties

### skos:definition

The formal, complete meaning of a concept:

```turtle
ex:KnowledgeGraph a skos:Concept ;
    skos:prefLabel "Knowledge Graph"@en ;
    skos:definition """A knowledge graph is a structured representation of facts,
        consisting of entities, relationships, and semantic descriptions,
        organized as a graph where nodes represent entities and edges
        represent relationships between them."""@en ;
    skos:definition """Ein Wissensgraph ist eine strukturierte Darstellung von
        Fakten, bestehend aus Entitäten, Beziehungen und semantischen
        Beschreibungen."""@de .
```

**Best practices:**
- Write complete, standalone definitions
- Avoid circular definitions
- Provide definitions in all supported languages

### skos:scopeNote

Usage guidance—when and how to apply the concept:

```turtle
ex:Cat a skos:Concept ;
    skos:prefLabel "Cat"@en ;
    skos:definition "A small domesticated carnivorous mammal"@en ;

    skos:scopeNote """Use for domestic cats (Felis catus) only.
        For wild cats, use the broader term 'Felidae'.
        For big cats (lions, tigers), use 'Panthera'."""@en ;

    skos:scopeNote """Applies to content about cats as pets,
        cat care, cat breeds, and domestic cat behavior."""@en .
```

**Common uses:**
- Distinguish from similar concepts
- Specify included/excluded topics
- Provide classification guidance

### skos:example

Illustrative instances or applications:

```turtle
ex:Laptop a skos:Concept ;
    skos:prefLabel "Laptop"@en ;
    skos:example "MacBook Pro, ThinkPad X1, Dell XPS"@en ;
    skos:example "Gaming laptops, ultrabooks, Chromebooks"@en .

ex:Renaissance a skos:Concept ;
    skos:prefLabel "Renaissance"@en ;
    skos:example "Leonardo da Vinci, Michelangelo, Raphael"@en ;
    skos:example "The Sistine Chapel, Mona Lisa, The Birth of Venus"@en .
```

### skos:historyNote

Historical context and evolution:

```turtle
ex:ComputerScience a skos:Concept ;
    skos:prefLabel "Computer Science"@en ;
    skos:historyNote """Emerged as a distinct discipline in the 1950s and 1960s,
        originally called 'computing science' in British usage.
        Developed from mathematics, electrical engineering,
        and information theory."""@en .

ex:Yugoslavia a skos:Concept ;
    skos:prefLabel "Yugoslavia"@en ;
    skos:historyNote """Former country that existed from 1918-1992 (as a kingdom)
        and 1943-2003 (as socialist/federal states).
        Now dissolved into seven independent nations."""@en .
```

### skos:editorialNote

Internal notes for taxonomy maintainers:

```turtle
ex:MachineLearning a skos:Concept ;
    skos:prefLabel "Machine Learning"@en ;

    skos:editorialNote """TODO: Review relationship with 'Artificial Intelligence'.
        Consider adding narrower terms for supervised/unsupervised learning.
        Last reviewed: 2024-03-15 by JSmith."""@en ;

    skos:editorialNote """Candidate for splitting into multiple concepts
        in next major version. Discussed at TaxComm meeting 2024-Q2."""@en .
```

**Note:** Editorial notes are typically not exposed to end users.

### skos:changeNote

Documentation of modifications:

```turtle
ex:CloudComputing a skos:Concept ;
    skos:prefLabel "Cloud Computing"@en ;

    skos:changeNote "2020-01: Concept created"@en ;
    skos:changeNote "2021-06: Added narrower terms for IaaS, PaaS, SaaS"@en ;
    skos:changeNote "2023-09: Updated definition to include edge computing"@en ;
    skos:changeNote "2024-03: Added German translations"@en .
```

### skos:note (General)

Generic notes that don't fit other categories:

```turtle
ex:QuantumComputing a skos:Concept ;
    skos:prefLabel "Quantum Computing"@en ;
    skos:note """This is an emerging field with rapidly evolving terminology.
        Definitions may need frequent updates."""@en .
```

---

## Comprehensive Documentation Example

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .

ex:ArtificialIntelligence a skos:Concept ;
    # Labels
    skos:prefLabel "Artificial Intelligence"@en ;
    skos:prefLabel "Künstliche Intelligenz"@de ;
    skos:altLabel "AI"@en ;
    skos:altLabel "KI"@de ;
    skos:altLabel "Machine Intelligence"@en ;
    skos:hiddenLabel "A.I."@en ;

    # Notation
    skos:notation "CS-AI-001" ;

    # Formal definition
    skos:definition """The theory and development of computer systems able to
        perform tasks that normally require human intelligence, such as visual
        perception, speech recognition, decision-making, and translation
        between languages."""@en ;

    skos:definition """Die Theorie und Entwicklung von Computersystemen, die
        Aufgaben ausführen können, die normalerweise menschliche Intelligenz
        erfordern."""@de ;

    # Scope guidance
    skos:scopeNote """Use for general AI concepts, AI theory, and AI history.
        For specific AI techniques, prefer narrower terms:
        - Machine Learning for learning algorithms
        - Neural Networks for connectionist approaches
        - Natural Language Processing for language tasks
        - Computer Vision for image/video processing"""@en ;

    # Examples
    skos:example "ChatGPT, AlphaGo, Tesla Autopilot, Siri"@en ;
    skos:example "Expert systems, recommendation engines, autonomous vehicles"@en ;

    # History
    skos:historyNote """The term 'Artificial Intelligence' was coined at the
        Dartmouth Conference in 1956 by John McCarthy. The field has experienced
        multiple 'AI winters' (funding/interest drops) and 'AI summers'
        (breakthroughs and renewed interest)."""@en ;

    # Editorial
    skos:editorialNote """High-priority concept. Review annually.
        Last major review: 2024-01 by AI Working Group.
        Consider adding 'Generative AI' as narrower term."""@en ;

    # Change log
    skos:changeNote "2015-01: Concept created"@en ;
    skos:changeNote "2017-06: Added deep learning examples"@en ;
    skos:changeNote "2020-03: Updated definition for modern AI"@en ;
    skos:changeNote "2023-12: Added German translations"@en ;
    skos:changeNote "2024-03: Added generative AI examples"@en ;

    # Structure
    skos:inScheme ex:ComputerScienceTaxonomy ;
    skos:broader ex:ComputerScience ;
    skos:narrower ex:MachineLearning, ex:NLP, ex:ComputerVision ;
    skos:related ex:Robotics, ex:CognitiveScience .
```

---

## Dublin Core Integration

Complement SKOS notes with Dublin Core for richer metadata:

```turtle
@prefix dct: <http://purl.org/dc/terms/> .

ex:Concept1 a skos:Concept ;
    skos:prefLabel "Example Concept"@en ;

    # Dublin Core additions
    dct:creator <http://example.org/people/taxonomist> ;
    dct:contributor <http://example.org/people/reviewer> ;
    dct:created "2020-01-15"^^xsd:date ;
    dct:modified "2024-06-20"^^xsd:date ;
    dct:source <http://example.org/sources/reference-doc> ;
    dct:language "en" ;
    dct:rights "CC BY 4.0" ;
    dct:audience "Data scientists, ML engineers" .
```

---

## SPARQL Patterns

### Find Concepts with Definitions

```sparql
SELECT ?concept ?label ?definition
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label ;
             skos:definition ?definition .
    FILTER (lang(?label) = "en" && lang(?definition) = "en")
}
```

### Find Concepts Missing Documentation

```sparql
SELECT ?concept ?label ?missing
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label .
    FILTER (lang(?label) = "en")

    {
        FILTER NOT EXISTS { ?concept skos:definition ?d }
        BIND ("definition" AS ?missing)
    } UNION {
        FILTER NOT EXISTS { ?concept skos:scopeNote ?s }
        BIND ("scopeNote" AS ?missing)
    }
}
ORDER BY ?concept
```

### Get Change History

```sparql
SELECT ?concept ?label ?change
WHERE {
    ?concept skos:prefLabel ?label ;
             skos:changeNote ?change .
    FILTER (lang(?label) = "en")
}
ORDER BY ?concept ?change
```

### Find Editorial Tasks

```sparql
SELECT ?concept ?label ?task
WHERE {
    ?concept skos:prefLabel ?label ;
             skos:editorialNote ?task .
    FILTER (lang(?label) = "en")
    FILTER (CONTAINS(LCASE(?task), "todo") ||
            CONTAINS(LCASE(?task), "review") ||
            CONTAINS(LCASE(?task), "consider"))
}
```

---

## SHACL Validation

```turtle
ex:DocumentationShape a sh:NodeShape ;
    sh:targetClass skos:Concept ;

    # Definition required
    sh:property [
        sh:path skos:definition ;
        sh:minCount 1 ;
        sh:severity sh:Warning ;
        sh:message "Concept should have at least one definition"
    ] ;

    # Definition should have language tag
    sh:property [
        sh:path skos:definition ;
        sh:datatype rdf:langString ;
        sh:message "Definitions should have language tags"
    ] ;

    # Scope note recommended for leaf concepts
    sh:sparql [
        sh:severity sh:Info ;
        sh:message "Leaf concepts should have scope notes" ;
        sh:select """
            SELECT $this
            WHERE {
                $this a skos:Concept .
                FILTER NOT EXISTS { $this skos:narrower ?child }
                FILTER NOT EXISTS { $this skos:scopeNote ?note }
            }
        """
    ] ;

    # Notes should not be empty
    sh:property [
        sh:path skos:note ;
        sh:minLength 10 ;
        sh:message "Notes should contain meaningful content"
    ] .
```

---

## Best Practices

1. **Write self-contained definitions** — Don't assume reader knows related concepts
2. **Provide multilingual documentation** — At least labels and definitions
3. **Use scope notes liberally** — Help users classify correctly
4. **Maintain change logs** — Track evolution for auditing
5. **Keep editorial notes internal** — Don't expose to end users
6. **Review regularly** — Schedule periodic documentation reviews
7. **Link to sources** — Reference authoritative definitions
8. **Be concise but complete** — Avoid unnecessary verbosity
