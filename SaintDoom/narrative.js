// Narrative System for SaintDoom
// Handles story progression, dialogue, and lore integration

export class NarrativeSystem {
    constructor(game) {
        this.game = game;
        this.currentChapter = 0;
        this.currentObjective = '';
        this.collectedLore = [];
        this.giovanniMemories = 0;
        this.isIntroComplete = false;
        
        // Story flags
        this.flags = {
            firstDemonKill: false,
            firstWeaponPickup: false,
            firstResurrection: true,
            metBelial: false,
            discoveredPortal: false
        };
        
        // Giovanni's voice lines
        this.voiceLines = {
            resurrection: [
                "Seven times called, seven times I answer. What year is it now?",
                "The cold of resurrection... it never gets easier.",
                "Heaven was so close... and yet here I am again."
            ],
            combat: [
                "Same demons, different century.",
                "You'd think they'd learn by now.",
                "I've died before. Death is merely an inconvenience now.",
                "In nomine Patris... *slash*"
            ],
            lowHealth: [
                "Not my first death, won't be my last.",
                "The pain reminds me I still serve.",
                "Lord, grant me strength for one more swing."
            ],
            demonKill: [
                "Return to the pit.",
                "Tell them Giovanni sends you. Again.",
                "Eight centuries of practice.",
                "Deus Vult, as we used to say."
            ],
            findWeapon: [
                "Still using the Mark VI blessing. Good.",
                "Modern tools, ancient purpose.",
                "The tools change, the mission remains."
            ],
            findLore: [
                "Another piece of the puzzle.",
                "The truth is always darker than they tell us.",
                "History repeats, and I'm always there to see it."
            ]
        };
        
        // Environmental story elements
        this.environmentalStories = {
            prayerCorpses: "MIB agents died in prayer positions - they knew what they unleashed.",
            crossBullets: "Bullet holes form a cross pattern - someone's desperate last stand.",
            bloodLatin: "Blood message on wall switches between English and Latin: 'God help us / Deus auxilium'",
            alienGrey: "Grey corpse arranged in angel wing pattern - they tried to warn us.",
            demonCircle: "Summoning circle drawn in mixed blood and alien fluid.",
            holyWater: "Spilled holy water still steams where demons walked."
        };
    }
    
