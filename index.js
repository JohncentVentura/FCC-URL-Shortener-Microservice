require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

//Solution
//Mongodb setup, using mongoose is not necessary
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGODBURI);
const db = client.db("urlshortner");
const urls = db.collection("urls");

//body parsing middleware to handle the POST requests (from HTML Form)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//For verifying a submitted URL if it is a real link
const dns = require("dns");
const { URL } = require("url");

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(new URL(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments();
      const urlDoc = {
        url,
        short_url: urlCount, //The URL shortener depends on its count from the database
      };

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);
});
