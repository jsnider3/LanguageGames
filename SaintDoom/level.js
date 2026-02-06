// Minimal fallback level container used by LevelFactory
export class Level {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
    }
}
