import express from "express"
import { createTenant, deleteTenantByUUID, getAllTenants, getTenantByUUID, updateTenantByUUID } from "../../controllers/Tenants/index.js";
import { AuthVerify } from "../../middelware/authverify.js";

const TenantRouter = express.Router();

TenantRouter.post("/create",AuthVerify(["owner"]),createTenant)
TenantRouter.get("/", getAllTenants)
TenantRouter.get("/:uuid", getTenantByUUID)
TenantRouter.put("/:uuid",AuthVerify(["owner"]), updateTenantByUUID)
TenantRouter.delete("/:uuid",AuthVerify(["owner"]), deleteTenantByUUID)

export default TenantRouter;