import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
    title: {
        type: String,
    },
    description: {
        type: String
    },
    notify_type: {
        type: String,
        enum: ["rent", "lease"]
    },
    is_read : {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

export const NotifyModel = mongoose.model("notification", NotificationSchema)