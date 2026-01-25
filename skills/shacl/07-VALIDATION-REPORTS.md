# Validation Reports

SHACL validation produces RDF reports describing conformance and violations.

---

## Report Structure

### Basic Report

```turtle
[] a sh:ValidationReport ;
    sh:conforms true .  # All validations passed
```

### Report with Violations

```turtle
[] a sh:ValidationReport ;
    sh:conforms false ;
    sh:result [
        a sh:ValidationResult ;
        sh:focusNode ex:Person1 ;
        sh:resultPath ex:email ;
        sh:value "invalid-email" ;
        sh:resultSeverity sh:Violation ;
        sh:resultMessage "Value does not match pattern" ;
        sh:sourceConstraintComponent sh:PatternConstraintComponent ;
        sh:sourceShape ex:EmailPropertyShape
    ] .
```

---

## Report Properties

### sh:conforms

Boolean indicating overall conformance:

```turtle
sh:conforms true   # All validations passed
sh:conforms false  # At least one violation
```

### sh:result

Links to individual validation results:

```turtle
[] a sh:ValidationReport ;
    sh:result _:result1, _:result2, _:result3 .
```

---

## Validation Result Properties

### sh:focusNode (Required)

The node that was validated:

```turtle
sh:focusNode ex:John .
sh:focusNode _:b0 .  # Blank node
```

### sh:resultPath

The property path where the violation occurred:

```turtle
sh:resultPath ex:email .
sh:resultPath ( ex:address ex:city ) .  # Sequence path
```

### sh:value

The specific value that caused the violation:

```turtle
sh:value "bad-email" .
sh:value ex:InvalidResource .
sh:value "42"^^xsd:integer .
```

### sh:resultSeverity

Severity level of the result:

```turtle
sh:resultSeverity sh:Violation .  # Critical error
sh:resultSeverity sh:Warning .    # Non-critical
sh:resultSeverity sh:Info .       # Informational
```

### sh:resultMessage

Human-readable description:

```turtle
sh:resultMessage "Email format invalid" .
sh:resultMessage "E-Mail-Format ungültig"@de .
```

### sh:sourceConstraintComponent

The constraint component that was violated:

```turtle
sh:sourceConstraintComponent sh:MinCountConstraintComponent .
sh:sourceConstraintComponent sh:PatternConstraintComponent .
sh:sourceConstraintComponent sh:ClassConstraintComponent .
sh:sourceConstraintComponent sh:DatatypeConstraintComponent .
```

### sh:sourceShape

The shape that defined the constraint:

```turtle
sh:sourceShape ex:PersonShape .
sh:sourceShape ex:EmailPropertyShape .
```

### sh:detail

Nested result for additional detail:

```turtle
sh:detail [
    a sh:ValidationResult ;
    sh:focusNode _:nestedNode ;
    ...
] .
```

---

## Severity Levels

### sh:Violation (Default)

Critical constraint failures that typically prevent data acceptance:

```turtle
sh:property [
    sh:path ex:id ;
    sh:minCount 1 ;
    sh:severity sh:Violation ;  # Default if omitted
    sh:message "ID is required"
] .
```

### sh:Warning

Non-critical issues that should be addressed but don't block:

```turtle
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@[^@]+$" ;
    sh:severity sh:Warning ;
    sh:message "Email format may be invalid"
] .
```

### sh:Info

Informational messages for guidance:

```turtle
sh:property [
    sh:path ex:description ;
    sh:minLength 100 ;
    sh:severity sh:Info ;
    sh:message "Consider adding a longer description"
] .
```

---

## Common Constraint Components

| Component | Triggered By |
|-----------|--------------|
| `sh:MinCountConstraintComponent` | `sh:minCount` |
| `sh:MaxCountConstraintComponent` | `sh:maxCount` |
| `sh:DatatypeConstraintComponent` | `sh:datatype` |
| `sh:ClassConstraintComponent` | `sh:class` |
| `sh:NodeKindConstraintComponent` | `sh:nodeKind` |
| `sh:PatternConstraintComponent` | `sh:pattern` |
| `sh:MinInclusiveConstraintComponent` | `sh:minInclusive` |
| `sh:MaxInclusiveConstraintComponent` | `sh:maxInclusive` |
| `sh:MinExclusiveConstraintComponent` | `sh:minExclusive` |
| `sh:MaxExclusiveConstraintComponent` | `sh:maxExclusive` |
| `sh:MinLengthConstraintComponent` | `sh:minLength` |
| `sh:MaxLengthConstraintComponent` | `sh:maxLength` |
| `sh:InConstraintComponent` | `sh:in` |
| `sh:HasValueConstraintComponent` | `sh:hasValue` |
| `sh:NodeConstraintComponent` | `sh:node` |
| `sh:ClosedConstraintComponent` | `sh:closed` |
| `sh:EqualsConstraintComponent` | `sh:equals` |
| `sh:DisjointConstraintComponent` | `sh:disjoint` |
| `sh:LessThanConstraintComponent` | `sh:lessThan` |
| `sh:AndConstraintComponent` | `sh:and` |
| `sh:OrConstraintComponent` | `sh:or` |
| `sh:NotConstraintComponent` | `sh:not` |
| `sh:XoneConstraintComponent` | `sh:xone` |
| `sh:SPARQLConstraintComponent` | `sh:sparql` |

