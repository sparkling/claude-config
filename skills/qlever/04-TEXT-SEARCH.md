# QLever SPARQL+Text Search Guide

QLever's unique capability: combining SPARQL queries with full-text search. Query semantic relationships AND textual content simultaneously.

---

## Overview

QLever extends SPARQL with two special predicates for text search:

| Predicate | Purpose |
|-----------|---------|
| `ql:contains-word` | Match text records containing specific words/phrases |
| `ql:contains-entity` | Match text records mentioning specific RDF entities |

**Namespace**: `PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>`

---

## How Text Search Works

### The Text Corpus

QLever can index text from:

1. **RDF Literals**: Text values from your RDF data (default: `from-literals`)
2. **External Text Records**: Wikipedia articles, papers, documents (custom text files)
3. **Both**: Combined indexing

### Entity Linking

Text records are linked to RDF entities through entity recognition:
- Named entity mentions in text → RDF entity IRIs
- Enables queries like "find papers mentioning Einstein that discuss relativity"

---

## Basic Text Queries

### Search by Words

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>

# Find text records containing "machine learning"
SELECT ?text
WHERE {
  ?text ql:contains-word "machine learning" .
}
LIMIT 20
```

### Wildcard Search

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>

# Match words starting with "learn" (learns, learning, learned, etc.)
SELECT ?text
WHERE {
  ?text ql:contains-word "learn*" .
}
LIMIT 20

# Match "artificial" followed by any word starting with "intell"
SELECT ?text
WHERE {
  ?text ql:contains-word "artificial intell*" .
}
LIMIT 20
```

### Multiple Word Patterns

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>

# All words must appear (implicit AND)
SELECT ?text
WHERE {
  ?text ql:contains-word "neural" .
  ?text ql:contains-word "network" .
}
LIMIT 20

# Same as above, more efficient
SELECT ?text
WHERE {
  ?text ql:contains-word "neural network" .
}
LIMIT 20
```

---

## Entity-Based Text Search

### Find Text Mentioning Entities

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>

# Find texts mentioning Albert Einstein
SELECT ?text
WHERE {
  ?text ql:contains-entity wd:Q937 .  # Einstein's Wikidata ID
}
LIMIT 20
```

### Combine Entity and Word Search

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>

# Find texts mentioning Einstein AND containing "relativity"
SELECT ?text
WHERE {
  ?text ql:contains-entity wd:Q937 .
  ?text ql:contains-word "relativity" .
}
LIMIT 20
```

### Find Co-occurring Entities

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>

# Find texts mentioning both Einstein and physics concepts
SELECT ?text ?concept
WHERE {
  ?text ql:contains-entity wd:Q937 .      # Einstein
  ?text ql:contains-entity ?concept .
  ?concept wdt:P31 wd:Q11862829 .         # Physical concept
}
LIMIT 50
```

---

## Advanced Patterns

### Count Mentions

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Which scientists are mentioned most with "Nobel Prize"?
SELECT ?scientist ?name (COUNT(?text) AS ?mentions)
WHERE {
  ?text ql:contains-word "Nobel Prize" .
  ?text ql:contains-entity ?scientist .
  ?scientist wdt:P31 wd:Q5 ;             # Human
             wdt:P106 wd:Q901 .          # Scientist
  ?scientist rdfs:label ?name .
  FILTER (LANG(?name) = "en")
}
GROUP BY ?scientist ?name
ORDER BY DESC(?mentions)
LIMIT 20
```

### Astronaut Moon Walk Example

Classic QLever example from the original paper:

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Find astronauts mentioned with "moon" and words starting with "walk"
SELECT ?astronaut ?name (COUNT(?text) AS ?mentions)
WHERE {
  ?text ql:contains-entity ?astronaut .
  ?text ql:contains-word "moon walk*" .
  ?astronaut wdt:P31 wd:Q5 ;             # Human
             wdt:P106 wd:Q11631 .        # Astronaut
  ?astronaut rdfs:label ?name .
  FILTER (LANG(?name) = "en")
}
GROUP BY ?astronaut ?name
ORDER BY DESC(?mentions)
LIMIT 10
```

### Discover Entity Relationships Through Text

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# Find companies mentioned with "bankruptcy" in text
SELECT ?company ?name (COUNT(?text) AS ?mentions)
WHERE {
  ?text ql:contains-word "bankruptcy" .
  ?text ql:contains-entity ?company .
  ?company wdt:P31/wdt:P279* wd:Q783794 .  # Company or subclass
  ?company rdfs:label ?name .
  FILTER (LANG(?name) = "en")
}
GROUP BY ?company ?name
ORDER BY DESC(?mentions)
LIMIT 20
```

---

## Setting Up Text Search

### Enable Text Indexing

In your Qleverfile:

```ini
[index]
INPUT_FILES = data.ttl
TEXT_INDEX = from-literals

