const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'prisma/migrations/20260211042359_init/migration.sql');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
        console.log('BOM removed.');
    } else {
        console.log('No BOM found, but rewriting anyway to be safe.');
    }
    
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log('File saved successfully without BOM.');
} catch (err) {
    console.error('Error:', err);
}
