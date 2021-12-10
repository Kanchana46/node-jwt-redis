const redis = require('redis');
const client = redis.createClient("redis://127.0.0.1:6379");
console.log('AAA')

client.on('connect', function () {
    console.log('Connected!');
});

client.on('error', err => {
    console.log('Error ' + err);
});


module.exports = client