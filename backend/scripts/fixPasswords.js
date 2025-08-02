const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Connect to MongoDB
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tsw-fantasy-league';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function fixUserPasswords() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get all users
    console.log('🔍 Finding users with unhashed passwords...');
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (user.password && user.password.startsWith('$2b$')) {
          console.log(`✅ User ${user.username} already has hashed password`);
          alreadyCorrectCount++;
          continue;
        }

        // Hash the plain text password
        console.log(`🔧 Fixing password for user: ${user.username}`);
        const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

        // Update the user with hashed password
        await User.findByIdAndUpdate(user._id, {
          password: hashedPassword
        });

        console.log(`✅ Fixed password for user: ${user.username}`);
        fixedCount++;

      } catch (userError) {
        console.error(`❌ Error fixing password for user ${user.username}:`, userError.message);
      }
    }

    console.log('\n🎯 Password fix completed:');
    console.log(`   - Users with correct hashed passwords: ${alreadyCorrectCount}`);
    console.log(`   - Users fixed: ${fixedCount}`);
    console.log(`   - Total users: ${users.length}`);

    // Verify a sample user
    if (users.length > 0) {
      const sampleUser = await User.findOne({});
      console.log(`\n🔍 Sample user verification:`);
      console.log(`   - Username: ${sampleUser.username}`);
      console.log(`   - Password starts with $2b$: ${sampleUser.password.startsWith('$2b$')}`);
      console.log(`   - Password length: ${sampleUser.password.length} characters`);
    }

  } catch (error) {
    console.error('❌ Password fix failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  fixUserPasswords();
}

module.exports = fixUserPasswords;