[server]
# Enable when starting
```

### Text Index Modes

| Mode | Description |
|------|-------------|
| `from-literals` | Index all RDF literal values (default) |
| `from-text-records` | Index external text files with entity annotations |
| `from-all` | Both literals and text records |

### Start Server with Text Index

```bash
# Build with text index
qlever index --text-index from-literals

# Or add to existing index
qlever add-text-index

# Start with text search enabled
qlever start --use-text-index
```

---

## Custom Text Records Format

For indexing external text (Wikipedia articles, documents, etc.):

### Wordsfile Format

Tab-separated: `word  is_entity  record_id  score`

```
Fleming     0   17  1
discovered  0   17  1
penicillin  0   17  1
<Alexander_Fleming>  1   17  1
```

- `word`: The token (or entity IRI in angle brackets)
- `is_entity`: 0 for regular words, 1 for entities
- `record_id`: Unique identifier for the text record
- `score`: Relevance score (typically 1)

### Docsfile Format

Tab-separated: `record_id  text_content`

```
17  Alexander Fleming discovered penicillin in 1928.
```

### Configuration

```ini
[index]
INPUT_FILES = data.ttl
TEXT_INDEX = from-text-records
WORDS_FILE = words.txt
DOCS_FILE = docs.txt
```

---

## Query Optimization

### Put Restrictive Patterns First

```sparql
# GOOD: Filter by type first, then text search
SELECT ?person ?text
WHERE {
  ?person a ex:Scientist .              # Restrictive pattern first
  ?text ql:contains-entity ?person .
  ?text ql:contains-word "discovery" .
}

# BAD: Unrestricted text search first
SELECT ?person ?text
WHERE {
  ?text ql:contains-word "discovery" .  # Matches many records
  ?text ql:contains-entity ?person .
  ?person a ex:Scientist .
}
```

### Use Specific Words

```sparql
# GOOD: Specific phrase
SELECT ?text WHERE {
  ?text ql:contains-word "machine learning algorithm" .
}

# LESS EFFICIENT: Common words
SELECT ?text WHERE {
  ?text ql:contains-word "the" .  # Too broad
}
```

### Combine with LIMIT

```sparql
# Always use LIMIT for exploratory queries
SELECT ?text ?entity
WHERE {
  ?text ql:contains-word "breakthrough" .
  ?text ql:contains-entity ?entity .
}
LIMIT 100
```

---

## Use Cases

### 1. Knowledge Graph + Document Search

Query structured data AND unstructured text:

```sparql
PREFIX ql: <http://qlever.cs.uni-freiburg.de/builtin/>

# Find entities from the KG mentioned in documents about AI
SELECT ?entity ?type ?textCount
WHERE {
  ?text ql:contains-word "artificial intelligence" .
  ?text ql:contains-entity ?entity .
  ?entity a ?type .
}
GROUP BY ?entity ?type
ORDER BY DESC(?textCount)
```

### 2. Entity Discovery

Find entities not yet in your KG:

```sparql
# Find company names mentioned with "startup" that aren't in Wikidata
SELECT DISTINCT ?text
WHERE {
  ?text ql:contains-word "startup" .
  ?text ql:contains-word "founded" .
  FILTER NOT EXISTS {
    ?text ql:contains-entity ?entity .
    ?entity wdt:P31 wd:Q783794 .  # Known company
  }
}
LIMIT 50
```

### 3. Sentiment/Topic Analysis Prep

Extract text for downstream NLP:

```sparql
# Get all text about specific topics for sentiment analysis
SELECT ?text
WHERE {
  ?text ql:contains-word "climate change" .
}
```

---

## Comparison with Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **QLever Text** | Integrated with SPARQL, entity-aware | QLever-specific |
| **Lucene/Solr** | Mature, full-featured | Separate system |
| **SPARQL CONTAINS()** | Standard SPARQL | Very slow, no indexing |
| **Virtuoso bif:contains** | In-database | Virtuoso-specific |

QLever's text search is unique because it:
- Integrates seamlessly with SPARQL
- Links text mentions to RDF entities
- Maintains QLever's performance characteristics

---

## Resources

### Documentation
- [QLever SPARQL+Text Guide](https://github.com/ad-freiburg/qlever/blob/master/docs/sparql_plus_text.md)

### Papers
- [QLever: A Query Engine for Efficient SPARQL+Text Search](https://dl.acm.org/doi/10.1145/3132847.3132921) (CIKM 2017)

### Examples
- QLever Demo UI includes text search examples for Wikipedia-linked datasets
