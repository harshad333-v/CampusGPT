const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    documentType: {
      type: String,
      enum: [
        "SYLLABUS",
        "QUESTION_PAPER",
        "QUESTION_BANK",
        "COURSE_MATERIAL",
        "LAB_MANUAL",
        "ASSIGNMENT",
        "TIMETABLE",
        "ACADEMIC_CALENDAR",
        "EXAM_SCHEDULE",
        "NOTICE",
        "CIRCULAR",
        "POLICY",
        "REGULATION",
        "FORM",
        "HOSTEL",
        "TRANSPORT",
        "LIBRARY",
        "SCHOLARSHIP",
        "PLACEMENT",
        "FEE_STRUCTURE",
        "ADMISSION",
        "EVENT",
        "CLUB",
        "WORKSHOP",
        "OTHER",
      ],
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

   semester: {
  type: Number,
  default: null,
},

    visibility: {
      type: String,
      enum: [
        "PUBLIC",
        "TEACHER_ONLY",
        "ADMIN_ONLY",
      ],
      default: "PUBLIC",
    },

    tags: {
      type: [String],
      default: [],
    },

    fileName: {
      type: String,
      required: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    uploadedByRole: {
      type: String,
      enum: ["admin", "teacher"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);