import express from "express"
import { createProperty, deletePropertyByUUID, getAllProperties, getPropertyByUUID, updatePropertyByUUID } from "../../controllers/Properties/index.js";

const PropertyRouter = express.Router();

PropertyRouter.post("/create", createProperty);
PropertyRouter.get("/", getAllProperties);
PropertyRouter.get("/:uuid", getPropertyByUUID);
PropertyRouter.put("/:uuid", updatePropertyByUUID);
PropertyRouter.delete("/:uuid", deletePropertyByUUID);

export default PropertyRouter;