import express from "express"
import { createUnit, deleteUnitByUUID, getAllUnits, getUnitByUUID, updateUnitByUUID } from "../../controllers/Units/index.js";
import { AuthVerify } from "../../middelware/authverify.js";

const UnitRouter = express.Router();

UnitRouter.post("/create",AuthVerify(["owner"]), createUnit)
UnitRouter.get("/", getAllUnits)
UnitRouter.get("/:uuid", getUnitByUUID)
UnitRouter.put("/:uuid",AuthVerify(["owner"]), updateUnitByUUID)
UnitRouter.delete("/:uuid",AuthVerify(["owner"]), deleteUnitByUUID)

export default UnitRouter;