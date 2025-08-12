import express from "express"
import { getLeases } from "../../controllers/Lease/index.js";

const LeaseRouter = express.Router();

LeaseRouter.get("/", getLeases);

export default LeaseRouter;