const username = 'unbeatable.lozer@gmail.com';
const apiKey = 'YiZNlUO.h.OCHIJcZ6vU-qTlht/dSTn8gZJDsmJg6';
const authString = `${username}:${apiKey}`;
const auth = Buffer.from(authString).toString('base64');
console.log('Auth string:', authString);
console.log('Auth header:', auth);
console.log('Basic auth value:', `Basic ${auth}`);