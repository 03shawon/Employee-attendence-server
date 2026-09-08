const express = require('express');
const { handleScan, getDashboardStats, getAttendanceLogs, sendEmailReport, markManualLeave } = require('../controllers/attendanceController');
const router = express.Router();

router.post('/scan', handleScan);
router.get('/stats', getDashboardStats);
router.get('/logs', getAttendanceLogs);
router.post('/send-email', sendEmailReport);
router.post('/manual-leave', markManualLeave);

module.exports = router;