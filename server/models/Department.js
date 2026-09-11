const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    programs: [
      {
        type: String,
        trim: true,
        default: ['B.Tech'],
      },
    ],
    courses: [
      {
        type: String,
        trim: true,
      },
    ],
    years: {
      type: [Number],
      default: [1, 2, 3, 4],
    },
    headOfDepartment: {
      type: String,
      trim: true,
      default: '',
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

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
