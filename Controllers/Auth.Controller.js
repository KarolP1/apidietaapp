const createError = require("http-errors");
const User = require("../Models/User.schema");
const Refresh = require("../Models/RefreshToken.schema");
const { authSchema } = require("../helpers/validation_schema_user");
const {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	tryToFindRefreshToken,
} = require("../helpers/jwt_helper");

const {
	editToken,
	addToken,
	removeToken,
} = require("../helpers/refresh_token");
const register = async (req, res, next) => {
	try {
		const result = await authSchema.validateAsync(req.body);

		const doesExist = await User.findOne({ email: result.email });
		if (doesExist)
			throw createError.Conflict(`${result.email} is already been registered`);
		const newUser = new User(result);
		const savedUser = await newUser.save();

		const accessToken = await signAccessToken(savedUser.id);
		const refreshToken = await signRefreshToken(savedUser.id);

		const newRefresh = new Refresh({
			userId: newUser.id,
			refreshToken: refreshToken,
		});
		await newRefresh.save();
		await newUser.refToken.push(newRefresh);
		await newUser.save();
		console.log({ newUser, newRefresh });

		res.send({ accessToken, refreshToken });
	} catch (error) {
		if (error.isJoi) error.status = 422;
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
		const refreshTokenInBase = await tryToFindRefreshToken(user.id);
		if (refreshTokenInBase) {
			editToken(user.id, refreshToken);
		} else {
			addToken(user.id, refreshToken);
		}

		res.send({ accessToken, refreshToken, userId: user.id });
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
		const refreshTokenInBase = await tryToFindRefreshToken(userId);
		if (refreshTokenInBase) {
			await editToken(userId, refresh);
		} else {
			await addToken(userId, refresh);
		}

		res.send({ accessToken: acces, refreshToken: refresh, userId: userId });
	} catch (err) {
		next(err);
	}
};

const logout = async (req, res, next) => {
	const { userId } = req.body;
	try {
		if (!userId) throw createError.BadRequest;
		removeToken(userId);
	} catch (error) {
		next(error);
	}
	res.send({ message: `${userId} removed ` });
};

module.exports = {
	register,
	login,
	refreshToken,
	logout,
};
