const express = require('express');
const router = express.Router();

const { 
    createPunt,
    getAllPunte,
    getPuntById,
    getPunteByMerkbladId,
    getPunteBySpanId,
    getPuntByMerkbladAndSpan,
    getPunteByRondteId,
    updatePunt,
    updatePuntByMerkbladAndSpan,
    deletePunt,
    deletePuntByMerkbladAndSpan,
    deletePunteByMerkblad,
    deletePunteBySpan,
    getRoundStatus,
    closeRound,
    openRound
} = require('../db_calls/punte');

// GET /punte - get all punte
router.get('/', async (req, res) => {
    try {
        const punte = await getAllPunte();
        res.json(punte);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte laai nie', details: err.message });
    }
});

// GET /punte/:id - get specific punt by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID moet \'n geldige nommer wees' });
        }
        
        const punt = await getPuntById(id);
        if (!punt) {
            return res.status(404).json({ error: 'Punt nie gevind nie' });
        }
        
        res.json(punt);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt laai nie', details: err.message });
    }
});

// GET /punte/merkblad/:merkblad_id - get all punte for a specific merkblad
router.get('/merkblad/:merkblad_id', async (req, res) => {
    try {
        const merkblad_id = parseInt(req.params.merkblad_id, 10);
        if (isNaN(merkblad_id)) {
            return res.status(400).json({ error: 'Merkblad ID moet \'n geldige nommer wees' });
        }
        
        const punte = await getPunteByMerkbladId(merkblad_id);
        res.json(punte);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte vir merkblad laai nie', details: err.message });
    }
});

// GET /punte/span/:span_id - get all punte for a specific span
router.get('/span/:span_id', async (req, res) => {
    try {
        const span_id = parseInt(req.params.span_id, 10);
        if (isNaN(span_id)) {
            return res.status(400).json({ error: 'Span ID moet \'n geldige nommer wees' });
        }
        
        const punte = await getPunteBySpanId(span_id);
        res.json(punte);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte vir span laai nie', details: err.message });
    }
});

// GET /punte/merkblad/:merkblad_id/span/:span_id - get punt for specific merkblad and span combination
router.get('/merkblad/:merkblad_id/span/:span_id', async (req, res) => {
    try {
        const merkblad_id = parseInt(req.params.merkblad_id, 10);
        const span_id = parseInt(req.params.span_id, 10);
        
        if (isNaN(merkblad_id) || isNaN(span_id)) {
            return res.status(400).json({ error: 'Merkblad ID en Span ID moet geldige nommers wees' });
        }
        
        const punt = await getPuntByMerkbladAndSpan(merkblad_id, span_id);
        if (!punt) {
            return res.status(404).json({ error: 'Punt vir hierdie merkblad en span kombinasie nie gevind nie' });
        }
        
        res.json(punt);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt laai nie', details: err.message });
    }
});

// GET /punte/rondte/:rondte_id - get all punte for all teams in a specific round
router.get('/rondte/:rondte_id', async (req, res) => {
    try {
        const rondte_id = parseInt(req.params.rondte_id, 10);
        if (isNaN(rondte_id)) {
            return res.status(400).json({ error: 'Rondte ID moet \'n geldige nommer wees' });
        }
        
        const punte = await getPunteByRondteId(rondte_id);
        res.json(punte);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte vir rondte laai nie', details: err.message });
    }
});

// POST /punte - create a new punt
router.post('/', async (req, res) => {
    try {
        const { merkblad_id, span_id, punt } = req.body;
        
        // Validate required fields
        if (!merkblad_id || !span_id || punt === undefined) {
            return res.status(400).json({ error: 'Merkblad ID, Span ID en punt is verpligtend' });
        }
        
        // Validate data types
        const merkbladId = parseInt(merkblad_id, 10);
        const spanId = parseInt(span_id, 10);
        const puntValue = parseInt(punt, 10);
        
        if (isNaN(merkbladId) || isNaN(spanId) || isNaN(puntValue)) {
            return res.status(400).json({ error: 'Merkblad ID, Span ID en punt moet geldige nommers wees' });
        }
        
        const newPunt = await createPunt(merkbladId, spanId, puntValue);
        res.status(201).json(newPunt);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt skep nie', details: err.message });
    }
});

