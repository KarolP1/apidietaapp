const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let RefreshTokenSchema = new Schema({
	userId: {
		type: String,
		required: true,
		unique: true,
	},
	refreshToken: {
		type: String,
		required: true,
		unique: true,
	},
	createdAt: { type: Date, default: Date.now, expires: "7d" },
});

const RefreshToken = mongoose.model("refreshToken", RefreshTokenSchema);
module.exports = RefreshToken;
