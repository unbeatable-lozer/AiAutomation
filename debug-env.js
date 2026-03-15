const dotenv = require('dotenv');
const result = dotenv.config();
console.log('Dotenv result:', result);
if (result.error) {
  console.error('Dotenv error:', result.error);
}
console.log('Process env:');
console.log('TESTRAIL_URL:', process.env.TESTRAIL_URL);
console.log('TESTRAIL_USERNAME:', process.env.TESTRAIL_USERNAME);
console.log('TESTRAIL_API_KEY:', process.env.TESTRAIL_API_KEY ? 'SET' : 'NOT SET');
console.log('TESTRAIL_PROJECT_ID:', process.env.TESTRAIL_PROJECT_ID);
console.log('TESTRAIL_SUITE_ID:', process.env.TESTRAIL_SUITE_ID);