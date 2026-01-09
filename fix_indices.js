const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
let currentModel = null;

const newLines = lines.map(line => {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
    if (modelMatch) {
        currentModel = modelMatch[1];
        return line;
    }
    if (line.includes('}') && /^}/.test(line.trim())) {
        currentModel = null;
        return line;
    }

    if (currentModel && (line.includes('@@index') || line.includes('@@unique'))) {
        return line.replace(/map:\s*"([^"]+)"/, (match, name) => {
            // Remove existing suffixes to avoid duplicate suffixing
            let cleanName = name.replace(/(_idx|_key|_fkey)$/, '');

            // Remove existing model prefix if present (case insensitive check)
            const prefixRegex = new RegExp('^' + currentModel + '_', 'i');
            cleanName = cleanName.replace(prefixRegex, '');

            const suffix = line.includes('@@unique') ? '_key' : '_idx';
            return `map: "${currentModel}_${cleanName}${suffix}"`;
        });
    }
    return line;
});

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
console.log('Indices renamed successfully.');
