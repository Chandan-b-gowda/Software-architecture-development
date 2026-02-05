const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const {
  generateJWTWithPrivateKey,
  fetchStudents,
  fetchProfessors,
} = require("./util");
const { ROLES } = require("../../../consts");
const { access } = require("fs");

const router = express.Router();

dotenv.config();

// Student Login
router.post("/student", async (req, res) => {
  const { email, password } = req.body;

  

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
  //Fetch the list of students
  const students = await fetchStudents();
  const student = students.find((s) => s.email ===email);
  //Verify if the student exists
  //If not throw the correct error message
  //----------
  //Also check if the password does not match bcrypt.compare
  //If this does nto match throw an error

  const token = generateJWTWithPrivateKey({
    id: student._id,
    roles: [ROLES.STUDENT]
  });
  res.status(200).json({access_token: token});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Professor Login
router.post("/professor", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    //Fetch the list of professors
  const professors = await fetchProfessors();
  const professor = professors.find((p) => p.email === email);
  //Verify if the professor exists
  //If not throw the correct error message
  //----------
  //Also check if the password does not match bcrypt.compare
  //If this does nto match throw an error

  const token = generateJWTWithPrivateKey({
    id: professor._id,
    roles: [ROLES.PROFESSOR]
  });
  res.status(200).json({access_token: token});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });;
  }
});

module.exports = router;


