const mongoose = require('mongoose');
const { CATEGORIES, LEVELS } = require('../utils/constants');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 4, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, enum: CATEGORIES },
    level: { type: String, required: true, enum: LEVELS, default: 'Beginner' },
    language: { type: String, default: 'English', trim: true, maxlength: 40 },
    price: { type: Number, required: true, min: 0, default: 0 },
    thumbnail: { type: String, default: '', trim: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    published: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });
courseSchema.index({ category: 1, published: 1, price: 1 });

module.exports = mongoose.model('Course', courseSchema);
