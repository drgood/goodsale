import { db } from '../src/db';
import { customers } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function fixCustomerAvatars() {
  console.log('Fixing customer avatars to use local placeholder...');
  
  try {
    const allCustomers = await db.select().from(customers);
    console.log(`Found ${allCustomers.length} customers`);
    
    let updated = 0;
    
    for (const customer of allCustomers) {
      // Update any external URL to local placeholder
      if (customer.avatarUrl && (customer.avatarUrl.includes('http://') || customer.avatarUrl.includes('https://'))) {
        const newAvatarUrl = '/placeholder.png';
        
        await db
          .update(customers)
          .set({ avatarUrl: newAvatarUrl })
          .where(eq(customers.id, customer.id));
        
        console.log(`Updated avatar for: ${customer.name}`);
        updated++;
      }
    }
    
    console.log(`✅ Complete! Updated ${updated} customer avatars to local placeholder.`);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixCustomerAvatars();
