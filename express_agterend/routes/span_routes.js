const express = require('express');
const router = express.Router();

const { getTeamById, 
    getAllTeams,
    getMembersByTeamId, 
    createTeam,
    createMember,
    updateTeam,
    updateMember,
    deleteTeam,
    deleteMember } = require('../db_calls/span');

// GET /teams - get all teams
router.get('/', async (req, res) => {
    try {
        const teams = await getAllTeams();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie spanne laai nie', details: err.message });
    }
});

// GET /teams/:id - team info
router.get('/:id', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        const team = await getTeamById(spanId);
        if (!team) {
            return res.status(404).json({ error: 'Span nie gevind nie' });
        }
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span inligting laai nie', details: err.message });
    }
});

// GET /teams/:id/members - team members
router.get('/:id/members', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        const members = await getMembersByTeamId(spanId);
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span lede laai nie', details: err.message });
    }
});

// POST /teams - create a new team
router.post('/', async (req, res) => {
    try {
        const newTeamId = await createTeam(req.body);
        res.status(201).json({ id: newTeamId });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span skep nie', details: err.message });
    }
});

// POST /teams/:id/members - add a new member to a team
router.post('/:id/members', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        const memberData = Object.assign({}, req.body, { span_id: spanId });
        const newMemberId = await createMember(memberData);
        res.status(201).json({ id: newMemberId });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie lid skep nie', details: err.message });
    }
});

// PUT /teams/:id - update a team
router.put('/:id', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        await updateTeam(spanId, req.body);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span opdateer nie', details: err.message });
    }
});

// PUT /teams/:id/members/:memberId - update a member
router.put('/:id/members/:memberId', async (req, res) => {
    const memberId = parseInt(req.params.memberId, 10);
    if (isNaN(memberId)) {
        return res.status(400).json({ error: 'Ongeldige lid ID' });
    }
    try {
        await updateMember(memberId, req.body);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie lid opdateer nie', details: err.message });
    }
});

// DELETE /teams/:id - delete a team
router.delete('/:id', async (req, res) => {
    const spanId = parseInt(req.params.id, 10);
    if (isNaN(spanId)) {
        return res.status(400).json({ error: 'Ongeldige span ID' });
    }
    try {
        await deleteTeam(spanId);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie span verwyder nie', details: err.message });
    }
});

// DELETE /teams/:id/members/:memberId - delete a member
router.delete('/:id/members/:memberId', async (req, res) => {
    const memberId = parseInt(req.params.memberId, 10);
    if (isNaN(memberId)) {
        return res.status(400).json({ error: 'Ongeldige lid ID' });
    }
    try {
        await deleteMember(memberId);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Kon nie lid verwyder nie', details: err.message });
    }
});


module.exports = router;