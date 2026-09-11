const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    program: {
      type: String,
      required: true,
      default: 'B.Tech',
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Academic year level is required (1-4)'],
      min: 1,
      max: 5,
      index: true,
    },
    sectionName: {
      type: String,
      required: [true, 'Section name is required (e.g. A, B, C)'],
      trim: true,
      uppercase: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: '2025-26',
      trim: true,
      index: true,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    maxTeachersLimit: {
      type: Number,
      default: 5,
    },
    classAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of section within a department, year, and academic year
sectionSchema.index({ departmentCode: 1, year: 1, sectionName: 1, academicYear: 1 }, { unique: true });

const Section = mongoose.model('Section', sectionSchema);
module.exports = Section;
