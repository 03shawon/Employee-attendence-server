const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Vercel Proxy-র মাধ্যমে আসল Public IP ট্র্যাক করার জন্য
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Vercel Serverless-এ প্রতিটি রিকোয়েস্টে ডাটাবেজ কানেকশন নিশ্চিত করার মিডলওয়্যার
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, message: 'Database Connection Failed' });
  }
});

// Routes Setup
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('Attendance System Server is Running...');
});

// লোকাল এনভায়রনমেন্টে সার্ভার চালুর জন্য
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Vercel Serverless Function Export
module.exports = app;