    async startIntroSequence() {
        // Create intro overlay
        const introContainer = document.createElement('div');
        introContainer.id = 'introSequence';
        introContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            color: white;
            font-family: 'Garamond', serif;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 1;
            transition: opacity 2s;
        `;
        
        document.body.appendChild(introContainer);
        
        // Add skip button
        const skipButton = document.createElement('div');
        skipButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            cursor: pointer;
            font-size: 14px;
            z-index: 10001;
            transition: all 0.3s;
        `;
        skipButton.innerHTML = 'Press SPACE or click here to skip';
        skipButton.onclick = () => this.skipIntro = true;
        document.body.appendChild(skipButton);
        
        // Add keyboard listener for skip
        const handleSkip = (e) => {
            if (e.code === 'Space') {
                this.skipIntro = true;
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleSkip);
        
        // Intro sequence stages
        const introStages = [
            {
                text: "Vatican Black Site - Sublevel 7",
                subtext: "Protocol Lazarus Initiated",
                duration: 3000
            },
            {
                text: "Year 2025",
                subtext: "82 years since last resurrection",
                duration: 3000
            },
            {
                text: "You are Saint Giovanni di Ferrara",
                subtext: "Died 1248. First resurrection 1347.",
                duration: 3000
            },
            {
                text: "The Americans opened a portal to Hell.",
                subtext: "They didn't listen to our warnings. They never do.",
                duration: 3000
            },
            {
                text: "Your mission:",
                subtext: "Close the portal. Save what souls remain.",
                duration: 3000
            }
        ];
        
        // Play through intro stages (or skip if requested)
        this.skipIntro = false;
        for (const stage of introStages) {
            if (this.skipIntro) break;
            await this.displayIntroStage(introContainer, stage);
        }
        
        // Clean up
        window.removeEventListener('keydown', handleSkip);
        skipButton.remove();
        
        // Fade out and remove
        introContainer.style.opacity = '0';
        await this.delay(this.skipIntro ? 500 : 2000);
        introContainer.remove();
        
        this.isIntroComplete = true;
        this.playVoiceLine('resurrection');
        // Don't override objectives that were already set by the current level (e.g. tutorial steps).
        if (!this.currentObjective) {
            this.setObjective("Find the desecrated chapel");
        }
    }
    
    displayIntroStage(container, stage) {
        return new Promise(resolve => {
            container.innerHTML = `
                <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(255,0,0,0.3);">
                    ${stage.text}
                </h1>
                <p style="font-size: 24px; color: #ccc; font-style: italic;">
                    ${stage.subtext}
                </p>
            `;
            
            // Check for skip every 100ms instead of waiting full duration
            let elapsed = 0;
            const checkInterval = setInterval(() => {
                elapsed += 100;
                if (this.skipIntro || elapsed >= stage.duration) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    playVoiceLine(category) {
        const lines = this.voiceLines[category];
        if (!lines || lines.length === 0) return;
        
        const line = lines[Math.floor(Math.random() * lines.length)];
        this.displaySubtitle(line);
        
        // TODO: Play actual audio when audio system is implemented
        console.log(`Giovanni: "${line}"`);
    }
    
    displaySubtitle(text) {
        // Remove existing subtitle if any
        const existing = document.getElementById('subtitle');
        if (existing) existing.remove();
        
        const subtitle = document.createElement('div');
        subtitle.id = 'subtitle';
        subtitle.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 20px;
            font-family: 'Garamond', serif;
            text-shadow: 2px 2px 4px black;
            background: rgba(0,0,0,0.7);
            padding: 10px 20px;
            border: 1px solid rgba(255,215,0,0.3);
            z-index: 1000;
            max-width: 600px;
            text-align: center;
        `;
        subtitle.textContent = text;
        document.body.appendChild(subtitle);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (subtitle.parentNode) {
                subtitle.style.opacity = '0';
                subtitle.style.transition = 'opacity 1s';
                setTimeout(() => subtitle.remove(), 1000);
            }
        }, 4000);
    }
    
    setObjective(objective) {
        this.currentObjective = objective;
        this.updateObjectiveDisplay();
    }
    
    updateObjectiveDisplay() {
        let objectiveEl = document.getElementById('objective');
        if (!objectiveEl) {
            objectiveEl = document.createElement('div');
            objectiveEl.id = 'objective';
            objectiveEl.style.cssText = `
                position: fixed;
                top: 140px;
                right: 20px;
                color: white;
                font-size: 14px;
                font-family: 'Courier New', monospace;
                text-shadow: 2px 2px 4px black;
                background: rgba(0,0,0,0.7);
                padding: 10px;
                border-left: 3px solid gold;
                z-index: 99;
                max-width: 250px;
                pointer-events: none;
            `;
            document.body.appendChild(objectiveEl);
        }
        
        objectiveEl.innerHTML = `
            <div style="color: gold; margin-bottom: 5px; font-size: 12px;">OBJECTIVE</div>
            <div style="font-size: 13px;">${this.currentObjective}</div>
        `;
    }
    
    onEnemyKilled(enemyType) {
        if (!this.flags.firstDemonKill && enemyType.includes('demon')) {
            this.flags.firstDemonKill = true;
            this.playVoiceLine('demonKill');
            this.addLoreEntry('First Contact', 'The demons are here. Just like Florence, 1347.');
        } else if (Math.random() < 0.3) {
            this.playVoiceLine('demonKill');
        }
    }
    
    onWeaponPickup(weaponName) {
        if (!this.flags.firstWeaponPickup) {
            this.flags.firstWeaponPickup = true;
            this.playVoiceLine('findWeapon');
        }
    }
    
    onLowHealth() {
        if (Math.random() < 0.5) {
            this.playVoiceLine('lowHealth');
        }
    }
    
    addLoreEntry(title, text) {
        const entry = { title, text, timestamp: Date.now() };
        this.collectedLore.push(entry);
        
        // Display notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            border: 1px solid gold;
            color: white;
            padding: 15px;
            font-family: 'Garamond', serif;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.5s;
        `;
        notification.innerHTML = `
            <div style="color: gold; margin-bottom: 5px;">LORE DISCOVERED</div>
            <div style="font-weight: bold;">${title}</div>
            <div style="font-size: 14px; color: #ccc; margin-top: 5px;">${text}</div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 1s';
            setTimeout(() => notification.remove(), 1000);
        }, 5000);
    }
    
    checkEnvironmentalStory(position) {
        // Check if player is near any environmental story elements
        // This would be called from the game loop with player position
        // Returns story text if near an undiscovered element
    }
    
    advanceChapter() {
        this.currentChapter++;
        
        const chapters = [
            { title: "Resurrection", objective: "Find the desecrated chapel" },
            { title: "Into the Depths", objective: "Reach the armory" },
            { title: "Underground Nightmare", objective: "Navigate the tunnels" },
            { title: "Ascension", objective: "Reach the observatory" },
            { title: "Final Confrontation", objective: "Close the portal" }
        ];
        
        if (this.currentChapter < chapters.length) {
            const chapter = chapters[this.currentChapter];
            this.setObjective(chapter.objective);
            this.displayChapterTitle(chapter.title);
        }
    }
    
    displayChapterTitle(title) {
        const chapterDisplay = document.createElement('div');
        chapterDisplay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 48px;
            font-family: 'Garamond', serif;
            text-shadow: 3px 3px 6px black;
            z-index: 1000;
            text-align: center;
            opacity: 0;
            animation: fadeInOut 4s;
        `;
        chapterDisplay.innerHTML = `
            <div style="font-size: 24px; color: gold; margin-bottom: 10px;">Chapter ${this.currentChapter}</div>
            <div>${title}</div>
        `;
        document.body.appendChild(chapterDisplay);
        
        setTimeout(() => chapterDisplay.remove(), 4000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);
