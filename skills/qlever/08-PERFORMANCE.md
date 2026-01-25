# QLever Performance & Optimization Guide

Benchmark results, optimization strategies, and troubleshooting for maximum QLever performance.

---

## Performance Overview

QLever is designed for high-performance SPARQL processing:

| Metric | QLever | Typical Triplestore |
|--------|--------|---------------------|
| Index Speed | 1.7M triples/sec | 0.1-0.5M triples/sec |
| Query Median | 0.24s (Wikidata) | 2-5s |
| Success Rate | 98% | 79-90% |
| Scale | 1+ trillion triples | 10-100B max |

---

## Benchmark Comparisons

### DBLP Dataset (390M Triples)

**Indexing Performance:**

| Engine | Time | Speed | Index Size |
|--------|------|-------|------------|
| **QLever** | **231s** | **1.7M/s** | **8 GB** |
| Virtuoso | 561s | 0.7M/s | 13 GB |
| Oxigraph | 640s | 0.6M/s | 67 GB |
| GraphDB | 1,066s | 0.4M/s | 28 GB |
| Apache Jena | 2,392s | 0.2M/s | 42 GB |
| Blazegraph | 6,326s | <0.1M/s | 67 GB |

**Query Performance (Average of 6 Queries):**

| Engine | Avg Time | vs QLever |
|--------|----------|-----------|
| **QLever** | **0.7s** | 1.0x |
| Virtuoso | 2.2s | 3.1x slower |
| Blazegraph | 4.3s | 6.1x slower |
| GraphDB | 16.0s | 22.9x slower |

### Wikidata (18B Triples, 298 Queries)

| Metric | QLever | Official WDQS | Virtuoso |
|--------|--------|---------------|----------|
| **Success Rate** | **98%** | 79% | 89% |
| **<1 second** | **78%** | 36% | 54% |
| **1-5 seconds** | 11% | 20% | 15% |
| **>5 seconds** | 9% | 23% | 20% |
| **Failed** | 2% | 21% | 11% |
| **Avg Time** | **1.38s** | 6.98s | 4.11s |
| **Median** | **0.24s** | 2.47s | 0.74s |

### Hardware Used

All benchmarks on consumer hardware:
- **CPU**: AMD Ryzen 9 7950X (16 cores)
- **RAM**: 128 GB DDR5
- **Storage**: 7.1 TB NVMe SSD
- **Cost**: ~2,500 EUR total

---

## Query Optimization

### 1. Put Restrictive Patterns First

The order of triple patterns matters significantly:

```sparql
# GOOD: Most restrictive pattern first
SELECT ?person ?name ?employer
WHERE {
  ?person wdt:P106 wd:Q82594 .     # Profession: computer scientist (specific)
  ?person rdfs:label ?name .
  ?person wdt:P108 ?employer .
  FILTER(LANG(?name) = "en")
}

# BAD: Broad pattern first
SELECT ?person ?name ?employer
WHERE {
  ?person rdfs:label ?name .       # Matches millions of entities
  ?person wdt:P106 wd:Q82594 .
  ?person wdt:P108 ?employer .
  FILTER(LANG(?name) = "en")
}
```

### 2. Move OPTIONAL After Restrictive Patterns

```sparql
# GOOD: OPTIONAL comes last
SELECT ?item ?name ?description
WHERE {
  ?item wdt:P31 wd:Q515 .          # City (restrictive)
  ?item rdfs:label ?name .
  FILTER(LANG(?name) = "en")
  OPTIONAL { ?item schema:description ?description }
}

# BAD: OPTIONAL before restrictive patterns
SELECT ?item ?name ?description
WHERE {
  OPTIONAL { ?item schema:description ?description }
  ?item wdt:P31 wd:Q515 .
  ?item rdfs:label ?name .
}
```

### 3. Use Triple Patterns Instead of FILTER

```sparql
# GOOD: Direct pattern
SELECT ?s ?label
WHERE {
  ?s rdfs:label ?label .
}

# BAD: Pattern + unnecessary filter
SELECT ?s ?label
WHERE {
  ?s ?p ?label .
  FILTER(?p = rdfs:label)
}
```

### 4. Prefer BIND Over Complex Expressions

```sparql
# GOOD: BIND for clarity and reuse
SELECT ?item ?name ?uppername
WHERE {
  ?item rdfs:label ?name .
  BIND(UCASE(?name) AS ?uppername)
  FILTER(STRSTARTS(?uppername, "A"))
}

# LESS EFFICIENT: Repeated expressions
SELECT ?item ?name (UCASE(?name) AS ?uppername)
WHERE {
  ?item rdfs:label ?name .
  FILTER(STRSTARTS(UCASE(?name), "A"))
}
```

### 5. Use VALUES for Known Sets

