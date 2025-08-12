import mongoose, { Schema } from "mongoose";
import { v4 as uuid } from "uuid"

const LeaseSchema = new Schema({
    uuid: {
        type: String,
        default: uuid
    },
    propertyId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    tenantId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "expired"],
        default: "active"
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
},{timestamps: true})

export const LeaseModel = mongoose.model("lease", LeaseSchema)