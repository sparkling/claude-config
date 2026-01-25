# QLever GeoSPARQL Guide

Spatial queries with QLever: query geographic data using OGC GeoSPARQL predicates. Essential for OpenStreetMap, geographic knowledge graphs, and location-based applications.

---

## Overview

QLever provides partial support for OGC GeoSPARQL 1.1, enabling spatial queries on RDF data with geometric properties.

### Supported Features

| Feature | Support |
|---------|---------|
| `ogc:sfContains` | Full |
| `ogc:sfIntersects` | Full |
| `ogc:sfCovers` | Full |
| `ogc:sfEquals` | Full |
| `ogc:sfTouches` | Full |
| `ogc:sfCrosses` | Full |
| `ogc:sfOverlaps` | Full |
| `geof:distance` | Full |
| `geof:latitude` / `geof:longitude` | Full |
| `geof:centroid` | Full |
| `geo:asWKT` | Full |
| Bounding box filtering | Partial |

---

## Essential Prefixes

```sparql
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmway: <https://www.openstreetmap.org/way/>
PREFIX osmnode: <https://www.openstreetmap.org/node/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#>
```

---

## Spatial Relationship Queries

### ogc:sfContains - "What's Inside?"

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find all railway stations in France
SELECT ?station ?name
WHERE {
  osmrel:2202162 ogc:sfContains ?station .  # France relation ID
  ?station osmkey:railway "station" .
  OPTIONAL { ?station osmkey:name ?name }
}
LIMIT 100
```

### ogc:sfIntersects - "What Overlaps?"

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>

# Find all elements intersecting a specific region
SELECT ?element ?type
WHERE {
  osmrel:51477 ogc:sfIntersects ?element .  # Germany
  ?element osmkey:boundary ?type .
}
LIMIT 100
```

### Negative Spatial Filtering

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find cities NOT in France
SELECT ?city ?name
WHERE {
  ?city osmkey:place "city" ;
        osmkey:name ?name .
  FILTER (LANG(?name) = "en" || LANG(?name) = "")
  MINUS {
    osmrel:2202162 ogc:sfContains ?city .  # France
  }
}
LIMIT 50
```

---

## Distance Queries

### Calculate Distance Between Points

```sparql
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osmnode: <https://www.openstreetmap.org/node/>

