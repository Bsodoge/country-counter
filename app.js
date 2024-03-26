const express = require("express");
const geoip = require('geoip-lite');

const app = express();

app.get("/", (req, res) => {
	let ip = req.headers['x-forwarded-for'] ||  req.socket.remoteAddress || null;
	if(ip.startsWith("::ffff:")) ip = ip.substring(7);
	res.send(geoip.lookup(ip));
})

app.listen(3000);
