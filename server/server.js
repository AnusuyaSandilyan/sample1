import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import expenseRoutes from './routes/expenseRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initCronNotifier } from './services/cronNotifier.js';
import { initPostgresDB } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        database: 'Neon PostgreSQL',
        app: 'Smart Expense Tracker & Automated Due Date Notifier',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend static build if present
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.send('PERN Backend running on port ' + PORT + '. Client dashboard loading...');
        }
    });
});

// Initialize Neon Database & Start Express Server
const startServer = async () => {
    await initPostgresDB();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Smart Expense PERN Backend running on http://localhost:${PORT}`);
        console.log(`📊 Connected to Neon PostgreSQL DB.`);
        console.log(`🔗 API endpoints live at http://localhost:${PORT}/api/expenses`);
        initCronNotifier();
    });
};

startServer();