# Distance between two specific nodes
SELECT ?distance
WHERE {
  osmnode:123456 geo:hasGeometry/geo:asWKT ?geom1 .
  osmnode:789012 geo:hasGeometry/geo:asWKT ?geom2 .
  BIND(geof:distance(?geom1, ?geom2,
       <http://www.opengis.net/def/uom/OGC/1.0/kilometre>) AS ?distance)
}
```

### Find Nearby Elements

```sparql
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find hospitals within 5km of a point
SELECT ?hospital ?name ?distance
WHERE {
  ?hospital osmkey:amenity "hospital" ;
            osmkey:name ?name ;
            geo:hasGeometry/geo:asWKT ?geom .

  # Reference point (e.g., city center)
  BIND("POINT(7.8421 47.9990)"^^geo:wktLiteral AS ?center)
  BIND(geof:distance(?geom, ?center,
       <http://www.opengis.net/def/uom/OGC/1.0/kilometre>) AS ?distance)

  FILTER(?distance < 5)
}
ORDER BY ?distance
LIMIT 20
```

### Distance with Metric Units

```sparql
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

SELECT ?place1 ?place2 ?distanceKm ?distanceMi
WHERE {
  ?place1 geo:hasGeometry/geo:asWKT ?geom1 .
  ?place2 geo:hasGeometry/geo:asWKT ?geom2 .

  # Distance in kilometers
  BIND(geof:distance(?geom1, ?geom2,
       <http://www.opengis.net/def/uom/OGC/1.0/kilometre>) AS ?distanceKm)

  # Convert to miles
  BIND(?distanceKm * 0.621371 AS ?distanceMi)

  FILTER(?distanceKm < 10)
}
LIMIT 50
```

---

## Geometry Functions

### Get Coordinates from Points

```sparql
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Get latitude/longitude of cities
SELECT ?city ?name ?lat ?lon
WHERE {
  ?city osmkey:place "city" ;
        osmkey:name ?name ;
        geo:hasGeometry/geo:asWKT ?geom .

  BIND(geof:latitude(?geom) AS ?lat)
  BIND(geof:longitude(?geom) AS ?lon)
}
LIMIT 50
```

### Calculate Centroid

```sparql
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Get centroids of parks
SELECT ?park ?name ?centroid
WHERE {
  ?park osmkey:leisure "park" ;
        osmkey:name ?name ;
        geo:hasGeometry/geo:asWKT ?geom .

  BIND(geof:centroid(?geom) AS ?centroid)
}
LIMIT 50
```

---

## OpenStreetMap Specific Queries

### OSM RDF Prefixes

| Prefix | Namespace | Purpose |
|--------|-----------|---------|
| `osmnode:` | `https://www.openstreetmap.org/node/` | Node IDs |
| `osmway:` | `https://www.openstreetmap.org/way/` | Way IDs |
| `osmrel:` | `https://www.openstreetmap.org/relation/` | Relation IDs |
| `osmkey:` | `https://www.openstreetmap.org/wiki/Key:` | Tag keys |
| `osm2rdf:` | `https://osm2rdf.cs.uni-freiburg.de/rdf#` | Metadata (area, length) |
| `osmmeta:` | Varies | Changeset, user, etc. |

### Find Elements by Tag

```sparql
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

# Find all cafes with their geometry
SELECT ?cafe ?name ?geometry
WHERE {
  ?cafe osmkey:amenity "cafe" .
  OPTIONAL { ?cafe osmkey:name ?name }
  OPTIONAL { ?cafe geo:hasGeometry/geo:asWKT ?geometry }
}
LIMIT 100
```

### Area and Length Calculations

```sparql
PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find largest parks by area
SELECT ?park ?name ?areaSqKm
WHERE {
  ?park osmkey:leisure "park" ;
        osmkey:name ?name ;
        osm2rdf:area ?areaM2 .

  BIND(?areaM2 / 1000000 AS ?areaSqKm)
}
ORDER BY DESC(?areaSqKm)
LIMIT 20

# Find longest roads
SELECT ?road ?name ?lengthKm
WHERE {
  ?road osmkey:highway "motorway" ;
        osmkey:name ?name ;
        osm2rdf:length ?lengthM .

  BIND(?lengthM / 1000 AS ?lengthKm)
}
ORDER BY DESC(?lengthKm)
LIMIT 20
```

### Boundary Analysis

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#>

# Find municipalities with complex (convoluted) boundaries
# Using the sinuosity metric
SELECT ?municipality ?name ?sinuosity
WHERE {
  ?municipality osmkey:boundary "administrative" ;
                osmkey:admin_level "8" ;
                osmkey:name ?name ;
                osm2rdf:area ?area ;
                osm2rdf:perimeter ?perimeter .

  # Polsby-Popper compactness test
  # 1.0 = perfect circle, higher = more irregular
  BIND((4 * 3.14159 * ?area) / (?perimeter * ?perimeter) AS ?compactness)
  BIND(1 / ?compactness AS ?sinuosity)

  FILTER(?sinuosity > 5)  # Only very irregular shapes
}
ORDER BY DESC(?sinuosity)
LIMIT 20
```

---

## Federated GeoSPARQL Queries

### Combine OSM with Wikidata

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

# Find OSM elements with Wikidata links
SELECT ?osm ?wikidataItem ?population
WHERE {
  ?osm osmkey:wikidata ?wikidataId ;
       osmkey:place "city" .

  # Federate to Wikidata for additional info
  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataItem wdt:P1082 ?population .
    FILTER(STR(?wikidataItem) = ?wikidataId)
  }
}
ORDER BY DESC(?population)
LIMIT 50
```

---

## Advanced Spatial Analysis

### Find Route Gaps

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmrel: <https://www.openstreetmap.org/relation/>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find ways in a route that don't connect
SELECT ?way1 ?way2
WHERE {
  osmrel:123456 osmkey:member ?way1 .
  osmrel:123456 osmkey:member ?way2 .

  # Ways should touch but don't intersect
  FILTER NOT EXISTS {
    ?way1 ogc:sfTouches ?way2 .
  }
  FILTER NOT EXISTS {
    ?way1 ogc:sfIntersects ?way2 .
  }
  FILTER(?way1 < ?way2)  # Avoid duplicates
}
```

### Street Intersection Detection

```sparql
PREFIX ogc: <http://www.opengis.net/rdf#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Find intersecting streets
SELECT ?street1 ?name1 ?street2 ?name2
WHERE {
  ?street1 osmkey:highway ?type1 ;
           osmkey:name ?name1 .
  ?street2 osmkey:highway ?type2 ;
           osmkey:name ?name2 .

  ?street1 ogc:sfIntersects ?street2 .

  FILTER(?street1 < ?street2)  # Avoid duplicates
  FILTER(?name1 != ?name2)     # Different streets
}
LIMIT 100
```

---

## Map Visualization

QLever UI provides automatic map visualization for queries returning:

1. **WKT geometries**: `geo:asWKT` values
2. **Point coordinates**: latitude/longitude pairs

### Return Geometry for Visualization

```sparql
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:>

# Results will show on map in QLever UI
SELECT ?element ?name ?geometry
WHERE {
  ?element osmkey:tourism "museum" ;
           osmkey:name ?name ;
           geo:hasGeometry/geo:asWKT ?geometry .
}
LIMIT 1000
```

The UI can render millions of geometric objects interactively.

---

## Performance Tips

### 1. Use ogc: Predicates First

```sparql
# GOOD: Spatial filter first
SELECT ?element ?name
WHERE {
  osmrel:2202162 ogc:sfContains ?element .  # France
  ?element osmkey:amenity "restaurant" ;
           osmkey:name ?name .
}

# BAD: Type filter first on large result set
SELECT ?element ?name
WHERE {
  ?element osmkey:amenity "restaurant" ;
           osmkey:name ?name .
  osmrel:2202162 ogc:sfContains ?element .
}
```

### 2. Limit Results for Large Areas

```sparql
# Always add LIMIT for exploratory queries
SELECT ?element
WHERE {
  osmrel:51477 ogc:sfContains ?element .  # Germany (many elements)
}
LIMIT 100
```

### 3. Use Specific Regions

```sparql
# More specific = faster
# Query a city instead of a country when possible
SELECT ?cafe ?name
WHERE {
  osmrel:62422 ogc:sfContains ?cafe .  # Berlin, not Germany
  ?cafe osmkey:amenity "cafe" ;
        osmkey:name ?name .
}
```

---

## osm2rdf Tool

OpenStreetMap data is converted to RDF using the [osm2rdf](https://github.com/ad-freiburg/osm2rdf) tool:

### Features

- Converts OSM PBF files to RDF Turtle
- Computes spatial relationships (`ogc:sfContains`, etc.)
- Adds area/length calculations
- Weekly planet-wide updates available

### Pre-computed Downloads

QLever provides weekly updated RDF exports:

- **OSM Planet**: ~80 billion triples
- **Per-country extracts**: Available for most countries

---

## Resources

### Endpoints

- **OSM Planet**: https://qlever.dev/osm-planet/
- **OpenHistoricalMap**: https://qlever.dev/ohm-planet/

### Documentation

- [QLever OSM Wiki](https://wiki.openstreetmap.org/wiki/QLever)
- [QLever Example Queries](https://wiki.openstreetmap.org/wiki/QLever/Example_queries)
- [osm2rdf GitHub](https://github.com/ad-freiburg/osm2rdf)
- [GeoSPARQL Standard](https://www.ogc.org/standards/geosparql/)