// POST /punte/bulk - create multiple punte for a team's marksheet submission
router.post('/bulk', async (req, res) => {
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
        
        const results = [];
        const errors = [];
        
        // Process each kriteria score
        for (const [kriteriaId, scoreData] of Object.entries(kriteria_scores)) {
            try {
                const { merkblad_id, score } = scoreData;
                
                // Validate score data
                if (!merkblad_id || score === undefined) {
                    errors.push(`Kriteria ${kriteriaId}: Merkblad ID en score is verpligtend`);
                    continue;
                }
                
                const merkbladId = parseInt(merkblad_id, 10);
                const scoreValue = parseFloat(score);
                
                if (isNaN(merkbladId) || isNaN(scoreValue)) {
                    errors.push(`Kriteria ${kriteriaId}: Merkblad ID en score moet geldige nommers wees`);
                    continue;
                }
                
                // Create the punt
                const newPunt = await createPunt(merkbladId, spanId, scoreValue);
                results.push(newPunt);
                
            } catch (err) {
                errors.push(`Kriteria ${kriteriaId}: ${err.message}`);
            }
        }
        
        // If there were any errors, return them with partial success
        if (errors.length > 0) {
            return res.status(207).json({ 
                message: 'Gedeeltelike sukses',
                created: results.length,
                errors: errors,
                results: results
            });
        }
        
        // All successful
        res.status(201).json({ 
            message: `${results.length} punte suksesvol geskep`,
            results: results
        });
        
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte skep nie', details: err.message });
    }
});

// PUT /punte/:id - update a punt by ID
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { merkblad_id, span_id, punt } = req.body;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID moet \'n geldige nommer wees' });
        }
        
        // Validate required fields
        if (!merkblad_id || !span_id || punt === undefined) {
            return res.status(400).json({ error: 'Merkblad ID, Span ID en punt is verpligtend' });
        }
        
        // Validate data types
        const merkbladId = parseInt(merkblad_id, 10);
        const spanId = parseInt(span_id, 10);
        const puntValue = parseInt(punt, 10);
        
        if (isNaN(merkbladId) || isNaN(spanId) || isNaN(puntValue)) {
            return res.status(400).json({ error: 'Merkblad ID, Span ID en punt moet geldige nommers wees' });
        }
        
        const updatedPunt = await updatePunt(id, merkbladId, spanId, puntValue);
        if (updatedPunt.changes === 0) {
            return res.status(404).json({ error: 'Punt nie gevind nie' });
        }
        
        res.json(updatedPunt);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt opdateer nie', details: err.message });
    }
});

// PUT /punte/merkblad/:merkblad_id/span/:span_id - update punt by merkblad and span combination
router.put('/merkblad/:merkblad_id/span/:span_id', async (req, res) => {
    try {
        const merkblad_id = parseInt(req.params.merkblad_id, 10);
        const span_id = parseInt(req.params.span_id, 10);
        const { punt } = req.body;
        
        if (isNaN(merkblad_id) || isNaN(span_id)) {
            return res.status(400).json({ error: 'Merkblad ID en Span ID moet geldige nommers wees' });
        }
        
        // Validate required field
        if (punt === undefined) {
            return res.status(400).json({ error: 'Punt is verpligtend' });
        }
        
        // Validate data type
        const puntValue = parseInt(punt, 10);
        if (isNaN(puntValue)) {
            return res.status(400).json({ error: 'Punt moet \'n geldige nommer wees' });
        }
        
        const updatedPunt = await updatePuntByMerkbladAndSpan(merkblad_id, span_id, puntValue);
        if (updatedPunt.changes === 0) {
            return res.status(404).json({ error: 'Punt vir hierdie merkblad en span kombinasie nie gevind nie' });
        }
        
        res.json(updatedPunt);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt opdateer nie', details: err.message });
    }
});

// DELETE /punte/:id - delete punt by ID
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID moet \'n geldige nommer wees' });
        }
        
        const result = await deletePunt(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Punt nie gevind nie' });
        }
        
        res.json({ message: 'Punt suksesvol verwyder', id: result.id });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt verwyder nie', details: err.message });
    }
});

