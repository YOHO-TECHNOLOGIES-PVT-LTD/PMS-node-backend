import express from "express"
import { deleteNotify, markedAsAllRead, markedAsRead, notificationGetAll } from "../../controllers/Notification/index.js";

const NotifyRouter = express.Router();

NotifyRouter.get("/", notificationGetAll)
NotifyRouter.put("/:uuid", markedAsRead)
NotifyRouter.delete("/:uuid", deleteNotify)
NotifyRouter.put("/read/all", markedAsAllRead)

export default NotifyRouter