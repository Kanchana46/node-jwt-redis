const redis = require('redis');

module.exports = (async () => {
    const client = await redis.createClient();
    await client.connect();
    return client
})();