import express from "express"
import { downloadMonthlyExcel, downloadRentPDF, getRents, markRentPaidByUUID } from "../../controllers/Rent/index.js";

const RentRouter = express.Router();

RentRouter.get("/", getRents);
RentRouter.put("/:uuid", markRentPaidByUUID)
RentRouter.post("/download/pdf", downloadRentPDF)
RentRouter.post("/download/excel", downloadMonthlyExcel)

export default RentRouter;