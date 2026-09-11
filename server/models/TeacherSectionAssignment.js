const mongoose = require('mongoose');
const SystemSetting = require('./SystemSetting');

const teacherSectionAssignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section ID is required'],
      index: true,
    },
    departmentCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    sectionName: {
      type: String,
      required: true,
      uppercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: '2025-26',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate assignment of the same teacher for the same subject in the same section
teacherSectionAssignmentSchema.index(
  { teacherId: 1, sectionId: 1, subject: 1, academicYear: 1 },
  { unique: true }
);

// Pre-save hook to enforce maximum teachers per section
teacherSectionAssignmentSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('status')) {
    if (this.status === 'ACTIVE') {
      // Look up configurable limit from SystemSetting
      let maxLimit = 5;
      try {
        const setting = await SystemSetting.findOne({ key: 'maxTeachersPerSection' });
        if (setting && typeof setting.value === 'number') {
          maxLimit = setting.value;
        }
      } catch (err) {
        maxLimit = 5;
      }

      // Count currently active distinct teachers assigned to this section
      const activeAssignments = await mongoose.model('TeacherSectionAssignment').find({
        sectionId: this.sectionId,
        academicYear: this.academicYear,
        status: 'ACTIVE',
        _id: { $ne: this._id },
      });

      const uniqueTeachers = new Set(activeAssignments.map((a) => a.teacherId.toString()));
      uniqueTeachers.add(this.teacherId.toString());

      if (uniqueTeachers.size > maxLimit) {
        return next(
          new Error(
            `Section teacher limit exceeded. Maximum allowed teachers for this section is ${maxLimit}.`
          )
        );
      }
    }
  }
  next();
});

const TeacherSectionAssignment = mongoose.model(
  'TeacherSectionAssignment',
  teacherSectionAssignmentSchema
);
module.exports = TeacherSectionAssignment;
