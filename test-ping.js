const TestRailClient = require('./dist/framework/testrail/client').TestRailClient;

const config = {
  url: 'https://blisscoders.testrail.io/',
  username: 'unbeatable.lozer@gmail.com',
  apiKey: 'THkHE7oJjdtokc5n.MEu-GJz8.n9kkj9FwXBAJ5YN',
  projectId: 1,
  suiteId: 1
};

const client = new TestRailClient(config);

client.ping().then(result => {
  console.log('Ping result:', result);
}).catch(error => {
  console.error('Ping error:', error.message);
});