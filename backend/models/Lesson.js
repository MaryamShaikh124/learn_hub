const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    videoUrl: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    durationMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
