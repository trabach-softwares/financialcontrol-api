import app from './app.js';
import dotenv from 'dotenv';
import { startPlanExpirationJob } from './jobs/planExpirationJob.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Iniciar job de verificação de expiração de planos
  startPlanExpirationJob();
});
