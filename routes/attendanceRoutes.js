const express = require('express');
const { handleScan, getDashboardStats, getAttendanceLogs, sendEmailReport } = require('../controllers/attendanceController');
const router = express.Router();

router.post('/scan', handleScan);
router.get('/stats', getDashboardStats);
router.get('/logs', getAttendanceLogs);
router.post('/send-email', sendEmailReport);

module.exports = router;