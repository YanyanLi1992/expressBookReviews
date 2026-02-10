const express = require("express");
const axios = require("axios");

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

// Change this if your server runs on a different port
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/* ---------------------------
   INTERNAL DATA ENDPOINTS
   (Used ONLY so Axios calls won't recurse)
---------------------------- */

// Get full books object (internal)
public_users.get("/books-data", (req, res) => {
  return res.status(200).json(books);
});

// Get book by ISBN (internal)
public_users.get("/books-data/isbn/:isbn", (req, res) => {
  const { isbn } = req.params;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json(books[isbn]);
});

// Get books by author (internal)
public_users.get("/books-data/author/:author", (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = [];

  Object.keys(books).forEach((key) => {
    if (books[key].author.toLowerCase() === author) {
      result.push({ isbn: key, ...books[key] });
    }
  });

  if (result.length === 0) {
    return res.status(404).json({ message: "No books found for this author" });
  }
  return res.status(200).json(result);
});

// Get books by title (internal)
public_users.get("/books-data/title/:title", (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = [];

  Object.keys(books).forEach((key) => {
    if (books[key].title.toLowerCase() === title) {
      result.push({ isbn: key, ...books[key] });
    }
  });

  if (result.length === 0) {
    return res.status(404).json({ message: "No books found with this title" });
  }
  return res.status(200).json(result);
});

/* ---------------------------
   REGISTER (same as before)
---------------------------- */

public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(400).json({ message: "Invalid username" });
  }

  const userExists = users.some((u) => u.username === username);
  if (userExists) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

/* ---------------------------
   REQUIRED TASKS USING AXIOS
---------------------------- */

// ✅ Task: Get the book list (using Axios + async/await)
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    // Hint asked for JSON.stringify neat output
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (err) {
    return res.status(500).json({ message: "Error fetching book list" });
  }
});

// ✅ Task: Get book details by ISBN (Axios + async/await)
public_users.get("/isbn/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;
    const response = await axios.get(`${BASE_URL}/books-data/isbn/${isbn}`);
    return res.status(200).json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.status(500).json({ message: "Error fetching book by ISBN" });
  }
});

// ✅ Task: Get book details by author (Axios + async/await)
public_users.get("/author/:author", async (req, res) => {
  try {
    const { author } = req.params;
    const response = await axios.get(`${BASE_URL}/books-data/author/${encodeURIComponent(author)}`);
    return res.status(200).json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "No books found for this author" });
    }
    return res.status(500).json({ message: "Error fetching books by author" });
  }
});

// ✅ Task: Get book details by title (Axios + async/await)
public_users.get("/title/:title", async (req, res) => {
  try {
    const { title } = req.params;
    const response = await axios.get(`${BASE_URL}/books-data/title/${encodeURIComponent(title)}`);
    return res.status(200).json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "No books found with this title" });
    }
    return res.status(500).json({ message: "Error fetching books by title" });
  }
});

// Get book review (keep as direct lookup; not asked to change)
public_users.get("/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json(books[isbn].reviews);
});

module.exports.general = public_users;
