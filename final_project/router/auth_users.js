const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js"); // booksdb.js is under router folder

const regd_users = express.Router();

let users = [];

// Check if username is valid
const isValid = (username) => {
  return typeof username === "string" && username.trim().length > 0;
};

// Check if username/password match a registered user
const authenticatedUser = (username, password) => {
  return users.some((u) => u.username === username && u.password === password);
};

// Login (endpoint becomes /customer/login)
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(400).json({ message: "Invalid username" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "access";
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  // Store token + username in session
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Add / modify a book review (?review=...)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const review = req.query.review;

  if (!review || typeof review !== "string" || review.trim().length === 0) {
    return res.status(400).json({ message: "Review query parameter is required" });
  }

  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });

  const username = req.session?.authorization?.username;
  if (!username) return res.status(401).json({ message: "Unauthorized: please login first" });

  if (!book.reviews) book.reviews = {};
  book.reviews[username] = review;

  return res.status(200).json({
    message: "Review added/updated successfully",
    reviews: book.reviews,
  });
});

// ✅ Delete a book review (only the logged-in user's review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;

  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });

  const username = req.session?.authorization?.username;
  if (!username) return res.status(401).json({ message: "Unauthorized: please login first" });

  if (!book.reviews || book.reviews[username] === undefined) {
    return res.status(404).json({ message: "No review by this user to delete" });
  }

  // ✅ delete only this user's review
  delete book.reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    reviews: book.reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;