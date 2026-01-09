const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);

async function run() {
    const dummyBuffer = Buffer.from('Dummy PDF Content');
    try {
        console.log('Calling pdf(buffer)...');
        const data = await pdf(dummyBuffer);
        console.log('Success keys:', Object.keys(data));
        console.log('Text:', data.text);
    } catch (e) {
        console.error('Caught error message:', e.message);
        console.error('Stack:', e.stack);
    } finally {
        process.exit(0);
    }
}

run();
