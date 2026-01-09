const fs = require('fs');
const path = require('path');

try {
    const indexPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', 'index.js');
    console.log('Reading:', indexPath);
    if (fs.existsSync(indexPath)) {
        const fd = fs.openSync(indexPath, 'r');
        const buffer = Buffer.alloc(2000);
        const bytesRead = fs.readSync(fd, buffer, 0, 2000, 0);
        console.log(buffer.slice(0, bytesRead).toString('utf8'));
        fs.closeSync(fd);
    } else {
        console.log('index.js not found. Checking package.json main...');
        const pkgPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        console.log('Main:', pkg.main);
        const mainPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', pkg.main);
        console.log('Reading Main:', mainPath);
        console.log(fs.readFileSync(mainPath, 'utf8'));
    }
} catch (e) {
    console.error('Error:', e);
}
