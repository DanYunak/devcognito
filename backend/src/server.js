const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDb = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/error');
const initSocket = require('./socket');

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

initSocket(server, env.corsOrigin);

const bootstrap = async () => {
  try {
    await connectDb(env.mongoUri);
    server.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

bootstrap();
