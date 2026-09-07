const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const getEmployees = async (req, res) => {
  try {
    const db = getDB();
    const employees = await db.collection("employees").find().toArray();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addEmployee = async (req, res) => {
  try {
    const db = getDB();
    const { name, employeeId, department, email, pin } = req.body;

    const existing = await db.collection("employees").findOne({ employeeId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }

    const newEmp = { name, employeeId, department, email, pin, createdAt: new Date() };
    const result = await db.collection("employees").insertOne(newEmp);
    res.status(201).json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const result = await db.collection("employees").deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEmployees, addEmployee, deleteEmployee };