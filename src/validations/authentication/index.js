import Joi from "joi";

const authSchema = Joi.object({
    first_name: Joi.string().min(4).required().messages({
        "string.base": `"first_name" should be a type of "string"`,
        "string.empty": `"first_name" cannot be an empty field`,
        "string.min": `"first_name" should have a minimum length of {#limit}`,
        "any.required": `"first_name" is a required field`,
    }),

    last_name: Joi.string().min(1).required().messages({
        "string.base": `"last_name" should be a type of "string"`,
        "string.empty": `"last_name" cannot be an empty field`,
        "string.min": `"last_name" should have a minimum length of {#limit}`,
        "any.required": `"last_name" is a required field`,
    }),

    phone_number:Joi.string().min(10).required().messages({
        "string.base": `"phone_number" should be a type of "string"`,
        "string.empty": `"phone_number" cannot be an empty field`,
        "string.min": `"phone_number" should have a minimum length of {#limit}`,
        "any.required": `"phone_number" is a required field`,
    }),

    email: Joi.string().email().required().messages({
        "string.base": `"email" should be a type of "string"`,
        "string.empty": `"email" cannot be an empty field`,
        "string.email": `"email" must be a valid email address`,
        "any.required": `"email" is a required field`,
    }),

    password: Joi.string().required().messages({
        "string.base": `"password" should be a type of "string"`,
        "string.empty": `"password" cannot be an empty field`,
        "any.required": `"password" is a required field`,
    }),

    address:Joi.string().required().messages({
        "string.base": `"address" should be a type of "string"`,
        "string.empty": `"address" cannot be an empty field`,
        "any.required": `"address" is a required field`,
    }),

    image:Joi.string().optional(),

    role: Joi.string().required().messages({
        "string.base": `"role" should be a type of "string"`,
        "string.empty": `"role" cannot be an empty field`,
        "any.required": `"role" is a required field`,
    })
});

export const AuthUserValidation = (data)=>{
     const {value,error} = authSchema.validate(data,{abortEarly:false})
    if (error) {
        throw new Error(error.details.map((detail)=>detail.message).join(","))
    }
    return value
}