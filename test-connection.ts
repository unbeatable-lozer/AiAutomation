import * as dotenv from 'dotenv';
import { TestRailClient } from './src/framework/testrail/client';
import { TestRailConfig } from './src/framework/testrail/types';

dotenv.config();

const config: TestRailConfig = {
  url: process.env.TESTRAIL_URL || '',
  username: process.env.TESTRAIL_USERNAME || '',
  apiKey: process.env.TESTRAIL_API_KEY || '',
  projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1'),
  suiteId: process.env.TESTRAIL_SUITE_ID ? parseInt(process.env.TESTRAIL_SUITE_ID) : undefined
};

console.log('Testing TestRail connection...');
console.log('URL:', config.url);
console.log('Username:', config.username);
console.log('API Key:', config.apiKey ? 'SET' : 'NOT SET');
console.log('Project ID:', config.projectId);
console.log('Suite ID:', config.suiteId);

const client = new TestRailClient(config);

client.ping().then(connected => {
  console.log('Connection successful:', connected);
}).catch(error => {
  console.error('Connection failed:', error);
});