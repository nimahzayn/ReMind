const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate unique 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
const register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const userData = { username, password, role };

    // If patient, generate unique code
    if (role === "patient") {
      let code;
      let exists = true;
      while (exists) {
        code = generateCode();
        exists = await User.findOne({ patientCode: code });
      }
      userData.patientCode = code;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        patientCode: user.patientCode || null,
        linkedPatient: user.linkedPatient || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
const login = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: `This account is not registered as a ${role}` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        patientCode: user.patientCode || null,
        linkedPatient: user.linkedPatient || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };