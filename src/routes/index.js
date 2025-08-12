import express from "express"
import PropertyRouter from "./Properties/index.js"
import authroutes from "./authentication/index.js"
import UnitRouter from "./Units/index.js"
import TenantRouter from "./Tenants/index.js"
import RentRouter from "./Rent/index.js"
import LeaseRouter from "./Lease/index.js"

const routes = express.Router()

routes.use("/property", PropertyRouter)
routes.use('/auth',authroutes)
routes.use('/unit', UnitRouter)
routes.use('/tenant', TenantRouter)
routes.use('/rent', RentRouter)
routes.use('/lease', LeaseRouter)

export default routes
