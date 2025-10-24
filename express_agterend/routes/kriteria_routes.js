const express = require('express');
const router = express.Router();

const { 
    getAllKriteria,
    getKriteriaById,
    createKriteria,
    updateKriteria,
    deleteKriteria 
} = require('../db_calls/kriteria');

// GET /kriteria - get all kriteria
router.get('/', async (req, res) => {
    try {
        const kriteria = await getAllKriteria();
        res.json(kriteria);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie kriteria laai nie', details: err.message });
    }
});

// GET /kriteria/:id - kriteria info
router.get('/:id', async (req, res) => {
    const kriteriaId = parseInt(req.params.id, 10);
    if (isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige kriteria ID' });
    }
    try {
        const kriteria = await getKriteriaById(kriteriaId);
        if (!kriteria) {
            return res.status(404).json({ error: 'Kriteria nie gevind nie' });
        }
        res.json(kriteria);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie kriteria inligting laai nie', details: err.message });
    }
});


// POST /kriteria - create a new kriteria
router.post('/', async (req, res) => {
    try {
        const newKriteriaId = await createKriteria(req.body);
        res.status(201).json({ id: newKriteriaId });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie kriteria skep nie', details: err.message });
    }
});


// PUT /kriteria/:id - update a kriteria
router.put('/:id', async (req, res) => {
    const kriteriaId = parseInt(req.params.id, 10);
    if (isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige kriteria ID' });
    }
    try {
        await updateKriteria(kriteriaId, req.body);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie kriteria opdateer nie', details: err.message });
    }
});


// DELETE /kriteria/:id - delete a kriteria
router.delete('/:id', async (req, res) => {
    const kriteriaId = parseInt(req.params.id, 10);
    if (isNaN(kriteriaId)) {
        return res.status(400).json({ error: 'Ongeldige kriteria ID' });
    }
    try {
        await deleteKriteria(kriteriaId);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie kriteria verwyder nie', details: err.message });
    }
});



module.exports = router;