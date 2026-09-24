/** Versioned profile/run persistence with safe migration from rba_save_data_v1. */
const RbaSaveDefaults = Object.freeze({
    version: 2,
    profile: { unlockedStage: 0, bestScore: 0, bestFireflyCount: 0, settings: {}, tutorialFlags: {} },
    run: { currentStage: 0, score: 0, carriedFireflies: 0, startOfStageFireflies: 0 }
});

const cloneSaveDefaults = () => structuredClone(RbaSaveDefaults);

const StorageManager = {
    KEY: 'rba_save_data_v1',
    migrate(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return cloneSaveDefaults();
        if (Number(raw.version) > RbaSaveDefaults.version) return cloneSaveDefaults();
        const profile = raw.profile ?? raw;
        const run = raw.run ?? {};
        const migrated = {
            version: 2,
            profile: {
                unlockedStage: Math.max(0, Number(profile.unlockedStage) || 0),
                bestScore: Math.max(0, Number(profile.bestScore ?? profile.highScore) || 0),
                bestFireflyCount: Math.max(0, Number(profile.bestFireflyCount ?? profile.totalFireflies) || 0),
                settings: profile.settings && typeof profile.settings === 'object' ? profile.settings : {},
                tutorialFlags: profile.tutorialFlags && typeof profile.tutorialFlags === 'object' ? profile.tutorialFlags : {}
            },
            run: {
                currentStage: Math.max(0, Number(run.currentStage ?? raw.currentStage) || 0),
                score: Math.max(0, Number(run.score ?? raw.score) || 0),
                carriedFireflies: Math.max(0, Number(run.carriedFireflies ?? raw.fireflies) || 0),
                startOfStageFireflies: Math.max(0, Number(run.startOfStageFireflies) || 0)
            }
        };
        // Legacy aliases keep existing scene code compatible during migration.
        migrated.highScore = migrated.profile.bestScore;
        migrated.unlockedStage = migrated.profile.unlockedStage;
        migrated.totalFireflies = migrated.profile.bestFireflyCount;
        return migrated;
    },
    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return this.migrate(raw ? JSON.parse(raw) : null);
        } catch (error) { return cloneSaveDefaults(); }
    },
    save(data = {}) {
        const current = this.load();
        const migrated = this.migrate(current);
        migrated.profile.bestScore = Math.max(current.profile.bestScore, Number(data.score) || 0);
        migrated.profile.bestFireflyCount = Math.max(current.profile.bestFireflyCount, Number(data.fireflies) || 0);
        migrated.profile.unlockedStage = Math.max(current.profile.unlockedStage, Number(data.unlockedStage) || 0);
        migrated.profile.settings = { ...current.profile.settings, ...(data.settings || {}) };
        migrated.profile.tutorialFlags = { ...current.profile.tutorialFlags, ...(data.tutorialFlags || {}) };
        migrated.run = {
            ...current.run,
            currentStage: Math.max(0, Number(data.currentStage ?? current.run.currentStage) || 0),
            score: Math.max(0, Number(data.score ?? current.run.score) || 0),
            carriedFireflies: Math.max(0, Number(data.fireflies ?? current.run.carriedFireflies) || 0),
            startOfStageFireflies: Math.max(0, Number(data.startOfStageFireflies ?? current.run.startOfStageFireflies) || 0)
        };
        try { localStorage.setItem(this.KEY, JSON.stringify(migrated)); } catch (error) {}
        return migrated;
    },
    reset() {
        const fresh = cloneSaveDefaults();
        try { localStorage.setItem(this.KEY, JSON.stringify(fresh)); } catch (error) {}
        return fresh;
    },
    updateHighScore(score) { return this.save({ score }); },
    unlockStage(stageIndex) { return this.save({ unlockedStage: stageIndex }); }
};

window.StorageManager = StorageManager;
