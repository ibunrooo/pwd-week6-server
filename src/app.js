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
  app.set('trust proxy', 1); // ✅ Render, Vercel 환경에서 필수

  // ✅ CORS 설정 (로컬 + Vercel 배포 주소 허용)
  const allowedOrigins = [
    'http://localhost:5173', // 로컬 개발용
    //'https://pwd-week6-client.vercel.app', // 원래 Vercel 배포 주소
    'https://pwd-week6-client-eta.vercel.app', // 새 Vercel 배포 주소
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // origin이 허용된 목록에 없을 경우 차단
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('🚫 CORS 차단:', origin);
        callback(new Error('CORS not allowed for this origin: ' + origin));
      }
    },
    credentials: true, // 쿠키 허용 (세션 유지용)
  }));

  // ✅ Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ 세션 설정
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME,
      collectionName: 'sessions',
      touchAfter: 24 * 3600, // 하루에 한 번만 갱신
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS만 허용
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일 유지
    },
  };

  app.use(session(sessionConfig));

  // ✅ Passport 설정
  app.use(passport.initialize());
  app.use(passport.session());

  // ✅ API 라우트
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/restaurants', restaurantsRouter);
  app.use('/api/submissions', submissionsRouter);

  // ✅ 헬스 체크 (배포 확인용)
  app.get('/health', (_req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.status(200).json({
      success: true,
      database: states[mongoose.connection.readyState],
      env: process.env.NODE_ENV,
      ts: new Date().toISOString(),
    });
  });

  // ✅ 404 핸들러
  app.use(notFound);

  // ✅ 에러 핸들러
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
