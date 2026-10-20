"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Department = require("../src/models/Department");
const Document = require("../src/models/Document");
const User = require("../src/models/User");
const { indexStoredDocument } = require("../src/services/document.service");

const DEFAULT_DATA_DIR = path.resolve(__dirname, "../../ai-services/data");

const MANIFEST = [
  {
    file: "B.Tech-V(B).pdf",
    aiDocumentId: "test-btech-v-b-001",
    title: "B.Tech V(B) Timetable",
    documentType: "TIMETABLE",
    departmentCode: "CSE",
    departmentName: "Computer Science and Engineering",
    semester: 5,
    tags: ["timetable", "CSE", "semester-5"],
  },
  {
    file: "Notice_.pdf",
    aiDocumentId: "local-notice-2758141f72f44fe75412",
    title: "Notice",
    documentType: "NOTICE",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["notice"],
  },
  {
    file: "Notice_for_emedial_Classes-2.pdf",
    aiDocumentId: "test-emedial-notice",
    title: "Notice for e-Medial Classes",
    documentType: "NOTICE",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["notice", "emedial"],
  },
  {
    file: "Office_Order___Raksha_Bandan_Holiday.pdf",
    aiDocumentId: "test-raksha-bandhan-holiday",
    title: "Raksha Bandhan Holiday",
    documentType: "NOTICE",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["holiday", "notice"],
  },
  {
    file: "Orientation_Programme_Notice.pdf",
    aiDocumentId: "local-orientation-programme-notice-ae9ea9b843748789d54",
    title: "Orientation Programme Notice",
    documentType: "EVENT",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["orientation", "event"],
  },
  {
    file: "Student_Notice_15.08.2026.pdf",
    aiDocumentId: "test-independence-day-event",
    title: "Student Notice 15 August 2026",
    documentType: "EVENT",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["independence-day", "event"],
  },
  {
    file: "syllabus_updated_DSA.pdf",
    aiDocumentId: "test-syllabus-dsa",
    title: "Updated DSA Syllabus",
    documentType: "SYLLABUS",
    departmentCode: "CSE",
    departmentName: "Computer Science and Engineering",
    semester: 5,
    tags: ["syllabus", "DSA", "CSE"],
  },
  {
    file: "Uniform_Notice_2026 .pdf",
    aiDocumentId: "local-uniform-notice-2026-067ca84463f423a260b0",
    title: "University Uniform Policy 2026",
    documentType: "POLICY",
    departmentCode: "GEN",
    departmentName: "General",
    tags: ["uniform", "policy", "notice"],
  },
];

async function getOrCreateDepartment(entry) {
  const existing = await Department.findOne({
    $or: [{ code: entry.departmentCode }, { name: entry.departmentName }],
  });
  if (existing) return existing;

  return Department.create({
    name: entry.departmentName,
    code: entry.departmentCode,
    description: entry.departmentCode === "GEN"
      ? "General university notices and shared campus documents"
      : "Computer Science and Engineering",
    isActive: true,
  });
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Configure backend/.env first.");
  }

  const adminEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!adminEmail) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_EMAIL to an existing administrator account before seeding.",
    );
  }

  const dataDirectory = path.resolve(
    process.env.SEED_DOCUMENTS_DIR || DEFAULT_DATA_DIR,
  );
  if (!fs.existsSync(dataDirectory) || !fs.statSync(dataDirectory).isDirectory()) {
    throw new Error(`Seed document directory does not exist: ${dataDirectory}`);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000),
  });

  const admin = await User.findOne({ email: adminEmail });
  if (!admin || admin.role !== "admin" || admin.isActive === false) {
    throw new Error("The configured bootstrap email must belong to an active admin account.");
  }

  const departments = new Map();
  for (const entry of MANIFEST) {
    if (!departments.has(entry.departmentCode)) {
      departments.set(
        entry.departmentCode,
        await getOrCreateDepartment(entry),
      );
    }
  }

  let indexed = 0;
  let failed = 0;

  for (const entry of MANIFEST) {
    const filePath = path.join(dataDirectory, entry.file);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      failed += 1;
      console.error(`[FAILED] Missing seed PDF: ${filePath}`);
      continue;
    }

    try {
      const stat = fs.statSync(filePath);
      let document = await Document.findOne({ aiDocumentId: entry.aiDocumentId });

      // Adopt a prior seeded row by original file name if it predates aiDocumentId.
      if (!document) {
        document = await Document.findOne({
          originalFileName: entry.file,
          isSeeded: true,
        });
      }

      if (!document) {
        document = new Document({
          aiDocumentId: entry.aiDocumentId,
          isSeeded: true,
        });
      }

      document.set({
        aiDocumentId: entry.aiDocumentId,
        isSeeded: true,
        title: entry.title,
        description: "Bundled CampusGPT sample document",
        documentType: entry.documentType,
        department: departments.get(entry.departmentCode)._id,
        semester: entry.semester || null,
        visibility: "PUBLIC",
        tags: entry.tags,
        fileName: entry.file,
        originalFileName: entry.file,
        filePath,
        fileSize: stat.size,
        mimeType: "application/pdf",
        uploadedBy: admin._id,
        uploadedByRole: "admin",
        isActive: true,
      });
      await document.save();

      await indexStoredDocument(document._id);
      indexed += 1;
      console.log(
        `[OK] ${entry.file}: Mongo ID=${document._id}, AI ID=${entry.aiDocumentId}`,
      );
    } catch (error) {
      failed += 1;
      console.error(`[FAILED] ${entry.file}: ${error.message}`);
    }
  }

  console.log(`Seed complete. Indexed: ${indexed}; failed: ${failed}.`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Document seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
  });
