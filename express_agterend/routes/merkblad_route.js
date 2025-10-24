const express = require('express');
const router = express.Router();

const { 
    getAllMerkblads,
    getMerkbladById,
    getMerkbladsByRondteId,
    getMerkbladsByKriteriaId,
    createMerkblad,
    updateMerkblad,
    updateMerkbladTotaal,
    deleteMerkblad,
    deleteMerkbladsByRondteId,
    deleteMerkbladsByKriteriaId,
    checkMerkbladExists,
    getOrCreateMerkblad
} = require('../db_calls/merkblad');

// GET /merkblad - get all merkblads
router.get('/', async (req, res) => {
    try {
        const merkblads = await getAllMerkblads();
        res.json(merkblads);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblads laai nie', details: err.message });
    }
});

// GET /merkblad/:id - get specific merkblad by ID
router.get('/:id', async (req, res) => {
    const merkbladId = parseInt(req.params.id, 10);
    if (isNaN(merkbladId)) {
        return res.status(400).json({ error: 'Ongeldige merkblad ID' });
    }
    try {
        const merkblad = await getMerkbladById(merkbladId);
        if (!merkblad) {
            return res.status(404).json({ error: 'Merkblad nie gevind nie' });
        }
        res.json(merkblad);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad inligting laai nie', details: err.message });
    }
});

// GET /merkblad/rondte/:rondteId - get all merkblads for a specific rondte
router.get('/rondte/:rondteId', async (req, res) => {
    const rondteId = parseInt(req.params.rondteId, 10);
    if (isNaN(rondteId)) {
        return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }
    try {
        const merkblads = await getMerkbladsByRondteId(rondteId);
        res.json(merkblads);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblads vir rondte laai nie', details: err.message });
    }
});

// GET /merkblad/kriteria/:kriteriaId - get all merkblads for a specific kriteria
router.get('/kriteria/:kriteriaId', async (req, res) => {
    const kriteriaId = parseInt(req.params.kriteriaId, 10);
    if (isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige kriteria ID' });
    }
    try {
        const merkblads = await getMerkbladsByKriteriaId(kriteriaId);
        res.json(merkblads);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblads vir kriteria laai nie', details: err.message });
    }
});

// POST /merkblad - create a new merkblad
router.post('/', async (req, res) => {
    const { rondte_id, kriteria_id, totaal } = req.body;
    
    // Validate required fields
    if (!rondte_id || !kriteria_id) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID is verpligtend' });
    }
    
    // Validate data types
    const rondteId = parseInt(rondte_id, 10);
    const kriteriaId = parseInt(kriteria_id, 10);
    const totaalValue = totaal !== undefined ? parseInt(totaal, 10) : null;
    
    if (isNaN(rondteId) || isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID moet geldige nommers wees' });
    }
    
    if (totaalValue !== null && isNaN(totaalValue)) {
        return res.status(400).json({ error: 'Totaal moet \'n geldige nommer wees' });
    }
    
    try {
        const newMerkblad = await createMerkblad(rondteId, kriteriaId, totaalValue);
        res.status(201).json(newMerkblad);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad skep nie', details: err.message });
    }
});

// POST /merkblad/get-or-create - get existing or create new merkblad
router.post('/get-or-create', async (req, res) => {
    const { rondte_id, kriteria_id, default_totaal } = req.body;
    
    // Validate required fields
    if (!rondte_id || !kriteria_id) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID is verpligtend' });
    }
    
    // Validate data types
    const rondteId = parseInt(rondte_id, 10);
    const kriteriaId = parseInt(kriteria_id, 10);
    const defaultTotaalValue = default_totaal !== undefined ? parseInt(default_totaal, 10) : null;
    
    if (isNaN(rondteId) || isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID moet geldige nommers wees' });
    }
    
    if (defaultTotaalValue !== null && isNaN(defaultTotaalValue)) {
        return res.status(400).json({ error: 'Default totaal moet \'n geldige nommer wees' });
    }
    
    try {
        const merkblad = await getOrCreateMerkblad(rondteId, kriteriaId, defaultTotaalValue);
        res.json(merkblad);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad kry of skep nie', details: err.message });
    }
});

