const User = require('../models/User')

async function addRecord(user_id, new_record) {
    var user = await User.findOne({
        _id: user_id   // search query
    })
    var records = user.records
    if (records.length === 0) {
        records = [{ 
            year: new_record.year, 
            records: [{
                month: new_record.month, 
                records: [{
                    day: new_record.day,
                    expenses: new_record.expenses,
                    entries: new_record.entries
                }]
            }]
        }]
        await User.updateOne(
            {_id: user_id}, 
            { $set: { 'records': records}},
            {"upsert" : true});

    } else {
        var year_exist = false
        var month_exist = false
        var day_exist = false
        records.forEach(year => {
            if (year.year === new_record.year) year_exist = true
            year.records.forEach(month => {
                if (month.month === new_record.month) month_exist = true
                month.records.forEach(day => {
                    if (day.day === new_record.day) {
                        day_exist = true
                        day.expenses = new_record.expenses
                        day.entries = new_record.entries
                    }
                });
                if (!day_exist) {
                    month.records.push({
                        day: new_record.day,
                        expenses: new_record.expenses,
                        entries: new_record.entries
                    })
                }
            });

            if (!month_exist) {
                year.records.push({
                    month: new_record.month, 
                    records: [{
                        day: new_record.day,
                        expenses: new_record.expenses,
                        entries: new_record.entries
                    }]
                })
            }
        });

        if (!year_exist) {
            records.push({ 
                year: new_record.year, 
                records: [{
                    month: new_record.month, 
                    records: [{
                        day: new_record.day,
                        expenses: new_record.expenses,
                        entries: new_record.entries
                    }]
                }]
            })
        }
    }
    await User.updateOne(
        {_id: user_id}, 
        { $set: { 
            'records': records
            }
        },
        {"upsert" : true});
}

const userController = {
    all: async function () {
        const users = await User.find({})
        return users
    },
    get: async function (user_id, token) {
        try {
            const user = await User.findOne({_id: user_id})
            if (user) {
                if (user.token === token) return {status: 'success', data: user} 
                return {status: 'error', message: 'Invalid Credentials'}
            }
            return {status: 'error', message: 'Ressource not found'}
        } catch (error) {
            return {status: 'error', message: error}
        }
    },
    create: async function (data) {
        try {
            const user = new User(data)
            await user.save()
            return {status: 'success', data: user}
        } catch (error) {
            return {status: 'error', message: error}
        }
    },
    updateRecords: async function (new_records, user_id, token) {
        const user = await User.findOne({_id: user_id})
        if (user && user.token === token) {
            try {
                for (i=0; i < new_records.length; i++) {
                    await addRecord(user_id, new_records[i])
                }
                return {status: 'success', message: 'Records updated'}
            } catch (error) {
                return {status: 'error', message: error}
            }
        }
        return {status: 'error', message: 'Invalid Credentials'}
    },
    updateToken: async function (user_id, token) {
        try {
            await User.updateOne(
                {_id: user_id}, 
                { $set: { 
                    'token': token
                    }
                },
                {"upsert" : true});
            return true
        } catch (error) {
            return false
        }
    },
    updateData: async function (user_id, token, data) {
        const user = await User.findOne({_id: user_id})
        if (user && user.token === token) {
            try {
                await User.updateOne(
                    {_id: user_id }, 
                    { $set: data },
                    {"upsert" : true});
                    return {status: 'success', message: 'user updated'}
            } catch (error) {
                return {status: 'error', message: error}
            }
        }
        return {status: 'error', message: 'Invalid Credentials'}
    }
}

module.exports = userController;