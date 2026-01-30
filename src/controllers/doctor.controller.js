const Doctor = require('../models/doctor.model');
const Slot = require('../models/slot.model');

exports.createDoctor = (req, res) => {
    const { name, specialization } = req.body;
    if (!name || !specialization) {
        return res.status(400).json({ error: 'Name and specialization required' });
    }
    const doctor = Doctor.create(name, specialization);
    res.status(201).json(doctor);
};

exports.createSlot = (req, res) => {
    const { doctorId } = req.params;
    const { start, end, capacity } = req.body;

    // Validation
    if (!start || !end || !capacity) {
        return res.status(400).json({ error: 'Start, End, Capacity required' });
    }

    // Check if doctor exists
    const doctor = Doctor.getById(parseInt(doctorId));
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Create slot
    const slot = Slot.create(parseInt(doctorId), start, end, parseInt(capacity));
    res.status(201).json(slot);
};

exports.getSlots = (req, res) => {
    const { doctorId } = req.params;
    const slots = Slot.getByDoctor(parseInt(doctorId));

    // Enrich with token count
    const result = slots.map(s => ({
        ...s,
        currentCount: s.getCurrentCount(),
        isFull: s.isFull()
    }));

    res.json(result);
};
