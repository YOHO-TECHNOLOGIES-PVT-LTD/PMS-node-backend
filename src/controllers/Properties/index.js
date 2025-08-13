import { ActivityLogModel } from "../../models/activity_log/index.js";
import { PropertyModel } from "../../models/Properties/index.js";

const validatePropertyData = (data) => {
    const errors = [];

    if (!data.property_name || data.property_name.trim() === "") {
        errors.push("Property name is required");
    }

    if (!data.property_type) {
        errors.push("Property type is required");
    }

    if (!data.square_feet || data.square_feet.trim() === "") {
        errors.push("Square feet is required");
    }

    if (!data.property_address || data.property_address.trim() === "") {
        errors.push("Property Address is required");
    }

    if (!data.owner_information) {
        errors.push("Owner information is required");
    } else {
        const owner = data.owner_information;
        if (!owner.full_name) errors.push("Owner full name is required");
        if (!owner.email) errors.push("Owner email is required");
        if (!owner.phone) errors.push("Owner phone is required");
        if (!owner.address) errors.push("Owner address is required");
    }

    return errors;
};


export const createProperty = async (req, res) => {
    try {
        const errors = validatePropertyData(req.body);
        const user = req.user
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const property = new PropertyModel(req.body);
        await property.save();

        await ActivityLogModel.create({
            userId:user._id,
            title:'added new property',
            details:`${user.first_name} to added new property`,
            action:'save'
        })

        return res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: property
        });
    } catch (error) {
        console.error("Create Property Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllProperties = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
        } = req.query;

        const filters = { is_deleted: false };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await PropertyModel.countDocuments(filters);

        const properties = await PropertyModel.aggregate([
            { $match: filters },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: "units",
                    localField: "_id",
                    foreignField: "propertyId",
                    as: "units"
                }
            },
            {
                $lookup: {
                    from: "tenants",
                    localField: "units._id",
                    foreignField: "unit",
                    as: "tenants"
                }
            },
            {
                $addFields: {
                    total_units: { $size: "$units" },
                    occupied_units: {
                        $size: {
                            $filter: {
                                input: '$units',
                                as: "unit",
                                cond: {
                                    $in: ["$$unit._id", "$tenants.unit"]
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    vacant_units: { $subtract: ["$total_units", "$occupied_units"] },
                    occupancy_rate: {
                        $cond: [
                            { $eq: ["$total_units", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ["$occupied_units", "$total_units"] },
                                            100
                                        ]
                                    },
                                    2 
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    units: 0,
                    tenants:0
                }
            }

        ])

        return res.status(200).json({
            success: true,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            data: properties
        });
    } catch (error) {
        console.error("Get Properties Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPropertyByUUID = async (req, res) => {
    try {
        const { uuid } = req.params
        const property = await PropertyModel.findOne({ uuid: uuid });

        if (!property || property.is_deleted) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        return res.status(200).json({ success: true, data: property });
    } catch (error) {
        console.error("Get Property Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePropertyByUUID = async (req, res) => {
    try {
        const { uuid } = req.params
        const user = req.user
        const property = await PropertyModel.findOneAndUpdate(
            { uuid: uuid },
            req.body,
            { new: true, runValidators: true }
        );

        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        await ActivityLogModel.create({
            userId:user._id,
            title:'update property info',
            details:`${user.first_name} to updated the property id ${property._id}`,
            action:'findOneAndUpdate'
        })

        return res.status(200).json({
            success: true,
            message: "Property updated successfully",
            data: property
        });
    } catch (error) {
        console.error("Update Property Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePropertyByUUID = async (req, res) => {
    try {
        const { uuid } = req.params
        const user = req.user
        const property = await PropertyModel.findOneAndUpdate(
            { uuid: uuid },
            { is_deleted: true },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }
        await ActivityLogModel.create({
            userId:user._id,
            title:'soft delete property',
            details:`${user.first_name} to deleted the property id ${property._id}`,
            action:'findOneAndUpdate'
        })
        return res.status(200).json({ success: true, message: "Property deleted successfully" });
    } catch (error) {
        console.error("Delete Property Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
