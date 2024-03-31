const express = require("express");
const fs = require("node:fs/promises");
const geoip = require('geoip-lite');
const sql = require("./db");

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
		await sql`INSERT INTO user_country_information (country, count) VALUES (${countryCode}, 1) ON CONFLICT (country) DO UPDATE SET count = user_country_information.count + 1;`
		res.render("index", { countryCode, flag });
		res.end();
	}catch(e){
		res.send(e)
	}
})

app.listen(3000);
