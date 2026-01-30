const store = require('./store');

class Slot {
    constructor(id, doctorId, start, end, capacity) {
        this.id = id;
        this.doctorId = doctorId;
        this.start = start;  // e.g., '09:00'
        this.end = end;      // e.g., '10:00'
        this.capacity = capacity;
        this.tokenIds = [];  // List of token IDs allocated
    }

    static create(doctorId, start, end, capacity) {
        const id = store.generateId();
        const slot = new Slot(id, doctorId, start, end, capacity);
        store.slots.push(slot);
        return slot;
    }

    static getById(id) {
        return store.slots.find(s => s.id === id);
    }

    static getByDoctor(doctorId) {
        return store.slots.filter(s => s.doctorId === doctorId);
    }

    isFull() {
        return this.tokenIds.length >= this.capacity;
    }

    addToken(tokenId) {
        if (!this.tokenIds.includes(tokenId)) {
            this.tokenIds.push(tokenId);
        }
    }

    removeToken(tokenId) {
        this.tokenIds = this.tokenIds.filter(id => id !== tokenId);
    }

    getCurrentCount() {
        return this.tokenIds.length;
    }
}

module.exports = Slot;
