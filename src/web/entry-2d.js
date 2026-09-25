import Phaser from "phaser";

window.Phaser = Phaser;
import levelData from "./data/levels.json";
window.RbaLevelData = levelData;

// These existing game files expose their contracts on window. Keep their
// dependency order until the scene code is extracted into ES modules.
await import("./js/constants.js");
await import("./js/save-data.js");
await import("./js/audio.js");
await import("./js/assets.js");
await import("./js/player.js");
await import("./js/enemies.js");
await import("./js/powerups.js");
await import("./js/depth-enemies.js");
await import("./js/levels.js");
await import("./js/ui.js");
await import("./js/gameplay-depth.js");
await import("./js/game.js");
