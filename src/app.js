// app.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport.config');
const authRouter = require('./routes/auth.routes');
const restaurantsRouter = require('./routes/restaurants.routes');
const submissionsRouter = require('./routes/submissions.routes');
const usersRouter = require('./routes/users.routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const mongoose = require('mongoose');

function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render, Vercel reverse proxy 환경에서 필수

  // ✅ CORS 설정
  app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ 세션 설정
  const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS 전용 쿠키
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  };

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // ✅ API 라우트
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/restaurants', restaurantsRouter);
  app.use('/api/submissions', submissionsRouter);

  // ✅ 헬스체크
  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, env: process.env.NODE_ENV });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
