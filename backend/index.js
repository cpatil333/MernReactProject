const express = require("express");
const cors = require("cors");
const Jwt = require("jsonwebtoken");

require("./db/config");
const User = require("./db/User");
const product = require("./db/Product");
const Product = require("./db/Product");
const { $regex } = require("sift");
const app = express();

app.use(cors());
app.use(express.json());

const jwtkey = "e-comm";

// for login signup and login
app.post("/register", async (req, resp) => {
	let user = new User(req.body);
	let result = await user.save();
	result = result.toObject();
	delete result.password;
	const token = Jwt.sign({ result }, jwtkey, { expiresIn: "1h" });
	if (!token) {
		resp.send({ result: "Something went wrong, please try again later." });
	}
	resp.json({ result, auth: token });
});

app.post("/login", async (req, resp) => {
	if (req.body.email && req.body.password) {
		let user = await User.findOne(req.body).select("-password");
		if (user) {
			const token = Jwt.sign({ user }, jwtkey, { expiresIn: "1h" });
			if (!token) {
				resp.send({ result: "Something went wrong, please try again later." });
			}
			resp.json({ user, auth: token });
		} else {
			resp.send({ result: "No User found..!" });
		}
	} else {
		resp.send({ result: "No User found..!" });
	}
});

//for products information
app.post("/add-product", verifyToken, async (req, resp) => {
	let product = new Product(req.body);
	let result = await product.save();
	resp.send(result);
});

//get product list
app.get("/products", verifyToken, async (req, resp) => {
	let products = await Product.find();
	if (product.length > 0) {
		resp.send(products);
	} else {
		resp.send({ result: "No Products found!" });
	}
});

//to delete product
app.delete("/product/:id", async (req, resp) => {
	const result = await Product.deleteOne({ _id: req.params.id });
	resp.send(result);
});

//to get single product
app.get("/product/:id", verifyToken, async (req, resp) => {
	let result = await Product.findOne({ _id: req.params.id });
	if (result) {
		resp.send(result);
	} else {
		resp.send({ result: "Not found!" });
	}
});

//to update product
app.put("/product/:id", verifyToken, async (req, resp) => {
	let result = await Product.updateOne(
		{ _id: req.params.id },
		{ $set: req.body }
	);
	resp.send(result);
});

//to search product
app.get("/search/:key", verifyToken, async (req, resp) => {
	let result = await Product.find({
		$or: [
			{ name: { $regex: req.params.key } },
			{ company: { $regex: req.params.key } },
			{ category: { $regex: req.params.key } },
			{ price: { $regex: req.params.key } },
		],
	});
	resp.send(result);
});

// to call middleware token check for every user
function verifyToken(req, resp, next) {
	let token = req.headers["authorization"];

	if (token) {
		token = token.split(" ")[1];

		Jwt.verify(token, jwtkey, (error, valid) => {
			if (error) {
				resp.status(401).send({ result: "Please add valid token" });
			} else {
				next(); //move to
			}
		});
	} else {
		resp.status(403).send({ result: "Invalid token" });
	}
}
app.listen(3000);
