const redis = require("redis");

const client = redis.createClient({
	port: 6379,
	host: "127.0.0.1",
});

client.on("connect", () => {
	console.log("client connected");
});

client.on("error", (err) => {
	console.log(err.message);
});

client.on("ready", () => {
	console.log("client redy and ready to use");
});

client.on("end", () => {
	console.log("client end");
});

process.on("SIGINT", () => {
	client.quit();
});

module.exports = client;
