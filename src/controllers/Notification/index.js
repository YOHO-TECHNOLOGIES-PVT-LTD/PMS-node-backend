import { NotifyModel } from "../../models/Notification/index.js"

export const notificationGetAll = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
        } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notification = await NotifyModel.find({ is_deleted: false }).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 })
        return res.status(200).json({
            success: true,
            message: "Notification Retrieved Successfully",
            data: notification
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const markedAsRead = async (req, res) => {
    try {
        const { uuid } = req.params;
        const updated = await NotifyModel.findOneAndUpdate(
            { _id: uuid },
            { is_read: true },
            { new: true}
        );
        return res.status(200).json({
            success: true,
            message: "Updated notification marked as read"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const markedAsAllRead = async (req, res) => {
    try {
        const updated = await NotifyModel.updateMany({is_read: false}, {$set: {is_read: true}});
        return res.status(200).json({
            success: true,
            message: "Updated notification all marked as read"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const deleteNotify = async (req, res) => {
    try {
        const { uuid } = req.params;
        const updated = await NotifyModel.findOneAndUpdate(
            { _id: uuid },
            { is_deleted: true },
            { new: true}
        );
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}