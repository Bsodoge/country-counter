const express = require("express");
const geoip = require('geoip-lite');

const app = express();

app.get("/", (req, res) => {
	let ip = req.headers['x-forwarded-for'] ||  req.socket.remoteAddress || null;
	if(ip.startsWith("::ffff:")) ip = ip.substring(7); 
	const geo = geoip.lookup("94.2.58.89");
	console.log(geo);
	res.send(geo.country);
})

app.listen(3000);
