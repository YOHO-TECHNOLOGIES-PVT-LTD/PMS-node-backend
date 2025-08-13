import express from "express"
import { downloadMonthlyExcel, downloadRentPDF, getRents, markRentPaidByUUID } from "../../controllers/Rent/index.js";

const RentRouter = express.Router();

RentRouter.get("/", getRents);
RentRouter.put("/:uuid", markRentPaidByUUID)
RentRouter.get("/download/pdf/:uuid", downloadRentPDF)
RentRouter.post("/download/excel/:uuid", downloadMonthlyExcel)

export default RentRouter;