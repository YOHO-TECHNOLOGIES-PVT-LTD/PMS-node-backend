import express from "express"
import { deleteRent, downloadMonthlyExcel, downloadRentPDF, getRents, markRentPaidByUUID } from "../../controllers/Rent/index.js";
import { AuthVerify } from "../../middelware/authverify.js";

const RentRouter = express.Router();

RentRouter.get("/", getRents);
RentRouter.put("/:uuid", markRentPaidByUUID)
RentRouter.get("/download/pdf/:uuid", downloadRentPDF)
RentRouter.post("/download/excel/:uuid", downloadMonthlyExcel)
RentRouter.delete("/delete/:uuid", AuthVerify(["owner","admin"]), deleteRent)

export default RentRouter;