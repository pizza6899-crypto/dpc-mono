const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN?.split(',');
  if (!origins || origins.length === 0 || origins[0] === '') {
    return ['http://localhost:3000'];
  }
  return origins.filter(Boolean).map((origin) => origin.trim());
};

export const corsConfig = {
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'Cookie',
  ],
  credentials: true,
  maxAge: 86400,
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'Set-Cookie'],
  optionsSuccessStatus: 200,
};
