import express from "express"
import { dashBoardReports } from "../../controllers/Dashboard/index.js";

const DashBoardRouter = express.Router();

DashBoardRouter.get("/report", dashBoardReports)

export default DashBoardRouter;