import express from "express"
import PropertyRouter from "./Properties/index.js"
import authroutes from "./authentication/index.js"
import maintenanceRoute from "./maintenance/index.js"

const routes = express.Router()

routes.use("/property", PropertyRouter)
routes.use('/auth',authroutes)
routes.use('/maintenance',maintenanceRoute)

export default routes
