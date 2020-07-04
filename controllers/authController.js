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

var authed = false;
const User = require('../models/User')

const userController = {
    all: async function () {
        const users = await User.find({})
        return users
    },
    get: async function (user_id) {
        const user = await User.findOne({
            _id: user_id  // search query
        })
        return user
    },
    create: async function (data) {
        const user = new User(data)
        await user.save()
        return user
    },
    updateRecords: async function (new_record) {
        await addRecord(new_record)
        return {satus: 'Records updated'}
    }
}

module.exports = userController;