import express from "express"
import { createProperty, deletePropertyByUUID, getAllProperties, getPropertyByUUID, getPropertyType, updatePropertyByUUID } from "../../controllers/Properties/index.js";

const PropertyRouter = express.Router();

PropertyRouter.post("/create", createProperty);
PropertyRouter.get("/get_property", getPropertyType)
PropertyRouter.get("/", getAllProperties);
PropertyRouter.get("/:uuid", getPropertyByUUID);
PropertyRouter.put("/:uuid", updatePropertyByUUID);
PropertyRouter.delete("/:uuid", deletePropertyByUUID);


export default PropertyRouter;