const express = require("express");
const fs = require("node:fs/promises");
const geoip = require('geoip-lite');
const sql = require("./db");

const app = express();

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
	try{
		const { username } = req.query;
		let ip = req.headers['x-forwarded-for'] ||  req.socket.remoteAddress || null;
		if(!username || !username.length || !username.trim().length) throw new Error("Username not valid");
		if(ip.startsWith("::ffff:")) ip = ip.substring(7); 
		ip = "175.45.176.69";
		const geo = geoip.lookup(ip);
		const countryCode = geo.country.toLowerCase();
		const flag = await fs.readFile(`${__dirname}/country-flags/${countryCode}.svg`);
		await sql`INSERT INTO country_information (country, ip) VALUES (${countryCode}, ${ip}) ON CONFLICT (ip) DO NOTHING;`
		await sql`INSERT INTO user_information (username) VALUES (${username}) ON CONFLICT (username) DO NOTHING;`
		await sql`INSERT INTO user_country_information (username, country) VALUES (${username}, ${countryCode}, ${ip}) ON CONFLICT (ip) DO NOTHING;`
		res.render("index", { countryCode, flag });
	}catch(e){
		res.status(400).send({error: e.message})
	}
	res.end();
})

app.listen(3000);
