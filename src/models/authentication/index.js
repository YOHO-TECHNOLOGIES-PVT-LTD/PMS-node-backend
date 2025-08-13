import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    uuid:{
        type:String,
        required:true,
        unique:true,
    },
    first_name:{
        type:String,
        required:true,
    },
    last_name:{
        type:String,
        requied:true,
    },
    email:{
        type:String,
        required:true,
    },
    phoone_number:{
        type:String,
        required:true,
    },
    address:{
        type:String,
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