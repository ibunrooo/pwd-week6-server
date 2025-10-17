// cors-config.js (정상 버전)
const getCorsConfig = () => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5050', // 브라우저 직접 접근 허용
    'https://pwd-week6-client-eta.vercel.app'
  ];

  return {
    origin: (origin, callback) => {
      // 브라우저 주소창/서버-서버 호출(origin 없음) 허용
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
};

// (선택) 개발용: 완전 허용 미들웨어도 함께 export
const allowAll = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
};

module.exports = getCorsConfig;
module.exports.allowAll = allowAll;
