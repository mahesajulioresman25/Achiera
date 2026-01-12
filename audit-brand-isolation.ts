
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(process.cwd(), 'src/lib');
const BRAND_SCOPED_MODELS = [
    'frozenVariant', 'frozenProduct', 'recipe', 'inventoryBatch', 'stockMutation',
    'invoice', 'transaction', 'productionPlan', 'productionPlanItem', 'adCampaign'
];
// These are property names in prisma client, usually lower camelCase of model name

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const errors: string[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Simple regex to catch prisma.<model>.update({ where: { ... } }) pattern
        // This is a heuristic, not a full AST parser, but good for catching obvious ones.

        for (const model of BRAND_SCOPED_MODELS) {
            // Check for .update({
            // match "prisma.<model>.update(" or "tx.<model>.update(" or "client.<model>.update("
            const updatePattern = new RegExp(`\\.(?:${model})\\.update\\(`, 'g');

            if (updatePattern.test(line)) {
                // If found, check if next few lines contain 'brandId' or 'updateMany'
                // Actually, if it's .update(), it's suspicious unless we are sure.
                // But better to Flag ALL .update() on these models and manually review.
                // Because .update() by definition usually only takes ID.

                // Exception: maybe checking 'warehouse: { brandId: ... }' inside where?
                // But .update() WHERE clause only accepts Unique inputs.
                // Does Unique input allow compound indices? Yes, if defined in schema.
                // But most of our models use single ID.

                errors.push(`[LINE ${index + 1}] Usage of .update() on '${model}'. Verify if it should be .updateMany() with brandId.`);
            }

            const deletePattern = new RegExp(`\\.(?:${model})\\.delete\\(`, 'g');
            if (deletePattern.test(line)) {
                errors.push(`[LINE ${index + 1}] Usage of .delete() on '${model}'. Verify if it should be .deleteMany() with brandId.`);
            }
        }
    });

    return errors;
}

function walkDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            walkDir(path.join(dir, file), fileList);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                fileList.push(path.join(dir, file));
            }
        }
    }
    return fileList;
}

const files = walkDir(ROOT_DIR);
console.log(`Scanning ${files.length} files for Brand Isolation violations...`);

let violationCount = 0;

files.forEach(file => {
    const errors = scanFile(file);
    if (errors.length > 0) {
        console.log(`\nFILE: ${path.relative(process.cwd(), file)}`);
        errors.forEach(e => console.log(e));
        violationCount += errors.length;
    }
});

console.log(`\nScan Complete. Found ${violationCount} potential violations.`);
