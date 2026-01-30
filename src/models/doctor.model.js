const store = require('./store');

class Doctor {
    constructor(id, name, specialization) {
        this.id = id;
        this.name = name;
        this.specialization = specialization;
        this.slots = []; // Slot IDs
    }

    static create(name, specialization) {
        const id = store.generateId();
        const doctor = new Doctor(id, name, specialization);
        store.doctors.push(doctor);
        return doctor;
    }

    static getAll() {
        return store.doctors;
    }

    static getById(id) {
        return store.doctors.find(d => d.id === id);
    }
}

module.exports = Doctor;
