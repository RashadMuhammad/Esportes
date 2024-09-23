const mongoose = require('mongoose')

const users = mongoose.Schema({
    googleId: String,
    username:{
        type:String,
        required:false,
        unique: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:false
    },
    status: {  // Field to track user status (blocked or active)
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }
})

// const User = mongoose.model('User',user)

module.exports = mongoose.model('User',users)