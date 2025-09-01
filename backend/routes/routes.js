// routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');
const friendRoutes = require('./friendRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/friends', friendRoutes)

module.exports = router;