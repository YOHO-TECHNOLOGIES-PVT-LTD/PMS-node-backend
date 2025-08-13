import express from "express"
import { createProperty, deletePropertyByUUID, getAllProperties, getPropertyByUUID, updatePropertyByUUID } from "../../controllers/Properties/index.js";
import { AuthVerify } from "../../middelware/authverify.js";

const PropertyRouter = express.Router();

PropertyRouter.post("/create",AuthVerify(["owner"]),createProperty);
PropertyRouter.get("/", getAllProperties);
PropertyRouter.get("/:uuid", getPropertyByUUID);
PropertyRouter.put("/:uuid",AuthVerify(["owner"]),updatePropertyByUUID);
PropertyRouter.delete("/:uuid",AuthVerify(["owner"]),deletePropertyByUUID);

export default PropertyRouter;