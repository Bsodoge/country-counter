const express = require("express");
const fs = require("node:fs/promises");
const geoip = require('geoip-lite');
const sql = require("./db");
const path = require("path");

const app = express();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")))

app.get("/", async (req, res) => {
	try{
		const { username } = req.query;
		let ip = req.headers['x-forwarded-for'] ||  req.socket.remoteAddress || null;
		if(!username || !username.length || !username.trim().length) throw new Error("Username not valid");
		if(ip.startsWith("::ffff:")) ip = ip.substring(7); 
		const geo = geoip.lookup(ip);
		const countryCode = geo.country.toLowerCase();
		await sql`INSERT INTO country_information (country, ip) VALUES (${countryCode}, ${ip}) ON CONFLICT (ip) DO NOTHING;`
		await sql`INSERT INTO user_information (username) VALUES (${username}) ON CONFLICT (username) DO NOTHING;`
		await sql`INSERT INTO user_country_information (username, ip) VALUES (${username}, ${ip}) ON CONFLICT (ip) DO NOTHING;`
		const response = await sql`SELECT country_information.country FROM user_country_information RIGHT JOIN country_information ON user_country_information.ip = country_information.ip WHERE username=${username};`
		const countries = response.map(obj => obj.country);
		const countryCount = [];
		for (const code of countries) {
		  const country = countryCount.find(country => country.code === code);
		  if(country){
		  	country.count++; 
 			continue;
		  }
		  const flag = await fs.readFile(`${__dirname}/country-flags/${code}.svg`);
		  countryCount.push({ code, flag, count: 1});
		}
		res.render("index", { countryCount });
	}catch(e){
		res.status(400).send({error: e.message})
	}
	res.end();
})

app.listen(3000);