// DELETE /punte/merkblad/:merkblad_id/span/:span_id - delete punt by merkblad and span combination
router.delete('/merkblad/:merkblad_id/span/:span_id', async (req, res) => {
    try {
        const merkblad_id = parseInt(req.params.merkblad_id, 10);
        const span_id = parseInt(req.params.span_id, 10);
        
        if (isNaN(merkblad_id) || isNaN(span_id)) {
            return res.status(400).json({ error: 'Merkblad ID en Span ID moet geldige nommers wees' });
        }
        
        const result = await deletePuntByMerkbladAndSpan(merkblad_id, span_id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Punt vir hierdie merkblad en span kombinasie nie gevind nie' });
        }
        
        res.json({ message: 'Punt suksesvol verwyder', merkblad_id: result.merkblad_id, span_id: result.span_id });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punt verwyder nie', details: err.message });
    }
});

// DELETE /punte/merkblad/:merkblad_id - delete all punte for a specific merkblad
router.delete('/merkblad/:merkblad_id', async (req, res) => {
    try {
        const merkblad_id = parseInt(req.params.merkblad_id, 10);
        if (isNaN(merkblad_id)) {
            return res.status(400).json({ error: 'Merkblad ID moet \'n geldige nommer wees' });
        }
        
        const result = await deletePunteByMerkblad(merkblad_id);
        res.json({ message: `${result.changes} punte vir merkblad ${result.merkblad_id} suksesvol verwyder` });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte vir merkblad verwyder nie', details: err.message });
    }
});

// DELETE /punte/span/:span_id - delete all punte for a specific span
router.delete('/span/:span_id', async (req, res) => {
    try {
        const span_id = parseInt(req.params.span_id, 10);
        if (isNaN(span_id)) {
            return res.status(400).json({ error: 'Span ID moet \'n geldige nommer wees' });
        }
        
        const result = await deletePunteBySpan(span_id);
        res.json({ message: `${result.changes} punte vir span ${result.span_id} suksesvol verwyder` });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie punte vir span verwyder nie', details: err.message });
    }
});

// GET /punte/rondte/:rondte_id/status - get round status (is_oop)
router.get('/rondte/:rondte_id/status', async (req, res) => {
    try {
        const rondte_id = parseInt(req.params.rondte_id, 10);
        if (isNaN(rondte_id)) {
            return res.status(400).json({ error: 'Rondte ID moet \'n geldige nommer wees' });
        }
        
        const roundStatus = await getRoundStatus(rondte_id);
        if (!roundStatus) {
            return res.status(404).json({ error: 'Rondte nie gevind nie' });
        }
        
        res.json({ 
            rondte_id: roundStatus.rondte_id,
            is_open: roundStatus.is_oop === 1,
            is_oop: roundStatus.is_oop
        });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie rondte status laai nie', details: err.message });
    }
});

// PUT /punte/rondte/:rondte_id/close - close a round (set is_oop to 0)
router.put('/rondte/:rondte_id/close', async (req, res) => {
    try {
        const rondte_id = parseInt(req.params.rondte_id, 10);
        if (isNaN(rondte_id)) {
            return res.status(400).json({ error: 'Rondte ID moet \'n geldige nommer wees' });
        }
        
        const result = await closeRound(rondte_id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rondte nie gevind nie' });
        }
        
        res.json({ 
            message: `Rondte ${result.rondte_id} suksesvol gesluit`,
            rondte_id: result.rondte_id,
            changes: result.changes
        });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie rondte sluit nie', details: err.message });
    }
});

// PUT /punte/rondte/:rondte_id/open - open a round (set is_oop to 1)
router.put('/rondte/:rondte_id/open', async (req, res) => {
    try {
        const rondte_id = parseInt(req.params.rondte_id, 10);
        if (isNaN(rondte_id)) {
            return res.status(400).json({ error: 'Rondte ID moet \'n geldige nommer wees' });
        }
        
        const result = await openRound(rondte_id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Rondte nie gevind nie' });
        }
        
        res.json({ 
            message: `Rondte ${result.rondte_id} suksesvol oopgemaak`,
            rondte_id: result.rondte_id,
            changes: result.changes
        });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie rondte oopmaak nie', details: err.message });
    }
});

module.exports = router;
