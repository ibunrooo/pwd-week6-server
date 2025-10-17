// app.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport.config');
const restaurantsRouter = require('./routes/restaurants.routes');
const submissionsRouter = require('./routes/submissions.routes');
const authRouter = require('./routes/auth.routes');
const usersRouter = require('./routes/users.routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const mongoose = require('mongoose');
const getCorsConfig = require('../cors-config');
const { allowAll } = require('../cors-config'); // ← 추가

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // 0) 요청 로깅
  app.use((req, _res, next) => {
    console.log(`REQ ${req.method} ${req.url} origin=${req.headers.origin || '(none)'}`);
    next();
  });

  // 1) (임시) 완전 허용 헤더 – 원인 분리용
  app.use(allowAll);

  // 2) 헬스 체크 (모든 미들웨어보다 위)
  app.get('/health', (_req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return res.status(200).json({
      success: true,
      database: states[mongoose.connection.readyState],
      ts: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  // 3) CORS 설정(정상 버전)
  app.use(cors(getCorsConfig()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4) 세션
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  };
  if (process.env.NODE_ENV === 'production') sessionConfig.proxy = true;
  if (mongoose.connection.readyState === 1) {
    sessionConfig.store = MongoStore.create({
      client: mongoose.connection.getClient(),
      touchAfter: 24 * 3600,
    });
  } else if (process.env.MONGODB_URI) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME,
      touchAfter: 24 * 3600,
    });
  }
  app.use(session(sessionConfig));

  // 5) Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // 6) API 라우트
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/restaurants', restaurantsRouter);
  app.use('/api/submissions', submissionsRouter);

  // 7) 404 & 에러
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
