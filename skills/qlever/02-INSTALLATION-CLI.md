# QLever Installation & CLI Guide

Complete guide to installing QLever, configuring datasets, and using the command-line interface.

---

## Installation Methods

### 1. pip/pipx/uv (Recommended)

```bash
# Using pip (in virtual environment)
python -m venv qlever-env
source qlever-env/bin/activate  # On Windows: qlever-env\Scripts\activate
pip install qlever

# Using pipx (isolated installation)
pipx install qlever

# Using uv (fast package manager)
uv tool install qlever

# Verify installation
qlever --version
qlever --help
```

### 2. Docker (For Engine Only)

```bash
# Pull the QLever image
docker pull adfreiburg/qlever

# Run with mounted data directory
docker run -v /path/to/data:/data -p 7001:7001 adfreiburg/qlever
```

### 3. Build from Source

```bash
# Clone repository
git clone --recursive https://github.com/ad-freiburg/QLever.git qlever
cd qlever

# Build with CMake (requires C++17 compiler)
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)

# Binaries in build directory:
# - IndexBuilderMain (indexer)
# - ServerMain (SPARQL server)
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Linux (64-bit) | Ubuntu 22.04+ |
| RAM | 8 GB | 32-128 GB |
| Storage | SSD | NVMe SSD |
| CPU | 4 cores | 8+ cores |
| Docker | 18.05+ | Latest |

**Note**: macOS and Windows work via Docker. Native builds primarily target Linux.

---

## Quick Start Workflow

### Step 1: Setup Configuration

```bash
# Create working directory
mkdir ~/qlever-demo && cd ~/qlever-demo

# Fetch preconfigured Qleverfile
qlever setup-config olympics

# View the configuration
cat Qleverfile
```

### Step 2: Download Data

```bash
# Download the dataset
qlever get-data

# This creates data files based on GET_DATA_CMD in Qleverfile
ls -la *.ttl *.nt *.nq 2>/dev/null
```

### Step 3: Build Index

```bash
# Build the index (may take time for large datasets)
qlever index

# Preview command without executing
qlever index --show

# Monitor progress
qlever log
```

### Step 4: Start Server

```bash
# Start the SPARQL server
qlever start

# Check status
qlever status

# Server runs on configured PORT (default: 7001)
```

### Step 5: Query

```bash
# Run a SPARQL query
qlever query "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# Run query from file
qlever query < my-query.sparql

# Interactive query mode
qlever query
```

### Step 6: Launch UI

```bash
# Start the web UI (default port: 7000)
qlever ui

# Open browser to http://localhost:7000
```

---

## The Qleverfile

The Qleverfile is a single configuration file controlling all QLever operations.

### Structure

```ini
[data]
# Dataset identification and acquisition
NAME = my-dataset
GET_DATA_CMD = curl -L -o data.ttl https://example.org/data.ttl
FORMAT = turtle

[index]
# Indexing configuration
INPUT_FILES = data.ttl
SETTINGS_JSON = {"prefixes": {"": "http://example.org/"}}
# Optional text index
TEXT_INDEX = from-literals

[server]
# Server configuration
PORT = 7001
MEMORY_FOR_QUERIES = 10G
CACHE_MAX_SIZE = 5G
ACCESS_TOKEN = my-secret-token
TIMEOUT = 300

