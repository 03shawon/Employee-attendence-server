const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// IP সঠিকভাবে ট্র্যাক করার জন্য
app.set('trust proxy', true);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes Setup
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('Attendance System Server is Running...');
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});