import express from "express"
import { createLand, deleteLandByUUID, getAllLands, getLandByUUID, updateLandByUUID } from "../../controllers/Land/index.js";

const LandRouter = express.Router();

LandRouter.post("/create", createLand);
LandRouter.get("/", getAllLands);
LandRouter.get("/:uuid", getLandByUUID);
LandRouter.put("/:uuid", updateLandByUUID);
LandRouter.delete("/:uuid", deleteLandByUUID);

export default LandRouter;