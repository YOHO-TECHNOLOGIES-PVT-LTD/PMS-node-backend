import express from "express"
import { deleteNotify, markedAsRead, notificationGetAll } from "../../controllers/Notification/index.js";

const NotifyRouter = express.Router();

NotifyRouter.get("/", notificationGetAll)
NotifyRouter.put("/:uuid", markedAsRead)
NotifyRouter.delete("/:uuid", deleteNotify)

export default NotifyRouter