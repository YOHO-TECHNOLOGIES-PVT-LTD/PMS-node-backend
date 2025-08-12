import express from "express"
import PropertyRouter from "./Properties/index.js"

const router = express.Router()

router.use("/property", PropertyRouter)

export default router