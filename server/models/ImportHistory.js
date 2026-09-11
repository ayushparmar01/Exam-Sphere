const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema(
  {
    importId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedByName: {
      type: String,
      default: 'Administrator',
    },
    fileName: {
      type: String,
      default: 'students.csv',
    },
    totalRecords: {
      type: Number,
      default: 0,
    },
    createdCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    invalidCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PARTIAL', 'FAILED'],
      default: 'COMPLETED',
      index: true,
    },
    duplicateStrategy: {
      type: String,
      enum: ['SKIP', 'UPDATE', 'REPORT'],
      default: 'SKIP',
    },
    errors: [
      {
        rowNumber: Number,
        name: String,
        email: String,
        rollNumber: String,
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ImportHistory = mongoose.model('ImportHistory', importHistorySchema);
module.exports = ImportHistory;
