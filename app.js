import express from "express";
import dotenv from "dotenv";
import db from "./src/config/database.js"
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors"


dotenv.config();

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(morgan('combined'))
app.use(cors())
app.use(cors({origin:["http://localhost:5173","http://localhost:5174"]}))

const PORT = process.env.PORT

app.listen(PORT, ()=>{
    console.log(`Server Running at http://localhost:${PORT}`)
})