// PUT /merkblad/:id - update a merkblad
router.put('/:id', async (req, res) => {
    const merkbladId = parseInt(req.params.id, 10);
    if (isNaN(merkbladId)) {
        return res.status(400).json({ error: 'Ongeldige merkblad ID' });
    }
    
    const { rondte_id, kriteria_id, totaal } = req.body;
    
    // Validate required fields
    if (!rondte_id || !kriteria_id) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID is verpligtend' });
    }
    
    // Validate data types
    const rondteId = parseInt(rondte_id, 10);
    const kriteriaId = parseInt(kriteria_id, 10);
    const totaalValue = totaal !== undefined ? parseInt(totaal, 10) : null;
    
    if (isNaN(rondteId) || isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Rondte ID en Kriteria ID moet geldige nommers wees' });
    }
    
    if (totaalValue !== null && isNaN(totaalValue)) {
        return res.status(400).json({ error: 'Totaal moet \'n geldige nommer wees' });
    }
    
    try {
        const updatedMerkblad = await updateMerkblad(merkbladId, rondteId, kriteriaId, totaalValue);
        res.json(updatedMerkblad);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad opdateer nie', details: err.message });
    }
});

// PATCH /merkblad/:id/totaal - update only the totaal field
router.patch('/:id/totaal', async (req, res) => {
    const merkbladId = parseInt(req.params.id, 10);
    if (isNaN(merkbladId)) {
        return res.status(400).json({ error: 'Ongeldige merkblad ID' });
    }
    
    const { totaal } = req.body;
    
    // Validate totaal
    if (totaal === undefined) {
        return res.status(400).json({ error: 'Totaal is verpligtend' });
    }
    
    const totaalValue = parseInt(totaal, 10);
    if (isNaN(totaalValue)) {
        return res.status(400).json({ error: 'Totaal moet \'n geldige nommer wees' });
    }
    
    try {
        const updatedMerkblad = await updateMerkbladTotaal(merkbladId, totaalValue);
        res.json(updatedMerkblad);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad totaal opdateer nie', details: err.message });
    }
});

// DELETE /merkblad/:id - delete a specific merkblad
router.delete('/:id', async (req, res) => {
    const merkbladId = parseInt(req.params.id, 10);
    if (isNaN(merkbladId)) {
        return res.status(400).json({ error: 'Ongeldige merkblad ID' });
    }
    try {
        const result = await deleteMerkblad(merkbladId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad verwyder nie', details: err.message });
    }
});

// DELETE /merkblad/rondte/:rondteId - delete all merkblads for a specific rondte
router.delete('/rondte/:rondteId', async (req, res) => {
    const rondteId = parseInt(req.params.rondteId, 10);
    if (isNaN(rondteId)) {
        return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }
    try {
        const result = await deleteMerkbladsByRondteId(rondteId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblads vir rondte verwyder nie', details: err.message });
    }
});

// DELETE /merkblad/kriteria/:kriteriaId - delete all merkblads for a specific kriteria
router.delete('/kriteria/:kriteriaId', async (req, res) => {
    const kriteriaId = parseInt(req.params.kriteriaId, 10);
    if (isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige kriteria ID' });
    }
    try {
        const result = await deleteMerkbladsByKriteriaId(kriteriaId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblads vir kriteria verwyder nie', details: err.message });
    }
});

// GET /merkblad/exists/:rondteId/:kriteriaId - check if merkblad exists for rondte and kriteria combination
router.get('/exists/:rondteId/:kriteriaId', async (req, res) => {
    const rondteId = parseInt(req.params.rondteId, 10);
    const kriteriaId = parseInt(req.params.kriteriaId, 10);
    
    if (isNaN(rondteId) || isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige rondte ID of kriteria ID' });
    }
    
    try {
        const exists = await checkMerkbladExists(rondteId, kriteriaId);
        res.json({ exists });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie merkblad bestaan status kontroleer nie', details: err.message });
    }
});

module.exports = router;
