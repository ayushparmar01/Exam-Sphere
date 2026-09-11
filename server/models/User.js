const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    program: {
      type: String,
      trim: true,
      default: 'B.Tech',
    },
    course: {
      type: String,
      trim: true,
      default: 'CSE',
      index: true,
    },
    semester: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
      index: true,
    },
    year: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2025-26',
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    stats: {
      testsTaken: { type: Number, default: 0 },
      testsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      examReminders: { type: Boolean, default: true },
      resultAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
