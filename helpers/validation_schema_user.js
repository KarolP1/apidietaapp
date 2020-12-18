const Joi = require("joi");
Joi.val;

const authSchema = Joi.object({
	email: Joi.string().email().lowercase().required(),
	password: Joi.string().required().min(8).required(),
});

module.exports = {
	authSchema,
};