[ui]
# Web UI configuration
UI_PORT = 7000
UI_CONFIG = default.config.json
```

### Section: [data]

| Option | Description | Example |
|--------|-------------|---------|
| `NAME` | Dataset identifier | `wikidata`, `osm-planet` |
| `GET_DATA_CMD` | Shell command to download data | `curl -L -o data.ttl ...` |
| `FORMAT` | Input format | `turtle`, `ntriples`, `nquads` |
| `DESCRIPTION` | Human-readable description | `"Wikipedia entities"` |

### Section: [index]

| Option | Description | Example |
|--------|-------------|---------|
| `INPUT_FILES` | Space-separated input files | `data.ttl more-data.nt` |
| `SETTINGS_JSON` | JSON settings for indexer | `{"prefixes": {...}}` |
| `TEXT_INDEX` | Text indexing mode | `from-literals`, `from-text-records` |
| `STXXL_MEMORY` | Memory for external sorting | `8G` |

**SETTINGS_JSON Options**:

```json
{
  "prefixes": {
    "": "http://example.org/",
    "wd": "http://www.wikidata.org/entity/"
  },
  "languages-internal": ["en", "de", "fr"],
  "locale": {
    "language": "en",
    "country": "US",
    "ignore-punctuation": true
  }
}
```

### Section: [server]

| Option | Description | Default |
|--------|-------------|---------|
| `PORT` | HTTP port | `7001` |
| `MEMORY_FOR_QUERIES` | Query memory limit | `5G` |
| `CACHE_MAX_SIZE` | Result cache size | `2G` |
| `TIMEOUT` | Query timeout (seconds) | `30` |
| `ACCESS_TOKEN` | Optional auth token | none |
| `NUM_THREADS` | Worker threads | auto |

### Section: [ui]

| Option | Description | Default |
|--------|-------------|---------|
| `UI_PORT` | Web UI port | `7000` |
| `UI_CONFIG` | UI configuration file | auto-generated |

---

## CLI Command Reference

### General Options

```bash
qlever --help              # Show all commands
qlever --version           # Show version
qlever <command> --help    # Command-specific help
qlever <command> --show    # Preview without executing
```

### Data Commands

```bash
# Setup configuration
qlever setup-config <name>     # Fetch preconfigured Qleverfile
qlever setup-config --list     # List available configurations

# Download data
qlever get-data                # Execute GET_DATA_CMD from Qleverfile
```

### Index Commands

```bash
# Build index
qlever index                   # Build main index
qlever index --text-index      # Include text index

# Add text index to existing index
qlever add-text-index

# Show index statistics
qlever index-stats
```

### Server Commands

```bash
# Server lifecycle
qlever start                   # Start server
qlever stop                    # Stop server
qlever restart                 # Restart server
qlever status                  # Show status

# Server options
qlever start --use-text-index  # Enable text search
qlever start --port 8080       # Override port
```

### Query Commands

```bash
# Execute queries
qlever query "SELECT ..."      # Inline query
qlever query < file.sparql     # Query from file
qlever query                   # Interactive mode

# Query options
qlever query --format json     # Output format
qlever query --timeout 60      # Custom timeout
```

### UI Commands

```bash
# Web interface
qlever ui                      # Start UI
qlever ui --port 8000          # Custom port
```

### Logging & Debugging

```bash
# View logs
qlever log                     # Show server log
qlever log -f                  # Follow log (tail -f)

# Show actual commands
qlever index --show            # Preview index command
qlever start --show            # Preview start command
```

---

## Available Configurations

Preconfigured Qleverfiles for popular datasets:

| Name | Dataset | Triples | Notes |
|------|---------|---------|-------|
| `olympics` | 120 Years of Olympics | 2M | Great for learning |
| `dblp` | Computer Science Bibliography | 390M | Academic papers |
| `wikidata` | Complete Wikidata | 18B+ | Requires 64GB+ RAM |
| `osm-planet` | OpenStreetMap Planet | 40B+ | Geographic data |
| `uniprot` | UniProt Proteins | 100B+ | Life sciences |
| `pubchem` | PubChem Compounds | 150B+ | Chemistry |
| `dbpedia` | DBpedia | 1B+ | Wikipedia structured data |
| `yago` | YAGO Knowledge Graph | 2B+ | Entities and facts |

### Getting a Configuration

```bash
# List all available
qlever setup-config --list

# Fetch specific config
qlever setup-config wikidata
qlever setup-config osm-planet

# The Qleverfile is created in current directory
cat Qleverfile
```

---

## Custom Dataset Setup

### From Local Turtle/N-Triples File

```bash
mkdir my-dataset && cd my-dataset

# Create Qleverfile
cat > Qleverfile << 'EOF'
[data]
NAME = my-knowledge-graph
FORMAT = turtle

[index]
INPUT_FILES = data.ttl
SETTINGS_JSON = {"prefixes": {"ex": "http://example.org/"}}

