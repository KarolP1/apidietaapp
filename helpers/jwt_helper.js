const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const RefreshToken = require("../Models/RefreshToken.schema");

module.exports = {
	signAccessToken: (userId) => {
		return new Promise((resolve, reject) => {
			const payload = { message: "ok" };
			const secret = process.env.ACCESS_TOKEN_KEY;
			const options = {
				expiresIn: "10m",
				issuer: "http://dietanote.netlify.app/",
				audience: userId,
			};

			JWT.sign(payload, secret, options, (err, token) => {
				if (err) {
					console.log(err.message);
					return reject(createError.InternalServerError());
				}
				resolve(token);
			});
		});
	},
	verifyAccessToken: (req, res, next) => {
		if (!req.headers["authorization"]) return next(createError.Unauthorized());

		const authHeader = req.headers["authorization"];
		const barerToken = authHeader.split(" ");
		const token = barerToken[1];

		JWT.verify(token, process.env.ACCESS_TOKEN_KEY, (err, payload) => {
			if (err) {
				const message =
					err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
				return next(createError.Unauthorized(message));
			}
			req.payload = payload;
			next();
		});
	},
	signRefreshToken: (userId) => {
		return new Promise((resolve, reject) => {
			const payload = {};
			const secret = process.env.REFRESH_TOKEN_KEY;
			const options = {
				expiresIn: "7d",
				issuer: "http://dietanote.netlify.app/",
				audience: userId,
			};

			JWT.sign(payload, secret, options, (err, token) => {
				if (err) {
					console.log(err.message);
					reject(createError.InternalServerError());
				}

				resolve(token);
			});
		});
	},
	verifyRefreshToken: (refreshToken) => {
		return new Promise(async (resolve, reject) => {
			JWT.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_KEY,
				(err, payload) => {
					if (err) return reject(createError.Unauthorized());

					const userId = payload.aud;

					resolve(userId);
				}
			);
		});
	},

	tryToFindRefreshToken: (userId) => {
		return new Promise((resolve, reject) => {
			const rtdb = RefreshToken.findOne({ userId });
			resolve(rtdb);
		});
	},
};