```sparql
# GOOD: VALUES for small known sets
SELECT ?item ?label
WHERE {
  VALUES ?item { wd:Q1 wd:Q2 wd:Q3 wd:Q5 wd:Q8 }
  ?item rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}

# LESS EFFICIENT: FILTER with IN
SELECT ?item ?label
WHERE {
  ?item rdfs:label ?label .
  FILTER(?item IN (wd:Q1, wd:Q2, wd:Q3, wd:Q5, wd:Q8))
}
```

### 6. Be Careful with Property Paths

```sparql
# CAUTION: Unbounded paths can be expensive
SELECT ?ancestor
WHERE {
  wd:Q5 rdfs:subClassOf+ ?ancestor .  # Could traverse entire hierarchy
}

# BETTER: Add constraints
SELECT ?ancestor
WHERE {
  wd:Q5 rdfs:subClassOf+ ?ancestor .
  ?ancestor rdfs:label ?label .
  FILTER(LANG(?label) = "en")
}
LIMIT 100
```

### 7. Use LIMIT Early

```sparql
# Always add LIMIT for exploratory queries
SELECT ?s ?p ?o
WHERE { ?s ?p ?o }
LIMIT 100  # Essential for large datasets
```

---

## Indexing Optimization

### Memory Configuration

In Qleverfile:

```ini
[index]
# Memory for external sorting during index build
STXXL_MEMORY = 16G

# Parallel index construction
NUM_THREADS = 8

# Settings for large datasets
SETTINGS_JSON = {
  "prefixes": {"wd": "http://www.wikidata.org/entity/"},
  "num-triples-per-batch": 50000000
}
```

### Index Build Guidelines

| Dataset Size | STXXL_MEMORY | Time Estimate |
|--------------|--------------|---------------|
| <10M triples | 2 GB | <1 min |
| 10M-100M | 4 GB | 1-5 min |
| 100M-1B | 8 GB | 5-30 min |
| 1B-10B | 16 GB | 30 min - 3 hr |
| 10B-100B | 32 GB | 3-24 hr |
| >100B | 64 GB+ | 24+ hr |

### Parallel Indexing

```bash
# Use all available cores
qlever index --num-threads $(nproc)

# Or specify in Qleverfile
[index]
NUM_THREADS = 16
```

---

## Server Optimization

### Memory Settings

```ini
[server]
# Query execution memory pool
MEMORY_FOR_QUERIES = 32G

# Result cache size
CACHE_MAX_SIZE = 8G

# Query timeout (seconds)
TIMEOUT = 600

# Worker threads
NUM_THREADS = 8
```

### Memory Guidelines

| RAM Available | MEMORY_FOR_QUERIES | CACHE_MAX_SIZE |
|---------------|-------------------|----------------|
| 16 GB | 8 GB | 2 GB |
| 32 GB | 20 GB | 4 GB |
| 64 GB | 40 GB | 8 GB |
| 128 GB | 80 GB | 16 GB |
| 256 GB | 160 GB | 32 GB |

### Caching Strategies

QLever caches query results automatically:

```bash
# Check cache statistics
qlever status

# Clear cache (restart required)
qlever stop && qlever start
```

---

## Hardware Recommendations

### Storage

| Type | Performance | Recommendation |
|------|-------------|----------------|
| NVMe SSD | Best | Production |
| SATA SSD | Good | Development |
| HDD | Poor | Not recommended |

**Why NVMe?**
- Index scanning is I/O intensive
- Random access patterns
- Large intermediate results

### Memory

| Dataset | Minimum | Recommended |
|---------|---------|-------------|
| <100M | 4 GB | 8 GB |
| 100M-1B | 8 GB | 32 GB |
| 1B-10B | 32 GB | 64 GB |
| 10B-100B | 64 GB | 128 GB |
| >100B | 128 GB | 256 GB+ |

### CPU

- **Cores**: More cores = faster indexing
- **Clock**: Higher clock = faster single queries
- **Recommendation**: 8+ cores, modern architecture

---

## Common Performance Issues

### Query Timeouts

**Symptoms**: Query doesn't complete, timeout error

**Solutions**:
```sparql
# 1. Add LIMIT
SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 100

# 2. Be more specific
SELECT ?s ?p ?o
WHERE {
  ?s a ex:SpecificType .  # Add type constraint
  ?s ?p ?o
}
LIMIT 100

# 3. Increase timeout
[server]
TIMEOUT = 600  # 10 minutes
```

### Slow Aggregations

**Symptoms**: COUNT, GROUP BY queries are slow

**Solutions**:
```sparql
# 1. Filter before aggregating
SELECT ?type (COUNT(?item) AS ?count)
WHERE {
  ?item a ?type .
  ?item wdt:P31 wd:Q5 .  # Filter to humans
}
GROUP BY ?type

# 2. Use subqueries
SELECT ?type ?count
WHERE {
  {
    SELECT ?type (COUNT(?item) AS ?count)
    WHERE { ?item a ?type }
    GROUP BY ?type
    HAVING (COUNT(?item) > 1000)  # Filter small groups
  }
}
ORDER BY DESC(?count)
LIMIT 20
```

