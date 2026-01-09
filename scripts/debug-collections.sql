-- Check if collection exists
SELECT * FROM merch_collections WHERE slug = 'test';

-- Check if products are linked to collection
SELECT 
    cp.*,
    c.name as collection_name,
    p.displayName as product_name
FROM collection_products cp
LEFT JOIN merch_collections c ON cp.collectionId = c.id
LEFT JOIN mockup_product_templates p ON cp.productId = p.id;

-- Check all collections
SELECT id, slug, name FROM merch_collections;

-- Check all products
SELECT id, slug, displayName FROM mockup_product_templates;
