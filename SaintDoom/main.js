// For now, let's keep it simple and just load the existing index.html structure
// This will be our step-by-step migration approach

// We'll modularize by keeping the existing code working while gradually moving pieces
import { GAME_CONFIG } from './modules/GameConfig.js';
import { AudioManager, GeometryCache, MeshFactory, ParticleSystem, VectorUtils } from './modules/Utils.js';

// Make these available globally until we fully modularize
window.GAME_CONFIG = GAME_CONFIG;
window.AudioManager = AudioManager;
window.GeometryCache = GeometryCache;
window.MeshFactory = MeshFactory;
window.ParticleSystem = ParticleSystem;
window.VectorUtils = VectorUtils;