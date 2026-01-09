const fs = require('fs');
const path = require('path');

const libPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', 'lib', 'pdf-parse.js');
console.log('Checking:', libPath);
console.log('Exists?', fs.existsSync(libPath));

if (fs.existsSync(libPath)) {
    // Try requiring it to see what it exports
    try {
        const lib = require(libPath);
        console.log('Type of lib export:', typeof lib);
    } catch (e) {
        console.error('Require failed:', e.message);
    }
}
