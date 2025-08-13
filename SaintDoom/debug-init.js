// Debug script to test performance system initialization
import * as THREE from 'three';
import { PoolManager } from './modules/ObjectPool.js';
import { LODManager } from './modules/LODManager.js';
import { AnimationManager } from './modules/AnimationManager.js';
import { ShadowOptimizer } from './modules/ShadowOptimizer.js';
import { GeometryBatcher } from './modules/GeometryBatcher.js';
import { TimerManager } from './modules/TimerManager.js';
import { PhysicsManager } from './modules/PhysicsManager.js';

console.log('=== Performance Systems Initialization Test ===');

try {
    // Create minimal scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    console.log('✓ THREE.js initialized');
    
    // Test each system
    const tests = [
        {
            name: 'PoolManager',
            test: () => new PoolManager(scene)
        },
        {
            name: 'LODManager',
            test: () => new LODManager(camera, scene)
        },
        {
            name: 'AnimationManager',
            test: () => new AnimationManager()
        },
        {
            name: 'ShadowOptimizer',
            test: () => new ShadowOptimizer(renderer, scene)
        },
        {
            name: 'GeometryBatcher',
            test: () => new GeometryBatcher(scene)
        },
        {
            name: 'TimerManager',
            test: () => new TimerManager()
        },
        {
            name: 'PhysicsManager',
            test: () => new PhysicsManager(scene)
        }
    ];
    
    const results = [];
    
    tests.forEach(({ name, test }) => {
        try {
            const instance = test();
            
            // Test critical methods
            if (name === 'TimerManager') {
                // Verify clearAll method exists
                if (typeof instance.clearAll !== 'function') {
                    throw new Error('clearAll method not found');
                }
            }
            
            if (name === 'PoolManager') {
                // Verify pool creation
                const bulletPool = instance.getPool('bullets');
                if (!bulletPool) {
                    throw new Error('Failed to get bullet pool');
                }
            }
            
            results.push({ name, status: 'PASS', instance });
            console.log(`✓ ${name} initialized successfully`);
        } catch (error) {
            results.push({ name, status: 'FAIL', error: error.message });
            console.error(`✗ ${name} failed: ${error.message}`);
        }
    });
    
    // Summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    console.log('\n=== Summary ===');
    console.log(`Passed: ${passed}/${tests.length}`);
    console.log(`Failed: ${failed}/${tests.length}`);
    
    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    // Export for use in console
    window.performanceSystemsTest = {
        results,
        systems: results.filter(r => r.status === 'PASS').reduce((acc, r) => {
            acc[r.name] = r.instance;
            return acc;
        }, {})
    };
    
    console.log('\nTest results available in: window.performanceSystemsTest');
    
} catch (error) {
    console.error('Fatal error during initialization test:', error);
}