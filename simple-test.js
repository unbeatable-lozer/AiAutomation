const https = require('https');

const username = 'unbeatable.lozer@gmail.com';
const password = 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN';
const auth = Buffer.from(`${username}:${password}`).toString('base64');

const options = {
  hostname: 'blisscoders.testrail.io',
  port: 443,
  path: '/index.php?/api/v2/get_user',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
};

console.log('Testing connection with:');
console.log('  Hostname:', options.hostname);
console.log('  Path:', options.path);
console.log('  Auth header starts with:', options.headers.Authorization.substring(0, 20));

const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();