import { db } from '../src/db';
import { customers } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function migrateCustomerAvatars() {
  console.log('Starting customer avatar migration...');
  
  try {
    // Get all customers
    const allCustomers = await db.select().from(customers);
    console.log(`Found ${allCustomers.length} customers`);
    
    let updated = 0;
    
    for (const customer of allCustomers) {
      // Check if avatar URL is from picsum, ui-avatars, or is null
      if (!customer.avatarUrl || customer.avatarUrl.includes('picsum.photos') || customer.avatarUrl.includes('ui-avatars.com')) {
        const seed = encodeURIComponent(customer.name);
        const newAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
        
        await db
          .update(customers)
          .set({ avatarUrl: newAvatarUrl })
          .where(eq(customers.id, customer.id));
        
        console.log(`Updated avatar for: ${customer.name}`);
        updated++;
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} customer avatars.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateCustomerAvatars();
