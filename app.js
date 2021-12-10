const express = require('express');
const app = express();
require('dotenv').config()
//require("./util/redis")

const redis = require("redis");
const client = redis.createClient();

client.on("error", function (error) {
    console.error(error);n
});

client.set("key", "value", redis.print);
client.get("key", redis.print);

app.use(express.json());

const db = require('./db/db');

const userRoutes = require('./routes/user_routes');
app.use('/user', userRoutes);

const PORT = 3000;


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});

//