const store = require('./store');

class Token {
    constructor(id, patientName, source, priority, slotId, timestamp) {
        this.id = id;
        this.patientName = patientName;
        this.source = source;
        this.priority = priority; // Lower number = higher priority
        this.slotId = slotId;    // Allocated slot
        this.status = 'Waitlisted'; // Pending, Allocated, Cancelled, Completed, Waitlisted
        this.timestamp = timestamp;
    }

    static create(patientName, source, priority, slotId) {
        const id = store.generateId();
        const token = new Token(id, patientName, source, priority, slotId, Date.now());
        store.tokens.push(token);
        return token;
    }

    static getById(id) {
        return store.tokens.find(t => t.id === id);
    }

    static getBySlot(slotId) {
        return store.tokens.filter(t => t.slotId === slotId);
    }

    updateStatus(status) {
        this.status = status;
    }
}

module.exports = Token;
