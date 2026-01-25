# SKOS and AI/LLM Integration

> "The need to know a URL for a given resource has been a major roadblock in the adoption of knowledge graphs." — Kurt Cagle

---

## The Challenge

Large Language Models (LLMs) and AI agents face a fundamental problem when working with knowledge graphs:

1. **URIs are opaque** — LLMs don't know that `ex:Cat` means "cat"
2. **Ontology knowledge required** — Queries assume understanding of schema
3. **Context fragmentation** — Taxonomies scattered across systems
4. **Label diversity** — Multiple vocabularies use different label properties

SKOS taxonomies, when properly designed, can bridge this gap.

---

## Cagle's Context-Free SPARQL Pattern

### The Problem

Traditional SPARQL requires knowing exact predicates and URIs:

```sparql
# Brittle query - requires knowing ex:Cat URI
SELECT ?label WHERE {
    ex:Cat skos:prefLabel ?label .
}
```

### The Solution: Label-Based Discovery

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Context-free query - works with human-readable input
SELECT ?concept ?label ?definition
WHERE {
    VALUES ?searchTerm { "artificial intelligence" }

    # Search across multiple label properties
    ?concept a skos:Concept .
    {
        ?concept skos:prefLabel ?matchLabel
    } UNION {
        ?concept skos:altLabel ?matchLabel
    } UNION {
        ?concept skos:hiddenLabel ?matchLabel
    }

    FILTER (CONTAINS(LCASE(STR(?matchLabel)), LCASE(?searchTerm)))

    # Return canonical label
    ?concept skos:prefLabel ?label .
    OPTIONAL { ?concept skos:definition ?definition }

    FILTER (lang(?label) = "en")
}
LIMIT 20
```

---

## The Label Problem (Multi-Vocabulary)

Different ontologies use different label predicates:

| Vocabulary | Label Property |
|------------|----------------|
| RDFS | `rdfs:label` |
| SKOS | `skos:prefLabel`, `skos:altLabel` |
| Dublin Core | `dcterms:title` |
| Schema.org | `schema:name` |
| FOAF | `foaf:name` |

### Universal Label Query

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?resource ?label
WHERE {
    VALUES ?labelProp {
        rdfs:label
        skos:prefLabel
        skos:altLabel
        schema:name
        dct:title
    }

    ?resource ?labelProp ?label .
    FILTER (CONTAINS(LCASE(STR(?label)), LCASE("search term")))
}
```

### Property Path Alternative

```sparql
SELECT ?resource ?label
WHERE {
    ?resource rdfs:label|skos:prefLabel|skos:altLabel|schema:name|dct:title ?label .
    FILTER (lang(?label) = "en" || lang(?label) = "")
}
```

---

## LLM-Friendly Taxonomy API Pattern

### Architecture

```
User Query → LLM → API Endpoint → Parameterized SPARQL → Results → LLM → Response
```

### Parameterized Endpoint Example

```javascript
// Express endpoint for LLM consumption
app.get('/api/taxonomy/search', async (req, res) => {
    const { term, scheme, lang = 'en' } = req.query;

    const sparql = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

        SELECT ?concept ?label ?definition ?broader ?narrower
        WHERE {
            ?concept a skos:Concept ;
                     skos:inScheme <${scheme}> .

            {
                ?concept skos:prefLabel ?matchLabel
            } UNION {
                ?concept skos:altLabel ?matchLabel
            }

            FILTER (CONTAINS(LCASE(STR(?matchLabel)), LCASE("${term}")))

            ?concept skos:prefLabel ?label .
            OPTIONAL { ?concept skos:definition ?definition }
            OPTIONAL { ?concept skos:broader/skos:prefLabel ?broader }
            OPTIONAL { ?concept skos:narrower/skos:prefLabel ?narrower }

            FILTER (lang(?label) = "${lang}")
        }
        LIMIT 10
    `;

    const results = await executeSparql(sparql);
    res.json(formatForLLM(results));
});
```

### LLM-Optimized Response Format

```json
{
    "query": "artificial intelligence",
    "results": [
        {
            "concept": "http://example.org/ArtificialIntelligence",
            "label": "Artificial Intelligence",
            "definition": "The theory and development of computer systems...",
            "broader": ["Computer Science"],
            "narrower": ["Machine Learning", "Neural Networks", "NLP"],
            "related": ["Robotics", "Cognitive Science"]
        }
    ],
    "sparql": "SELECT ?concept...",
    "source": "http://example.org/graph/taxonomy"
}
```

---

## RAG with Taxonomies

### Retrieval-Augmented Generation Pattern

```python
def taxonomy_rag(user_question: str, taxonomy_endpoint: str) -> str:
    # 1. Extract key concepts from question
    concepts = extract_concepts(user_question)

    # 2. Query taxonomy for each concept
    context = []
    for concept in concepts:
        taxonomy_info = query_taxonomy(concept, taxonomy_endpoint)
        context.append(taxonomy_info)

    # 3. Build prompt with taxonomy context
    prompt = f"""
    User Question: {user_question}

    Relevant Taxonomy Information:
    {format_context(context)}

    Based on the taxonomy information above, please answer the question.
    """

    # 4. Send to LLM
    return llm.complete(prompt)
