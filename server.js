// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, images, etc.) from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded audio files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// PostgreSQL database connection
const pool = new Pool({
  user: "postgres", // 🔁 replace with your actual PostgreSQL user
  host: "localhost",
  database: "music_poll", // ✅ ensure this DB exists
  password: "", // 🔁 replace with your actual PostgreSQL password
  port: 5455,
});

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Create table if it doesn't exist
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracks (
      id SERIAL PRIMARY KEY,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      rating INTEGER DEFAULT 0
    );
  `);
};

// Upload track route
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const { artist, title } = req.body;
    const filename = req.file.filename;
    //let success = "Successfully Uploaded file."

    await pool.query(
      "INSERT INTO tracks (artist, title, filename) VALUES ($1, $2, $3)",
      [artist, title, filename]
    );

    res.sendStatus(200);
    //res.json({"response":success})
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Upload failed.");
  }
});

// Get all tracks
app.get("/tracks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tracks ORDER BY rating DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch tracks error:", error);
    res.status(500).send("Could not fetch tracks.");
  }
});

// Rate a track (upvote/downvote)
app.post("/rate/:id", async (req, res) => {
  try {
    const { delta } = req.body;
    const { id } = req.params;

    await pool.query("UPDATE tracks SET rating = rating + $1 WHERE id = $2", [
      delta,
      id,
    ]);

    res.sendStatus(200);
  } catch (error) {
    console.error("Rating error:", error);
    res.status(500).send("Could not rate track.");
  }
});

// Initialize DB and start server
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on http://127.0.0.1:${PORT}`)
  );
});
