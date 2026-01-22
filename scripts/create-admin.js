const bcrypt = require('bcryptjs');

async function generateAdminHash() {
  const password = 'Admin@123!';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('='.repeat(60));
  console.log('ADMIN USER CREDENTIALS');
  console.log('='.repeat(60));
  console.log('Email:    admin@chatme.com');
  console.log('Username: admin');
  console.log('Password: Admin@123!');
  console.log('Role:     admin');
  console.log('='.repeat(60));
  console.log('\nPassword Hash:', hash);
  console.log('\nSQL Command:');
  console.log(`INSERT INTO users (email, username, password_hash, role, full_name)
VALUES ('admin@chatme.com', 'admin', '${hash}', 'admin', 'System Administrator')
ON CONFLICT (email) DO NOTHING;`);
}

generateAdminHash();
