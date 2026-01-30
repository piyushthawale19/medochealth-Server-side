const store = {
    doctors: [],
    slots: [],
    tokens: [],
    idCounter: 1,

    generateId() {
        return this.idCounter++;
    },

    reset() {
        this.doctors = [];
        this.slots = [];
        this.tokens = [];
        this.idCounter = 1;
    }
};

module.exports = store;