```

### Taxonomy Context Template

```
Concept: Artificial Intelligence
URI: http://example.org/ArtificialIntelligence
Definition: The theory and development of computer systems able to perform tasks that normally require human intelligence.
Broader: Computer Science
Narrower: Machine Learning, Neural Networks, Natural Language Processing, Computer Vision
Related: Robotics, Cognitive Science
Scope: Use for general AI concepts. For specific techniques, use narrower terms.
```

---

## Concept Disambiguation

### Using Taxonomy Hierarchy for Disambiguation

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

# Find all concepts matching "Mercury"
SELECT ?concept ?label ?scheme ?broader ?definition
WHERE {
    ?concept a skos:Concept ;
             skos:prefLabel ?label ;
             skos:inScheme ?scheme .

    FILTER (LCASE(STR(?label)) = "mercury")

    OPTIONAL { ?concept skos:broader/skos:prefLabel ?broader }
    OPTIONAL { ?concept skos:definition ?definition }
}

# Results help disambiguate:
# Mercury (broader: Planet) - the planet
# Mercury (broader: Element) - the chemical element
# Mercury (broader: RomanGod) - the deity
# Mercury (broader: Automobile) - the car brand
```

### Disambiguation Prompt

```
The term "Mercury" matches multiple concepts in the taxonomy:

1. Mercury (Planet)
   - Part of: Astronomy > Solar System > Planets
   - Definition: The smallest planet in our solar system...

2. Mercury (Element)
   - Part of: Chemistry > Elements > Metals
   - Definition: A chemical element with symbol Hg...

3. Mercury (Deity)
   - Part of: Mythology > Roman Mythology > Gods
   - Definition: The Roman god of commerce...

Based on the user's context, which Mercury is most relevant?
```

---

## Taxonomy-Guided Classification

### Using SKOS for Content Classification

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

# Get all leaf concepts (no narrower terms) for classification
SELECT ?concept ?label ?path
WHERE {
    ?concept a skos:Concept ;
             skos:inScheme ex:ProductTaxonomy ;
             skos:prefLabel ?label .

    # Leaf nodes only
    FILTER NOT EXISTS { ?concept skos:narrower ?child }

    # Build path
    {
        SELECT ?concept (GROUP_CONCAT(?ancestorLabel; separator=" > ") AS ?path)
        WHERE {
            ?concept skos:broader+ ?ancestor .
            ?ancestor skos:prefLabel ?ancestorLabel .
            FILTER (lang(?ancestorLabel) = "en")
        }
        GROUP BY ?concept
    }
}
```

### Classification Prompt

```
Classify the following product into the taxonomy:

Product: "MacBook Pro 16-inch M3 Laptop"

Available categories:
- Electronics > Computers > Laptops > Gaming Laptops
- Electronics > Computers > Laptops > Business Laptops
- Electronics > Computers > Laptops > Ultrabooks
- Electronics > Computers > Desktops
- Electronics > Phones > Smartphones

Select the most appropriate category path.
```

---

## SHACL-Described Parameters

Use SHACL to document query parameters for AI:

```turtle
ex:TaxonomySearchShape a sh:NodeShape ;
    rdfs:label "Taxonomy Search Parameters"@en ;
    rdfs:comment "Parameters for searching the product taxonomy"@en ;

    sh:property [
        sh:path ex:searchTerm ;
        sh:name "searchTerm" ;
        sh:description "The term to search for in concept labels"@en ;
        sh:datatype xsd:string ;
        sh:minLength 2 ;
        sh:maxLength 100 ;
        sh:minCount 1
    ] ;

    sh:property [
        sh:path ex:language ;
        sh:name "language" ;
        sh:description "Language code for results (ISO 639-1)"@en ;
        sh:datatype xsd:string ;
        sh:in ("en" "de" "fr" "es") ;
        sh:defaultValue "en"
    ] ;

    sh:property [
        sh:path ex:maxResults ;
        sh:name "maxResults" ;
        sh:description "Maximum number of results to return"@en ;
        sh:datatype xsd:integer ;
        sh:minInclusive 1 ;
        sh:maxInclusive 100 ;
        sh:defaultValue 10
    ] .
```

---

## Best Practices for AI Integration

1. **Design for label discovery** — Make taxonomies searchable by human terms
2. **Provide rich context** — Include definitions, scope notes, examples
3. **Build hierarchy paths** — Show full classification context
4. **Use multiple label types** — prefLabel, altLabel, hiddenLabel
5. **Document with SHACL** — Describe API parameters formally
6. **Return structured responses** — JSON with metadata for LLM parsing
7. **Include provenance** — Source URIs, SPARQL queries for verification
8. **Cache taxonomy data** — Taxonomies change less frequently than instances
9. **Handle multilingual** — Support language selection and fallbacks
10. **Enable disambiguation** — Provide context when terms are ambiguous

---

## Resources

- [Writing Context-Free SPARQL for AI](https://ontologist.substack.com/p/writing-context-free-sparql-for-ai) — Kurt Cagle
- [Using SHACL and AI for Creating Queries](https://ontologist.substack.com/p/using-shacl-and-ai-for-creating-queries) — Kurt Cagle
- [The Role of the Ontologist in the Age of AI](https://ontologist.substack.com/p/the-role-of-the-ontologist-in-the) — Kurt Cagle
