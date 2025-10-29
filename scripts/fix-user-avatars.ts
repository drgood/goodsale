import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function fixUserAvatars() {
  console.log('Fixing user avatars to use local placeholder...');
  
  try {
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users`);
    
    let updated = 0;
    
    for (const user of allUsers) {
      // Update any external URL to local placeholder
      if (user.avatarUrl && (user.avatarUrl.includes('http://') || user.avatarUrl.includes('https://'))) {
        const newAvatarUrl = '/placeholder.png';
        
        await db
          .update(users)
          .set({ avatarUrl: newAvatarUrl })
          .where(eq(users.id, user.id));
        
        console.log(`Updated avatar for: ${user.name}`);
        updated++;
      }
    }
    
    console.log(`✅ Complete! Updated ${updated} user avatars to local placeholder.`);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixUserAvatars();
