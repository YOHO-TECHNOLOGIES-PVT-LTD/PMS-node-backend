import express from "express"
import { createUnit, deleteUnitByUUID, getAllUnits, getUnitByUUID, updateUnitByUUID } from "../../controllers/Units/index.js";

const UnitRouter = express.Router();

UnitRouter.post("/create", createUnit)
UnitRouter.get("/", getAllUnits)
UnitRouter.get("/:uuid", getUnitByUUID)
UnitRouter.put("/:uuid", updateUnitByUUID)
UnitRouter.delete("/:uuid", deleteUnitByUUID)

export default UnitRouter;