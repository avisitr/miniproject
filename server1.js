const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/library')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Define the Book schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publicationYear: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true }
});

const Book = mongoose.model('Book', bookSchema);

// ---- User Authentication Routes ----

// Route for user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

// Route for user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    req.session.userId = user._id;
    res.status(200).send('Login successful');
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});

// Route to check if the user is logged in and fetch books for the dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized: Please log in');
  }

  try {
    const books = await Book.find();
    res.status(200).json(books); // Send the list of books
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Error fetching books');
  }
});

// Route for logging out
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.status(200).send('Logged out successfully');
  });
});

// ---- Book Management Routes ----

// Add a new book
app.post('/books', async (req, res) => {
  const { title, author, publicationYear } = req.body;

  try {
    const newBook = new Book({ title, author, publicationYear });
    await newBook.save();
    res.status(201).send('Book added successfully');
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).send('Error adding book');
  }
});

// View all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Error fetching books');
  }
});

// Update a book
app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, publicationYear, isAvailable } = req.body;

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, { title, author, publicationYear, isAvailable }, { new: true });
    if (!updatedBook) {
      return res.status(404).send('Book not found');
    }
    res.status(200).send('Book updated successfully');
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Error updating book');
  }
});

// Borrow a book
app.post('/borrow/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).send('Book not found');
    }
    if (!book.isAvailable) {
      return res.status(400).send('Book is currently not available');
    }

    book.isAvailable = false;
    await book.save();
    res.status(200).send('Book borrowed successfully');
  } catch (error) {
    console.error('Error borrowing book:', error);
    res.status(500).send('Error borrowing book');
  }
});

// Return a book
app.post('/return/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).send('Book not found');
    }
    book.isAvailable = true;
    await book.save();
    res.status(200).send('Book returned successfully');
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).send('Error returning book');
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return res.status(404).send('Book not found');
    }
    res.status(200).send('Book deleted successfully');
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Error deleting book');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
