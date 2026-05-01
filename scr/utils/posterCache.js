class PosterCache {
    constructor() {
        this.pendingPosters = new Map();
        this.expiryTime = 5 * 60 * 1000; // 5 минут
    }

    set(userId, data) {
        const posterId = Date.now().toString();
        this.pendingPosters.set(posterId, {
            ...data,
            userId,
            timestamp: Date.now()
        });

        // Авто-удаление через 5 минут
        setTimeout(() => {
            if (this.pendingPosters.has(posterId)) {
                this.pendingPosters.delete(posterId);
            }
        }, this.expiryTime);

        return posterId;
    }

    get(userId) {
        for (let [id, data] of this.pendingPosters.entries()) {
            if (data.userId === userId) {
                this.pendingPosters.delete(id);
                return data;
            }
        }
        return null;
    }

    delete(userId) {
        for (let [id, data] of this.pendingPosters.entries()) {
            if (data.userId === userId) {
                this.pendingPosters.delete(id);
                return true;
            }
        }
        return false;
    }
}

module.exports = new PosterCache();