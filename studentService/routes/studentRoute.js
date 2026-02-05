const express = require("express");
const bcrypt = require("bcrypt");


const Student = require("../models/student");

const { verifyRole, restrictStudentToOwnData } = require("./auth/util");
const { ROLES } = require("../../consts");
const { studentServiceLogger:logger } = require("../../logging");

const router = express.Router();



//Add student
//verifyRole([ROLES.PROFESSOR])
router.post("/", verifyRole([ROLES.STUDENT]), async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email or password" });
  }
  try {
    // Try to find if the email exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this email exists" });
    }
    const newStudent = new Student({ name, email, password });
    const savedStudent = await newStudent.save();

    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({
      message: "Unable to create student", error: error.message
    });
  }
});

module.exports = router;


//Get users
//verifyRole([ROLES.PROFESSOR])
router.get(
  "/",
  verifyRole([
    ROLES.PROFESSOR,
    ROLES.ADMIN,
    ROLES.AUTH_SERVICE,
    ROLES.ENROLLMENT_SERVICE,
  ]),
  async (req, res) => {
    try {
      const students = await Student.find();
      logger.info("All Students Fetched");
      return res.json(students);
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        message: "Server Error: Unable to fetch students",
        correlationId: getCorrelationId(),
      });
    }
  },
);


// Get a specific student by ID
//verifyRole([ROLES.PROFESSOR])
router.get("/:id", verifyRole([ROLES.PROFESSOR], [ROLES.STUDENT]), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(
      "-password"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Update a student
//verifyRole([ROLES.PROFESSOR])
router.put("/:id",verifyRole([ROLES.STUDENT]), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const updatedData = { name, email, phone };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res
      .status(200)
      .json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Delete a student
//verifyRole([ROLES.PROFESSOR])
router.delete("/:id", verifyRole([ROLES.STUDENT]), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res
      .status(200)
      .json({ message: "Student deleted successfully", student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router; 

 