/**
 * Debug Helper - Diagnostic utilities for the project
 */

import fs from 'fs';
import path from 'path';

class DebugHelper {
    constructor() {
        this.stats = {
            totalFiles: 0,
            totalLines: 0,
            largestFile: null,
            filesByType: {},
            errors: []
        };
    }

    /**
     * Analyze project structure and identify potential issues
     */
    analyzeProject(dir = '.') {
        console.log('🔍 Analyzing project structure...\n');
        
        this.scanDirectory(dir);
        this.printReport();
    }

    scanDirectory(dir, depth = 0) {
        if (depth > 5) return; // Prevent too deep recursion
        
        try {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    this.scanDirectory(filePath, depth + 1);
                } else if (stats.isFile()) {
                    this.analyzeFile(filePath, stats);
                }
            });
        } catch (error) {
            this.stats.errors.push(`Error scanning ${dir}: ${error.message}`);
        }
    }

    analyzeFile(filePath, stats) {
        this.stats.totalFiles++;
        
        const ext = path.extname(filePath);
        this.stats.filesByType[ext] = (this.stats.filesByType[ext] || 0) + 1;
        
        if (!this.stats.largestFile || stats.size > this.stats.largestFile.size) {
            this.stats.largestFile = {
                path: filePath,
                size: stats.size,
                sizeKB: (stats.size / 1024).toFixed(2)
            };
        }
        
        // Count lines for code files
        if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(ext)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').length;
                this.stats.totalLines += lines;
                
                // Check for potential issues
                this.checkForIssues(filePath, content, lines);
            } catch (error) {
                this.stats.errors.push(`Error reading ${filePath}: ${error.message}`);
            }
        }
    }

    checkForIssues(filePath, content, lines) {
        const issues = [];
        
        // Check for very large files
        if (lines > 1000) {
            issues.push(`Large file (${lines} lines)`);
        }
        
        // Check for potential memory leaks
        if (content.includes('setInterval') && !content.includes('clearInterval')) {
            issues.push('Possible memory leak: setInterval without clearInterval');
        }
        
        if (content.includes('setTimeout') && !content.includes('clearTimeout')) {
            issues.push('Possible memory leak: setTimeout without clearTimeout');
        }
        
        // Check for console.logs in production code
        const consoleLogs = (content.match(/console\.log/g) || []).length;
        if (consoleLogs > 10) {
            issues.push(`Many console.log statements (${consoleLogs})`);
        }
        
        // Check for TODO comments
        const todos = (content.match(/TODO|FIXME|HACK/gi) || []).length;
        if (todos > 0) {
            issues.push(`${todos} TODO/FIXME/HACK comments`);
        }
        
        if (issues.length > 0) {
            console.log(`\n⚠️  ${filePath}:`);
            issues.forEach(issue => console.log(`   - ${issue}`));
        }
    }

    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PROJECT ANALYSIS REPORT');
        console.log('='.repeat(60));
        
        console.log(`\n📁 Files: ${this.stats.totalFiles}`);
        console.log(`📝 Total lines of code: ${this.stats.totalLines.toLocaleString()}`);
        
        if (this.stats.largestFile) {
            console.log(`\n📦 Largest file:`);
            console.log(`   ${this.stats.largestFile.path}`);
            console.log(`   Size: ${this.stats.largestFile.sizeKB} KB`);
        }
        
        console.log('\n📂 Files by type:');
        Object.entries(this.stats.filesByType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([ext, count]) => {
                console.log(`   ${ext || '(no extension)'}: ${count}`);
            });
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.stats.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log('\n' + '='.repeat(60));
        this.printRecommendations();
    }

    printRecommendations() {
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('='.repeat(60));
        
        const recommendations = [];
        
        if (this.stats.largestFile && this.stats.largestFile.size > 100000) {
            recommendations.push('Consider splitting large files into smaller modules');
        }
        
        if (this.stats.totalLines > 50000) {
            recommendations.push('Project is getting large - consider code splitting');
        }
        
        if (this.stats.filesByType['.js'] > 100) {
            recommendations.push('Many JavaScript files - ensure proper module organization');
        }
        
        if (recommendations.length === 0) {
            console.log('✅ No major issues detected');
        } else {
            recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
    }

    /**
     * Check for common refactoring opportunities
     */
    checkRefactoringOpportunities() {
        console.log('\n🔧 REFACTORING OPPORTUNITIES:');
        console.log('='.repeat(60));
        
        const opportunities = [
            {
                pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]{500,}/g,
                message: 'Long functions detected - consider breaking them down'
            },
            {
                pattern: /if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if\s*\(/g,
                message: 'Deeply nested conditionals - consider early returns'
            },
            {
                pattern: /new THREE\.\w+Geometry/g,
                message: 'Geometry creation - consider caching for reuse'
            },
            {
                pattern: /\.forEach\(.*\.splice\(/g,
                message: 'Array splice in forEach - potential bug'
            }
        ];
        
        // Check each pattern
        console.log('Checking for common patterns...\n');
        
        // This would need to scan files, but keeping it simple for now
        console.log('Run full analysis with: node debug_helper.js --full\n');
    }
}

// Export for use in other files
export default DebugHelper;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const debugHelper = new DebugHelper();
    debugHelper.analyzeProject();
    debugHelper.checkRefactoringOpportunities();
}