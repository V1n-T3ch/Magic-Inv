const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { db } = require('./firebase'); // Ensure this is correctly configured
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register User
app.post('/register', async (req, res) => {
    const { name, email, password, ref_by } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const referralCode = userId.slice(0, 8); // First 8 characters of the userId as referral code

        // Create a reference for the new user in the database
        const userRef = db.ref('users').child(userId);

        // Save user details
        await userRef.set({
            name,
            email,
            password: hashedPassword,
            referralCode,
            ref_by: ref_by || null, // Store the referrer code if provided
            rewards: 0, // Initial rewards
        });

        // Handle referral reward if a valid referrer code was provided
        if (ref_by) {
            const referrerQuery = await db.ref('users').orderByChild('referralCode').equalTo(ref_by).once('value');
            if (referrerQuery.exists()) {
                const referrerId = Object.keys(referrerQuery.val())[0];
                const referrer = referrerQuery.val()[referrerId];
                const updatedRewards = (referrer.rewards || 0) + 10; // Add 10 rewards to the referrer
                await db.ref(`users/${referrerId}`).update({ rewards: updatedRewards });
            }
        }

        // Respond with success message and referral code
        res.status(201).json({ message: 'User registered successfully!', referralCode });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// Login User
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Query for the user by email in the database
        const userQuery = await db.ref('users').orderByChild('email').equalTo(email).once('value');
        if (!userQuery.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = Object.keys(userQuery.val())[0];
        const user = userQuery.val()[userId];

        // Compare the hashed password from the database with the provided password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Successful login response
        res.status(200).json({ message: 'Login successful!', user });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
