import express from 'express'
import authroutes from './authentication/index.js'
const routes = express.Router()

routes.use('/auth',authroutes)

export default routes