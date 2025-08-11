import * as THREE from 'three';

export class CombatUtils {
    static calculateDamage(baseDamage, damageType, target, modifiers = {}) {
        let finalDamage = baseDamage;
        
        // Apply damage type multipliers
        if (target && target.resistances) {
            const resistance = target.resistances[damageType] || 0;
            finalDamage *= (1 - resistance);
        }
        
        if (target && target.weaknesses && target.weaknesses.includes(damageType)) {
            finalDamage *= 1.5;
        }
        
        // Apply modifiers
        if (modifiers.criticalHit) {
            finalDamage *= modifiers.criticalMultiplier || 2;
        }
        
        if (modifiers.holyDamage && target && target.type === 'demon') {
            finalDamage *= 1.5;
        }
        
        if (modifiers.distanceFalloff && modifiers.distance) {
            const falloffStart = modifiers.falloffStart || 10;
            const falloffEnd = modifiers.falloffEnd || 30;
            
            if (modifiers.distance > falloffStart) {
                const falloffRange = falloffEnd - falloffStart;
                const falloffProgress = Math.min((modifiers.distance - falloffStart) / falloffRange, 1);
                finalDamage *= (1 - falloffProgress * 0.5);
            }
        }
        
        // Random variance
        if (modifiers.variance) {
            const variance = modifiers.variance || 0.1;
            finalDamage *= (1 - variance + Math.random() * variance * 2);
        }
        
        return Math.round(finalDamage);
    }

    static applyKnockback(entity, direction, force, options = {}) {
        if (!entity || !entity.velocity) return;
        
        const defaults = {
            airborne: false,
            maxVelocity: 20,
            verticalComponent: 0.3
        };
        
        const settings = { ...defaults, ...options };
        
        const knockbackVector = direction.clone().normalize();
        knockbackVector.multiplyScalar(force);
        
        if (settings.airborne) {
            knockbackVector.y = force * settings.verticalComponent;
        }
        
        entity.velocity.add(knockbackVector);
        
        // Clamp velocity
        if (entity.velocity.length() > settings.maxVelocity) {
            entity.velocity.normalize().multiplyScalar(settings.maxVelocity);
        }
        
        // Set knockback state
        if (entity.state) {
            entity.state = 'knockback';
            entity.knockbackEndTime = Date.now() + (settings.duration || 500);
        }
    }

    static checkHitInRadius(position, radius, targets, options = {}) {
        const defaults = {
            friendlyFire: false,
            maxTargets: Infinity,
            ignoreList: [],
            requireLineOfSight: false,
            scene: null
        };
        
        const settings = { ...defaults, ...options };
        const hitTargets = [];
        
        for (const target of targets) {
            if (settings.ignoreList.includes(target)) continue;
            if (!settings.friendlyFire && target.team === settings.attackerTeam) continue;
            if (hitTargets.length >= settings.maxTargets) break;
            
            const targetPos = target.position || target.mesh?.position;
            if (!targetPos) continue;
            
            const distance = position.distanceTo(targetPos);
            if (distance <= radius) {
                // Line of sight check
                if (settings.requireLineOfSight && settings.scene) {
                    if (!this.hasLineOfSight(position, targetPos, settings.scene)) {
                        continue;
                    }
                }
                
                hitTargets.push({
                    target: target,
                    distance: distance,
                    damageMultiplier: 1 - (distance / radius) * 0.5
                });
            }
        }
        
        // Sort by distance
        hitTargets.sort((a, b) => a.distance - b.distance);
        
        return hitTargets;
    }