---

## Querying Validation Reports

### Find All Violations

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?focus ?path ?value ?message ?severity
WHERE {
    ?report a sh:ValidationReport ;
            sh:result ?result .
    ?result sh:focusNode ?focus ;
            sh:resultMessage ?message ;
            sh:resultSeverity ?severity .
    OPTIONAL { ?result sh:resultPath ?path }
    OPTIONAL { ?result sh:value ?value }
}
ORDER BY ?severity ?focus ?path
```

### Count Violations by Type

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?component (COUNT(*) AS ?count)
WHERE {
    ?report sh:result ?result .
    ?result sh:sourceConstraintComponent ?component .
}
GROUP BY ?component
ORDER BY DESC(?count)
```

### Find Violations by Severity

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?focus ?path ?message
WHERE {
    ?report sh:result ?result .
    ?result sh:resultSeverity sh:Violation ;
            sh:focusNode ?focus ;
            sh:resultMessage ?message .
    OPTIONAL { ?result sh:resultPath ?path }
}
```

### Group by Focus Node

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?focus (COUNT(?result) AS ?violations)
       (GROUP_CONCAT(?message; separator="; ") AS ?messages)
WHERE {
    ?report sh:result ?result .
    ?result sh:focusNode ?focus ;
            sh:resultMessage ?message .
}
GROUP BY ?focus
ORDER BY DESC(?violations)
```

### Find Nodes Missing Required Properties

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?focus ?path
WHERE {
    ?report sh:result ?result .
    ?result sh:sourceConstraintComponent sh:MinCountConstraintComponent ;
            sh:focusNode ?focus ;
            sh:resultPath ?path .
}
```

---

## Processing Reports Programmatically

### Python Example (with rdflib)

```python
from rdflib import Graph, Namespace

SH = Namespace("http://www.w3.org/ns/shacl#")

def process_report(report_graph):
    """Process SHACL validation report."""

    # Check conformance
    conforms = report_graph.value(
        predicate=SH.conforms,
        any=True
    )

    if conforms:
        print("Validation passed!")
        return

    # Process violations
    for result in report_graph.subjects(RDF.type, SH.ValidationResult):
        focus = report_graph.value(result, SH.focusNode)
        path = report_graph.value(result, SH.resultPath)
        message = report_graph.value(result, SH.resultMessage)
        severity = report_graph.value(result, SH.resultSeverity)

        print(f"[{severity}] {focus} - {path}: {message}")
```

### JavaScript Example

```javascript
function processReport(reportQuads) {
    const results = reportQuads
        .filter(q => q.predicate.value === SH + 'result')
        .map(q => q.object);

    results.forEach(result => {
        const focus = getObject(result, SH + 'focusNode');
        const path = getObject(result, SH + 'resultPath');
        const message = getObject(result, SH + 'resultMessage');
        const severity = getObject(result, SH + 'resultSeverity');

        console.log(`[${severity}] ${focus} - ${path}: ${message}`);
    });
}
```

---

## Report Aggregation Patterns

### Summary Statistics

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT
    (COUNT(DISTINCT ?result) AS ?totalViolations)
    (COUNT(DISTINCT ?focus) AS ?affectedNodes)
    (SUM(IF(?severity = sh:Violation, 1, 0)) AS ?errors)
    (SUM(IF(?severity = sh:Warning, 1, 0)) AS ?warnings)
    (SUM(IF(?severity = sh:Info, 1, 0)) AS ?infos)
WHERE {
    ?report sh:result ?result .
    ?result sh:focusNode ?focus ;
            sh:resultSeverity ?severity .
}
```

### Violations by Shape

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>

SELECT ?shape (COUNT(*) AS ?count)
WHERE {
    ?report sh:result ?result .
    ?result sh:sourceShape ?shape .
}
GROUP BY ?shape
ORDER BY DESC(?count)
```

---

## Best Practices

### 1. Always Include Messages

```turtle
sh:property [
    sh:path ex:email ;
    sh:pattern "^[^@]+@" ;
    sh:message "Email must contain @"  # Helpful!
] .
```

### 2. Use Appropriate Severity

- **Violation**: Data integrity issues
- **Warning**: Quality concerns, suggestions
- **Info**: Documentation, guidance

### 3. Provide Actionable Messages

```turtle
# Bad
sh:message "Validation failed"

# Good
sh:message "Employee ID must be format EMP-123456"
```

### 4. Include Multilingual Messages

```turtle
sh:message "Name is required"@en ;
sh:message "Der Name ist erforderlich"@de ;
sh:message "Le nom est requis"@fr .
```

### 5. Log and Monitor Reports

Track validation statistics over time to identify:
- Common data quality issues
- Problematic data sources
- Schema evolution needs
