import bcrypt from "bcryptjs"
import { UserModel } from "../../models/authentication/index.js"
import { GetUUID, JWTEncoded } from "../../utils/authhelper.js"
import { validation } from "../../validations/index.js"

export const RegisterUser=async (req,res) => {
    try {
        const {email,full_name,password,role} = validation.authRegiter(req.body)

        const user = await UserModel.findOne({email})
        if (user) {
           return res.status(302).json({success:false,message:"user already exists."})
        }

        const hashpass = bcrypt.hashSync(password,13)

        const newuser =new UserModel({
            uuid: await GetUUID(),
            email,
            password:hashpass,
            full_name,
            role,
        })

        await newuser.save()

        res.status(201).json({success:true,message:"new user created",newuser})

    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}


export const LoginUser=async (req,res) => {
    try {
        const {email,password} = req.body
        
        const user = await UserModel.findOne({email:email.toLowerCase()})

        if (!user) {
            return res.status(404).json({success:false,message:'user not founded'})
        }
        
        const valid = bcrypt.compareSync(password,user?.password)
        
        if (valid) {
            const {token} =await JWTEncoded(user)
            res.status(200).json({success:true,message:"login success",token})
        }else{
            res.status(400).json({success:false,message:"password doesn't match"})
        }
        
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

export const GetUserDetails= async(req,res)=>{
    try {
        console.log(req.user, "user")
        const profile = await UserModel.findById({_id: req.user._id})
        if(!profile){
           return res.status(400).json({message: "Profile not found"})
        }
        res.status(200).json({success:true,message:'profile data fetched',data:profile})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

export const UpdateUser=async (req,res) => {
    try {
        const value = req.body
        const {uuid} = req.user
        const user = await UserModel.findOneAndUpdate({uuid},{...value})

        res.status(200).json({success:true,message:'profile updated'})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

export const ChangeUserPassword = async(req,res)=>{
    try {
        const {old_password,new_password} = req.body
        const user = req.user

        const data = await UserModel.findById(user?._id)

        const valid = bcrypt.compareSync(old_password,data.password)
        if (!valid) {
            return res.status(400).json({success:false,message:"old password incorrect"})
        }

        const hashpass = bcrypt.hashSync(new_password,13)

        await UserModel.updateOne({uuid:data.uuid},{password:hashpass})

        res.status(200).json({success:true,message:"password updated"})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

// export const LogoutUser=async (req,res) => {
//     try {
        
//     } catch (error) {
//         res.status(500).json({success:false,message:error.message})
//     }
// }