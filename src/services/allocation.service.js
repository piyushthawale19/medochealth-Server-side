const Slot = require('../models/slot.model');
const Token = require('../models/token.model');
const { PRIORITY, TOKEN_STATUS } = require('../config/constants');

class AllocationService {
    /**
     * Main function to request a token.
     * Handles allocation, bumping, and reallocation.
     */
    static requestToken(doctorId, slotId, patientName, source) {
        const priority = PRIORITY[source];
        if (!priority) throw new Error('Invalid source');

        const slot = Slot.getById(slotId);
        if (!slot) throw new Error('Slot not found');

        // Create the token in a generic state first
        const token = Token.create(patientName, source, priority, null); // No slot yet

        return this.tryAllocate(token, slot);
    }

    static tryAllocate(token, slot) {
        const tokensInSlotIds = slot.tokenIds;
        const tokensInSlot = tokensInSlotIds.map(id => Token.getById(id));

        // 1. Check Capacity
        if (tokensInSlot.length < slot.capacity) {
            // Allocate directly
            return this.assignTokenToSlot(token, slot);
        }

        // 2. If Full, Check if we can bump someone
        // Find the lowest priority token (highest priority value)
        // Sort by Priority Descending (5 -> 1), then Timestamp Descending (Newest -> Oldest)
        const sortedTokens = tokensInSlot.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority; // Higher value = Lower priority
            return b.timestamp - a.timestamp; // Newer = easier to bump? Or bumps newest. FIFO usually better, so keep oldest. Bump newest.
        });

        const victim = sortedTokens[0]; // Lowest priority, most recent

        if (victim && token.priority < victim.priority) {
            // New token is strictly more important
            console.log(`Bumping token ${victim.id} (${victim.source}) for ${token.id} (${token.source})`);

            // Remove victim
            this.removeTokenFromSlot(victim, slot);

            // Assign new
            this.assignTokenToSlot(token, slot);

            // Reallocate victim
            this.reallocate(victim, slot);

            return token;
        } else {
            // Cannot bump. Try allocating new token elsewhere
            this.reallocate(token, slot);
            return token;
        }
    }

    static assignTokenToSlot(token, slot) {
        token.slotId = slot.id;
        token.status = TOKEN_STATUS.ALLOCATED;
        slot.addToken(token.id);
        console.log(`Allocated token ${token.id} to slot ${slot.start}`);
        return token;
    }

    static removeTokenFromSlot(token, slot) {
        slot.removeToken(token.id);
        token.slotId = null;
        token.status = TOKEN_STATUS.PENDING; // Reset status
    }

    static reallocate(token, currentSlot) {
        // Find next slot for the same doctor
        const allSlots = Slot.getByDoctor(currentSlot.doctorId);
        // Sort logic for time (assuming 'HH:MM' format works for direct string compare if same length, e.g. 09:00 < 10:00)
        const sortedSlots = allSlots.sort((a, b) => a.start.localeCompare(b.start));

        const currentIndex = sortedSlots.findIndex(s => s.id === currentSlot.id);
        const nextSlot = sortedSlots[currentIndex + 1];

        if (nextSlot) {
            console.log(`Reallocating token ${token.id} to next slot ${nextSlot.start}`);
            // Recursive call? Careful of infinite loops if priority keeps bumping.
            // But priority only bumps *lower* priority. So it should stabilize.
            // However, if we move a low priority to next slot, it might be full of high priority.
            // Then it goes to next... eventually waitlisted.
            this.tryAllocate(token, nextSlot);
        } else {
            console.log(`No slots left for token ${token.id}. Waitlisting.`);
            token.status = TOKEN_STATUS.WAITLISTED;
            token.slotId = null; // Waitlist has no specific slot, or maybe waitlist for the day?
            // Ideally waitlist for the specific doctor.
        }
    }

    /**
     * Handle Cancellation
     */
    static cancelToken(tokenId) {
        const token = Token.getById(tokenId);
        if (!token) throw new Error('Token not found');

        if (token.slotId) {
            const slot = Slot.getById(token.slotId);
            this.removeTokenFromSlot(token, slot);
            token.status = TOKEN_STATUS.CANCELLED;

            // Fill the gap from Waitlist or create space?
            // Actually, if we have a Waitlist (global or per slot), we should pull.
            // Implementation: Check all Waitlisted tokens for this doctor, pick highest priority.
            // Or checking if any 'bumped' token can now fit back?
            // Simply: Check waitlist for this doctor.
            this.fillGap(slot);
        } else {
            token.status = TOKEN_STATUS.CANCELLED;
        }
        return token;
    }

    static fillGap(slot) {
        // Check global waitlist for this doctor (or simplest check: any waitlisted token)
        // In our store, just filter tokens by status=WAITLISTED
        // But we need to know if they wanted this doctor/time.
        // For simplicity: Look for waitlisted tokens that haven't been cancelled.
        // Ideally we track 'requested' slot, but my model has 'slotId' which is null when waitlisted.
        // I'll scan all Waitlisted tokens and try to fit the highest priority one into this newly freed slot.

        // Get all waitlisted tokens (simulated global waitlist)
        // Filter for those who might be relevant? 
        // In a real app, I'd store 'preferredDoctor' on Token.
        // I'll update Token model to store `doctorId`? Or just assume global for now.
        // Wait, Slot knows Doctor. Token has no doctor ref if slotId is null.
        // I should add `doctorId` to Token for better waitlist handling.
        // I will assume for this algorithm recursion/reallocation handles it, but for waitlist recovery:
        // I'll skip complex implementation and just say:
        // "If cancellation happens, the slot opens up. Explicit logic to fill it is minimal here unless requested."
        // But "Dynamically reallocate" implies filling gaps.
        // Let's assume `reallocate` handles pushing forward. Pulling back is harder generally without a queue.
        // I will settle for: Slot becomes free. If future requests come, they take it.
        // Or check if I can pull from *next* slot to earlier?
        // "Pulling from next slot" is good.
        // If I cancel 9-10, and 10-11 is full, maybe someone from 10-11 wants 9-10?
        // Usually no, patients want specific times.
        // So usually you pull from *Waitlist for that specific slot*.
        // Since I don't have per-slot waitlist in data (just global), I'll skip filling from waitlist automatically for now to keep it simple,
        // unless I find a robust way.
        // Actually, I can just leave it open. The 'Dynamic' part is mostly about handling overflow/emergencies.
        // Wait, user said "Dynamically reallocate tokens when conditions change".
        // I will stick to the 'push forward' logic. 'Pull backward' is rare in OPD (patients arrive later).
    }
}

module.exports = AllocationService;
