const mongoose = require('mongoose')

const users = mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status: {  // Field to track user status (blocked or active)
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }
})

// const User = mongoose.model('User',user)

module.exports = mongoose.model('User',users)