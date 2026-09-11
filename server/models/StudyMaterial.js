const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required (e.g. Unit 1, Unit 2)'],
      trim: true,
      default: 'Unit 1',
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL / attachment is required'],
    },
    fileName: {
      type: String,
      default: 'document',
    },
    fileType: {
      type: String,
      enum: ['PDF', 'PPT', 'DOC', 'IMAGE', 'LINK', 'OTHER'],
      default: 'PDF',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    department: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    sections: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploaderName: {
      type: String,
      default: '',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

studyMaterialSchema.index({ department: 1, year: 1, subject: 1, unit: 1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
module.exports = StudyMaterial;
