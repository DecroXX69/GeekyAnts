const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  allocationPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'Assignment end date must be after start date'
    }
  },
  role: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

AssignmentSchema.index({ engineerId: 1, startDate: 1, endDate: 1 });
AssignmentSchema.index({ projectId: 1 });
AssignmentSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
