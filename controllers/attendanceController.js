const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');

const handleScan = async (req, res) => {
  try {
    // ১. ক্লায়েন্টের IP নেওয়া এবং IPv6 ফরম্যাট ফিল্টার করা
    const forwarded = req.headers['x-forwarded-for'];
    const rawIP = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const clientIP = rawIP ? rawIP.replace(/^.*:/, '').trim() : '';

    const allowedIP = process.env.OFFICE_STATIC_IP;
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '1' || clientIP === 'localhost' || clientIP === '::1';

    // ২. IP চেক করা (যদি .env-এ IP দেওয়া থাকে এবং লোকালহস্ট না হয়)
    if (allowedIP && !isLocalhost && clientIP !== allowedIP) {
      return res.status(403).json({ 
        success: false, 
        message: 'এটেনডেন্স শুধুমাত্র অফিসের ওয়াইফাই নেটওয়ার্ক থেকে দেওয়া সম্ভব।' 
      });
    }

    const db = getDB();
    const { employeeId, pin, type } = req.body;

    const employee = await db.collection("employees").findOne({ employeeId, pin });
    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or PIN' });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'in') {
      const existingRecord = await db.collection("attendances").findOne({ employeeId, date: today });
      if (existingRecord && existingRecord.checkIn) {
        return res.status(400).json({ success: false, message: 'Already checked in today' });
      }

      const settings = await db.collection("settings").findOne({}) || { lateThreshold: "09:15" };
      const [cutoffHour, cutoffMinute] = settings.lateThreshold.split(':').map(Number);

      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(cutoffHour, cutoffMinute, 0);

      const newRecord = {
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        date: today,
        checkIn: currentTime,
        checkOut: null,
        workingHours: '-',
        status: now > cutoff ? 'Late' : 'On Time',
        createdAt: new Date()
      };

      await db.collection("attendances").insertOne(newRecord);
      return res.json({ success: true, message: `Checked IN successfully at ${currentTime}` });
    }

    if (type === 'out') {
      const existingRecord = await db.collection("attendances").findOne({ employeeId, date: today });
      if (!existingRecord) {
        return res.status(400).json({ success: false, message: 'You have not checked in today' });
      }

      await db.collection("attendances").updateOne(
        { employeeId, date: today },
        { $set: { checkOut: currentTime, updatedAt: new Date() } }
      );
      return res.json({ success: true, message: `Checked OUT successfully at ${currentTime}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    const totalEmployees = await db.collection("employees").countDocuments();
    const todayRecords = await db.collection("attendances").find({ date: today }).toArray();

    const presentToday = todayRecords.filter(r => r.checkIn).length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    const checkedOut = todayRecords.filter(r => r.checkOut !== null).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);

    res.json({
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      checkedOut,
      records: todayRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAttendanceLogs = async (req, res) => {
  try {
    const db = getDB();
    const { date, status } = req.query;
    let query = {};

    if (date) query.date = date;
    if (status && status !== 'All') query.status = status;

    const logs = await db.collection("attendances").find(query).sort({ createdAt: -1 }).toArray();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendEmailReport = async (req, res) => {
  try {
    const { email, reportType, date } = req.body;
    const db = getDB();

    const records = await db.collection("attendances").find({ date }).toArray();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: `Attendance Summary Report (${reportType.toUpperCase()}) - ${date}`,
      html: `
        <h3>Attendance Summary for ${date}</h3>
        <p>Total Records: <b>${records.length}</b></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `Report successfully emailed to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { handleScan, getDashboardStats, getAttendanceLogs, sendEmailReport };