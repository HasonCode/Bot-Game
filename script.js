class BotGameEditor {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 15;
        this.cellSize = 30;
        this.selectedTool = 'select';
        this.selectedTileType = 'obstacle';
        this.selectedGateColor = '#8B4513';
        this.selectedGateType = 'horizontal';
        this.selectedGatePosition = 'center';
        this.selectedKeyColor = '#FFD700';
        this.keyTemplateImage = null;
        this.board = [];
        this.gates = [];
        this.keys = [];
        this.customAssets = [];
        this.customAssetImages = new Map();
        
        this.loadKeyTemplate();
        
        this.initializeBoard();
        this.setupEventListeners();
        this.resizeCanvas();
        this.drawBoard();
    }

    initializeBoard() {
        this.board = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.board[y][x] = {
                    type: 'normal',
                    asset: null,
                    customAsset: null
                };
            }
        }
    }

    setupEventListeners() {
        // Grid size control
        document.getElementById('resizeGrid').addEventListener('click', () => {
            this.gridSize = parseInt(document.getElementById('gridSize').value);
            this.initializeBoard();
            this.resizeCanvas();
            this.drawBoard();
            this.updateStatus(`Grid resized to ${this.gridSize}x${this.gridSize}`);
            
            // Update default filename with grid size
            const baseFileName = `bot_game_board_${this.gridSize}x${this.gridSize}`;
            document.getElementById('csvFileName').value = baseFileName;
            document.getElementById('pngFileName').value = baseFileName;
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedTool = e.target.dataset.tool;
                
                // Show/hide relevant sections
                document.getElementById('tileTypes').style.display = 
                    this.selectedTool === 'tile' ? 'flex' : 'none';
                document.getElementById('gateOptions').style.display = 
                    this.selectedTool === 'gate' ? 'block' : 'none';
                document.getElementById('keyOptions').style.display = 
                    this.selectedTool === 'key' ? 'block' : 'none';
                document.getElementById('customAssetSection').style.display = 
                    this.selectedTool === 'custom' ? 'block' : 'none';
                
                // Update cursor style
                if (this.selectedTool === 'delete') {
                    this.canvas.style.cursor = 'crosshair';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
                
                this.updateStatus(`Tool selected: ${this.selectedTool}`);
            });
        });

        // Tile type selection
        document.querySelectorAll('.tile-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tile-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedTileType = e.target.dataset.tile;
            });
        });

        // Canvas interactions
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                this.handleCellClick(x, y);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                document.getElementById('coordinates').textContent = `(${x}, ${y})`;
            } else {
                document.getElementById('coordinates').textContent = '';
            }
        });

        // Gate options handling
        document.getElementById('gateColor').addEventListener('change', (e) => {
            this.selectedGateColor = e.target.value;
        });

        document.getElementById('gateType').addEventListener('change', (e) => {
            this.selectedGateType = e.target.value;
        });

        document.getElementById('gatePosition').addEventListener('change', (e) => {
            this.selectedGatePosition = e.target.value;
        });

        // Key options handling
        document.getElementById('keyColor').addEventListener('change', (e) => {
            this.selectedKeyColor = e.target.value;
            this.updateKeyPreview();
        });

        // Custom asset handling
        document.getElementById('addCustomAsset').addEventListener('click', () => {
            this.addCustomAsset();
        });

        document.getElementById('assetUpload').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.previewCustomAsset(e.target.files[0]);
            }
        });

        // Action buttons
        document.getElementById('clearBoard').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire board?')) {
                this.initializeBoard();
                this.gates = [];
                this.keys = [];
                this.drawBoard();
                this.updateStatus('Board cleared');
            }
        });

        document.getElementById('saveCSV').addEventListener('click', () => {
            this.saveAsCSV();
        });

        document.getElementById('savePNG').addEventListener('click', () => {
            this.saveAsPNG();
        });

        document.getElementById('loadFileBtn').addEventListener('click', () => {
            document.getElementById('loadFile').click();
        });

        document.getElementById('loadFile').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadFile(e.target.files[0]);
            }
        });
    }

    handleCellClick(x, y) {
        switch (this.selectedTool) {
            case 'select':
                this.selectCell(x, y);
                break;
            case 'tile':
                this.placeTile(x, y);
                break;
            case 'key':
                this.placeKey(x, y);
                break;
            case 'gate':
                this.placeGate(x, y);
                break;
            case 'custom':
                this.placeCustomAsset(x, y);
                break;
            case 'delete':
                this.deleteElement(x, y);
                break;
        }
        this.drawBoard();
    }

    selectCell(x, y) {
        const cell = this.board[y][x];
        let info = `Cell (${x}, ${y}): Type: ${cell.type}`;
        if (cell.asset) info += `, Asset: ${cell.asset}`;
        if (cell.customAsset) info += `, Custom Asset: ${cell.customAsset}`;
        this.updateStatus(info);
    }

    placeTile(x, y) {
        this.board[y][x].type = this.selectedTileType;
        this.updateStatus(`Placed ${this.selectedTileType} tile at (${x}, ${y})`);
    }

    placeKey(x, y) {
        const keyId = `key_${Date.now()}`;
        this.board[y][x].asset = 'key';
        this.keys.push({ id: keyId, x, y, color: this.selectedKeyColor });
        this.updateStatus(`Placed ${this.selectedKeyColor} key at (${x}, ${y})`);
    }

    placeGate(x, y) {
        // Check if there's already a gate at this position and remove it
        const existingGateIndex = this.gates.findIndex(gate => gate.x === x && gate.y === y);
        if (existingGateIndex !== -1) {
            this.gates.splice(existingGateIndex, 1);
        }
        
        const gateId = `gate_${Date.now()}`;
        this.gates.push({ 
            id: gateId, 
            x, 
            y, 
            type: this.selectedGateType,
            color: this.selectedGateColor,
            position: this.selectedGatePosition
        });
        this.updateStatus(`Placed ${this.selectedGateColor} ${this.selectedGateType} gate at (${x}, ${y}) - ${this.selectedGatePosition} position`);
    }

    placeCustomAsset(x, y) {
        if (this.selectedCustomAsset) {
            this.board[y][x].customAsset = this.selectedCustomAsset;
            this.updateStatus(`Placed custom asset "${this.selectedCustomAsset}" at (${x}, ${y})`);
        }
    }

    deleteElement(x, y) {
        let deletedItems = [];
        
        // Check for gates at this position
        const gateIndex = this.gates.findIndex(gate => gate.x === x && gate.y === y);
        if (gateIndex !== -1) {
            const gate = this.gates[gateIndex];
            deletedItems.push(`gate (${gate.color} ${gate.type})`);
            this.gates.splice(gateIndex, 1);
        }
        
        // Check for keys at this position
        const keyIndex = this.keys.findIndex(key => key.x === x && key.y === y);
        if (keyIndex !== -1) {
            const key = this.keys[keyIndex];
            deletedItems.push(`key (${key.color})`);
            this.keys.splice(keyIndex, 1);
        }
        
        // Check for custom assets
        if (this.board[y][x].customAsset) {
            deletedItems.push(`custom asset (${this.board[y][x].customAsset})`);
            this.board[y][x].customAsset = null;
        }
        
        // Check for non-normal tiles
        if (this.board[y][x].type !== 'normal') {
            deletedItems.push(`${this.board[y][x].type} tile`);
            this.board[y][x].type = 'normal';
        }
        
        // Remove key asset from cell if it exists
        if (this.board[y][x].asset === 'key') {
            this.board[y][x].asset = null;
        }
        
        if (deletedItems.length > 0) {
            this.updateStatus(`Deleted: ${deletedItems.join(', ')} at (${x}, ${y})`);
        } else {
            this.updateStatus(`No elements to delete at (${x}, ${y})`);
        }
    }

    addCustomAsset() {
        const fileInput = document.getElementById('assetUpload');
        const nameInput = document.getElementById('assetName');
        
        if (!fileInput.files[0] || !nameInput.value.trim()) {
            alert('Please select a file and enter a name for the custom asset.');
            return;
        }

        const file = fileInput.files[0];
        const name = nameInput.value.trim();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.customAssetImages.set(name, img);
                this.customAssets.push(name);
                this.createCustomAssetPreview(name, img);
                this.updateStatus(`Added custom asset: ${name}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    createCustomAssetPreview(name, img) {
        const preview = document.createElement('div');
        preview.className = 'asset-preview';
        preview.title = name;
        preview.style.backgroundImage = `url(${img.src})`;
        preview.style.backgroundSize = 'cover';
        preview.addEventListener('click', () => {
            this.selectedCustomAsset = name;
            document.querySelectorAll('.asset-preview').forEach(p => p.classList.remove('selected'));
            preview.classList.add('selected');
        });
        
        // Add to custom asset section
        let previewContainer = document.querySelector('.custom-asset .asset-previews');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'asset-previews';
            previewContainer.style.display = 'flex';
            previewContainer.style.flexWrap = 'wrap';
            previewContainer.style.marginTop = '10px';
            document.querySelector('.custom-asset').appendChild(previewContainer);
        }
        previewContainer.appendChild(preview);
    }

    previewCustomAsset(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // You could add a preview here if needed
        };
        reader.readAsDataURL(file);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxSize = Math.min(container.clientWidth - 40, container.clientHeight - 40, 600);
        this.cellSize = Math.floor(maxSize / this.gridSize);
        const canvasSize = this.cellSize * this.gridSize;
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#ccc';
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
                const cell = this.board[y][x];
                this.drawCell(x, y, cell);
            }
        }

        // Draw gates
        this.gates.forEach(gate => {
            this.drawGate(gate);
        });
    }

    drawCell(x, y, cell) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Draw tile background
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

        // Draw assets
        if (cell.asset === 'key') {
            this.drawKey(pixelX, pixelY);
        }
        
        if (cell.customAsset && this.customAssetImages.has(cell.customAsset)) {
            this.drawCustomAsset(pixelX, pixelY, this.customAssetImages.get(cell.customAsset));
        }
    }

    drawKey(x, y) {
        // Find the key data to get its color
        const keyData = this.keys.find(key => 
            key.x === Math.floor(x / this.cellSize) && 
            key.y === Math.floor(y / this.cellSize)
        );
        
        const keyColor = keyData ? keyData.color : '#FFD700';
        
        if (this.keyTemplateImage) {
            // Create a colored key image
            const coloredKeyDataURL = this.createColoredKeyImage(keyColor);
            const coloredKeyImg = new Image();
            coloredKeyImg.onload = () => {
                // Save current canvas state
                this.ctx.save();
                
                // Clear the area first
                this.ctx.clearRect(x, y, this.cellSize, this.cellSize);
                
                // Draw the colored key image
                const keySize = Math.min(this.cellSize * 0.8, 24);
                const keyX = x + (this.cellSize - keySize) / 2;
                const keyY = y + (this.cellSize - keySize) / 2;
                
                this.ctx.drawImage(coloredKeyImg, keyX, keyY, keySize, keySize);
                
                // Restore canvas state
                this.ctx.restore();
            };
            coloredKeyImg.src = coloredKeyDataURL;
        } else {
            // Fallback to simple key drawing
            this.drawSimpleKey(x, y, keyColor);
        }
    }

    drawSimpleKey(x, y, keyColor) {
        const darkerColor = this.darkenColor(keyColor, 0.3);
        
        // Draw key body
        this.ctx.fillStyle = keyColor;
        this.ctx.beginPath();
        this.ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize/4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw key highlight
        this.ctx.fillStyle = this.lightenColor(keyColor, 0.3);
        this.ctx.beginPath();
        this.ctx.arc(x + this.cellSize/2 - 2, y + this.cellSize/2 - 2, this.cellSize/6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw key letter
        this.ctx.fillStyle = darkerColor;
        this.ctx.font = `bold ${this.cellSize/3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('K', x + this.cellSize/2, y + this.cellSize/2);
    }

    drawCustomAsset(x, y, img) {
        this.ctx.drawImage(img, x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    }

    drawGate(gate) {
        const pixelX = gate.x * this.cellSize;
        const pixelY = gate.y * this.cellSize;
        
        this.ctx.strokeStyle = gate.color || '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        let startX, startY, endX, endY;
        
        if (gate.type === 'horizontal') {
            switch (gate.position) {
                case 'top':
                    // Draw on the top boundary of the tile
                    startY = endY = pixelY;
                    startX = pixelX;
                    endX = pixelX + this.cellSize;
                    break;
                case 'bottom':
                    // Draw on the bottom boundary of the tile
                    startY = endY = pixelY + this.cellSize;
                    startX = pixelX;
                    endX = pixelX + this.cellSize;
                    break;
                default: // center
                    // Draw through the center of the tile
                    startY = endY = pixelY + this.cellSize/2;
                    startX = pixelX;
                    endX = pixelX + this.cellSize;
            }
        } else { // vertical
            switch (gate.position) {
                case 'left':
                    // Draw on the left boundary of the tile
                    startX = endX = pixelX;
                    startY = pixelY;
                    endY = pixelY + this.cellSize;
                    break;
                case 'right':
                    // Draw on the right boundary of the tile
                    startX = endX = pixelX + this.cellSize;
                    startY = pixelY;
                    endY = pixelY + this.cellSize;
                    break;
                default: // center
                    // Draw through the center of the tile
                    startX = endX = pixelX + this.cellSize/2;
                    startY = pixelY;
                    endY = pixelY + this.cellSize;
            }
        }
        
        // Draw main gate line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw gate shadow for depth
        this.ctx.strokeStyle = this.darkenColor(gate.color || '#8B4513', 0.4);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX + 2, startY + 2);
        this.ctx.lineTo(endX + 2, endY + 2);
        this.ctx.stroke();
        
        // Draw gate highlight
        this.ctx.strokeStyle = this.lightenColor(gate.color || '#8B4513', 0.4);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX - 2, startY - 2);
        this.ctx.lineTo(endX - 2, endY - 2);
        this.ctx.stroke();
        
        // Add gate posts for visual clarity
        this.ctx.fillStyle = gate.color || '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    saveAsCSV() {
        let csv = 'x,y,type,asset,custom_asset\n';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.board[y][x];
                if (cell.type !== 'normal' || cell.asset || cell.customAsset) {
                    csv += `${x},${y},${cell.type || ''},${cell.asset || ''},${cell.customAsset || ''}\n`;
                }
            }
        }
        
        csv += '\n# Gates\n';
        this.gates.forEach(gate => {
            csv += `gate,${gate.x},${gate.y},${gate.type},${gate.color},${gate.position}\n`;
        });
        
        csv += '\n# Keys\n';
        this.keys.forEach(key => {
            csv += `key,${key.x},${key.y},${key.color}\n`;
        });
        
        // Get custom filename
        const fileName = document.getElementById('csvFileName').value.trim() || 'bot_game_board';
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Clean filename
        const fullFileName = cleanFileName + '.csv';
        
        this.downloadFile(csv, fullFileName, 'text/csv');
        this.updateStatus(`Board saved as ${fullFileName}`);
    }

    saveAsPNG() {
        // Get custom filename
        const fileName = document.getElementById('pngFileName').value.trim() || 'bot_game_board';
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Clean filename
        const fullFileName = cleanFileName + '.png';
        
        const link = document.createElement('a');
        link.download = fullFileName;
        link.href = this.canvas.toDataURL();
        link.click();
        this.updateStatus(`Board saved as ${fullFileName}`);
    }

    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.csv')) {
                    this.loadFromCSV(e.target.result);
                } else if (file.name.endsWith('.json')) {
                    this.loadFromJSON(e.target.result);
                }
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    loadFromCSV(csvData) {
        // Reset board
        this.initializeBoard();
        this.gates = [];
        this.keys = [];
        
        const lines = csvData.split('\n');
        let mode = 'board';
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) {
                if (line.includes('Gates')) mode = 'gates';
                else if (line.includes('Keys')) mode = 'keys';
                continue;
            }
            
            const parts = line.split(',');
            if (mode === 'board' && parts.length >= 3) {
                const x = parseInt(parts[0]);
                const y = parseInt(parts[1]);
                if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                    this.board[y][x].type = parts[2] || 'normal';
                    this.board[y][x].asset = parts[3] || null;
                    this.board[y][x].customAsset = parts[4] || null;
                }
            } else if (mode === 'gates' && parts.length >= 3) {
                this.gates.push({
                    id: `gate_${Date.now()}_${Math.random()}`,
                    x: parseInt(parts[1]),
                    y: parseInt(parts[2]),
                    type: parts[3] || 'horizontal',
                    color: parts[4] || '#8B4513',
                    position: parts[5] || 'center'
                });
            } else if (mode === 'keys' && parts.length >= 2) {
                this.keys.push({
                    id: `key_${Date.now()}_${Math.random()}`,
                    x: parseInt(parts[1]),
                    y: parseInt(parts[2]),
                    color: parts[3] || '#FFD700'
                });
            }
        }
        
        this.drawBoard();
        this.updateStatus('Board loaded from CSV');
    }

    loadFromJSON(jsonData) {
        const data = JSON.parse(jsonData);
        this.gridSize = data.gridSize || 15;
        this.initializeBoard();
        this.gates = data.gates || [];
        this.keys = data.keys || [];
        this.customAssets = data.customAssets || [];
        
        // Load board data
        if (data.board) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (data.board[y] && data.board[y][x]) {
                        this.board[y][x] = data.board[y][x];
                    }
                }
            }
        }
        
        this.resizeCanvas();
        this.drawBoard();
        this.updateStatus('Board loaded from JSON');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    // Color utility functions
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    loadKeyTemplate() {
        // Create a canvas to generate a key template
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        
        // Draw a pixel art key shape
        this.drawKeyTemplate(ctx, 16, 16, '#FFD700');
        
        // Convert to image
        this.keyTemplateImage = new Image();
        this.keyTemplateImage.onload = () => {
            this.drawBoard(); // Redraw when template is ready
            this.updateKeyPreview(); // Update preview when template is ready
        };
        this.keyTemplateImage.src = canvas.toDataURL();
    }

    drawKeyTemplate(ctx, centerX, centerY, color) {
        // Clear the canvas first
        ctx.clearRect(0, 0, 32, 32);
        
        // Key bow (handle) - hollow square (like in your image)
        ctx.fillStyle = color;
        ctx.fillRect(centerX - 6, centerY - 4, 6, 6);
        
        // Create hollow center
        ctx.clearRect(centerX - 4, centerY - 2, 2, 2);
        
        // Key shaft
        ctx.fillRect(centerX - 2, centerY - 1, 8, 2);
        
        // Key bit (teeth) - matching your image style
        ctx.fillRect(centerX + 6, centerY - 2, 1, 1);  // Top tooth
        ctx.fillRect(centerX + 6, centerY + 1, 1, 1);  // Bottom tooth
        ctx.fillRect(centerX + 7, centerY - 1, 2, 2);  // Wide section
        
        // Add highlight for depth (like in your image)
        ctx.fillStyle = this.lightenColor(color, 0.5);
        ctx.fillRect(centerX - 5, centerY - 3, 1, 1);  // Small highlight in bow
    }

    createColoredKeyImage(keyColor) {
        if (!this.keyTemplateImage) return null;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        
        // Draw key template with new color
        this.drawKeyTemplate(ctx, 16, 16, keyColor);
        
        return canvas.toDataURL();
    }

    updateKeyPreview() {
        const previewCanvas = document.getElementById('keyPreview');
        if (!previewCanvas) return;
        
        const ctx = previewCanvas.getContext('2d');
        this.drawKeyTemplate(ctx, 16, 16, this.selectedKeyColor);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BotGameEditor();
});
