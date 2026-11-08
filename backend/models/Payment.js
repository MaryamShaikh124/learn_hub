const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'PKR', enum: ['PKR'] },
    status: { type: String, required: true, enum: ['simulated'], default: 'simulated' },
    method: { type: String, required: true, enum: ['demo'], default: 'demo' },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
