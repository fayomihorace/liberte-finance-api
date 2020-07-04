var express = require('express');
var router = express.Router();
const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json')
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0]
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
const User = require('./models/User')
const userController = require('./controllers/userController.js')
const TokenGenerator = require('uuid-token-generator');

var authed = false;
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);

router.get('/auth/google', function(req, res){
    if (!authed) { 
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ]
        });
        console.log(url)
        res.redirect(url);
    } else {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const labels = res.data.labels;
            if (labels.length) {
                console.log('Labels:');
                labels.forEach((label) => {
                    console.log(`- ${label.name}`);
                });
            } else {
                console.log('No labels found.');
            }
        });
        res.send('Logged in')
    }
});
router.get('/auth/google/callback', function(req, res){
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code,async function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                var oauth2 = google.oauth2({
                    auth: oAuth2Client,
                    version: 'v2'
                  });
                  await oauth2.userinfo.v2.me.get(
                    async function(err, resp) {
                        if (err) {
                            res.send({status: 'error', message: err});
                        } else {
                            const token = tokgen.generate()
                            var user = {}
                            user = await User.findOne({email: resp.data.email})
                            if (user) {
                                await userController.updateToken(user._id, token)
                                res.send({
                                    status: 'success',
                                    data: user
                                });
                            } else {
                                const response = await userController.create({
                                    token: token,
                                    username: resp.data.name,
                                    firstname: resp.data.given_name,
                                    lastname: resp.data.family_name,
                                    email: resp.data.email,
                                    picture: resp.data.picture,
                                    records: []
                                })
                                res.send(response);
                            }
                        }
                    });
            }
        });
    }
});

// logout
router.get("/auth/google/logout/:user_id/:token", async (req, res) => {
    console.log('--------------------- ')
    const user = await User.findOne({_id: req.params.user_id})
    if (user && user.token === req.params.token) {
        try {
            await User.updateOne(
                {_id: req.params.user_id}, 
                { $set: { 'token': '' } },
                {"upsert" : true});
                res.send({status: 'success', message: 'logged out'});
        } catch (error) {
            res.send({status: 'error', message: error})
        }
    }
    res.send({status: 'error', message: 'Invalid Credentials'})
})


// update records
router.post("/user/update/records/:user_id/:token", async (req, res) => {
    res.send(await userController.updateRecords(req.body, req.params.user_id, req.params.token))
})

// update user profile infos
router.post("/user/update/data/:user_id/:token", async (req, res) => {
    res.send(await userController.updateData(req.params.user_id, req.params.token, req.body))
})

// Get user by ID
router.get("/user/:user_id/:token", async (req, res) => {
    res.send(await userController.get(req.params.user_id, req.params.token))
})

// Get all users
/* router.get("/users", async (req, res) => {
    res.send(await userController.all())
}) */

//export this router to use in our index.js
module.exports = router;