const mongoose = require("mongoose")

const schema = mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    username: String,
    picture: String,
    token: String,
    age: { type: Number, required: false },
    records: [{ 
        year: Number, 
        records: [{
            month: String, 
            records: [{
                day: Number,
                expenses: [{ 
                    description: String,
                    category: String,
                    money: Number,
                    tags: [String]
                }],
                entries: [{ 
                    description: String,
                    category: String,
                    money: Number,
                    tags: [String]
                }]
            }]
        }]
    }],
    createdAt: { type: Date, default: Date.now() },
    sex: String,
    whatsappNumber: String,
    momoNumber: String,
    preferences: String
})

module.exports = mongoose.model("User", schema)