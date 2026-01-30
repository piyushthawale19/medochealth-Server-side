const AllocationService = require('../services/allocation.service');
const Token = require('../models/token.model');
const Slot = require('../models/slot.model');

exports.requestToken = (req, res) => {
    const { doctorId, slotId, patientName, source } = req.body;

    if (!doctorId || !slotId || !patientName || !source) {
        return res.status(400).json({ error: 'Missing required fields: doctorId, slotId, patientName, source' });
    }

    try {
        const token = AllocationService.requestToken(parseInt(doctorId), parseInt(slotId), patientName, source);
        res.status(201).json(token);
    } catch (error) {
        console.error('Error allocating token:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.cancelToken = (req, res) => {
    const { tokenId } = req.params;
    try {
        const token = AllocationService.cancelToken(parseInt(tokenId));
        res.json({ message: 'Token cancelled', token });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

exports.getTokenStatus = (req, res) => {
    const { tokenId } = req.params;
    const token = Token.getById(parseInt(tokenId));
    if (!token) return res.status(404).json({ error: 'Token not found' });

    // Enrich with current slot info
    let slotDetails = null;
    if (token.slotId) {
        const slot = Slot.getById(token.slotId);
        if (slot) slotDetails = { start: slot.start, end: slot.end };
    }

    res.json({ ...token, slotDetails });
};
