# SHACL for AI Integration

> "LLMs are not databases. They lack ACID properties—atomicity, consistency, isolation, and durability." — Kurt Cagle

SHACL provides the bridge between natural language AI systems and structured knowledge graphs.

---

## The Core Problem

Traditional approaches to AI + Knowledge Graphs face challenges:

1. **LLMs can't query directly**: They don't understand SPARQL without extensive context
2. **Full ontology context is expensive**: Loading entire schemas consumes tokens
3. **Data quality is inconsistent**: LLM-generated data needs validation
4. **Security concerns**: Direct database access is risky

---

## Cagle's Architecture: SHACL as the Bridge

```
User Query → LLM → SHACL Schema → SPARQL Generation → Knowledge Graph → Results → LLM → Response
```

### Key Principles

1. **SHACL describes free variables**: Schema defines query parameters
2. **LLMs need only schemas, not full ontologies**: Compact context
3. **Security through indirection**: No direct database access
4. **Validation ensures quality**: SHACL validates LLM output

---

## SHACL for Query Parameter Description

### Describing API Parameters

```turtle
ex:PersonQueryParams a sh:NodeShape ;
    sh:property [
        sh:path ex:nameFilter ;
        sh:name "nameFilter" ;
        sh:description "Substring to search in person names" ;
        sh:datatype xsd:string ;
        sh:minCount 0 ;
        sh:maxCount 1
    ] ;
    sh:property [
        sh:path ex:minAge ;
        sh:name "minAge" ;
        sh:description "Minimum age filter" ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150
    ] ;
    sh:property [
        sh:path ex:limit ;
        sh:name "limit" ;
        sh:description "Maximum results to return" ;
        sh:datatype xsd:integer ;
        sh:defaultValue 20 ;
        sh:minInclusive 1 ;
        sh:maxInclusive 1000
    ] .
```

### Associated Query Template

```sparql
# Template bound to PersonQueryParams
SELECT ?person ?name ?age
WHERE {
    ?person a ex:Person ;
            ex:name ?name .
    OPTIONAL { ?person ex:age ?age }

    # Applied if nameFilter provided
    FILTER (!BOUND($nameFilter) || CONTAINS(LCASE(?name), LCASE($nameFilter)))

    # Applied if minAge provided
    FILTER (!BOUND($minAge) || ?age >= $minAge)
}
ORDER BY ?name
LIMIT $limit
```

---

## LLM Workflow Patterns

### Pattern 1: Schema-Guided Query Generation

```
1. User: "Find all employees over 30 in Engineering"

2. System provides SHACL schema to LLM:
   - EmployeeShape with properties: name, age, department
   - DepartmentShape with properties: name, code

3. LLM generates SPARQL based on schema understanding

4. System executes query, returns results

5. LLM formats results in natural language
```

### Pattern 2: SHACL-Validated Data Entry

```
1. User: "Add a new employee: John Smith, age 28, Engineering"

2. LLM generates RDF triples:
   ex:employee_123 a ex:Employee ;
       ex:name "John Smith" ;
       ex:age 28 ;
       ex:department ex:Engineering .

3. System validates against SHACL shapes

4. If valid: Store data
   If invalid: Return errors to LLM for correction
```

### Pattern 3: Shape-Driven Conversation

```
1. System loads SHACL shapes for domain

2. LLM uses sh:name, sh:description for understanding

3. User asks natural language questions

4. LLM maps questions to shape properties

5. System generates and executes queries
```

---

## SHACL Schema for LLM Consumption

### Minimal Schema Pattern

Keep schemas small for token efficiency:

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .

ex:HeroShape a sh:NodeShape ;
    sh:name "Hero" ;
    sh:description "A superhero character" ;
    sh:targetClass ex:Hero ;

    sh:property [
        sh:path ex:name ;
        sh:name "name" ;
        sh:description "Hero's name or alias" ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;

    sh:property [
        sh:path ex:powers ;
        sh:name "powers" ;
        sh:description "Superpowers the hero possesses" ;
        sh:class ex:Power
    ] ;

    sh:property [
        sh:path ex:team ;
        sh:name "team" ;
        sh:description "Team membership" ;
        sh:class ex:Team
    ] .
```

### Including Enumerations

```turtle
sh:property [
    sh:path ex:alignment ;
    sh:name "alignment" ;
    sh:description "Moral alignment" ;
    sh:in ("hero" "villain" "anti-hero" "neutral") ;
    sh:minCount 1
] .
```

LLMs can use `sh:in` values to understand valid options.

---

## Validation of LLM Output

### Validating Generated Triples

```turtle
ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;

    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
        sh:message "Person must have a string name"
    ] ;

    sh:property [
        sh:path ex:email ;
        sh:pattern "^[^@]+@[^@]+\\.[^@]+$" ;
        sh:message "Invalid email format"
    ] ;

    sh:property [
        sh:path ex:age ;
        sh:datatype xsd:integer ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150 ;
        sh:message "Age must be 0-150"
    ] .
```

### Validation Feedback Loop

```python
def create_entity_with_llm(user_request, schema):
    # Generate with LLM
    triples = llm.generate_triples(user_request, schema)

    # Validate
    report = shacl_validate(triples, schema)

    if report.conforms:
        return store(triples)

    # Feed errors back to LLM
    errors = extract_errors(report)
    corrected = llm.fix_triples(triples, errors, schema)

    return create_entity_with_llm_retry(corrected, schema, max_retries=3)
