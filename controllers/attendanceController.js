// const { getDB } = require('../config/db');
// const nodemailer = require('nodemailer');

// const handleScan = async (req, res) => {
//   try {
//     // ১. ক্লায়েন্টের IP উদ্ধার করা
//     const forwarded = req.headers['x-forwarded-for'];
//     const rawIP = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
//     const clientIP = rawIP ? rawIP.replace(/^.*:/, '').trim() : '';

//     const allowedIPsString = process.env.OFFICE_STATIC_IP || '';
//     const isLocalhost = clientIP === '127.0.0.1' || clientIP === '1' || clientIP === 'localhost' || clientIP === '::1';

//     // .env থেকে কমা দিয়ে একাধিক IP / Subnet Prefix আলাদা করা
//     const allowedPrefixes = allowedIPsString
//       ? allowedIPsString.split(',').map(ip => ip.trim())
//       : [];

//     // Subnet Prefix Matching (যেমন: 103.112.65. বা 103.191.98.)
//     const isAllowed = allowedPrefixes.some(prefix => clientIP.startsWith(prefix));

//     if (allowedPrefixes.length > 0 && !isLocalhost && !isAllowed) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'এটেনডেন্স শুধুমাত্র অফিসের ওয়াইফাই নেটওয়ার্ক থেকে দেওয়া সম্ভব।' 
//       });
//     }

//     const db = getDB();
//     const { employeeId, pin, type } = req.body;

//     const employee = await db.collection("employees").findOne({ employeeId, pin });
//     if (!employee) {
//       return res.status(401).json({ success: false, message: 'Invalid Employee ID or PIN' });
//     }

//     // বাংলাদেশ সময়জোনে (Asia/Dhaka) Date ও Time নির্ধারণ
//     const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
//     const currentTime = new Date().toLocaleTimeString('en-US', {
//       timeZone: 'Asia/Dhaka',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true
//     });

//     if (type === 'in') {
//       const existingRecord = await db.collection("attendances").findOne({ employeeId, date: today });
//       if (existingRecord && existingRecord.checkIn) {
//         return res.status(400).json({ success: false, message: 'Already checked in today' });
//       }

//       const settings = await db.collection("settings").findOne({}) || { lateThreshold: "09:15" };
//       const [cutoffHour, cutoffMinute] = settings.lateThreshold.split(':').map(Number);

//       // Late চেক করার জন্য মিনিট হিসাব (Asia/Dhaka)
//       const bdTimeString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
//       const bdNow = new Date(bdTimeString);
//       const currentMinutes = bdNow.getHours() * 60 + bdNow.getMinutes();
//       const cutoffMinutes = cutoffHour * 60 + cutoffMinute;

//       const newRecord = {
//         employeeId: employee.employeeId,
//         name: employee.name,
//         department: employee.department,
//         designation: employee.designation,
//         date: today,
//         checkIn: currentTime,
//         checkOut: null,
//         workingHours: '-',
//         status: currentMinutes > cutoffMinutes ? 'Late' : 'On Time',
//         createdAt: new Date()
//       };
//       console.log(employee.designation,'from employee object')

//       await db.collection("attendances").insertOne(newRecord);
//       return res.json({ success: true, message: `Checked IN successfully at ${currentTime}` });
//     }

//     if (type === 'out') {
//       const existingRecord = await db.collection("attendances").findOne({ employeeId, date: today });
//       if (!existingRecord) {
//         return res.status(400).json({ success: false, message: 'You have not checked in today' });
//       }

//       await db.collection("attendances").updateOne(
//         { employeeId, date: today },
//         { $set: { checkOut: currentTime, updatedAt: new Date() } }
//       );
//       return res.json({ success: true, message: `Checked OUT successfully at ${currentTime}` });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const getDashboardStats = async (req, res) => {
//   try {
//     const db = getDB();
//     const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

//     const totalEmployees = await db.collection("employees").countDocuments();
//     const allEmployees = await db.collection("employees").find({}).toArray();
//     const todayRecords = await db.collection("attendances").find({ date: today }).toArray();

//     // ১. Employee ID অনুযায়ী দ্রুত খোঁজার জন্য Map তৈরি
//     const employeeMap = {};
//     allEmployees.forEach(emp => {
//       employeeMap[emp.employeeId] = emp;
//     });

//     // ২. পুরাতন বা নতুন সকল রেকর্ডে Designation নিশ্চিত করা
//     const enrichedRecords = todayRecords.map(record => {
//       const emp = employeeMap[record.employeeId] || {};
//       return {
//         ...record,
//         department: record.department || emp.department || '-',
//         designation: record.designation || emp.designation || emp.position || emp.role || '-'
//       };
//     });

