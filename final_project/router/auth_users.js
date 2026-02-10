const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

// Check if username is valid (basic rule: non-empty string)
const isValid = (username) => {
  return typeof username === "string" && username.trim().length > 0;
};

// Check if username/password match a registered user
const authenticatedUser = (username, password) => {
  return users.some(
    (u) => u.username === username && u.password === password
  );
};

// only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username) || typeof password !== "string" || password.trim().length === 0) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "access";

  // Create JWT access token
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  // ✅ Session authorization feature: store token in session
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Add / modify a book review (protected route)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;

  if (!review || typeof review !== "string") {
    return res.status(400).json({ message: "Review is required" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // ✅ req.user is set by your auth middleware after jwt.verify()
  const username = req.user?.username;
  if (!username) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure reviews object exists
  if (!book.reviews) book.reviews = {};

  // Add/update review for this user
  book.reviews[username] = review;

  return res.status(200).json({
    message: "Review added/updated successfully",
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
