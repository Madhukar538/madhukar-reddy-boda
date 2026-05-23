/**
 * Custom YAML Serializer (simple recursive object to YAML string converter)
 */
export function toYaml(obj: any, indent = 0): string {
  const spacing = ' '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // If multiline or contains special chars, return block scalar or quoted
    if (obj.includes('\n')) {
      return '|\n' + obj.split('\n').map(line => ' '.repeat(indent + 2) + line).join('\n');
    }
    if (obj.includes(':') || obj.includes('#') || obj.startsWith('-') || obj.includes('[') || obj.includes(']')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return '\n' + obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return `${spacing}- ${toYaml(item, indent + 2).trimStart()}`;
      }
      return `${spacing}- ${toYaml(item, indent)}`;
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    let yaml = '';
    keys.forEach((key, index) => {
      const val = obj[key];
      const prefix = index === 0 && indent > 0 ? '' : spacing;
      if (typeof val === 'object' && val !== null) {
        yaml += `${prefix}${key}:${Array.isArray(val) ? '' : '\n'}${toYaml(val, indent + 2)}\n`;
      } else {
        yaml += `${prefix}${key}: ${toYaml(val, indent + 2)}\n`;
      }
    });
    return yaml.trimEnd();
  }

  return '';
}

/**
 * Tokenizes and highlights JSON strings for the terminal theme
 */
export function highlightJson(json: string): string {
  // Escape HTML tags to prevent XSS
  let escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Regex matches: keys, string values, numbers, booleans, null
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-foreground/80'; // default
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // It's a key
          cls = 'text-primary/95 font-semibold';
          return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
        } else {
          // It's a string value
          cls = 'text-accent/90';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-amber-500 font-medium';
      } else if (/null/.test(match)) {
        cls = 'text-muted-foreground/60';
      } else {
        // Number
        cls = 'text-amber-500 font-medium';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

/**
 * Tokenizes and highlights YAML strings for the terminal theme
 */
export function highlightYaml(yaml: string): string {
  let escaped = yaml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line for simplicity in YAML structure
  return escaped
    .split('\n')
    .map(line => {
      // Empty line
      if (!line.trim()) return '';

      // Comment line
      if (line.trim().startsWith('#')) {
        return `<span class="text-muted-foreground/50">${line}</span>`;
      }

      // Check if it's a key-value or list item
      // Matches: optional spacing, list dash (optional), key, colon, optional value
      const match = line.match(/^(\s*)(-\s*)?([^:]+)(:)(.*)$/);
      if (match) {
        const [, indent, dash, key, colon, value] = match;
        const dashSpan = dash ? `<span class="text-primary/70">${dash}</span>` : '';
        const keySpan = `<span class="text-primary/95 font-semibold">${key}</span>`;
        const colonSpan = `<span class="text-muted-foreground">${colon}</span>`;
        
        let valSpan = value;
        const trimmedVal = value.trim();
        if (trimmedVal) {
          if (trimmedVal.startsWith('"') || trimmedVal.startsWith("'")) {
            valSpan = ` <span class="text-accent/90">${trimmedVal}</span>`;
          } else if (trimmedVal === 'true' || trimmedVal === 'false' || !isNaN(Number(trimmedVal))) {
            valSpan = ` <span class="text-amber-500 font-medium">${trimmedVal}</span>`;
          } else if (trimmedVal === '|' || trimmedVal === '>') {
            valSpan = ` <span class="text-primary/70">${trimmedVal}</span>`;
          } else {
            valSpan = ` <span class="text-foreground/80">${trimmedVal}</span>`;
          }
        }
        
        return `${indent}${dashSpan}${keySpan}${colonSpan}${valSpan}`;
      }

      // Check if it is a list item without a key (just plain value)
      const listMatch = line.match(/^(\s*)-\s*(.*)$/);
      if (listMatch) {
        const [, indent, val] = listMatch;
        let valSpan = val;
        const trimmedVal = val.trim();
        if (trimmedVal) {
          if (trimmedVal.startsWith('"') || trimmedVal.startsWith("'")) {
            valSpan = `<span class="text-accent/90">${trimmedVal}</span>`;
          } else if (trimmedVal === 'true' || trimmedVal === 'false' || !isNaN(Number(trimmedVal))) {
            valSpan = `<span class="text-amber-500 font-medium">${trimmedVal}</span>`;
          } else {
            valSpan = `<span class="text-foreground/80">${trimmedVal}</span>`;
          }
        }
        return `${indent}<span class="text-primary/70">- </span>${valSpan}`;
      }

      return line;
    })
    .join('\n');
}