//     const presentToday = todayRecords.filter(r => r.checkIn).length;
//     const lateToday = todayRecords.filter(r => r.status === 'Late').length;
//     const checkedOut = todayRecords.filter(r => r.checkOut !== null).length;
//     const absentToday = Math.max(0, totalEmployees - presentToday);

//     res.json({
//       totalEmployees,
//       presentToday,
//       lateToday,
//       absentToday,
//       checkedOut,
//       records: enrichedRecords
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // const getAttendanceLogs = async (req, res) => {
// //   try {
// //     const db = getDB();
// //     const { date, status } = req.query;
// //     let query = {};

// //     if (date) query.date = date;
// //     if (status && status !== 'All') query.status = status;

// //     const logs = await db.collection("attendances").find(query).sort({ createdAt: -1 }).toArray();
// //     res.json(logs);
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// const getAttendanceLogs = async (req, res) => {
//   try {
//     const db = getDB();
//     const { date, status } = req.query;
//     let query = {};

//     if (date) query.date = date;
//     if (status && status !== 'All') query.status = status;

//     const logs = await db.collection("attendances").find(query).sort({ createdAt: -1 }).toArray();
//     const allEmployees = await db.collection("employees").find({}).toArray();

//     // Quick lookup map
//     const employeeMap = {};
//     allEmployees.forEach(emp => {
//       employeeMap[emp.employeeId] = emp;
//     });

//     // Dynamically attach missing designation & department from employees collection
//     const enrichedLogs = logs.map(log => {
//       const emp = employeeMap[log.employeeId] || {};
//       return {
//         ...log,
//         department: log.department || emp.department || '-',
//         designation: log.designation || emp.designation || emp.position || emp.role || '-'
//       };
//     });