### Memory Errors

**Symptoms**: Out of memory, query killed

**Solutions**:
```ini
# 1. Increase memory
[server]
MEMORY_FOR_QUERIES = 64G

# 2. Reduce result size
LIMIT 10000  # Instead of unlimited

# 3. Use pagination
OFFSET 0 LIMIT 1000  # First page
OFFSET 1000 LIMIT 1000  # Second page
```

### Property Path Explosions

**Symptoms**: Queries with `*` or `+` hang

**Solutions**:
```sparql
# 1. Add depth limits via UNION
SELECT ?item ?ancestor
WHERE {
  { ?item rdfs:subClassOf ?ancestor }
  UNION
  { ?item rdfs:subClassOf/rdfs:subClassOf ?ancestor }
  UNION
  { ?item rdfs:subClassOf/rdfs:subClassOf/rdfs:subClassOf ?ancestor }
}

# 2. Add result constraints
SELECT ?item ?ancestor
WHERE {
  ?item rdfs:subClassOf+ ?ancestor .
  ?ancestor a owl:Class .  # Only named classes
}
LIMIT 1000
```

---

## Debugging Queries

### Query Analysis

QLever UI provides query analysis:

1. Execute query
2. Click "Show Query Analysis"
3. Review execution plan

### Explain Mode

```bash
# Add &action=explain to URL
curl "https://qlever.dev/api/wikidata?action=explain&query=..."
```

### Common Debug Patterns

```sparql
# Test subpatterns incrementally
# Step 1: Does base pattern return results?
SELECT * WHERE { ?s wdt:P31 wd:Q5 } LIMIT 10

# Step 2: Add next pattern
SELECT * WHERE {
  ?s wdt:P31 wd:Q5 ;
     rdfs:label ?label .
} LIMIT 10

# Step 3: Add filters
SELECT * WHERE {
  ?s wdt:P31 wd:Q5 ;
     rdfs:label ?label .
  FILTER(LANG(?label) = "en")
} LIMIT 10
```

---

## Monitoring

### Server Status

```bash
# Check QLever status
qlever status

# View logs
qlever log
qlever log -f  # Follow

# Check memory usage
top -p $(pgrep -f ServerMain)
```

### Query Statistics

Via API:
```bash
curl "https://localhost:7001/?action=cache-stats"
```

---

## Comparison Summary

### vs Virtuoso

| Aspect | QLever | Virtuoso |
|--------|--------|----------|
| Query Speed | 3-5x faster | Baseline |
| Index Size | Smaller | Larger |
| SPARQL Compliance | Full 1.1 | Full 1.1 |
| Text Search | ql: predicates | bif:contains |
| Commercial | QLeverize | OpenLink |

### vs Blazegraph

| Aspect | QLever | Blazegraph |
|--------|--------|------------|
| Query Speed | 5-10x faster | Baseline |
| Scale | Trillions | ~100B max |
| Maintenance | Active | Unmaintained |
| Updates | Full SPARQL Update | Full |

### vs GraphDB

| Aspect | QLever | GraphDB |
|--------|--------|---------|
| Query Speed | 10-20x faster | Baseline |
| License | Apache 2.0 | Commercial |
| Reasoning | No | Yes (RDFS++, OWL) |
| Enterprise | QLeverize | Ontotext |

---

## Best Practices Checklist

### Query Writing

- [ ] Put most restrictive patterns first
- [ ] Move OPTIONAL to end
- [ ] Use direct patterns instead of FILTER
- [ ] Add LIMIT for exploratory queries
- [ ] Use VALUES for small known sets
- [ ] Constrain property paths

### Server Configuration

- [ ] Adequate MEMORY_FOR_QUERIES
- [ ] Appropriate TIMEOUT setting
- [ ] Enable caching (CACHE_MAX_SIZE)
- [ ] Match NUM_THREADS to cores

### Hardware

- [ ] NVMe SSD storage
- [ ] Sufficient RAM for dataset
- [ ] Modern multi-core CPU

### Monitoring

- [ ] Check query logs regularly
- [ ] Monitor memory usage
- [ ] Track query success rates

---

## Resources

- [QLever Performance Wiki](https://github.com/ad-freiburg/qlever/wiki/QLever-performance-evaluation-and-comparison-to-other-SPARQL-engines)
- [Wikidata Benchmarking Report](https://www.wikidata.org/wiki/Wikidata:Scaling_Wikidata/Benchmarking/Final_Report)
- [Sparqloscope Benchmark (ISWC 2025)](https://link.springer.com/chapter/10.1007/978-3-032-09530-5_2)
- [Learning SPARQL (DuCharme)](https://www.oreilly.com/library/view/learning-sparql/9781449371449/) - Query optimization chapter
