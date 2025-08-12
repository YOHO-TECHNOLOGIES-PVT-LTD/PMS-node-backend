import express from "express"
import { createTenant, deleteTenantByUUID, getAllTenants, getTenantByUUID, updateTenantByUUID } from "../../controllers/Tenants/index.js";

const TenantRouter = express.Router();

TenantRouter.post("/create", createTenant)
TenantRouter.get("/", getAllTenants)
TenantRouter.get("/:uuid", getTenantByUUID)
TenantRouter.put("/:uuid", updateTenantByUUID)
TenantRouter.delete("/:uuid", deleteTenantByUUID)

export default TenantRouter;