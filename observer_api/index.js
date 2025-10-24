const express = require('express');
const cors = require('cors');
const { initializeDatabase, getDatabasePath } = require('./db_setup/setup');
const app = express();
const port = 4001;


// CORS configuration to allow requests from localhost
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    optionsSuccessStatus: 200
}));

// Middleware to parse JSON bodies
app.use(express.json());

let clients = [];

app.get('/', (req, res) => {
    res.json({ message: 'Welkom by die Melktert Express Observer API' });
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

// Server Sent Events endpoint
app.get("/stream", (req, res) => {
    // Set CORS headers for SSE
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Add new client
    clients.push(res);
    console.log("New client connected, total:", clients.length);
  
    req.on("close", () => {
      clients = clients.filter(c => c !== res);
      console.log("Client disconnected, total:", clients.length);
    });
  });

app.post("/notify/punte/bulk", (req, res) => {
    try {
        const { span_id, rondte_id, kriteria_scores } = req.body;
        
        // Validate required fields
        if (!span_id || !rondte_id || !kriteria_scores) {
            return res.status(400).json({ error: 'Span ID, Rondte ID en kriteria_scores is verpligtend' });
        }
        
        // Validate data types
        const spanId = parseInt(span_id, 10);
        const rondteId = parseInt(rondte_id, 10);
        
        if (isNaN(spanId) || isNaN(rondteId)) {
            return res.status(400).json({ error: 'Span ID en Rondte ID moet geldige nommers wees' });
        }
        
        // Validate kriteria_scores is an object
        if (typeof kriteria_scores !== 'object' || Array.isArray(kriteria_scores)) {
            return res.status(400).json({ error: 'kriteria_scores moet \'n objek wees' });
        }

        // Send to all connected SSE clients the received body
        clients.forEach(c => c.write(`data: ${JSON.stringify(req.body)}\n\n`));

        // Respond that it was successful
        res.status(201).json({ message: 'notification sent' });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie notification skep nie', details: err.message });
    }
});