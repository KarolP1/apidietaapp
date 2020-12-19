const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

module.exports = {
	signAccessToken: (userId) => {
		return new Promise((resolve, reject) => {
			const payload = {};
			const secret = process.env.ACCESS_TOKEN_KEY;
			const options = {
				expiresIn: "15s",
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
				expiresIn: "1y",
				issuer: "http://dietanote.netlify.app/",
				audience: userId,
			};

			JWT.sign(payload, secret, options, (err, token) => {
				if (err) {
					console.log(err.message);
					reject(createError.InternalServerError());
				}
				client.SET(userId, token, "EX", 365 * 24 * 60 * 60, (err, response) => {
					if (err) {
						console.log(err.message);
						return reject(createError.InternalServerError());
					}
					console.log("token from redis:", token);
					resolve(token);
				});
				resolve(token);
			});
		});
	},
	verifyRefreshToken: (refreshToken) => {
		return new Promise((resolve, reject) => {
			JWT.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_KEY,
				(err, payload) => {
					if (err) return reject(createError.Unauthorized());
					const userId = payload.aud;

					client.GET(userId, (err, response) => {
						if (err) {
							console.log(err);
							reject(createError.InternalServerError());
							return;
						}
						if (refreshToken === resolve) {
							return resolve(userId);
						}
						reject(createError.Unauthorized());
					});

					resolve(userId);
				}
			);
		});
	},
};
