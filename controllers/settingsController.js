const { getDB } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection("settings").findOne({});

    const defaultSettings = {
      officeStartTime: "09:00",
      lateCutoffTime: "09:15",
      lateThreshold: "09:15",
      officeEndTime: "18:00",
      autoCheckoutTime: "23:59",
      weeklyOff: ["Friday", "Saturday"]
    };

    res.json(settings ? { ...defaultSettings, ...settings } : defaultSettings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const db = getDB();
    const {
      officeStartTime,
      lateCutoffTime,
      lateThreshold,
      officeEndTime,
      autoCheckoutTime,
      weeklyOff
    } = req.body;

    const cutoff = lateCutoffTime || lateThreshold || "09:15";

    const updateData = {
      officeStartTime: officeStartTime || "09:00",
      lateCutoffTime: cutoff,
      lateThreshold: cutoff, // Backward compatibility for existing checks
      officeEndTime: officeEndTime || "18:00",
      autoCheckoutTime: autoCheckoutTime || "23:59",
      weeklyOff: Array.isArray(weeklyOff) ? weeklyOff : ["Friday", "Saturday"],
      updatedAt: new Date()
    };

    await db.collection("settings").updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings };