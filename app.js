const express = require("express");
const fs = require("node:fs/promises");
const geoip = require('geoip-lite');
const sql = require("./db");
const path = require("path");
const jsdom = require("jsdom");

const app = express();

const generateCard = (countryCount) => {
	const { JSDOM } = jsdom;
	const { document } = (new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)).window;

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute('style', 'border: 1px solid black');
	svg.setAttribute('width', '467');
	svg.setAttribute('height', '195');
	svg.setAttribute('role', 'img');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

	const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
	style.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	style.innerHTML = "@import url('https://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic');"
	svg.appendChild(style);

	const container = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	container.setAttribute('fill', '#1a1b27');
	container.setAttribute('width', '467');
	container.setAttribute('height', '195');
	container.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	svg.appendChild(container);	

	const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
	title.setAttribute('fill', '#fff');
	title.setAttribute('x', `5`);
	title.setAttribute('y', `30`);
	title.setAttribute('font-size', `20`);
	title.setAttribute('font-family', 'Roboto');
	title.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	title.textContent = "This page has been viewed by people in: ";
	svg.appendChild(title);

	let x = 8;
	let y = -40;
	countryCount.forEach(country => {
		const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		group.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

		group.innerHTML += country.flag;
		group.firstChild.setAttribute("width", "20");
		group.firstChild.setAttribute("x", `${x}`);
		group.firstChild.setAttribute("y", `${y}`);

		const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttribute('fill', '#fff');
		text.setAttribute('x', `${x + 27}`);
		text.setAttribute('y', `${y + 101.5}`);
		text.setAttribute('font-size', `16`);
		text.setAttribute('font-family', 'Roboto');
		text.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		text.textContent = country.count;
		group.appendChild(text);

		svg.appendChild(group);
		x += 50;
		if(x >= 400){
			x = 8
			y += 20; 
		}
	})
	return svg.outerHTML;
}

app.get("/", async (req, res) => {
	try{
		const { username } = req.query;
		let ip = req.headers['x-forwarded-for'].split(',')[0] ||  req.socket.remoteAddress || null;
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
	     	  const string = flag.toString();
		  countryCount.push({ code, flag: string, count: 1});
		}
		countryCount.sort((a, b) => a.count > b.count ? -1 : 1);
		res.set({
			'Content-Type': 'image/svg+xml',
	  		'Content-Length': '123',
		})	
		res.send(generateCard(countryCount));
	}catch(e){
		console.log(e);
		res.status(400).send({error: e.message})
	}
	res.end();
})

app.listen(3000);
