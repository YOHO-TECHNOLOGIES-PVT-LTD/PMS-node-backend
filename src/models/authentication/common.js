import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    uuid:{
        type:String,
    },
    token:{
        type:String,
    },
    iv:{
        type:String,
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"UserModel"
    },
    endDate:{
        type:Date,
    }
},{
    timestamps:true
})

const RoleSchema = mongoose.Schema({})