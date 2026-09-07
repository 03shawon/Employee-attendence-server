const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String },
    date: { type: String, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    status: { type: String, enum: ['On Time', 'Late', 'Absent'], default: 'On Time' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);