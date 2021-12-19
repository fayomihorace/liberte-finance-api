const express = require('express')
var routes = require('./routes.js');
const mongoose = require("mongoose")
const bodyParser = require("body-parser")

// Connect to MongoDB database
mongoose
  .connect("mongodb://localhost:27017/persofinance", { useNewUrlParser: true, useUnifiedTopology: true  })
  .then(() => {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.text())
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(function (req, res, next) {

        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        next();
    });
    app.use('/api', routes);
    const port = process.env.port || 5000
    app.listen(port, () => console.log(`Server running at ${port}`));
})



