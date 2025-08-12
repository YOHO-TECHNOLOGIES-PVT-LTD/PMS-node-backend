import mongoose, { Schema } from "mongoose";
import { v4 as uuid } from "uuid";

const RentsSchema = new Schema({
    uuid: {
        type: String,
        default: uuid
    },
    propertyId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "property"
    },
    tenantId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "tenant"
    },
    paymentDueDay: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["paid", "pending", "overdue"],
        default: "pending"
    },
    reminderShown: { 
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const RentsModel = mongoose.model("rent", RentsSchema);
