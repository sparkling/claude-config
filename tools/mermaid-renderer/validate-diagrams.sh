#!/bin/bash
# Validate all mermaid diagrams in a markdown file
# Usage: ./validate-diagrams.sh <markdown-file>

set -e

FILE="${1:?Usage: validate-diagrams.sh <markdown-file>}"
TMPDIR=$(mktemp -d)
PUPPETEER_CONFIG="$TMPDIR/puppeteer.json"
echo '{"args":["--no-sandbox"]}' > "$PUPPETEER_CONFIG"

# Extract mermaid blocks with line numbers
python3 -c "
import re, sys

with open('$FILE', 'r') as f:
    content = f.read()

blocks = list(re.finditer(r'\`\`\`mermaid\n(.*?)\`\`\`', content, re.DOTALL))
for i, block in enumerate(blocks):
    line = content[:block.start()].count('\n') + 1
    code = block.group(1).strip()
    outfile = '$TMPDIR/block_{}.mmd'.format(i)
    with open(outfile, 'w') as f:
        f.write(code)
    print('{}|{}|{}'.format(i, line, outfile))
" | while IFS='|' read -r idx line_num mmd_file; do
    echo -n "Block $idx (line $line_num): "
    if npx -y @mermaid-js/mermaid-cli@latest -i "$mmd_file" -o "$TMPDIR/out_${idx}.png" --puppeteerConfigFile "$PUPPETEER_CONFIG" 2>"$TMPDIR/err_${idx}.txt"; then
        echo "OK"
    else
        echo "FAIL"
        head -3 "$TMPDIR/err_${idx}.txt" | grep -v "^$" | head -1
    fi
done

rm -rf "$TMPDIR"
