const https = require('https');

const username = 'unbeatable.lozer@gmail.com';
const apiKey = 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN';

console.log('Testing different API endpoints...');

// Test different possible API endpoints
const endpoints = [
  '/index.php?/api/v2/get_user',
  '/api/v2/get_user',
  '/v2/get_user',
  '/get_user'
];

endpoints.forEach(endpoint => {
  const options = {
    hostname: 'blisscoders.testrail.io',
    port: 443,
    path: endpoint,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  };

  console.log(`\nTesting endpoint: ${endpoint}`);
  
  const req = https.request(options, (res) => {
    console.log(`  Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`  Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
    });
  });

  req.on('error', (e) => {
    console.log(`  Error: ${e.message}`);
  });

  req.end();
});