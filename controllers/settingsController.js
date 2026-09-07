const { getDB } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection("settings").findOne({}) || { officeStartTime: "09:00", lateThreshold: "09:15" };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const db = getDB();
    const { officeStartTime, lateThreshold } = req.body;

    await db.collection("settings").updateOne(
      {},
      { $set: { officeStartTime, lateThreshold, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings };