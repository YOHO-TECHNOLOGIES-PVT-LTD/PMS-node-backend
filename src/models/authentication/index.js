import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    uuid:{
        type:String,
        required:true,
        unique:true,
    },
    full_name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:["owner","admin","manager","finance"],
    },
    is_two_completed:{
        type:Boolean,
        default:false,
    },
    is_active:{
        type:Boolean,
        default:true,
    },
    is_delete:{
        type:Boolean,
        default:false,
    }
},{
    timestamps:true
})

export const UserModel = mongoose.model("UserModel",userSchema)