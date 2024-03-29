const express = require("express");
const fs = require("node:fs/promises");
const geoip = require('geoip-lite');

const app = express();

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
	let ip = req.headers['x-forwarded-for'] ||  req.socket.remoteAddress || null;
	if(ip.startsWith("::ffff:")) ip = ip.substring(7); 
	const geo = geoip.lookup("175.45.176.67");
	try{
		const countryCode = geo.country.toLowerCase();
		const flag = await fs.readFile(`${__dirname}/country-flags/${countryCode}.svg`);
		//res.writeHead(200, {"Content-Type" : "text/html"});
		//res.write(flag);
		res.render("index")
		res.end();
	}catch(e){
		res.send(e)
	}
})

app.listen(3000);
