const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const { Readable } = require("stream");

const User = require("../models/User");
const Department = require("../models/Department");

/**
 * Parse CSV buffer into rows.
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

/**
 * Process bulk user registration.
 */
const processBulkRegistration = async (buffer) => {
  const rows = await parseCSV(buffer);

  if (rows.length === 0) {
    throw new Error("The uploaded CSV file is empty.");
  }

  const results = {
    totalRows: rows.length,
    successful: [],
    failed: [],
  };

  const emailsInFile = new Set();
  const studentIdsInFile = new Set();
  const employeeIdsInFile = new Set();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 2;

    try {
      const name = String(row.name || "").trim();

      const email = String(row.email || "")
        .trim()
        .toLowerCase();

      const role = String(row.role || "")
        .trim()
        .toLowerCase();

      const departmentCode = String(row.department || "")
        .trim()
        .toUpperCase();

      const studentId =
        String(row.studentId || "").trim() || null;

      const employeeId =
        String(row.employeeId || "").trim() || null;

      // -----------------------------
      // Basic validation
      // -----------------------------

      if (!name) {
        throw new Error("Name is required.");
      }

      if (!email) {
        throw new Error("Email is required.");
      }

      if (!role) {
        throw new Error("Role is required.");
      }

      if (!["student", "teacher", "admin"].includes(role)) {
        throw new Error(
          "Role must be student, teacher, or admin."
        );
      }

      // -----------------------------
      // Role-specific validation
      // -----------------------------

      if (role === "student" && !studentId) {
        throw new Error(
          "studentId is required for student."
        );
      }

      if (role === "teacher" && !employeeId) {
        throw new Error(
          "employeeId is required for teacher."
        );
      }

      // -----------------------------
      // Department
      // -----------------------------

      let department = null;

      if (departmentCode) {
        department = await Department.findOne({
          code: departmentCode,
          isActive: true,
        });

        if (!department) {
          throw new Error(
            `Department '${departmentCode}' does not exist or is inactive.`
          );
        }
      }

      // -----------------------------
      // Duplicate email in CSV
      // -----------------------------

      if (emailsInFile.has(email)) {
        throw new Error(
          "Duplicate email found in CSV."
        );
      }

      emailsInFile.add(email);

      // -----------------------------
      // Duplicate student ID in CSV
      // -----------------------------

      if (studentId) {
        if (studentIdsInFile.has(studentId)) {
          throw new Error(
            "Duplicate studentId found in CSV."
          );
        }

        studentIdsInFile.add(studentId);
      }

      // -----------------------------
      // Duplicate employee ID in CSV
      // -----------------------------

      if (employeeId) {
        if (employeeIdsInFile.has(employeeId)) {
          throw new Error(
            "Duplicate employeeId found in CSV."
          );
        }

        employeeIdsInFile.add(employeeId);
      }

      // -----------------------------
      // Existing email
      // -----------------------------

      const existingEmail = await User.findOne({
        email,
      });

      if (existingEmail) {
        throw new Error(
          "Email already exists."
        );
      }

      // -----------------------------
      // Existing student ID
      // -----------------------------

      if (studentId) {
        const existingStudentId =
          await User.findOne({
            studentId,
          });

        if (existingStudentId) {
          throw new Error(
            "Student ID already exists."
          );
        }
      }

      // -----------------------------
      // Existing employee ID
      // -----------------------------

      if (employeeId) {
        const existingEmployeeId =
          await User.findOne({
            employeeId,
          });

        if (existingEmployeeId) {
          throw new Error(
            "Employee ID already exists."
          );
        }
      }

      // -----------------------------
      // Initial password
      // -----------------------------

      const initialPassword = "CampusGPT@123";

      const passwordHash = await bcrypt.hash(
        initialPassword,
        10
      );

      // -----------------------------
      // Create user
      // -----------------------------

      const user = await User.create({
        name,
        email,
        passwordHash,
        role,

        department: department
          ? department._id
          : null,

        studentId:
          role === "student"
            ? studentId
            : null,

        employeeId:
          role === "teacher"
            ? employeeId
            : null,

        mustChangePassword: true,

        // New bulk users are active by default
        isActive: true,
      });

      results.successful.push({
        row: rowNumber,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      results.failed.push({
        row: rowNumber,
        name: row.name || "",
        email: row.email || "",
        reason: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  processBulkRegistration,
};