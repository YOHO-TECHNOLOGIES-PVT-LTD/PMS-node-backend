import mongoose, { Schema } from "mongoose";
import {v4 as uuid} from "uuid"

const TenantsSchema = new Schema({
    personal_information : {
        full_name : {
            type: String,
            required: true
        },
        email : {
            type: String,
            required: true
        },
        phone : {
            type: String,
            required: true
        },
        address : {
            type: String,
            required: true
        }
    },
    lease_duration: {
        start_date: {
            type: Date,
            default: null
        },
        end_date: {
            type: Date,
            default: null
        }
    },
    emergency_contact: {
        name: {
            type: String
        },
        phone: {
            type: String
        },
        relation: {
            type: String,
            enum: ["spouse", "parent", "sibling", "friend", "other"],
            default: "other"
        }
    },
    tenant_type: {
        type: String,
        enum: ["rent", "lease"],
        default: "rent"
    },
    unit: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    rent: {
        type: String,
    },
    deposit: {
        type: String,
        required: true
    },
    uuid: {
        type: String,
        default: uuid
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

export const TenantModel = mongoose.model("tenant", TenantsSchema)