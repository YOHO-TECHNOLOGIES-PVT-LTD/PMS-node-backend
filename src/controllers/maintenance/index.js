import { maintenance } from "../../models/maintenance/index.js"
import { GetUUID } from "../../utils/authhelper.js"
import { validation } from "../../validations/index.js"

export const CreateMaintenance=async(req,res)=>{
    try {
        const value = validation.maintenance(req.body)

        const data = new maintenance({
            uuid: await GetUUID(),
            ...value
        })

        await data.save()

        res.status(200).json({success:true,message:"new maintenance created",data})        
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const GetAllMaintenance=async(req,res)=>{
    try {
        let {page = 1, perpage = 10} = req.query
        page = parseInt(page)
        perpage =parseInt(perpage)

        const data =await maintenance.find()
                    .skip((page-1)* perpage)
                    .limit(perpage)
                    .sort({createdAt:-1})

        res.status(200).json({success:true,message:'all data fetched', data})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const GetOneMaintenance=async(req,res)=>{
    try {
        const {uuid} = req.params

        const data = await maintenance.findOne({uuid}).populate("propertyId")

        res.status(200).json({success:true,message:'maintenance data feteched', data})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const UpdateMaintenance=async(req,res)=>{
    try {
        const value = req.body
        const {uuid}= req.params

        await maintenance.findOneAndUpdate({uuid},{
            ...value
        })

        res.status(200).json({success:true,message:"maintenance update success"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const UpdateMaintenanceStatus=async(req,res)=>{
    try {
        const {status} = req.body
        const {uuid}= req.params

        await maintenance.findOneAndUpdate({uuid},{status})

        res.status(200).json({success:true,message:"maintenance update success"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const DeleteMaintenance=async(req,res)=>{
    try {
        const {uuid} = req.params
        await maintenance.updateOne({uuid},{is_delete:true})

        res.status(200).json({success:true,message:"maintenance update success"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}