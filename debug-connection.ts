import * as dotenv from 'dotenv';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

dotenv.config();

const config = {
  url: process.env.TESTRAIL_URL || '',
  username: process.env.TESTRAIL_USERNAME || '',
  apiKey: process.env.TESTRAIL_API_KEY || '',
  projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1'),
  suiteId: process.env.TESTRAIL_SUITE_ID ? parseInt(process.env.TESTRAIL_SUITE_ID) : undefined
};

console.log('Debugging TestRail connection...');
console.log('URL:', config.url);
console.log('Username:', config.username);
console.log('API Key length:', config.apiKey ? config.apiKey.length : 0);
console.log('API Key first 10 chars:', config.apiKey ? config.apiKey.substring(0, 10) : 'NOT SET');
console.log('Project ID:', config.projectId);
console.log('Suite ID:', config.suiteId);

// Remove trailing slash from URL
const baseUrl = config.url.replace(/\/$/, '');
const fullBaseUrl = `${baseUrl}/index.php?/api/v2`;
console.log('Base URL:', baseUrl);
console.log('Full base URL:', fullBaseUrl);

// Create Basic Auth header
const authString = `${config.username}:${config.apiKey}`;
const auth = Buffer.from(authString).toString('base64');
console.log('Auth header:', auth);

// Make request to get_user
const url = new URL(`${fullBaseUrl}/get_user`);
console.log('Full URL:', url.toString());

const isHttps = url.protocol === 'https:';
const transport = isHttps ? https : http;

const options: any = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'User-Agent': 'AI-Test-Framework/1.0'
  }
};

console.log('Request options:', JSON.stringify(options, null, 2));

const req = transport.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', parsed);
    } catch (e: any) {
      console.log('Could not parse as JSON:', e.message);
    }
  });
});

req.on('error', (e: any) => {
  console.error('Request error:', e.message);
});

req.end();