const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE ---
app.use(express.json());

// UPDATED CORS: This allows your specific Netlify site to talk to this Render server
app.use(cors({
    origin: [
        'https://glamora-store.netlify.app', 
        'http://127.0.0.1:5500', // For local testing
        'http://localhost:5500'   // For local testing
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// --- 2. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 3. DATA MODELS ---

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  image: String,
  description: String,
  productId: { type: String, unique: true, required: true }
});
const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- 4. API ROUTES ---

// Health Check (To see if server is awake)
app.get('/', (req, res) => {
    res.send('Glamora API is Running...');
});

// [GET] All Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// [POST] Add a New Product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: "Failed to add product. Ensure ProductID is unique." });
  }
});

// [POST] User Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

// [POST] User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ 
          message: "Login successful!", 
          userId: user._id,
          email: user.email 
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 10000; // Render usually uses 10000
app.listen(PORT, () => {
  console.log(`🚀 Glamora Server running on port ${PORT}`);
});