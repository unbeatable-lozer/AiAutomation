const https = require('https');

const username = 'unbeatable.lozer@gmail.com';
const apiKey = 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN';
const authString = `${username}:${apiKey}`;
const auth = Buffer.from(authString).toString('base64');

console.log('Auth string:', authString);
console.log('Auth header:', auth);

// Test the exact URL that the client is trying to reach
const url = new URL('https://blisscoders.testrail.io/index.php?/api/v2/get_user');
console.log('URL:', url.toString());
console.log('Hostname:', url.hostname);
console.log('Port:', url.port);
console.log('Path:', url.pathname + url.search);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'User-Agent': 'AI-Test-Framework/1.0'
  }
};

console.log('Options:', JSON.stringify(options, null, 2));

const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();