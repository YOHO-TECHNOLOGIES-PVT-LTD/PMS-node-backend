import { ActivityLogModel } from "../../models/activity_log/index.js"
import { maintenance } from "../../models/maintenance/index.js"
import { GetUUID } from "../../utils/authhelper.js"
import { validation } from "../../validations/index.js"

export const CreateMaintenance=async(req,res)=>{
    try {
        const value = validation.maintenance(req.body)
        const user = req.user
        const data = new maintenance({
            uuid: await GetUUID(),
            ...value
        })

        await data.save()

        await ActivityLogModel.create({
            userId:user._id,
            title:'create new maintenance',
            details:`${user.full_name} to created new maintenance request`,
            action:'save'
        })

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
        const user = req.user
        const data = await maintenance.findOneAndUpdate({uuid},{
            ...value
        })

        await ActivityLogModel.create({
            userId:user._id,
            title:'update maintenance info',
            details:`${user.full_name} to update the maintenance id ${data._id}`,
            action:'findOneAndUpdate',
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
        const user = req.user
        const data = await maintenance.findOneAndUpdate({uuid},{status})

        await ActivityLogModel.create({
            userId:user._id,
            title:'update status in maintenance',
            details:`${user.full_name} to update status in maintenance id ${data._id}`,
            action:'findOneAndUpdate'
        })

        res.status(200).json({success:true,message:"maintenance update success"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
export const DeleteMaintenance=async(req,res)=>{
    try {
        const {uuid} = req.params
        const user = req.user
        const data = await maintenance.updateOne({uuid},{is_delete:true})

        await ActivityLogModel.create({
            userId:user._id,
            title:'delete maintenance',
            details:`${user.full_name} to deleted the maintenance id ${data._id}`,
            action:'updateOne'
        })

        res.status(200).json({success:true,message:"maintenance update success"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}