```

---

## API Design with SHACL

### Endpoint Definition

```turtle
ex:SearchEndpoint a ex:APIEndpoint ;
    ex:path "/api/search" ;
    ex:method "GET" ;
    ex:parametersShape ex:SearchParams ;
    ex:responseShape ex:SearchResults ;
    ex:sparqlTemplate """
        SELECT ?entity ?label ?type
        WHERE {
            ?entity rdfs:label ?label .
            ?entity a ?type .
            FILTER (CONTAINS(LCASE(?label), LCASE($query)))
        }
        LIMIT $limit
    """ .

ex:SearchParams a sh:NodeShape ;
    sh:property [
        sh:path ex:query ;
        sh:name "query" ;
        sh:minCount 1 ;
        sh:datatype xsd:string
    ] ;
    sh:property [
        sh:path ex:limit ;
        sh:name "limit" ;
        sh:defaultValue 10 ;
        sh:datatype xsd:integer
    ] .
```

### Benefits for LLMs

1. **Self-documenting**: `sh:description` provides context
2. **Type-safe**: `sh:datatype` prevents type errors
3. **Constrained**: `sh:in` limits valid values
4. **Defaulted**: `sh:defaultValue` handles omissions

---

## Practical Example: Pizza Ordering (Cagle)

### SHACL Schema

```turtle
ex:PizzaOrderShape a sh:NodeShape ;
    sh:name "PizzaOrder" ;

    sh:property [
        sh:path ex:size ;
        sh:name "size" ;
        sh:in ("small" "medium" "large" "extra-large") ;
        sh:minCount 1
    ] ;

    sh:property [
        sh:path ex:crust ;
        sh:name "crust" ;
        sh:in ("thin" "regular" "thick" "stuffed") ;
        sh:minCount 1
    ] ;

    sh:property [
        sh:path ex:toppings ;
        sh:name "toppings" ;
        sh:class ex:Topping
    ] ;

    sh:property [
        sh:path ex:deliveryMethod ;
        sh:name "deliveryMethod" ;
        sh:in ("delivery" "pickup" "dine-in") ;
        sh:minCount 1
    ] .

ex:ToppingShape a sh:NodeShape ;
    sh:name "Topping" ;
    sh:property [
        sh:path ex:toppingType ;
        sh:in (ex:Pepperoni ex:Mushroom ex:Olives ex:Onions ex:Peppers
               ex:Sausage ex:Bacon ex:Pineapple ex:Anchovies)
    ] .
```

### LLM Interaction

```
User: "I'd like a large thin crust pizza with pepperoni and mushrooms for delivery"

LLM (using schema) generates:
_:order a ex:PizzaOrder ;
    ex:size "large" ;
    ex:crust "thin" ;
    ex:toppings ex:Pepperoni, ex:Mushroom ;
    ex:deliveryMethod "delivery" .

System validates against PizzaOrderShape → Valid

User: "Can I get herrings on it?"

LLM (checking schema): "I'm sorry, herrings aren't available.
Available toppings are: Pepperoni, Mushroom, Olives..."
```

---

## Context-Free SPARQL Pattern

### Query Library Approach

```turtle
ex:QueryLibrary a ex:SPARQLLibrary ;
    ex:query [
        ex:name "findPersonByName" ;
        ex:description "Find people by name substring" ;
        ex:parametersShape ex:NameSearchParams ;
        ex:sparql """
            SELECT ?person ?name ?email
            WHERE {
                ?person a ex:Person ;
                        ex:name ?name .
                OPTIONAL { ?person ex:email ?email }
                FILTER (CONTAINS(LCASE(?name), LCASE($nameQuery)))
            }
            LIMIT $limit
        """
    ] ;
    ex:query [
        ex:name "getPersonDetails" ;
        ex:description "Get full details for a person" ;
        ex:parametersShape ex:PersonIdParams ;
        ex:sparql """
            SELECT ?property ?value
            WHERE {
                $personId ?property ?value .
            }
        """
    ] .
```

### LLM Uses Library

Instead of generating SPARQL:
1. LLM selects appropriate query from library
2. LLM provides parameter values
3. System executes with validated parameters
4. LLM formats results

---

## Best Practices

### 1. Keep Schemas Minimal

```turtle
# Include only what LLM needs
sh:property [
    sh:path ex:name ;
    sh:name "name" ;           # For LLM understanding
    sh:description "..." ;     # Context for LLM
    sh:datatype xsd:string     # Type constraint
] .
```

### 2. Use Descriptive Names

```turtle
# LLM-friendly
sh:name "customerEmailAddress"
sh:description "Primary email for customer communications"

# Not helpful
sh:name "field_23"
```

### 3. Provide Enumerations

```turtle
# LLM can suggest valid options
sh:in ("pending" "approved" "rejected" "cancelled")
```

### 4. Include Defaults

```turtle
# LLM can omit optional params
sh:defaultValue 10
```

### 5. Validate Everything

Never trust LLM output without SHACL validation.

---

## Resources

- [Using SHACL and AI for Creating Queries](https://ontologist.substack.com/p/using-shacl-and-ai-for-creating-queries) — Kurt Cagle
- [Making Pizza with AI and SHACL](https://ontologist.substack.com/p/making-pizza-with-ai-and-shacl) — Kurt Cagle
- [Knowledge Graphs and AIs](https://ontologist.substack.com/p/knowledge-graphs-and-ais) — Kurt Cagle
