/**
 * Unified Level Management System
 * Handles level data structure, storage, and loading across all components
 */

class LevelManager {
    constructor() {
        this.storageKey = 'robotGameLevels';
        this.levels = this.loadLevels();
    }

    /**
     * Load all levels from localStorage
     */
    loadLevels() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading levels:', error);
            return {};
        }
    }

    /**
     * Save all levels to localStorage
     */
    saveLevels() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.levels));
            return true;
        } catch (error) {
            console.error('Error saving levels:', error);
            return false;
        }
    }

    /**
     * Create a new level with proper structure
     */
    createLevel(data) {
        const levelId = data.id || Date.now();
        const level = {
            id: levelId,
            name: data.name || `Level ${levelId}`,
            description: data.description || '',
            order: data.order || this.getNextOrder(),
            par: data.par || 10,
            gridData: data.gridData || '',
            startingCode: data.startingCode || this.getDefaultStartingCode(levelId),
            robotOrientation: data.robotOrientation || 'east',
            difficulty: data.difficulty || 'Beginner',
            created: data.created || Date.now(),
            updated: Date.now(),
            published: data.published || false
        };

        this.levels[levelId] = level;
        this.saveLevels();
        return level;
    }

    /**
     * Update an existing level
     */
    updateLevel(levelId, data) {
        if (!this.levels[levelId]) {
            return null;
        }

        const level = this.levels[levelId];
        const updatedLevel = {
            ...level,
            ...data,
            id: levelId, // Prevent ID changes
            created: level.created, // Preserve creation date
            updated: Date.now()
        };

        this.levels[levelId] = updatedLevel;
        this.saveLevels();
        return updatedLevel;
    }

    /**
     * Delete a level
     */
    deleteLevel(levelId) {
        if (this.levels[levelId]) {
            delete this.levels[levelId];
            this.saveLevels();
            return true;
        }
        return false;
    }

    /**
     * Get a specific level
     */
    getLevel(levelId) {
        return this.levels[levelId] || null;
    }

    /**
     * Get all levels sorted by order
     */
    getAllLevels() {
        return Object.values(this.levels).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    /**
     * Get published levels only (for players)
     */
    getPublishedLevels() {
        return this.getAllLevels().filter(level => level.published);
    }

    /**
     * Get next order number for new levels
     */
    getNextOrder() {
        const levels = this.getAllLevels();
        return levels.length > 0 ? Math.max(...levels.map(l => l.order || 0)) + 1 : 1;
    }

    /**
     * Validate level data
     */
    validateLevel(level) {
        const errors = [];
        
        if (!level.name || level.name.trim() === '') {
            errors.push('Level name is required');
        }
        
        if (!level.par || level.par < 1) {
            errors.push('Par score must be at least 1');
        }
        
        if (!level.order || level.order < 1) {
            errors.push('Order must be at least 1');
        }
        
        if (!level.gridData || level.gridData.trim() === '') {
            errors.push('Grid data is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Parse grid CSV data into structured format
     */
    parseGridCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const board = [];
        const gates = [];
        const keys = [];
        let gridSize = 0;

        lines.forEach(line => {
            const [x, y, type, color] = line.split(',').map(s => s.trim());
            const xNum = parseInt(x);
            const yNum = parseInt(y);
            
            if (isNaN(xNum) || isNaN(yNum) || !type) return;
            
            gridSize = Math.max(gridSize, xNum + 1, yNum + 1);
            
            if (type === 'gate') {
                gates.push({ x: xNum, y: yNum, color: color || '#000000' });
            } else if (type === 'key') {
                keys.push({ x: xNum, y: yNum, color: color || '#FFD700' });
            } else {
                // Regular board cell
                if (!board[yNum]) board[yNum] = [];
                board[yNum][xNum] = { type, color: color || '' };
            }
        });

        return {
            board,
            gates,
            keys,
            gridSize,
            tileCount: lines.filter(line => {
                const [, , type] = line.split(',');
                return type && type !== 'gate' && type !== 'key';
            }).length,
            keyCount: keys.length,
            gateCount: gates.length
        };
    }

    /**
     * Validate grid CSV data
     */
    validateGridCSV(csvData) {
        try {
            const parsed = this.parseGridCSV(csvData);
            const errors = [];
            
            if (parsed.gridSize < 5 || parsed.gridSize > 20) {
                errors.push(`Grid size must be between 5x5 and 20x20, got ${parsed.gridSize}x${parsed.gridSize}`);
            }
            
            if (parsed.tileCount === 0) {
                errors.push('Grid must contain at least one tile');
            }

            return {
                valid: errors.length === 0,
                errors: errors,
                ...parsed
            };
        } catch (error) {
            return {
                valid: false,
                errors: ['Invalid CSV format: ' + error.message]
            };
        }
    }

    /**
     * Get default starting code for a level
     */
    getDefaultStartingCode(levelId) {
        return `# Level ${levelId}: Robot Code
# Write your robot commands here
# Available commands:
# bot.move_forward()  - Move robot forward
# bot.move_backward() - Move robot backward  
# bot.turn_right()    - Turn robot right
# bot.turn_left()     - Turn robot left
# bot.can_move()      - Check if robot can move forward

# Example:
for i in range(10):
    if bot.can_move():
        bot.move_forward()
    else:
        bot.turn_right()`;
    }

    /**
     * Convert level to testing format
     */
    toTestingFormat(level) {
        return {
            id: level.id,
            title: level.name,
            description: level.description,
            par: level.par,
            difficulty: level.difficulty,
            board: level.gridData,
            startingCode: level.startingCode,
            order: level.order
        };
    }

    /**
     * Convert testing format to level format
     */
    fromTestingFormat(testingLevel) {
        return {
            id: testingLevel.id,
            name: testingLevel.title,
            description: testingLevel.description,
            par: testingLevel.par,
            difficulty: testingLevel.difficulty,
            gridData: testingLevel.board,
            startingCode: testingLevel.startingCode,
            order: testingLevel.order || 1
        };
    }
}

// Create global instance
window.LevelManager = new LevelManager();
