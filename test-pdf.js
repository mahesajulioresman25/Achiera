const pdf = require('pdf-parse');
console.log('pdf.PDFParse:', typeof pdf.PDFParse);
console.log('Is pdf.PDFParse a function?', typeof pdf.PDFParse === 'function');

try {
    const pdfDefault = require('pdf-parse/lib/pdf-parse.js');
    console.log('require("pdf-parse/lib/pdf-parse.js") type:', typeof pdfDefault);
} catch (e) {
    console.log('require("pdf-parse/lib/pdf-parse.js") failed:', e.message);
}
