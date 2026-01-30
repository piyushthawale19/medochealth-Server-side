const Doctor = require('../models/doctor.model');
const Slot = require('../models/slot.model');
const Token = require('../models/token.model');
const AllocationService = require('../services/allocation.service');
const store = require('../models/store');
const { TOKEN_SOURCES } = require('../config/constants');

function getRandomSource() {
    const sources = Object.values(TOKEN_SOURCES);
    return sources[Math.floor(Math.random() * sources.length)];
}

async function simulate() {
    console.log('--- Starting OPD Simulation Day ---');
    store.reset();

    // Create 3 Doctors
    const doctors = [
        Doctor.create('Dr. Alice', 'Cardiology'),
        Doctor.create('Dr. Bob', 'Neurology'),
        Doctor.create('Dr. Charlie', 'Orthopedics')
    ];

    // Define Slots for the Day (9-12, 3 slots each)
    const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' }
    ];

    for (const doc of doctors) {
        for (const ts of timeSlots) {
            // Random capacity between 3 and 5 for variety
            const cap = Math.floor(Math.random() * 3) + 3;
            Slot.create(doc.id, ts.start, ts.end, cap);
        }
        console.log(`Created 3 slots for ${doc.name}`);
    }

    // Simulate High Traffic Day
    // Generate 20-30 requests per doctor
    for (const doc of doctors) {
        console.log(`\n--- Simulating Logic for ${doc.name} ---`);
        const numRequests = 25; // High load to force reallocation

        for (let i = 0; i < numRequests; i++) {
            const source = getRandomSource();
            // 80% chance to request first slot (Morning rush)
            const targetSlotIndex = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 3);
            const slots = Slot.getByDoctor(doc.id);
            const targetSlot = slots[targetSlotIndex];

            if (!targetSlot) continue;

            try {
                AllocationService.requestToken(doc.id, targetSlot.id, `Patient-${doc.name[0]}-${i}`, source);
            } catch (e) {
                // Ignore (Waitlisted or Error)
            }
        }

        // Print Results
        const slots = Slot.getByDoctor(doc.id);
        slots.forEach(s => {
            const tokens = s.tokenIds.map(id => Token.getById(id));
            // Sort by priority for visualization
            tokens.sort((a, b) => a.priority - b.priority);
            console.log(`Slot ${s.start} (Cap ${s.capacity}) -> Count: ${s.tokenIds.length}`);
            // console.log(tokens.map(t => `${t.priority}:${t.source}`).join(', '));
        });

        // Check waitlist
        const waitlisted = store.tokens.filter(t => t.status === 'Waitlisted' && t.patientName.includes(doc.name[0]));
        console.log(`Waitlisted: ${waitlisted.length}`);
    }
}

simulate();
