class RobotTester {
    constructor() {
        this.canvas = document.getElementById('simulationBoard');
        this.ctx = this.canvas.getContext('2d');
        this.codeEditor = document.getElementById('codeEditor');
        this.outputPanel = document.getElementById('outputPanel');
        this.robotInfo = document.getElementById('robotInfo');
        this.statusText = document.getElementById('statusText');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.gridSizeSelect = document.getElementById('gridSizeSelect');
        this.resizeGridBtn = document.getElementById('resizeGridBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.helpDropdown = document.getElementById('helpDropdown');
        this.closeHelpBtn = document.getElementById('closeHelp');
        
        // Level system elements
        this.levelSelect = document.getElementById('levelSelect');
        this.loadLevelBtn = document.getElementById('loadLevelBtn');
        this.levelInfo = document.getElementById('levelInfo');
        this.levelTitle = document.getElementById('levelTitle');
        this.levelDescription = document.getElementById('levelDescription');
        this.parScore = document.getElementById('parScore');
        this.completionIndicator = document.getElementById('completionIndicator');
        this.levelProgressBar = document.getElementById('levelProgressBar');
        this.commandsUsed = document.getElementById('commandsUsed');
        this.parCommands = document.getElementById('parCommands');
        
        // Level tracking
        this.currentLevel = null;
        this.levelCompletion = JSON.parse(localStorage.getItem('levelCompletion') || '{}');
        
        // Initialize level manager
        this.levelManager = window.LevelManager || new LevelManager();
        
        // Board data
        this.board = [];
        this.gates = [];
        this.keys = [];
        this.gridSize = 15;
        this.cellSize = 30;
        
        // Robot state
        this.robot = {
            x: 0,
            y: 0,
            direction: 'north', // north, east, south, west
            commandsExecuted: 0,
            isMoving: false,
            keys: [] // Array of collected keys with their colors
        };
        
        // Animation
        this.animationSpeed = 500; // milliseconds
        this.isRunning = false;
        this.commandQueue = [];
        this.currentCommand = 0;
        
        this.setupEventListeners();
        this.updateSpeedDisplay();
        this.populateLevelSelector();
        this.checkForLevelParameter();
        this.drawEmptyBoard();
    }

    populateLevelSelector() {
        // Clear existing options except custom
        while (this.levelSelect.children.length > 1) {
            this.levelSelect.removeChild(this.levelSelect.lastChild);
        }
        
        // Add levels from level manager
        const levels = this.levelManager.getAllLevels();
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = `${level.name} (Order: ${level.order})`;
            this.levelSelect.appendChild(option);
        });
    }

    checkForLevelParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const levelId = urlParams.get('level');
        if (levelId) {
            this.levelSelect.value = levelId;
            this.loadLevel();
        }
    }

    // Level definitions (fallback if no levels from editor)
    getLevelDefinitions() {
        const editorLevels = this.levelManager.getAllLevels();
        if (editorLevels.length > 0) {
            // Convert editor format to testing format
            const convertedLevels = {};
            editorLevels.forEach(level => {
                convertedLevels[level.id] = this.levelManager.toTestingFormat(level);
            });
            return convertedLevels;
        }
        
        // Fallback to default levels
        return {
            1: {
                title: "Level 1: Simple Square",
                description: "Move in a square pattern using loops",
                par: 8,
                board: this.createLevel1Board(),
                startingCode: `# Level 1: Simple Square
# Move in a square pattern
for i in range(4):
    bot.move_forward()
    bot.move_forward()
    bot.turn_right()`
            },
            2: {
                title: "Level 2: Obstacle Course",
                description: "Navigate around obstacles using conditional logic",
                par: 12,
                board: this.createLevel2Board(),
                startingCode: `# Level 2: Obstacle Course
# Navigate around obstacles
for i in range(20):
    if bot.can_move():
        bot.move_forward()
    else:
        bot.turn_right()
        if bot.can_move():
            bot.move_forward()`
            },
            3: {
                title: "Level 3: Key Collection",
                description: "Collect keys and reach the ending zone",
                par: 15,
                board: this.createLevel3Board(),
                startingCode: `# Level 3: Key Collection
# Collect keys and reach the end
for i in range(30):
    if bot.can_move():
        bot.move_forward()
    else:
        bot.turn_right()`
            },
            4: {
                title: "Level 4: Gate Challenge",
                description: "Use keys to open gates and navigate the maze",
                par: 20,
                board: this.createLevel4Board(),
                startingCode: `# Level 4: Gate Challenge
# Collect keys and open gates
for i in range(40):
    if bot.can_move():
        bot.move_forward()
    elif bot.x < 5:
        bot.turn_right()
    else:
        bot.turn_left()`
            },
            5: {
                title: "Level 5: Maze Runner",
                description: "Navigate a complex maze with multiple paths",
                par: 25,
                board: this.createLevel5Board(),
                startingCode: `# Level 5: Maze Runner
# Navigate the complex maze
for i in range(50):
    if bot.can_move():
        bot.move_forward()
    else:
        bot.turn_right()
        if not bot.can_move():
            bot.turn_right()
            bot.turn_right()`
            },
            6: {
                title: "Level 6: Spiral Challenge",
                description: "Create a spiral pattern using nested loops",
                par: 18,
                board: this.createLevel6Board(),
                startingCode: `# Level 6: Spiral Challenge
# Create a spiral pattern
for i in range(4):
    for j in range(i + 1):
        if bot.can_move():
            bot.move_forward()
    bot.turn_right()`
            },
            7: {
                title: "Level 7: Complex Navigation",
                description: "Multi-objective challenge with keys, gates, and obstacles",
                par: 30,
                board: this.createLevel7Board(),
                startingCode: `# Level 7: Complex Navigation
# Multi-objective challenge
for i in range(60):
    if bot.can_move():
        bot.move_forward()
    elif bot.keys > 0:
        bot.turn_left()
    else:
        bot.turn_right()`
            },
            8: {
                title: "Level 8: Master Challenge",
                description: "Ultimate challenge combining all concepts",
                par: 35,
                board: this.createLevel8Board(),
                startingCode: `# Level 8: Master Challenge
# Ultimate challenge
for i in range(80):
    if bot.can_move():
        bot.move_forward()
    elif bot.x == 0 or bot.y == 0:
        bot.turn_right()
    else:
        bot.turn_left()`
            }
        };
    }

    setupEventListeners() {
        // Code controls
        document.getElementById('runCode').addEventListener('click', () => {
            this.runCode();
        });

        document.getElementById('resetRobot').addEventListener('click', () => {
            this.resetRobot();
        });

        document.getElementById('uploadBoard').addEventListener('click', () => {
            document.getElementById('boardFileInput').click();
        });

        document.getElementById('saveCode').addEventListener('click', () => {
            this.saveCode();
        });

        // File inputs
        document.getElementById('boardFileInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadBoardFile(e.target.files[0]);
            }
        });

        document.getElementById('codeFileInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadCodeFile(e.target.files[0]);
            }
        });

        // Speed control
        this.speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = 1100 - (e.target.value * 100); // 100ms to 1000ms
            this.updateSpeedDisplay();
        });

        // Grid size control
        this.resizeGridBtn.addEventListener('click', () => {
            this.resizeGrid();
        });

        // Level system
        this.loadLevelBtn.addEventListener('click', () => {
            this.loadLevel();
        });

        // Help dropdown control
        this.helpBtn.addEventListener('click', () => {
            this.toggleHelpDropdown();
        });

        this.closeHelpBtn.addEventListener('click', () => {
            this.hideHelpDropdown();
        });

        // Close help dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.helpBtn.contains(e.target) && !this.helpDropdown.contains(e.target)) {
                this.hideHelpDropdown();
            }
        });

        // Example button handlers
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codeType = e.target.dataset.code;
                this.loadExampleCode(codeType);
            });
        });

        // Tab indentation support for code editor
        this.codeEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault(); // Prevent default tab behavior (focus change)
                
                const start = this.codeEditor.selectionStart;
                const end = this.codeEditor.selectionEnd;
                const value = this.codeEditor.value;
                
                // Insert tab character at cursor position
                const newValue = value.substring(0, start) + '    ' + value.substring(end);
                this.codeEditor.value = newValue;
                
                // Set cursor position after the inserted tab
                const newPosition = start + 4;
                this.codeEditor.setSelectionRange(newPosition, newPosition);
            }
        });
    }

    updateSpeedDisplay() {
        this.speedValue.textContent = this.speedSlider.value;
    }

    toggleHelpDropdown() {
        if (this.helpDropdown.style.display === 'none' || this.helpDropdown.style.display === '') {
            this.showHelpDropdown();
        } else {
            this.hideHelpDropdown();
        }
    }

    showHelpDropdown() {
        this.helpDropdown.style.display = 'block';
        this.helpBtn.style.background = '#F57C00'; // Darker when active
    }

    hideHelpDropdown() {
        this.helpDropdown.style.display = 'none';
        this.helpBtn.style.background = '#FF9800'; // Back to normal color
    }

    loadExampleCode(codeType) {
        let code = '';
        
        switch (codeType) {
            case 'square':
                code = `# Square movement pattern
for i in range(4):
    if bot.can_move():
        bot.move_forward()
    bot.turn_right()`;
                break;
            case 'spiral':
                code = `# Spiral pattern
for i in range(2):
    for j in range(i + 1):
        bot.move_forward()
    bot.turn_right()`;
                break;
            case 'zigzag':
                code = `# Zigzag pattern
for i in range(4):
    bot.move_forward()
    bot.move_forward()
    if i % 2 == 0:
        bot.turn_right()
        bot.move_forward()
        bot.turn_right()
    else:
        bot.turn_left()
        bot.move_forward()
        bot.turn_left()`;
                break;
            case 'gate':
                code = `# Gate and key example with proper if-elif-else
# Move forward while checking for obstacles and gates
for i in range(10):
    if bot.can_move():
        bot.move_forward()
    elif bot.x < 5:
        # Try turning right when at left edge
        bot.turn_right()
        if bot.can_move():
            bot.move_forward()
    else:
        # Try turning left as last resort
        bot.turn_left()
        if bot.can_move():
            bot.move_forward()`;
                break;
            case 'conditional_test':
                code = `# Simple conditional test
if bot.can_move():
    bot.move_forward()
else:
    bot.turn_right()

if bot.x == 0:
    bot.move_forward()
elif bot.x == 1:
    bot.turn_left()
else:
    bot.turn_right()`;
                break;
        }
        
        if (code) {
            this.codeEditor.value = code;
            this.logOutput(`Loaded ${codeType} example code`, 'success');
            this.hideHelpDropdown();
        }
    }

    // Level system methods
    loadLevel() {
        const selectedLevel = this.levelSelect.value;
        
        if (selectedLevel === 'custom') {
            this.hideLevelInfo();
            return;
        }
        
        const levelDef = this.getLevelDefinitions()[selectedLevel];
        if (!levelDef) return;
        
        this.currentLevel = selectedLevel;
        this.parseBoardCSV(levelDef.board);
        this.codeEditor.value = levelDef.startingCode;
        this.showLevelInfo(levelDef);
        this.resetRobot();
        
        this.logOutput(`Loaded ${levelDef.title}`, 'success');
    }

    showLevelInfo(levelDef) {
        this.levelInfo.style.display = 'block';
        this.levelTitle.textContent = levelDef.title;
        this.levelDescription.textContent = levelDef.description;
        this.parScore.textContent = levelDef.par;
        this.parCommands.textContent = levelDef.par;
        
        // Update completion indicator
        const completion = this.levelCompletion[this.currentLevel];
        if (completion) {
            if (completion.commands <= levelDef.par) {
                this.completionIndicator.innerHTML = '⭐';
                this.completionIndicator.className = 'completion-indicator star';
            } else {
                this.completionIndicator.innerHTML = '✓';
                this.completionIndicator.className = 'completion-indicator checkmark';
            }
        } else {
            this.completionIndicator.innerHTML = '';
            this.completionIndicator.className = 'completion-indicator';
        }
        
        this.updateLevelProgress();
    }

    hideLevelInfo() {
        this.levelInfo.style.display = 'none';
        this.currentLevel = null;
    }

    updateLevelProgress() {
        if (!this.currentLevel) return;
        
        const levelDef = this.getLevelDefinitions()[this.currentLevel];
        const commandsUsed = this.robot.commandsExecuted;
        const progress = Math.min((commandsUsed / levelDef.par) * 100, 100);
        
        this.commandsUsed.textContent = commandsUsed;
        this.levelProgressBar.style.width = `${progress}%`;
        
        // Check for level completion
        const currentCell = this.board[this.robot.y] && this.board[this.robot.y][this.robot.x];
        if (currentCell && currentCell.type === 'ending') {
            this.completeLevel(commandsUsed);
        }
    }

    completeLevel(commandsUsed) {
        const levelDef = this.getLevelDefinitions()[this.currentLevel];
        const previousBest = this.levelCompletion[this.currentLevel];
        
        if (!previousBest || commandsUsed < previousBest.commands) {
            this.levelCompletion[this.currentLevel] = {
                commands: commandsUsed,
                completed: true,
                timestamp: Date.now()
            };
            localStorage.setItem('levelCompletion', JSON.stringify(this.levelCompletion));
            
            // Update level in level editor
            this.updateLevelInEditor(commandsUsed);
            
            // Call the global progress tracking function if it exists
            if (typeof window.recordLevelCompletion === 'function') {
                window.recordLevelCompletion(this.currentLevel, commandsUsed);
            }
            
            if (commandsUsed <= levelDef.par) {
                this.logOutput(`🎉 Level completed in ${commandsUsed} commands! ⭐ STAR! (Par: ${levelDef.par})`, 'success');
            } else {
                this.logOutput(`🎉 Level completed in ${commandsUsed} commands! ✓ (Par: ${levelDef.par})`, 'success');
            }
            
            this.showLevelInfo(levelDef);
        }
    }

    updateLevelInEditor(commandsUsed) {
        // Update player progress
        const playerProgress = JSON.parse(localStorage.getItem('playerProgress') || '{}');
        if (!playerProgress[this.currentLevel]) {
            playerProgress[this.currentLevel] = {};
        }
        
        playerProgress[this.currentLevel].completed = true;
        if (!playerProgress[this.currentLevel].bestScore || commandsUsed < playerProgress[this.currentLevel].bestScore) {
            playerProgress[this.currentLevel].bestScore = commandsUsed;
        }
        playerProgress[this.currentLevel].lastPlayed = Date.now();
        
        localStorage.setItem('playerProgress', JSON.stringify(playerProgress));
    }

    resizeGrid() {
        const newSize = parseInt(this.gridSizeSelect.value);
        if (newSize !== this.gridSize) {
            this.gridSize = newSize;
            this.logOutput(`Grid resized to ${this.gridSize}x${this.gridSize}`, 'info');
            
            // Clear board data that's outside the new grid
            this.board = this.board.slice(0, this.gridSize).map(row => row ? row.slice(0, this.gridSize) : []);
            
            // Remove gates and keys outside the new grid
            this.gates = this.gates.filter(gate => gate.x < this.gridSize && gate.y < this.gridSize);
            this.keys = this.keys.filter(key => key.x < this.gridSize && key.y < this.gridSize);
            
            // Ensure robot is within bounds
            this.robot.x = Math.min(this.robot.x, this.gridSize - 1);
            this.robot.y = Math.min(this.robot.y, this.gridSize - 1);
            
            this.drawBoard();
            this.updateRobotInfo();
        }
    }

    loadBoardFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseBoardCSV(e.target.result);
                this.updateStatus(`Board loaded: ${file.name}`);
                this.logOutput('Board loaded successfully!', 'success');
            } catch (error) {
                this.logOutput(`Error loading board: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    parseBoardCSV(csvData) {
        // Use the level manager to parse the CSV
        const parsedData = this.levelManager.parseGridCSV(csvData);
        
        if (!parsedData.valid) {
            this.logOutput(`Error parsing grid: ${parsedData.errors.join(', ')}`, 'error');
            return;
        }
        
        // Reset board data
        this.board = parsedData.board;
        this.gates = parsedData.gates;
        this.keys = parsedData.keys;
        
        // Auto-detect grid size
        const detectedSize = parsedData.gridSize;
        if (detectedSize > 0 && detectedSize <= 20) {
            this.gridSize = detectedSize;
            this.gridSizeSelect.value = this.gridSize.toString();
            this.logOutput(`Auto-detected grid size: ${this.gridSize}x${this.gridSize}`, 'info');
        }
        
        // Find robot starting position (first normal tile or 0,0)
        this.findRobotStartPosition();
        this.drawBoard();
    }

    findRobotStartPosition() {
        // Look for a normal tile to place the robot
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.board[y] && this.board[y][x];
                if (cell && cell.type === 'normal') {
                    this.robot.x = x;
                    this.robot.y = y;
                    return;
                }
            }
        }
        
        // If no normal tiles found, look for any non-obstacle tile
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.canMoveTo(x, y)) {
                    this.robot.x = x;
                    this.robot.y = y;
                    return;
                }
            }
        }
        
        // Fallback to 0,0 (should be valid if grid exists)
        this.robot.x = 0;
        this.robot.y = 0;
    }

    async runCode() {
        if (this.isRunning) {
            this.logOutput('Code is already running!', 'error');
            return;
        }

        const code = this.codeEditor.value.trim();
        if (!code) {
            this.logOutput('Please enter some robot commands!', 'error');
            return;
        }

        this.isRunning = true;
        this.robot.commandsExecuted = 0;
        this.logOutput('Starting robot execution...', 'info');
        
        try {
            // Parse and execute commands
            await this.executeRobotCode(code);
            this.logOutput('Robot execution completed!', 'success');
        } catch (error) {
            this.logOutput(`Execution error: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
            this.updateRobotInfo();
        }
    }

    async executeRobotCode(code) {
        // Create a safe execution environment
        const bot = this.createBotObject();
        
        // Parse Python-like syntax
        const commands = this.parseCommands(code);
        
        for (let i = 0; i < commands.length; i++) {
            if (!this.isRunning) break;
            
            const command = commands[i];
            this.currentCommand = i;
            
            try {
                await this.executeCommand(command, bot);
                this.updateRobotInfo();
                await this.sleep(this.animationSpeed);
            } catch (error) {
                throw new Error(`Command ${i + 1}: ${error.message}`);
            }
        }
    }

    createBotObject() {
        return {
            move_forward: () => this.moveForward(),
            move_backward: () => this.moveBackward(),
            turn_right: () => this.turnRight(),
            turn_left: () => this.turnLeft(),
            can_move: () => this.canMoveForward()
        };
    }

    canMoveBackward() {
        const currentX = this.robot.x;
        const currentY = this.robot.y;
        let targetX = currentX;
        let targetY = currentY;
        
        // Calculate target position based on direction (opposite of forward)
        switch (this.robot.direction) {
            case 'north':
                targetY = Math.min(this.gridSize - 1, currentY + 1);
                break;
            case 'east':
                targetX = Math.max(0, currentX - 1);
                break;
            case 'south':
                targetY = Math.max(0, currentY - 1);
                break;
            case 'west':
                targetX = Math.min(this.gridSize - 1, currentX + 1);
                break;
        }
        
        return this.canMoveTo(targetX, targetY);
    }

    parseCommands(code) {
        const commands = [];
        const lines = code.split('\n');
        
        this.logOutput(`Parsing code with ${lines.length} lines`, 'debug');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            
            this.logOutput(`Processing line ${i + 1}: "${trimmedLine}"`, 'debug');
            
            // Handle control structures FIRST (if, for loops)
            if (trimmedLine.includes('for i in range(')) {
                const result = this.parseForLoop(lines, i);
                commands.push(...result.commands);
                this.logOutput(`Added ${result.commands.length} commands from for loop`, 'debug');
                i = result.nextIndex - 1; // -1 because loop will increment
            }
            // Handle if statements with proper conditional evaluation
            else if (trimmedLine.startsWith('if ')) {
                const result = this.parseIfStatement(lines, i);
                commands.push(...result.commands);
                this.logOutput(`Added ${result.commands.length} commands from if statement`, 'debug');
                i = result.nextIndex - 1; // -1 because loop will increment
            }
            // Handle simple commands AFTER control structures
            else if (trimmedLine.includes('bot.move_forward()')) {
                commands.push('move_forward');
                this.logOutput('Added move_forward command', 'debug');
            } else if (trimmedLine.includes('bot.move_backward()')) {
                commands.push('move_backward');
                this.logOutput('Added move_backward command', 'debug');
            } else if (trimmedLine.includes('bot.turn_right()')) {
                commands.push('turn_right');
                this.logOutput('Added turn_right command', 'debug');
            } else if (trimmedLine.includes('bot.turn_left()')) {
                commands.push('turn_left');
                this.logOutput('Added turn_left command', 'debug');
            } else if (trimmedLine.includes('bot.can_move()')) {
                commands.push('can_move');
                this.logOutput('Added can_move command', 'debug');
            } else {
                this.logOutput(`Unknown command: "${trimmedLine}"`, 'debug');
            }
        }
        
        this.logOutput(`Total commands parsed: ${commands.length}`, 'info');
        this.logOutput(`Final command array: ${JSON.stringify(commands, null, 2)}`, 'debug');
        return commands;
    }

    parseForLoop(lines, startIndex) {
        const match = lines[startIndex].match(/for i in range\((\d+)\):/);
        if (!match) return { commands: [], nextIndex: startIndex + 1 };
        
        const count = parseInt(match[1]);
        const loopCommands = this.parseIndentedBlock(lines, startIndex + 1);
        
        // Add the loop commands multiple times
        const repeatedCommands = [];
        for (let k = 0; k < count; k++) {
            repeatedCommands.push(...loopCommands);
        }
        
        return { commands: repeatedCommands, nextIndex: startIndex + loopCommands.length + 1 };
    }

    parseIfStatement(lines, startIndex) {
        const conditionalBlocks = [];
        let currentIndex = startIndex;
        
        this.logOutput(`Parsing if statement starting at line ${startIndex + 1}`, 'debug');
        
        // Parse the if statement and all its elif/else branches
        while (currentIndex < lines.length) {
            const line = lines[currentIndex].trim();
            
            if (line.startsWith('if ')) {
                const condition = line.substring(3).replace(':', '').trim();
                const block = this.parseIndentedBlock(lines, currentIndex + 1);
                conditionalBlocks.push({
                    type: 'if',
                    condition: condition,
                    commands: block
                });
                this.logOutput(`Parsed if block with condition: "${condition}" and ${block.length} commands`, 'debug');
                currentIndex += block.length + 1;
            } else if (line.startsWith('elif ')) {
                const condition = line.substring(5).replace(':', '').trim();
                const block = this.parseIndentedBlock(lines, currentIndex + 1);
                conditionalBlocks.push({
                    type: 'elif',
                    condition: condition,
                    commands: block
                });
                this.logOutput(`Parsed elif block with condition: "${condition}" and ${block.length} commands`, 'debug');
                currentIndex += block.length + 1;
            } else if (line.startsWith('else:')) {
                const block = this.parseIndentedBlock(lines, currentIndex + 1);
                conditionalBlocks.push({
                    type: 'else',
                    condition: null,
                    commands: block
                });
                this.logOutput(`Parsed else block with ${block.length} commands`, 'debug');
                currentIndex += block.length + 1;
            } else {
                break;
            }
        }
        
        this.logOutput(`Created conditional structure with ${conditionalBlocks.length} blocks`, 'debug');
        
        // Return the conditional structure instead of evaluating immediately
        // The evaluation will happen during command execution
        return { 
            commands: [{
                type: 'conditional',
                blocks: conditionalBlocks
            }], 
            nextIndex: currentIndex 
        };
    }

    evaluateCondition(condition) {
        if (!condition) return true; // else block
        
        // Handle 'not' keyword
        if (condition.startsWith('not ')) {
            const innerCondition = condition.substring(4).trim();
            return !this.evaluateCondition(innerCondition);
        }
        
        // Handle bot.can_move() calls
        if (condition.includes('bot.can_move()')) {
            // Replace bot.can_move() with actual result
            const result = this.canMoveForward();
            condition = condition.replace(/bot\.can_move\(\)/g, result.toString());
        }
        
        // Handle boolean literals
        if (condition === 'True') return true;
        if (condition === 'False') return false;
        if (condition === 'true') return true;
        if (condition === 'false') return false;
        
        // Handle simple comparisons (==, !=, <, >, <=, >=)
        if (condition.includes('==')) {
            const [left, right] = condition.split('==').map(s => s.trim());
            return this.evaluateExpression(left) === this.evaluateExpression(right);
        }
        if (condition.includes('!=')) {
            const [left, right] = condition.split('!=').map(s => s.trim());
            return this.evaluateExpression(left) !== this.evaluateExpression(right);
        }
        if (condition.includes('<=')) {
            const [left, right] = condition.split('<=').map(s => s.trim());
            return this.evaluateExpression(left) <= this.evaluateExpression(right);
        }
        if (condition.includes('>=')) {
            const [left, right] = condition.split('>=').map(s => s.trim());
            return this.evaluateExpression(left) >= this.evaluateExpression(right);
        }
        if (condition.includes('<')) {
            const [left, right] = condition.split('<').map(s => s.trim());
            return this.evaluateExpression(left) < this.evaluateExpression(right);
        }
        if (condition.includes('>')) {
            const [left, right] = condition.split('>').map(s => s.trim());
            return this.evaluateExpression(left) > this.evaluateExpression(right);
        }
        
        // Handle logical operators (and, or)
        if (condition.includes(' and ')) {
            const parts = condition.split(' and ');
            return parts.every(part => this.evaluateCondition(part.trim()));
        }
        if (condition.includes(' or ')) {
            const parts = condition.split(' or ');
            return parts.some(part => this.evaluateCondition(part.trim()));
        }
        
        // If it's just a simple expression, evaluate it
        return this.evaluateExpression(condition);
    }

    evaluateExpression(expr) {
        expr = expr.trim();
        
        // Handle boolean literals
        if (expr === 'True' || expr === 'true') return true;
        if (expr === 'False' || expr === 'false') return false;
        
        // Handle numbers
        if (!isNaN(expr)) return parseFloat(expr);
        
        // Handle robot properties
        if (expr.includes('bot.')) {
            if (expr === 'bot.x') return this.robot.x;
            if (expr === 'bot.y') return this.robot.y;
            if (expr === 'bot.direction') return this.robot.direction;
            if (expr === 'bot.keys') return this.robot.keys.length;
        }
        
        // Default to false for unknown expressions
        return false;
    }

    parseIndentedBlock(lines, startIndex) {
        const blockCommands = [];
        const baseIndentation = this.getIndentationLevel(lines[startIndex - 1] || '');
        
        this.logOutput(`Parsing indented block starting at line ${startIndex + 1}, base indentation: ${baseIndentation}`, 'debug');
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            
            const currentIndentation = this.getIndentationLevel(line);
            this.logOutput(`Line ${i + 1}: indentation=${currentIndentation}, content="${trimmedLine}"`, 'debug');
            
            // If indentation is less than or equal to base, we're done with this block
            if (currentIndentation <= baseIndentation) {
                this.logOutput(`Ending block at line ${i + 1}, indentation ${currentIndentation} <= base ${baseIndentation}`, 'debug');
                break;
            }
            
            // Parse commands within the block - check control structures FIRST
            if (trimmedLine.includes('for i in range(')) {
                const result = this.parseForLoop(lines, i);
                blockCommands.push(...result.commands);
                this.logOutput(`Added ${result.commands.length} commands from nested for loop`, 'debug');
                i = result.nextIndex - 1;
            } else if (trimmedLine.startsWith('if ')) {
                const result = this.parseIfStatement(lines, i);
                blockCommands.push(...result.commands);
                this.logOutput(`Added ${result.commands.length} commands from nested if statement`, 'debug');
                i = result.nextIndex - 1;
            }
            // Handle simple commands AFTER control structures
            else if (trimmedLine.includes('bot.move_forward()')) {
                blockCommands.push('move_forward');
                this.logOutput('Added move_forward to block', 'debug');
            } else if (trimmedLine.includes('bot.move_backward()')) {
                blockCommands.push('move_backward');
                this.logOutput('Added move_backward to block', 'debug');
            } else if (trimmedLine.includes('bot.turn_right()')) {
                blockCommands.push('turn_right');
                this.logOutput('Added turn_right to block', 'debug');
            } else if (trimmedLine.includes('bot.turn_left()')) {
                blockCommands.push('turn_left');
                this.logOutput('Added turn_left to block', 'debug');
            } else if (trimmedLine.includes('bot.can_move()')) {
                blockCommands.push('can_move');
                this.logOutput('Added can_move to block', 'debug');
            } else {
                this.logOutput(`Unknown command in block: "${trimmedLine}"`, 'debug');
            }
        }
        
        this.logOutput(`Block parsed with ${blockCommands.length} commands`, 'debug');
        return blockCommands;
    }

    getIndentationLevel(line) {
        let level = 0;
        for (let char of line) {
            if (char === ' ' || char === '\t') {
                level++;
            } else {
                break;
            }
        }
        return level;
    }

    async executeCommand(command, bot) {
        // Handle conditional commands
        if (typeof command === 'object' && command.type === 'conditional') {
            this.logOutput('Executing conditional statement', 'info');
            await this.executeConditional(command, bot);
            return;
        }
        
        // Debug logging for simple commands
        this.logOutput(`Executing command: ${command}`, 'debug');
        
        // Handle regular commands
        switch (command) {
            case 'move_forward':
                bot.move_forward();
                break;
            case 'move_backward':
                bot.move_backward();
                break;
            case 'turn_right':
                bot.turn_right();
                break;
            case 'turn_left':
                bot.turn_left();
                break;
            case 'can_move':
                const canMove = bot.can_move();
                this.logOutput(`can_move() returned: ${canMove}`, 'info');
                break;
            default:
                this.logOutput(`Unknown command: ${command}`, 'error');
        }
    }

    async executeConditional(conditionalCommand, bot) {
        const { blocks } = conditionalCommand;
        this.logOutput(`Evaluating conditional with ${blocks.length} blocks`, 'debug');
        
        // Evaluate conditions in order and execute the first true branch
        for (const block of blocks) {
            this.logOutput(`Checking ${block.type} block with condition: ${block.condition}`, 'debug');
            
            if (block.type === 'else') {
                // Execute else block
                this.logOutput('Executing else block', 'info');
                await this.executeCommandList(block.commands, bot);
                return;
            } else {
                // Evaluate the condition
                const conditionResult = this.evaluateCondition(block.condition);
                this.logOutput(`Condition "${block.condition}" evaluated to: ${conditionResult}`, 'debug');
                
                if (conditionResult) {
                    // Execute the commands in this block
                    this.logOutput(`Executing ${block.type} block`, 'info');
                    await this.executeCommandList(block.commands, bot);
                    return;
                }
            }
        }
        
        // If no conditions were met, do nothing
        this.logOutput('No conditional branches executed', 'info');
    }

    async executeCommandList(commands, bot) {
        for (const command of commands) {
            await this.executeCommand(command, bot);
        }
    }

    moveForward() {
        // Use can_move() to check if movement is possible
        if (!this.canMoveForward()) {
            this.logOutput(`Cannot move forward - path is blocked!`, 'error');
            this.drawBoard();
            return;
        }
        
        const currentX = this.robot.x;
        const currentY = this.robot.y;
        let newX = currentX;
        let newY = currentY;
        
        // Calculate target position based on direction
        switch (this.robot.direction) {
            case 'north':
                newY = Math.max(0, currentY - 1);
                break;
            case 'east':
                newX = Math.min(this.gridSize - 1, currentX + 1);
                break;
            case 'south':
                newY = Math.min(this.gridSize - 1, currentY + 1);
                break;
            case 'west':
                newX = Math.max(0, currentX - 1);
                break;
        }
        
        // Check if we're actually moving
        if (newX === currentX && newY === currentY) {
            this.logOutput('Cannot move forward - at boundary!', 'error');
            this.drawBoard();
            return;
        }
        
        // Move the robot
        this.robot.x = newX;
        this.robot.y = newY;
        this.robot.commandsExecuted++;
        this.logOutput(`Moved forward to (${this.robot.x}, ${this.robot.y})`, 'info');
        this.checkTileEffects();
        this.drawBoard();
    }

    moveBackward() {
        const currentX = this.robot.x;
        const currentY = this.robot.y;
        let newX = currentX;
        let newY = currentY;
        
        // Calculate target position based on direction (opposite of forward)
        switch (this.robot.direction) {
            case 'north':
                newY = Math.min(this.gridSize - 1, currentY + 1);
                break;
            case 'east':
                newX = Math.max(0, currentX - 1);
                break;
            case 'south':
                newY = Math.max(0, currentY - 1);
                break;
            case 'west':
                newX = Math.min(this.gridSize - 1, currentX + 1);
                break;
        }
        
        // Check if movement is valid using the same logic as can_move()
        if (!this.canMoveTo(newX, newY)) {
            this.logOutput(`Cannot move backward - path is blocked!`, 'error');
            this.drawBoard();
            return;
        }
        
        // Check if we're actually moving
        if (newX === currentX && newY === currentY) {
            this.logOutput('Cannot move backward - at boundary!', 'error');
            this.drawBoard();
            return;
        }
        
        // Move the robot
        this.robot.x = newX;
        this.robot.y = newY;
        this.robot.commandsExecuted++;
        this.logOutput(`Moved backward to (${this.robot.x}, ${this.robot.y})`, 'info');
        this.checkTileEffects();
        this.drawBoard();
    }

    turnRight() {
        const directions = ['north', 'east', 'south', 'west'];
        const currentIndex = directions.indexOf(this.robot.direction);
        this.robot.direction = directions[(currentIndex + 1) % 4];
        this.robot.commandsExecuted++;
        this.logOutput(`Turned right, now facing ${this.robot.direction}`, 'info');
        this.drawBoard();
    }

    turnLeft() {
        const directions = ['north', 'east', 'south', 'west'];
        const currentIndex = directions.indexOf(this.robot.direction);
        this.robot.direction = directions[(currentIndex - 1 + 4) % 4];
        this.robot.commandsExecuted++;
        this.logOutput(`Turned left, now facing ${this.robot.direction}`, 'info');
        this.drawBoard();
    }

    canMoveForward() {
        const currentX = this.robot.x;
        const currentY = this.robot.y;
        let targetX = currentX;
        let targetY = currentY;
        
        // Calculate target position based on direction
        switch (this.robot.direction) {
            case 'north':
                targetY = Math.max(0, currentY - 1);
                break;
            case 'east':
                targetX = Math.min(this.gridSize - 1, currentX + 1);
                break;
            case 'south':
                targetY = Math.min(this.gridSize - 1, currentY + 1);
                break;
            case 'west':
                targetX = Math.max(0, currentX - 1);
                break;
        }
        
        const canMove = this.canMoveTo(targetX, targetY);
        console.log(`canMoveForward: from (${currentX},${currentY}) to (${targetX},${targetY}) = ${canMove}`);
        return canMove;
    }

    canMoveTo(x, y) {
        // Check if coordinates are within bounds
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            console.log(`canMoveTo: out of bounds (${x},${y})`);
            return false;
        }
        
        // Check if the target cell exists and is not an obstacle
        const cell = this.board[y] && this.board[y][x];
        console.log(`canMoveTo: checking cell at (${x},${y}) - type: ${cell ? cell.type : 'undefined'}`);
        
        if (cell && cell.type === 'obstacle') {
            console.log(`canMoveTo: OBSTACLE TILE at (${x},${y}) - blocking movement`);
            return false;
        }
        
        // Check for gates in the path
        if (this.isGateBlocking(this.robot.x, this.robot.y, x, y)) {
            console.log(`canMoveTo: gate blocking movement to (${x},${y})`);
            return false;
        }
        
        console.log(`canMoveTo: clear path to (${x},${y}) - cell type: ${cell ? cell.type : 'normal'}`);
        return true;
    }

    isGateBlocking(fromX, fromY, toX, toY) {
        // Check if there's a gate blocking the path between from and to positions
        for (const gate of this.gates) {
            // Check if gate is at the target position
            if (gate.x === toX && gate.y === toY) {
                // Check if robot has the matching key
                if (!this.robot.keys.includes(gate.color)) {
                    console.log(`Gate at (${toX},${toY}) blocks movement - need ${gate.color} key, have: ${this.robot.keys}`);
                    return true; // Gate blocks movement
                }
            }
            
            // Check if gate is at the current position and blocks movement to target
            if (gate.x === fromX && gate.y === fromY) {
                // Check if gate is in the direction of movement
                if (this.isGateInDirection(gate, fromX, fromY, toX, toY)) {
                    if (!this.robot.keys.includes(gate.color)) {
                        console.log(`Gate at current position (${fromX},${fromY}) blocks movement - need ${gate.color} key, have: ${this.robot.keys}`);
                        return true;
                    }
                }
            }
            
            // Check if gate is between the positions (for gates placed on borders)
            if (this.isGateBetween(fromX, fromY, toX, toY, gate)) {
                if (!this.robot.keys.includes(gate.color)) {
                    console.log(`Gate between positions blocks movement - need ${gate.color} key, have: ${this.robot.keys}`);
                    return true;
                }
            }
        }
        return false;
    }

    isGateBetween(fromX, fromY, toX, toY, gate) {
        // Check if gate is positioned between two cells
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        
        // For horizontal gates between vertical movement
        if (gate.type === 'horizontal' && deltaY !== 0) {
            // Gate should be at the border between cells
            if (gate.position === 'top' && deltaY < 0) {
                return gate.x === fromX && gate.y === fromY;
            } else if (gate.position === 'bottom' && deltaY > 0) {
                return gate.x === fromX && gate.y === fromY;
            }
        }
        
        // For vertical gates between horizontal movement
        if (gate.type === 'vertical' && deltaX !== 0) {
            // Gate should be at the border between cells
            if (gate.position === 'left' && deltaX < 0) {
                return gate.x === fromX && gate.y === fromY;
            } else if (gate.position === 'right' && deltaX > 0) {
                return gate.x === fromX && gate.y === fromY;
            }
        }
        
        return false;
    }

    isGateInDirection(gate, fromX, fromY, toX, toY) {
        // Determine if the gate is blocking the path from fromX,fromY to toX,toY
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        
        if (gate.type === 'horizontal') {
            // Horizontal gate blocks vertical movement
            return deltaY !== 0;
        } else if (gate.type === 'vertical') {
            // Vertical gate blocks horizontal movement
            return deltaX !== 0;
        }
        
        return false;
    }

    checkTileEffects() {
        const cell = this.board[this.robot.y] && this.board[this.robot.y][this.robot.x];
        if (!cell) return;
        
        switch (cell.type) {
            case 'obstacle':
                this.logOutput('Hit an obstacle! Robot stopped.', 'error');
                this.isRunning = false;
                break;
            case 'reset':
                this.logOutput('Hit reset/electrified tile! Game reset.', 'info');
                this.resetRobot();
                break;
            case 'ending':
                this.logOutput('Reached the ending zone! Mission complete!', 'success');
                this.isRunning = false;
                break;
        }
        
        // Check for keys
        const keyIndex = this.keys.findIndex(key => key.x === this.robot.x && key.y === this.robot.y);
        if (keyIndex !== -1) {
            const key = this.keys[keyIndex];
            this.robot.keys.push(key.color);
            this.logOutput(`Found a ${key.color} key! (Total keys: ${this.robot.keys.length})`, 'success');
            this.keys.splice(keyIndex, 1);
            this.updateRobotInfo();
        }
    }

    resetRobot() {
        this.isRunning = false;
        this.robot.commandsExecuted = 0;
        this.robot.keys = []; // Clear collected keys
        this.findRobotStartPosition();
        this.robot.direction = 'north';
        this.logOutput('Robot reset to starting position (keys cleared)', 'info');
        this.updateRobotInfo();
        this.drawBoard();
    }

    updateRobotInfo() {
        const keysText = this.robot.keys.length > 0 ? this.robot.keys.join(', ') : 'None';
        this.robotInfo.innerHTML = `
            <strong>Robot Status:</strong><br>
            Position: (${this.robot.x}, ${this.robot.y})<br>
            Direction: ${this.robot.direction}<br>
            Commands Executed: ${this.robot.commandsExecuted}<br>
            Keys: ${keysText}
        `;
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    logOutput(message, type = 'info') {
        const outputDiv = document.createElement('div');
        outputDiv.className = type;
        outputDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.outputPanel.appendChild(outputDiv);
        this.outputPanel.scrollTop = this.outputPanel.scrollHeight;
    }

    saveCode() {
        const code = this.codeEditor.value;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'robot_code.txt';
        link.click();
        URL.revokeObjectURL(url);
        this.logOutput('Code saved successfully!', 'success');
    }

    loadCodeFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.codeEditor.value = e.target.result;
            this.logOutput(`Code loaded from ${file.name}`, 'success');
        };
        reader.readAsText(file);
    }

    drawEmptyBoard() {
        this.resizeCanvas();
        
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    resizeCanvas() {
        // Calculate optimal cell size based on grid size
        const maxCanvasSize = 600; // Maximum canvas size
        this.cellSize = Math.floor(maxCanvasSize / this.gridSize);
        
        const canvasSize = this.cellSize * this.gridSize;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }

    drawBoard() {
        this.resizeCanvas(); // Ensure canvas is properly sized
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }

        // Draw tiles
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.board[y] && this.board[y][x];
                if (cell) {
                    this.drawCell(x, y, cell);
                }
            }
        }

        // Draw gates
        this.gates.forEach(gate => {
            this.drawGate(gate);
        });

        // Draw keys
        this.keys.forEach(key => {
            this.drawKey(key);
        });

        // Draw robot
        this.drawRobot();
    }

    drawCell(x, y, cell) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        switch (cell.type) {
            case 'obstacle':
                this.ctx.fillStyle = '#000000';
                break;
            case 'reset':
                this.ctx.fillStyle = '#708090';
                break;
            case 'ending':
                this.ctx.fillStyle = '#808080';
                break;
            default:
                this.ctx.fillStyle = '#ffffff';
        }
        
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
    }

    drawGate(gate) {
        const pixelX = gate.x * this.cellSize;
        const pixelY = gate.y * this.cellSize;
        
        this.ctx.strokeStyle = gate.color || '#8B4513';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        if (gate.type === 'horizontal') {
            const y = pixelY + (gate.position === 'top' ? 0 : 
                              gate.position === 'bottom' ? this.cellSize : this.cellSize/2);
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, y);
            this.ctx.lineTo(pixelX + this.cellSize, y);
            this.ctx.stroke();
        } else {
            const x = pixelX + (gate.position === 'left' ? 0 : 
                              gate.position === 'right' ? this.cellSize : this.cellSize/2);
            this.ctx.beginPath();
            this.ctx.moveTo(x, pixelY);
            this.ctx.lineTo(x, pixelY + this.cellSize);
            this.ctx.stroke();
        }
    }

    drawKey(key) {
        const pixelX = key.x * this.cellSize;
        const pixelY = key.y * this.cellSize;
        
        this.ctx.fillStyle = key.color || '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(pixelX + this.cellSize/2, pixelY + this.cellSize/2, this.cellSize/4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = `${this.cellSize/3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('K', pixelX + this.cellSize/2, pixelY + this.cellSize/2);
    }

    drawRobot() {
        const pixelX = this.robot.x * this.cellSize;
        const pixelY = this.robot.y * this.cellSize;
        
        // Robot body
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
        
        // Robot direction indicator
        this.ctx.fillStyle = '#4ECDC4';
        const centerX = pixelX + this.cellSize/2;
        const centerY = pixelY + this.cellSize/2;
        const arrowSize = this.cellSize/6;
        
        this.ctx.beginPath();
        switch (this.robot.direction) {
            case 'north':
                this.ctx.moveTo(centerX, centerY - arrowSize);
                this.ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
                this.ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
                break;
            case 'east':
                this.ctx.moveTo(centerX + arrowSize, centerY);
                this.ctx.lineTo(centerX - arrowSize/2, centerY - arrowSize/2);
                this.ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
                break;
            case 'south':
                this.ctx.moveTo(centerX, centerY + arrowSize);
                this.ctx.lineTo(centerX - arrowSize/2, centerY - arrowSize/2);
                this.ctx.lineTo(centerX + arrowSize/2, centerY - arrowSize/2);
                break;
            case 'west':
                this.ctx.moveTo(centerX - arrowSize, centerY);
                this.ctx.lineTo(centerX + arrowSize/2, centerY - arrowSize/2);
                this.ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
                break;
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the testing environment when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RobotTester();
});
