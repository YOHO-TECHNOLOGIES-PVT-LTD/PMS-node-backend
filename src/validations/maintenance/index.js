import Joi from "joi";

const maintainSchema = Joi.object({
    full_name: Joi.string().min(4).required().messages({
        "string.base": `"full_name" should be a type of "string"`,
        "string.empty": `"full_name" cannot be an empty field`,
        "string.min": `"full_name" should have a minimum length of {#limit}`,
        "any.required": `"full_name" is a required field`,
    }),

   category:Joi.string().required().messages({
        "string.base":`"category" should be a type of string`,
        "any.required":`"category" is required field`,
   }),
   propertyId:Joi.string().required().messages({
        "string.base":`"propertyId" should be a objectId`,
        "any.required":`"propertyId" is required field`
   }),
   scheduled:Joi.string().required().messages({
        "string.base":`"scheduled" should be a date`,
        "any.required":`"scheduled" is required field`,
   }),
   status:Joi.string().optional(),
});

export const MaintenanceValidation = (data)=>{
     const {value,error} = maintainSchema.validate(data,{abortEarly:false})
    if (error) {
        throw new Error(error.details.map((detail)=>detail.message).join(","))
    }
    return value
}