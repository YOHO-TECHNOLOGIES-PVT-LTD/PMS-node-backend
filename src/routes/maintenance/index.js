import express from 'express'
import { CreateMaintenance, DeleteMaintenance, GetAllMaintenance, GetOneMaintenance, UpdateMaintenance } from '../../controllers/maintenance/index.js'
const maintenanceRoute = express.Router()

maintenanceRoute.post('/create',CreateMaintenance)
maintenanceRoute.get('/getall',GetAllMaintenance)
maintenanceRoute.get('/get/:uuid',GetOneMaintenance)
maintenanceRoute.put('/update/:uuid',UpdateMaintenance)
maintenanceRoute.put('/updatestatus/:uuid',UpdateMaintenance)
maintenanceRoute.delete('/delete/:uuid',DeleteMaintenance)


export default maintenanceRoute