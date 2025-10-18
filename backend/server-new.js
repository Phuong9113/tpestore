import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import apiRoutes from './routes/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// Environment variables check
if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL không được thiết lập. Prisma sẽ không kết nối được DB.');
}
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET không được thiết lập. Sử dụng giá trị mặc định KHÔNG an toàn cho môi trường dev.');
}

// Root route
app.get('/', (req, res) => {
  res.json({ service: 'tpestore-backend', status: 'ok', docs: '/api' });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});
