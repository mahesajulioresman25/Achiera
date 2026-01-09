const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    "src/lib/actions/rasa-ibu/production.ts", // productionPlan uses variants? No spread sheet says productionPlan.
    "src/lib/pricing/PriceCalculator.ts",
    "src/lib/actions/rasa-ibu/automation.ts", // productMapping uses productVariant?
    "src/lib/actions/inventory/skuGenerator.ts",
    "src/lib/actions/intelligence.ts",
    "src/lib/actions/commerce/campaigns.ts", // productBundle?
    "src/lib/actions/commerce/marketingAnalytics.ts", // productBundle?
    "src/lib/intelligence/automationEngine.ts", // productMapping
    "src/lib/actions/commerce/bundles.ts", // productBundle
    "src/lib/intelligence/productionEngine.ts", // productionPlan
    "src/app/dashboard/rasa-ibu/inventory/labels/page.tsx",
    "src/app/api/public/price/calculate/route.ts",
    "src/app/api/public/products/[id]/route.ts",
    "src/app/api/public/orders/route.ts",
    "src/app/api/brands/[brandId]/campaigns/[campaignId]/bundles/route.ts", // productBundle
    "src/app/api/admin/collections/[id]/products/route.ts",
    "src/app/api/admin/[brandSlug]/products/route.ts",
    "src/app/api/admin/products/[id]/route.ts",
    "src/app/api/admin/pricing/scope-options/route.ts",
    "src/app/api/admin/products/[id]/variants/route.ts",
    "src/app/api/admin/products/[id]/variants/[variantId]/route.ts"
];

const replacements = [
    { from: /prisma\.product\./g, to: 'prisma.mockupProductTemplate.' },
    { from: /prisma\.productVariant\./g, to: 'prisma.mockupVariant.' }
];

filesToUpdate.forEach(relativePath => {
    const fullPath = path.resolve(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;

        replacements.forEach(rep => {
            content = content.replace(rep.from, rep.to);
        });

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            console.log(`Updated: ${relativePath}`);
        } else {
            console.log(`No changes needed: ${relativePath}`);
        }
    } else {
        console.warn(`File not found: ${relativePath}`);
    }
});
