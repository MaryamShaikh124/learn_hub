const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/error');
const meta = require('./controllers/metaController');

const app = express();


const clientOrigins = (
  process.env.CLIENT_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
  
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));

app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
});

app.get('/api/health', meta.health);
app.get('/api/stats', meta.publicStats);
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api', require('./routes/lessonRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/instructor', require('./routes/instructorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
