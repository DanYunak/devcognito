const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDb = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const vacancyRoutes = require('./routes/vacancyRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/error');
const initSocket = require('./socket');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    env.corsOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

initSocket(server, env.corsOrigin);

const bootstrap = async () => {
  try {
    await connectDb(env.mongoUri);
    server.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

bootstrap();
