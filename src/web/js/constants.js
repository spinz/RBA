/** Shared movement constants used by the runtime and offline level analysis. */
import physicsData from "../data/physics.json";
window.RbaPhysics = Object.freeze(physicsData);

window.rbaCameraShake = (camera, duration, intensity) => {
    const settings = window.StorageManager?.load().profile.settings || {};
    if (settings.reducedMotion || settings.screenShake === false) return;
    camera.shake(duration, intensity);
};

window.rbaCameraFlash = (camera, duration, red, green, blue) => {
    const settings = window.StorageManager?.load().profile.settings || {};
    if (settings.reducedMotion || settings.reducedFlashing) return;
    camera.flash(duration, red, green, blue);
};
