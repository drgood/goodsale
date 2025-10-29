import { db } from '../src/db';
import { products } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function migrateProductImages() {
  console.log('Starting product image migration...');
  
  try {
    // Get all products
    const allProducts = await db.select().from(products);
    console.log(`Found ${allProducts.length} products`);
    
    let updated = 0;
    
    for (const product of allProducts) {
      // Check if image URL is from picsum or other external sources
      if (product.imageUrl && (product.imageUrl.includes('picsum.photos') || product.imageUrl.includes('placehold.co'))) {
        // Use local placeholder for products without uploaded images
        const newImageUrl = '/placeholder-product.png';
        
        await db
          .update(products)
          .set({ imageUrl: newImageUrl })
          .where(eq(products.id, product.id));
        
        console.log(`Updated image for: ${product.name}`);
        updated++;
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} product images.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateProductImages();
