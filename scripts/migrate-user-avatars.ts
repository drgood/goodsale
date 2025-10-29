import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function migrateUserAvatars() {
  console.log('Starting user avatar migration...');
  
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users`);
    
    let updated = 0;
    
    for (const user of allUsers) {
      // Check if avatar URL is from picsum or is null
      if (!user.avatarUrl || user.avatarUrl.includes('picsum.photos')) {
        const seed = encodeURIComponent(user.name);
        const newAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
        
        await db
          .update(users)
          .set({ avatarUrl: newAvatarUrl })
          .where(eq(users.id, user.id));
        
        console.log(`Updated avatar for: ${user.name}`);
        updated++;
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} user avatars.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateUserAvatars();