//     res.json(enrichedLogs);
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const sendEmailReport = async (req, res) => {
//   try {
//     const { email, reportType, date } = req.body;
//     const db = getDB();

//     const records = await db.collection("attendances").find({ date }).toArray();

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.SMTP_EMAIL,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.SMTP_EMAIL,
//       to: email,
//       subject: `Attendance Summary Report (${reportType.toUpperCase()}) - ${date}`,
//       html: `
//         <h3>Attendance Summary for ${date}</h3>
//         <p>Total Records: <b>${records.length}</b></p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ success: true, message: `Report successfully emailed to ${email}` });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { handleScan, getDashboardStats, getAttendanceLogs, sendEmailReport };






const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');

const handleScan = async (req, res) => {
  try {
    // ১. ক্লায়েন্টের IP উদ্ধার করা
    const forwarded = req.headers['x-forwarded-for'];
    const rawIP = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    const clientIP = rawIP ? rawIP.replace(/^.*:/, '').trim() : '';

    const allowedIPsString = process.env.OFFICE_STATIC_IP || '';
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '1' || clientIP === 'localhost' || clientIP === '::1';

    // .env থেকে কমা দিয়ে একাধিক IP / Subnet Prefix আলাদা করা
    const allowedPrefixes = allowedIPsString
      ? allowedIPsString.split(',').map(ip => ip.trim())
      : [];

    // Subnet Prefix Matching (যেমন: 103.112.65. বা 103.191.98.)
    const isAllowed = allowedPrefixes.some(prefix => clientIP.startsWith(prefix));

    if (allowedPrefixes.length > 0 && !isLocalhost && !isAllowed) {
      return res.status(403).json({ 
        success: false, 
        message: 'এটেনডেন্স শুধুমাত্র অফিসের ওয়াইফাই নেটওয়ার্ক থেকে দেওয়া সম্ভব।' 
      });
    }

    const db = getDB();
    const { employeeId, pin, type } = req.body;

    const employee = await db.collection("employees").findOne({ employeeId, pin });
    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or PIN' });
    }

    // বাংলাদেশ সময়জোনে (Asia/Dhaka) Date ও Time নির্ধারণ
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (type === 'in') {
      const existingRecord = await db.collection("attendances").findOne({ employeeId, date: today });
      if (existingRecord && existingRecord.checkIn) {
        return res.status(400).json({ success: false, message: 'Already checked in today' });
      }

      const settings = await db.collection("settings").findOne({}) || { lateThreshold: "09:15" };
      const [cutoffHour, cutoffMinute] = settings.lateThreshold.split(':').map(Number);

      // Late চেক করার জন্য মিনিট হিসাব (Asia/Dhaka)
      const bdTimeString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
      const bdNow = new Date(bdTimeString);
      const currentMinutes = bdNow.getHours() * 60 + bdNow.getMinutes();
      const cutoffMinutes = cutoffHour * 60 + cutoffMinute;

      const newRecord = {
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        date: today,
        checkIn: currentTime,
        checkOut: null,
        workingHours: '-',
        status: currentMinutes > cutoffMinutes ? 'Late' : 'On Time',
        createdAt: new Date()
      };
      console.log(employee.designation,'from employee object')

      // Field work assigned in advance: attach the check-in to that record and switch status from 'Field Work' to On Time / Late
      if (existingRecord && isFieldWorkRecord(existingRecord)) {
        await db.collection("attendances").updateOne(
          { _id: existingRecord._id },
          { $set: { checkIn: currentTime, checkOut: null, status: newRecord.status, isFieldWork: true, updatedAt: new Date() } }
        );
        return res.json({ success: true, message: `Checked IN successfully at ${currentTime}` });
      }

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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

    const totalEmployees = await db.collection("employees").countDocuments();
    const allEmployees = await db.collection("employees").find({}).toArray();
    const todayRecords = await db.collection("attendances").find({ date: today }).toArray();
    const cutoffMinutes = await getLateCutoffMinutes(db);

    // ১. Employee ID অনুযায়ী দ্রুত খোঁজার জন্য Map তৈরি
    const employeeMap = {};
    allEmployees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // ২. পুরাতন বা নতুন সকল রেকর্ডে Designation নিশ্চিত করা
    const enrichedRecords = todayRecords.map(rawRecord => {
      const record = normalizeRecord(rawRecord, cutoffMinutes);
      const emp = employeeMap[record.employeeId] || {};
      return {
        ...record,
        department: record.department || emp.department || '-',
        designation: record.designation || emp.designation || emp.position || emp.role || '-'
      };
    });

    const presentToday = enrichedRecords.filter(r => r.status !== 'On Leave' && (r.checkIn || isFieldWorkRecord(r))).length;
    const lateToday = enrichedRecords.filter(r => r.status === 'Late').length;
    const checkedOut = enrichedRecords.filter(r => r.checkOut).length;
    const fieldWorkToday = enrichedRecords.filter(isFieldWorkRecord).length;
    
    // 🔴 [CHANGE HERE 1]: ছুটির সংখ্যা হিসাব করা এবং Absent থেকে বাদ দেওয়া
    const leaveToday = enrichedRecords.filter(r => r.status === 'On Leave').length;
    const absentToday = Math.max(0, totalEmployees - presentToday - leaveToday);

    res.json({
      totalEmployees,
      presentToday,
      lateToday,
      leaveToday, // 🔴 [CHANGE HERE 2]: রেসপন্সে leaveToday পাঠানো
      fieldWorkToday,
      absentToday,
      checkedOut,
      records: enrichedRecords
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
    // Status is filtered after normalization so legacy records resolve to their current status names
    const statusFilter = status && status !== 'All' ? (status === 'Leave' ? 'On Leave' : status) : null;

    const logs = await db.collection("attendances").find(query).sort({ createdAt: -1 }).toArray();
    const allEmployees = await db.collection("employees").find({}).toArray();
    const cutoffMinutes = await getLateCutoffMinutes(db);

    // Quick lookup map
    const employeeMap = {};
    allEmployees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // Dynamically attach missing designation & department from employees collection
    const enrichedLogs = logs
      .map(rawLog => {
        const log = normalizeRecord(rawLog, cutoffMinutes);
        const emp = employeeMap[log.employeeId] || {};
        return {
          ...log,
          department: log.department || emp.department || '-',
          designation: log.designation || emp.designation || emp.position || emp.role || '-'
        };
      })
      .filter(log => {
        if (!statusFilter) return true;
        if (statusFilter === 'Field Work') return isFieldWorkRecord(log);
        return log.status === statusFilter;
      });

    res.json(enrichedLogs);
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

// 🟢 [NEW ADDITION]: এডমিনের ম্যানুয়ালি ছুটি দেওয়ার নতুন ফাংশন
const markManualLeave = async (req, res) => {
  try {
    const db = getDB();
    const { employeeId, date, leaveType, note } = req.body;

    if (!employeeId || !date || !leaveType) {
      return res.status(400).json({ success: false, message: "Employee ID, Date, and Leave Type are required." });
    }

    const employee = await db.collection("employees").findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await db.collection("attendances").updateOne(
      { employeeId: employeeId, date: date },
      {
        $set: {
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department || '-',
          designation: employee.designation || employee.position || employee.role || '-',
          date: date,
          checkIn: null,
          checkOut: null,
          workingHours: '-',
          status: 'On Leave',
          leaveType: leaveType,
          note: note || '',
          updatedAt: new Date()
        },
        $unset: { isFieldWork: '', fieldWorkReason: '', fieldWorkStartTime: '', fieldWorkEndTime: '', remarks: '' }
      },
      { upsert: true }
    );

    res.json({ success: true, message: `Successfully marked ${leaveType} for ${employee.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accepts "09:34 AM" (scan format) or "14:30" (24h field-work format); returns minutes since midnight
const toMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const match = timeValue.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3] && match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getLateCutoffMinutes = async (db) => {
  const settings = (await db.collection('settings').findOne({})) || {};
  return toMinutes(settings.lateThreshold || '09:15') ?? 9 * 60 + 15;
};

const computePunctuality = (checkIn, cutoffMinutes) => {
  const arrival = toMinutes(checkIn);
  return arrival !== null && arrival > cutoffMinutes ? 'Late' : 'On Time';
};

const LEAVE_STATUSES = ['Leave', 'On Leave'];

const isFieldWorkRecord = (record) => Boolean(record.isFieldWork) || record.status === 'Field Work';

// Single source of truth for the displayed status (also upgrades legacy 'Leave' / 'Field Work' records)
const resolveStatus = (record, cutoffMinutes) => {
  if (LEAVE_STATUSES.includes(record.status)) return 'On Leave';
  if (isFieldWorkRecord(record)) {
    if (!record.checkIn) return 'Field Work';
    return ['On Time', 'Late'].includes(record.status) ? record.status : computePunctuality(record.checkIn, cutoffMinutes);
  }
  return record.status;
};

const normalizeRecord = (record, cutoffMinutes) => ({
  ...record,
  isFieldWork: isFieldWorkRecord(record),
  status: resolveStatus(record, cutoffMinutes),
});

const FIELD_WORK_CATEGORIES = ['Market Visit', 'Listing', 'Client Meeting', 'Other'];

const assignFieldWork = async (req, res) => {
  try {
    const db = getDB();
    const { employeeId, date, startTime, endTime, reasonCategory, customReason, remarks } = req.body;

    if (!employeeId || !date || !startTime || !reasonCategory) {
      return res.status(400).json({ success: false, message: 'Employee ID, Date, Start Time, and Reason are required.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Date must be in YYYY-MM-DD format.' });
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(startTime) || (endTime && !timePattern.test(endTime))) {
      return res.status(400).json({ success: false, message: 'Time must be in HH:mm (24-hour) format.' });
    }

    if (endTime && endTime <= startTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    if (!FIELD_WORK_CATEGORIES.includes(reasonCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid field work reason category.' });
    }

    const trimmedCustomReason = typeof customReason === 'string' ? customReason.trim() : '';
    if (reasonCategory === 'Other' && !trimmedCustomReason) {
      return res.status(400).json({ success: false, message: 'Please provide a custom reason for "Other".' });
    }

    const fieldWorkReason = reasonCategory === 'Other' ? trimmedCustomReason : reasonCategory;

    const employee = await db.collection('employees').findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const attendances = db.collection('attendances');
    const existingRecord = await attendances.findOne({ employeeId, date });

    const cutoffMinutes = await getLateCutoffMinutes(db);
    // A leave record without check-in becomes field work; an existing check-in keeps its On Time / Late status
    const existingPunctualStatus =
      existingRecord && existingRecord.checkIn && !LEAVE_STATUSES.includes(existingRecord.status) ? existingRecord.status : null;
    const status = resolveStatus(
      { checkIn: existingRecord && existingRecord.checkIn, status: existingPunctualStatus, isFieldWork: true },
      cutoffMinutes
    );

    const fieldWorkData = {
      status,
      isFieldWork: true,
      fieldWorkReason,
      fieldWorkStartTime: startTime,
      fieldWorkEndTime: endTime || null,
      remarks: typeof remarks === 'string' ? remarks.trim() : '',
      updatedAt: new Date(),
    };

    if (existingRecord) {
      // Keep any real check-in/out times; drop leave-specific fields if it was a leave record
      await attendances.updateOne(
        { _id: existingRecord._id },
        { $set: fieldWorkData, $unset: { leaveType: '', note: '' } }
      );
    } else {
      await attendances.insertOne({
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department || '-',
        designation: employee.designation || employee.position || employee.role || '-',
        date,
        checkIn: null,
        checkOut: null,
        workingHours: '-',
        ...fieldWorkData,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: `Field work (${fieldWorkReason}) assigned to ${employee.name} on ${date}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔴 [CHANGE HERE 3]: markManualLeave এক্সপোর্ট অপশনে যুক্ত করা হয়েছে
module.exports = { 
  handleScan, 
  getDashboardStats, 
  getAttendanceLogs, 
  sendEmailReport, 
  markManualLeave,
  assignFieldWork
};