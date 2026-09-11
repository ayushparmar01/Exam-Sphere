const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    targetScope: {
      type: String,
      enum: ['SECTION', 'MULTIPLE_SECTIONS', 'YEAR', 'DEPARTMENT', 'STUDENTS'],
      default: 'SECTION',
    },
    department: {
      type: String,
      required: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: true,
    },
    sections: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMarks: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'PUBLISHED',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ department: 1, year: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
