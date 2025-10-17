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

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // 0️⃣ 요청 로깅
  app.use((req, _res, next) => {
    console.log(`REQ ${req.method} ${req.url} origin=${req.headers.origin || '(none)'}`);
    next();
  });

  // ✅ 1️⃣ CORS 설정 (항상 세션/쿠키보다 위)
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // 🔥 쿠키 교환 허용 (중요)
  }));

  // ✅ 2️⃣ Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ 3️⃣ 세션 설정
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME,
      collectionName: 'sessions',
      touchAfter: 24 * 3600, // 하루에 한 번만 업데이트
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션이면 HTTPS만
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 로컬/배포 자동 전환
      maxAge: 1000 * 60 * 60 * 24, // 1일 유지
    },
  };

  app.use(session(sessionConfig));

  // ✅ 4️⃣ Passport 초기화
  app.use(passport.initialize());
  app.use(passport.session());

  // ✅ 5️⃣ 헬스 체크 (세션 이후 위치 OK)
  app.get('/health', (_req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return res.status(200).json({
      success: true,
      database: states[mongoose.connection.readyState],
      ts: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  // ✅ 6️⃣ API 라우트
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/restaurants', restaurantsRouter);
  app.use('/api/submissions', submissionsRouter);

  // ✅ 7️⃣ 404 핸들러
  app.use(notFound);

  // ✅ 8️⃣ 에러 핸들러
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
