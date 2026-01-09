const fs = require('fs');
const path = require('path');

try {
    const pkgPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', 'package.json');
    const pkgContent = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    console.log('Main:', pkg.main);
    console.log('Type:', pkg.type);
    console.log('Exports:', JSON.stringify(pkg.exports, null, 2));
} catch (e) {
    console.error('Error reading package.json:', e);
}
