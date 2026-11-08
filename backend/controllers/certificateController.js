const Certificate = require('../models/Certificate');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function present(certificate) {
  return {
    id: certificate._id,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    student: certificate.student?.name
      ? { id: certificate.student._id, name: certificate.student.name }
      : { id: certificate.student },
    course: certificate.course?.title
      ? { id: certificate.course._id, title: certificate.course.title, category: certificate.course.category }
      : { id: certificate.course },
  };
}

const myCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate('student', 'name')
    .populate('course', 'title category')
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: { certificates: certificates.map(present) } });
});

const getCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate('student', 'name')
    .populate('course', 'title category');
  if (!certificate) throw new AppError('Certificate not found.', 404);
  const owner = String(certificate.student._id || certificate.student) === String(req.user._id);
  const privileged = req.user.role === 'admin';
  if (!owner && !privileged) throw new AppError('You can only view your own certificates.', 403);
  res.json({ success: true, data: { certificate: present(certificate) } });
});

module.exports = { myCertificates, getCertificate };
