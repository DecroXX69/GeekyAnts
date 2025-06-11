// File: models/User.js
/**
 * User model: defines schema for both engineers and managers,
 * with authentication and profile fields.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,    // unique index created here
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['engineer', 'manager'],
    default: 'engineer'
  },
  // Engineer-specific fields
  skills: [{
    type: String,
    trim: true
  }],
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    default: 'mid'
  },
  maxCapacity: {
    type: Number,
    default: 100,
    min: 1,    // ensure at least 1% capacity if engineer; if you allow 0, change accordingly
    max: 100
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying by role and skills
// (Remove the explicit email index because `unique: true` on email adds it already)
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });

module.exports = mongoose.model('User', userSchema);
