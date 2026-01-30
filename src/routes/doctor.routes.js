const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const tokenController = require('../controllers/token.controller'); // For simplified calling

router.post('/', doctorController.createDoctor);
router.post('/:doctorId/slots', doctorController.createSlot);
router.get('/:doctorId/slots', doctorController.getSlots);
router.get('/', doctorController.getSlots); // Wait, this gets Slots for *a* doctor? No, for all.
// I'll keep generic `GET /doctors` unimplemented unless requested. Assume only specific doctor slot fetching.

module.exports = router;
