const express = require('express');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');

const router = express.Router();

// Register endpoint
router.post('/register', signupValidation, authController.signup);
router.post('/signup', signupValidation, authController.signup);

// Login endpoint
router.post('/login', loginValidation, authController.login);

// Get current user endpoint (protected)
router.get('/me', auth, authController.getMe);

module.exports = router;
