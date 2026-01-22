const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'Sample123!';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSample users:');
  console.log('1. Agent User');
  console.log('   Email: agent@example.com');
  console.log('   Username: agent_user');
  console.log('   Password: Sample123!');
  console.log('   Role: agent');
  console.log('');
  console.log('2. Management User');
  console.log('   Email: manager@example.com');
  console.log('   Username: manager_user');
  console.log('   Password: Sample123!');
  console.log('   Role: management');
}

generateHashes();
