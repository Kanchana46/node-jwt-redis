const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");

const jwtHelper = require("../util/jwt_helper");

const User = require("../model/user_model");
const UserToken = require("../model/userToken_model");

let client;

async function redis() {
    const redis_client = await require("../util/redis");
    client = redis_client;
}

redis()

router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        console.log(req.body)
        const isUserExists = await User.findOne({ email })

        if (isUserExists) {
            res.send("User already exists.")
        }
        const salt = await bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword
        })

        res.status(200).json(user);

    } catch (err) {
        console.log(err);
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (user) {
            if (isPasswordMatched) {
                const token = await jwtHelper.generateAccessToken(user._id)
                user.token = token;
                const refToken = await jwtHelper.generateRefreshToken(user._id)
                await UserToken.create({
                    userId: user._id,
                    refreshToken: refToken,
                    createdAt: new Date()
                })
                let uid = `${user._id}`
                await client.setEx(uid, 30 * 24 * 60 * 60, refToken);

                res.status(200).json({
                    userId: user._id,
                    token: token,
                    refreshToken: refToken
                });
            }
        } else {
            res.status(400).json('Invalid credentials');
        }
    } catch (err) {
        console.log(err);
    }
});


router.get('/doSomeWork', auth, (req, res) => {
    res.status(200).send("You are authenticated");
});


router.post('/refreshToken', async (req, res) => {
    try {
        const payload = await jwtHelper.verifyRefreshToken(req.body.refreshToken);
        const refTokenRedis = await client.get(payload.userId);
        console.log('val', refTokenRedis)
        if (refTokenRedis == null) {
            res.send("Refresh token does not exist")
        } else {
            const token = await jwtHelper.generateAccessToken(payload.userId);
            const refToken = await jwtHelper.generateRefreshToken(payload.userId);
            res.json({ token: token, refreshToken: refToken })
        }
    } catch (err) {
        res.send(err)
    }
});

router.post('/logout', async (req, res) => {
    try {
        const deleted = await client.del(req.body.userId)
        //const deleted = await UserToken.findOneAndRemove({ userId: req.body.userId })
        console.log(deleted)
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;