const express = require('express');
const {
  handleScan,
  getDashboardStats,
  getAttendanceLogs,
  sendEmailReport,
  markManualLeave,
  assignFieldWork,
  assignHomeOffice,
} = require('../controllers/attendanceController');
const router = express.Router();

router.post('/scan', handleScan);
router.get('/stats', getDashboardStats);
router.get('/logs', getAttendanceLogs);
router.post('/send-email', sendEmailReport);
router.post('/manual-leave', markManualLeave);
router.post('/assign-field-work', assignFieldWork);
router.post('/assign-home-office', assignHomeOffice);

module.exports = router;
