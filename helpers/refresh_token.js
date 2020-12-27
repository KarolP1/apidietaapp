const RefreshTokenSchema = require("../Models/RefreshToken.schema");

module.exports = {
	editToken: async (userId, refreshToken) => {
		await RefreshTokenSchema.findOneAndUpdate({ userId }, { refreshToken });
	},
	addToken: async (userId, refreshToken) => {
		await RefreshTokenSchema({ userId, refreshToken }).save();
	},
	removeToken: async (userId) => {
		await RefreshTokenSchema.findOneAndDelete({ userId });
	},
};
