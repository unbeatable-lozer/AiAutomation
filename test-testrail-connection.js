require('dotenv').config();
const { TestRailClient } = require('./dist/framework/testrail/client');

async function testConnection() {
  console.log('Testing TestRail connection...');
  console.log('URL:', process.env.TESTRAIL_URL);
  console.log('Username:', process.env.TESTRAIL_USERNAME);
  console.log('API Key:', process.env.TESTRAIL_API_KEY ? 'SET' : 'NOT SET');
  console.log('Project ID:', process.env.TESTRAIL_PROJECT_ID);
  console.log('Suite ID:', process.env.TESTRAIL_SUITE_ID);

  const config = {
    url: process.env.TESTRAIL_URL,
    username: process.env.TESTRAIL_USERNAME,
    apiKey: process.env.TESTRAIL_API_KEY,
    projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1'),
    suiteId: process.env.TESTRAIL_SUITE_ID ? parseInt(process.env.TESTRAIL_SUITE_ID) : undefined
  };

  const client = new TestRailClient(config);

  try {
    const connected = await client.ping();
    if (connected) {
      console.log('✓ Successfully connected to TestRail!');
      
      // Try to get project info
      const project = await client.getProject(config.projectId);
      console.log('✓ Project retrieved:', project.name);
      
      // Try to get suite info if suiteId is set
      if (config.suiteId) {
        const suite = await client.getSuite(config.projectId, config.suiteId);
        console.log('✓ Suite retrieved:', suite.name);
      }
      
      // Try to get cases
      const cases = await client.getCases(config.projectId, config.suiteId || 0);
      console.log('✓ Retrieved', cases.length, 'test cases');
      
    } else {
      console.log('✗ Failed to connect to TestRail');
    }
  } catch (error) {
    console.log('✗ Error connecting to TestRail:');
    console.log('Error message:', error.message);
    if (error.message.includes('Authentication failed')) {
      console.log('\nThis usually means:');
      console.log('1. Invalid TestRail URL');
      console.log('2. Wrong username/email');
      console.log('3. Invalid or expired API key');
      console.log('4. API access not enabled for the user');
      console.log('5. Network/firewall blocking the request');
    }
    console.log('Full error:', JSON.stringify(error, null, 2));
  }
}

testConnection();