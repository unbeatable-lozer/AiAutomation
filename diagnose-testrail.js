const https = require('https');
const { URL } = require('url');

const username = 'unbeatable.lozer@gmail.com';
const password = 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN';

console.log('=== TestRail Connection Diagnostics ===');
console.log(`Username: ${username}`);
console.log(`Password length: ${password.length}`);

// Test 1: Basic connectivity to the domain
console.log('\n--- Test 1: Basic Connectivity ---');
const domainOptions = {
  hostname: 'blisscoders.testrail.io',
  port: 443,
  path: '/',
  method: 'GET'
};

const domainReq = https.request(domainOptions, (domainRes) => {
  console.log(`Status: ${domainRes.statusCode}`);
  console.log(`Headers: ${JSON.stringify(domainRes.headers, null, 2)}`);
  
  domainRes.on('data', (chunk) => {
    // We don't need the body for this test
  });
  
  domainRes.on('end', () => {
    console.log('Domain connectivity: OK');
  });
});

domainReq.on('error', (e) => {
  console.error(`Domain connectivity failed: ${e.message}`);
});

domainReq.end();

// Test 2: Try to reach the login page
console.log('\n--- Test 2: Login Page ---');
const loginOptions = {
  hostname: 'blisscoders.testrail.io',
  port: 443,
  path: '/index.php?/auth/login/',
  method: 'GET'
};

const loginReq = https.request(loginOptions, (loginRes) => {
  console.log(`Status: ${loginRes.statusCode}`);
  console.log(`Headers: ${JSON.stringify(loginRes.headers, null, 2)}`);
  
  let loginData = '';
  loginRes.on('data', (chunk) => {
    loginData += chunk;
  });
  
  loginRes.on('end', () => {
    console.log(`Login page accessible: ${loginRes.statusCode === 200}`);
    if (loginData.length > 0) {
      console.log(`Login page length: ${loginData.length} characters`);
    }
  });
});

loginReq.on('error', (e) => {
  console.error(`Login page access failed: ${e.message}`);
});

loginReq.end();

// Test 3: Try API authentication with detailed logging
console.log('\n--- Test 3: API Authentication ---');
const apiOptions = {
  hostname: 'blisscoders.testrail.io',
  port: 443,
  path: '/index.php?/api/v2/get_user',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    'Content-Type': 'application/json'
  }
};

console.log(`Auth header: Basic ${Buffer.from(`${username}:${password}`).toString('base64').substring(0, 20)}...`);

const apiReq = https.request(apiOptions, (apiRes) => {
  console.log(`Status: ${apiRes.statusCode}`);
  console.log(`Headers: ${JSON.stringify(apiRes.headers, null, 2)}`);
  
  let apiData = '';
  apiRes.on('data', (chunk) => {
    apiData += chunk;
  });
  
  apiRes.on('end', () => {
    console.log(`Response: ${apiData}`);
    try {
      const parsed = JSON.parse(apiData);
      console.log(`Parsed: ${JSON.stringify(parsed, null, 2)}`);
    } catch (e) {
      console.log('Could not parse JSON response');
    }
  });
});

apiReq.on('error', (e) => {
  console.error(`API request failed: ${e.message}`);
});

apiReq.end();

console.log('\n=== Diagnostics Complete ===');