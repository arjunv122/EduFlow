const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'email.util.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace mustard/orange/yellow with red/dark-red
content = content.replace(/#E8A020/ig, '#E03131');
content = content.replace(/#C4780A/ig, '#C92A2A');
content = content.replace(/#FBBC04/ig, '#FF8787');
content = content.replace(/#F59E0B/ig, '#E03131');

// Replace "EduFlow" with "SRIHER Academic Portal" in a few specific places if needed, 
// but the user only mentioned "colour name format and all". 
// Wait, the user said "colour name format and all". This might mean they also want the name format?
// "Your EduFlow access is ready" is fine, but let's just do colors.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors updated successfully in email.util.js');