[server]
PORT = 7001
MEMORY_FOR_QUERIES = 8G

[ui]
UI_PORT = 7000
EOF

# Copy your data file
cp /path/to/your/data.ttl .

# Build and start
qlever index
qlever start
qlever ui
```

### From Remote URL

```bash
cat > Qleverfile << 'EOF'
[data]
NAME = remote-dataset
GET_DATA_CMD = curl -L -o data.ttl https://example.org/dataset.ttl
FORMAT = turtle

[index]
INPUT_FILES = data.ttl

[server]
PORT = 7001
EOF

# Download and index
qlever get-data
qlever index
qlever start
```

### Multiple Input Files

```bash
cat > Qleverfile << 'EOF'
[data]
NAME = combined-dataset
GET_DATA_CMD = curl -L -o ontology.ttl https://example.org/ontology.ttl && curl -L -o instances.nt https://example.org/instances.nt
FORMAT = turtle

[index]
INPUT_FILES = ontology.ttl instances.nt

[server]
PORT = 7001
EOF
```

---

## Memory & Performance Tuning

### Index Settings

```ini
[index]
# Memory for sorting (external merge sort)
STXXL_MEMORY = 8G

# Parallel indexing
NUM_THREADS = 8

# Settings for large datasets
SETTINGS_JSON = {
  "prefixes": {...},
  "num-triples-per-batch": 10000000
}
```

### Server Settings

```ini
[server]
# Query memory pool
MEMORY_FOR_QUERIES = 16G

# Result cache
CACHE_MAX_SIZE = 4G

# Query timeout (seconds)
TIMEOUT = 300

# Worker threads
NUM_THREADS = 8
```

### Hardware Guidelines

| Dataset Size | RAM | Storage | Notes |
|--------------|-----|---------|-------|
| <10M triples | 4 GB | 10 GB | Development |
| 10M-100M | 8 GB | 50 GB | Small production |
| 100M-1B | 32 GB | 200 GB | Medium production |
| 1B-10B | 64 GB | 1 TB | Large production |
| 10B-100B | 128 GB | 5 TB | Enterprise scale |
| >100B | 256 GB+ | 10 TB+ | Extreme scale |

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| `qlever: command not found` | Add pip bin to PATH or use pipx |
| Index fails with OOM | Increase STXXL_MEMORY or use swap |
| Server won't start | Check if port is in use: `lsof -i :7001` |
| Queries timeout | Increase TIMEOUT, add LIMIT, optimize query |
| Docker permission denied | Add user to docker group or use sudo |

### Debug Commands

```bash
# Show what would execute
qlever index --show
qlever start --show

# Check server status
qlever status

# View logs
qlever log
qlever log -f  # Follow

# Test basic connectivity
curl http://localhost:7001/ping
```

### Clearing and Rebuilding

```bash
# Stop server
qlever stop

# Remove index files (keep data)
rm -rf *.index.* *.vocabulary.* *.meta

# Rebuild
qlever index
qlever start
```

---

## Docker Deployment

### Basic Docker Usage

```bash
# Pull image
docker pull adfreiburg/qlever

# Run with local data
docker run -d \
  --name qlever \
  -v $(pwd)/data:/data \
  -p 7001:7001 \
  adfreiburg/qlever

# Check logs
docker logs qlever
```

### Docker Compose

```yaml
version: '3.8'
services:
  qlever:
    image: adfreiburg/qlever
    container_name: qlever
    ports:
      - "7001:7001"
    volumes:
      - ./data:/data
      - ./index:/index
    environment:
      - MEMORY_FOR_QUERIES=16G
      - CACHE_MAX_SIZE=4G
    restart: unless-stopped
```

---

## Next Steps

- **Query Patterns**: See `03-QUERY-PATTERNS.md` for SPARQL examples
- **Text Search**: See `04-TEXT-SEARCH.md` for full-text capabilities
- **GeoSPARQL**: See `05-GEOSPARQL.md` for spatial queries
- **Performance**: See `08-PERFORMANCE.md` for optimization
