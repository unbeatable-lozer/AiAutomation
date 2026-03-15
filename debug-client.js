const TestRailClient = require('./dist/framework/testrail/client').TestRailClient;

const config = {
  url: 'https://blisscoders.testrail.io/',
  username: 'unbeatable.lozer@gmail.com',
  apiKey: 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN',
  projectId: 1,
  suiteId: 1
};

console.log('Input config:', JSON.stringify(config, null, 2));

const client = new TestRailClient(config);

console.log('Client baseUrl:', client.baseUrl);
console.log('Client auth:', client.auth.substring(0, 20) + '...');