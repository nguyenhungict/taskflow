const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All routes here are protected
router.use(protect);

router.get('/overview', getOverview);

module.exports = router;
