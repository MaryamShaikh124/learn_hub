const crypto = require('crypto');

function slugify(value) {
  const base = String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'course'}-${suffix}`;
}

module.exports = { slugify };
