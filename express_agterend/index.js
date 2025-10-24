const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;
const { initializeDatabase, getDatabasePath } = require('./db_setup/setup');
const teamsRouter = require('./routes/span_routes');
const kriteriaRouter = require('./routes/kriteria_routes');
const merkbladRouter = require('./routes/merkblad_route');
const punteRouter = require('./routes/punte_routes');
const authRouter = require('./routes/auth_routes');
const roundRouter = require('./routes/round_routes');
const { authenticateToken } = require('./middleware/auth');

// CORS configuration to allow requests from localhost
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    optionsSuccessStatus: 200
}));

// Middleware to parse JSON bodies
app.use(express.json());


app.get('/', (req, res) => {
    res.json({ message: 'Welkom by die Melktert Express agterend' });
});

// Initialize DB then start the server
initializeDatabase()
    .then((dbPath) => {
        console.log(`SQLite DB ready at ${dbPath}`);
        app.listen(port, () => {
            console.log(`Express API listening at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });


// Auth routes (no authentication required)
app.use('/auth', authRouter);

// Protected routes (require authentication)
app.use('/teams', authenticateToken, teamsRouter);
app.use('/kriteria', authenticateToken, kriteriaRouter);
app.use('/merkblad', authenticateToken, merkbladRouter);
app.use('/punte', authenticateToken, punteRouter);
app.use('/rounds', authenticateToken, roundRouter);

