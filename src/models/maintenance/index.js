import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
    uuid:{
        type:String,
        required:true,
    },
    propertyId:{
        type:mongoose.Types.ObjectId,
        ref:"property",
        required:true,
    },
    full_name:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    scheduled:{
        type:Date,
        default:Date.now()
    },
    status:{
        type:String,
        enum:["assign","completed",'pending',"in-progress"],
        default:"assign"
    },
    is_delete:{
        type:Boolean,
        default:false,
    },
},{
    timestamps:true,
})

export const maintenance = mongoose.model("maintenance",maintenanceSchema)