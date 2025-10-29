import { db } from '../src/db';
import { customers, users, products } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function setPicsumFallbacks() {
  console.log('Setting Picsum fallbacks...\n');
  
  try {
    // 1. CUSTOMERS - Always use Picsum avatars
    console.log('Processing customers...');
    const allCustomers = await db.select().from(customers);
    let customersUpdated = 0;
    
    for (const customer of allCustomers) {
      const seed = customer.name.toLowerCase().replace(/\s+/g, '');
      const avatarUrl = `https://picsum.photos/seed/${seed}/128/128`;
      
      await db
        .update(customers)
        .set({ avatarUrl })
        .where(eq(customers.id, customer.id));
      
      console.log(`  ✓ ${customer.name} → ${avatarUrl}`);
      customersUpdated++;
    }
    
    // 2. USERS - Use Picsum as fallback (only if no uploaded image)
    console.log('\nProcessing users...');
    const allUsers = await db.select().from(users);
    let usersUpdated = 0;
    
    for (const user of allUsers) {
      // Only update if no avatar or doesn't have an uploaded image
      if (!user.avatarUrl || !user.avatarUrl.startsWith('/uploads/')) {
        const seed = user.name.toLowerCase().replace(/\s+/g, '');
        const avatarUrl = `https://picsum.photos/seed/${seed}/128/128`;
        
        await db
          .update(users)
          .set({ avatarUrl })
          .where(eq(users.id, user.id));
        
        console.log(`  ✓ ${user.name} → ${avatarUrl}`);
        usersUpdated++;
      } else {
        console.log(`  - ${user.name} → keeping uploaded image: ${user.avatarUrl}`);
      }
    }
    
    // 3. PRODUCTS - Use Picsum as fallback (only if no uploaded image)
    console.log('\nProcessing products...');
    const allProducts = await db.select().from(products);
    let productsUpdated = 0;
    
    for (const product of allProducts) {
      // Only update if no image or doesn't have an uploaded image
      if (!product.imageUrl || !product.imageUrl.startsWith('/uploads/')) {
        const seed = product.sku.toLowerCase().replace(/\s+/g, '');
        const imageUrl = `https://picsum.photos/seed/${seed}/400/300`;
        
        await db
          .update(products)
          .set({ imageUrl })
          .where(eq(products.id, product.id));
        
        console.log(`  ✓ ${product.name} → ${imageUrl}`);
        productsUpdated++;
      } else {
        console.log(`  - ${product.name} → keeping uploaded image: ${product.imageUrl}`);
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   - Customers: ${customersUpdated} updated (always Picsum)`);
    console.log(`   - Users: ${usersUpdated} updated to Picsum fallback`);
    console.log(`   - Products: ${productsUpdated} updated to Picsum fallback`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setPicsumFallbacks();