    static hasLineOfSight(from, to, scene) {
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3().subVectors(to, from).normalize();
        const distance = from.distanceTo(to);
        
        raycaster.set(from, direction);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.distance < distance) {
                // Check if it's a wall or obstacle
                if (intersect.object.userData.blocksLineOfSight !== false) {
                    return false;
                }
            }
        }
        
        return true;
    }

    static performMeleeAttack(attacker, direction, config = {}) {
        const defaults = {
            range: 3,
            arc: Math.PI / 3,
            damage: 50,
            knockback: 10,
            hitAll: false
        };
        
        const settings = { ...defaults, ...config };
        const hits = [];
        
        if (!config.targets) return hits;
        
        const attackerPos = attacker.position || attacker.mesh?.position;
        if (!attackerPos) return hits;
        
        for (const target of config.targets) {
            const targetPos = target.position || target.mesh?.position;
            if (!targetPos) continue;
            
            const distance = attackerPos.distanceTo(targetPos);
            if (distance > settings.range) continue;
            
            // Check if target is within arc
            const toTarget = new THREE.Vector3().subVectors(targetPos, attackerPos).normalize();
            const angle = direction.angleTo(toTarget);
            
            if (angle <= settings.arc / 2) {
                hits.push(target);
                
                // Apply damage
                if (target.takeDamage) {
                    target.takeDamage(settings.damage);
                }
                
                // Apply knockback
                if (settings.knockback > 0) {
                    this.applyKnockback(target, toTarget, settings.knockback);
                }
                
                if (!settings.hitAll) break;
            }
        }
        
        return hits;
    }

    static createProjectile(scene, config = {}) {
        const defaults = {
            position: new THREE.Vector3(),
            direction: new THREE.Vector3(0, 0, 1),
            speed: 20,
            damage: 25,
            lifetime: 5000,
            size: 0.2,
            color: 0xff0000,
            trail: false,
            homing: false,
            explosive: false,
            explosionRadius: 0
        };
        
        const settings = { ...defaults, ...config };
        
        const geometry = new THREE.SphereGeometry(settings.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: settings.color,
            emissive: settings.color,
            emissiveIntensity: 0.5
        });
        const projectile = new THREE.Mesh(geometry, material);
        
        projectile.position.copy(settings.position);
        projectile.userData = {
            type: 'projectile',
            velocity: settings.direction.clone().normalize().multiplyScalar(settings.speed),
            damage: settings.damage,
            lifetime: settings.lifetime,
            birthTime: Date.now(),
            explosive: settings.explosive,
            explosionRadius: settings.explosionRadius,
            owner: settings.owner,
            homing: settings.homing,
            target: settings.target
        };
        
        scene.add(projectile);
        
        // Add trail if requested
        if (settings.trail) {
            this.addProjectileTrail(projectile, scene, settings.color);
        }
        
        return projectile;
    }

    static updateProjectile(projectile, deltaTime, scene, enemies = []) {
        if (!projectile || !projectile.userData) return false;
        
        const data = projectile.userData;
        
        // Check lifetime
        if (Date.now() - data.birthTime > data.lifetime) {
            scene.remove(projectile);
            return false;
        }
        
        // Homing behavior
        if (data.homing && data.target && data.target.position) {
            const targetPos = data.target.position;
            const direction = new THREE.Vector3().subVectors(targetPos, projectile.position).normalize();
            data.velocity.lerp(direction.multiplyScalar(data.velocity.length()), 0.1);
        }
        
        // Update position
        const movement = data.velocity.clone().multiplyScalar(deltaTime / 1000);
        projectile.position.add(movement);
        
        // Check collisions
        for (const enemy of enemies) {
            if (enemy === data.owner) continue;
            
            const enemyPos = enemy.position || enemy.mesh?.position;
            if (!enemyPos) continue;
            
            const distance = projectile.position.distanceTo(enemyPos);
            const hitRadius = enemy.hitRadius || 1;
            
            if (distance < hitRadius) {
                // Hit!
                if (enemy.takeDamage) {
                    enemy.takeDamage(data.damage);
                }
                
                // Explosion
                if (data.explosive && data.explosionRadius > 0) {
                    this.createExplosion(projectile.position, data.explosionRadius, data.damage * 0.5, scene, enemies);
                }
                
                scene.remove(projectile);
                return false;
            }
        }
        
        // Check if out of bounds
        if (projectile.position.y < -10 || projectile.position.y > 100 ||
            projectile.position.length() > 200) {
            scene.remove(projectile);
            return false;
        }
        
        return true;
    }

    static createExplosion(position, radius, damage, scene, targets) {
        const hits = this.checkHitInRadius(position, radius, targets);
        
        hits.forEach(hit => {
            if (hit.target.takeDamage) {
                const explosionDamage = damage * hit.damageMultiplier;
                hit.target.takeDamage(explosionDamage);
            }
            
            // Knockback from explosion
            const direction = new THREE.Vector3()
                .subVectors(hit.target.position || hit.target.mesh.position, position)
                .normalize();
            const force = (1 - hit.distance / radius) * 15;
            this.applyKnockback(hit.target, direction, force, { airborne: true });
        });
        
        return hits;
    }

    static addProjectileTrail(projectile, scene, color) {
        const trailPositions = [];
        const maxTrailLength = 10;
        
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        scene.add(trail);
        
        projectile.userData.trail = trail;
        projectile.userData.trailPositions = trailPositions;
        
        projectile.userData.updateTrail = () => {
            trailPositions.push(projectile.position.clone());
            if (trailPositions.length > maxTrailLength) {
                trailPositions.shift();
            }
            
            if (trailPositions.length > 1) {
                trailGeometry.setFromPoints(trailPositions);
            }
        };
    }

    static applyStatusEffect(target, effectType, config = {}) {
        if (!target.statusEffects) {
            target.statusEffects = new Map();
        }
        
        const defaults = {
            duration: 3000,
            intensity: 1,
            stackable: false,
            maxStacks: 1
        };
        
        const settings = { ...defaults, ...config };
        
        const existingEffect = target.statusEffects.get(effectType);
        
        if (existingEffect && !settings.stackable) {
            // Refresh duration
            existingEffect.endTime = Date.now() + settings.duration;
            existingEffect.intensity = Math.max(existingEffect.intensity, settings.intensity);
        } else if (existingEffect && settings.stackable) {
            // Stack effect
            existingEffect.stacks = Math.min((existingEffect.stacks || 1) + 1, settings.maxStacks);
            existingEffect.endTime = Date.now() + settings.duration;
        } else {
            // New effect
            target.statusEffects.set(effectType, {
                type: effectType,
                startTime: Date.now(),
                endTime: Date.now() + settings.duration,
                intensity: settings.intensity,
                stacks: 1,
                config: settings
            });
        }
        
        // Apply immediate effects
        this.processStatusEffect(target, effectType, settings);
    }

    static processStatusEffect(target, effectType, config) {
        switch (effectType) {
            case 'burning':
                // Damage over time
                if (!target.burningInterval) {
                    target.burningInterval = setInterval(() => {
                        if (target.takeDamage) {
                            target.takeDamage(config.damagePerTick || 5);
                        }
                    }, 500);
                }
                break;
                
            case 'frozen':
                // Slow movement
                if (target.speed) {
                    target.originalSpeed = target.originalSpeed || target.speed;
                    target.speed = target.originalSpeed * (config.slowAmount || 0.3);
                }
                break;
                
            case 'stunned':
                // Disable actions
                target.stunned = true;
                target.canAttack = false;
                target.canMove = false;
                break;
                
            case 'blessed':
                // Damage reduction
                target.damageReduction = (target.damageReduction || 0) + (config.reduction || 0.3);
                break;
                
            case 'corrupted':
                // Reverse healing
                target.healingReversed = true;
                break;
        }
    }

    static updateStatusEffects(target, deltaTime) {
        if (!target.statusEffects) return;
        
        const currentTime = Date.now();
        const expiredEffects = [];
        
        target.statusEffects.forEach((effect, type) => {
            if (currentTime > effect.endTime) {
                expiredEffects.push(type);
            }
        });
        
        // Remove expired effects
        expiredEffects.forEach(type => {
            this.removeStatusEffect(target, type);
        });
    }

    static removeStatusEffect(target, effectType) {
        if (!target.statusEffects) return;
        
        const effect = target.statusEffects.get(effectType);
        if (!effect) return;
        
        // Clean up effect-specific changes
        switch (effectType) {
            case 'burning':
                if (target.burningInterval) {
                    clearInterval(target.burningInterval);
                    target.burningInterval = null;
                }
                break;
                
            case 'frozen':
                if (target.originalSpeed) {
                    target.speed = target.originalSpeed;
                    target.originalSpeed = null;
                }
                break;
                
            case 'stunned':
                target.stunned = false;
                target.canAttack = true;
                target.canMove = true;
                break;
                
            case 'blessed':
                target.damageReduction = Math.max(0, (target.damageReduction || 0) - (effect.config.reduction || 0.3));
                break;
                
            case 'corrupted':
                target.healingReversed = false;
                break;
        }
        
        target.statusEffects.delete(effectType);
    }

    static calculateCriticalChance(attacker, config = {}) {
        let baseCrit = attacker.criticalChance || 0.05;
        
        // Modifiers
        if (config.behindTarget) {
            baseCrit += 0.15;
        }
        
        if (config.targetStunned) {
            baseCrit += 0.25;
        }
        
        if (attacker.holyFocus === 'Righteous Fury') {
            baseCrit += 0.1;
        }
        
        return Math.min(baseCrit, 1);
    }

    static isWeakPoint(hitPoint, target) {
        if (!target.weakPoints) return false;
        
        for (const weakPoint of target.weakPoints) {
            const distance = hitPoint.distanceTo(weakPoint.position);
            if (distance <= weakPoint.radius) {
                return weakPoint;
            }
        }
        
        return false;
    }
}