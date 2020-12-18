const createError = require("http-errors");
const User = require("../Models/User.schema");
const { authSchema } = require("../helpers/validation_schema_user");
const {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} = require("../helpers/jwt_helper");
const client = require("../helpers/init_redis");

const register = async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);

		const doesExist = await User.findOne({ email: result.email });
		if (doesExist)
			throw createError.Conflict(`${result.email} is already been registered`);

		const user = new User(result);
		const savedUser = await user.save();
		const accessToken = await signAccessToken(savedUser.id);
		const refreshToken = await signRefreshToken(savedUser.id);

		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi === true) error.status = 422;
		next(error);
	}
};
const login = async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);
		const user = await User.findOne({ email: result.email });
		if (!user)
			throw createError.NotFound(
				"Użytkownik o podanym adresie email nie istnieje"
			);
		const isMach = await user.isValidPassword(result.password);
		if (!isMach)
			throw createError.Unauthorized("Email lub hasło są nie poprawne");

		const accessToken = await signAccessToken(user.id);
		const refreshToken = await signRefreshToken(user.id);
		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi)
			return next(createError.BadRequest("Email lub hasło są nie poprawne"));
		next(error);
	}
};

const refreshToken = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest();
		const userId = await verifyRefreshToken(refreshToken);
		const acces = await signAccessToken(userId);
		const refresh = await signRefreshToken(userId);
		res.send({ accessToken: acces, refreshToken: refresh });
	} catch (err) {
		next(err);
	}
};

const logout = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) throw createError.BadRequest;
		const userId = await verifyRefreshToken(refreshToken);
		client.DEL(userId, (err, value) => {
			if (err) {
				console.log(err);
				throw createError.InternalServerError();
			}
			console.log(value);
			res.sendStatus(204);
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	register,
	login,
	refreshToken,
	logout,
};
