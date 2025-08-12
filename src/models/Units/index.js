import mongoose, { Schema } from "mongoose";
import { v4 as uuid} from "uuid"

const UnitsSchema = new Schema({
    propertyId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    unit_name: {
        type: String,
        required: true
    },
    unit_sqft: {
        type: String,
        required: true
    },
    unit_address: {
        type: String,
        required: true
    },
    unit_rent: {
        type: String,
        required: true
    },
    unit_deposit: {
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
    },
    image: {
        type: String,
        default: null
    }

}, {timestamps: true})

export const UnitsModel = mongoose.model("units", UnitsSchema)