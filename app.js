const express = require("express");
const app = express();

app.get("/", (req, res) => {
	console.log(req);
	res.send("What u know about rollin down in the deep");
})

app.listen(3000);
