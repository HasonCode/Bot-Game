# Bot Game Board Editor

A comprehensive frontend editor for creating bot game boards with customizable grids, tiles, assets, and gates.

## Features

### Grid System
- Supports grid sizes from 5x5 to 15x15
- Dynamic resizing with automatic canvas adjustment
- Visual grid lines for easy editing

### Tile Types
- **Normal Tiles**: White background (default)
- **Obstacle Tiles**: Black tiles that block movement
- **Reset Tiles**: Blue-gray tiles that reset the game when touched
- **Ending Zone**: Gray tiles that mark the end zone

### Assets & Objects
- **Keys**: Golden key assets that can be placed on tiles
- **Gates**: Brown gates that can be placed between tiles
- **Custom Assets**: Upload your own images and place them on the board

### Save & Load
- **CSV Export**: Save board state as CSV for data processing
- **PNG Export**: Save visual representation as PNG image
- **Load Files**: Import previously saved CSV or JSON files

## How to Use

1. **Select Grid Size**: Choose your desired grid size from the dropdown and click "Resize Grid"

2. **Choose Tools**:
   - **Select**: Click on tiles to inspect their properties
   - **Tile**: Place different types of tiles (obstacle, reset, ending)
   - **Key**: Place key assets on tiles
   - **Gate**: Place gates between tiles
   - **Custom Asset**: Upload and place custom images

3. **Tile Types**: When using the Tile tool, select the desired tile type:
   - Normal (white)
   - Obstacle (black)
   - Reset (blue-gray)
   - Ending Zone (gray)

4. **Custom Assets**:
   - Upload an image file
   - Enter a name for the asset
   - Click "Add Asset"
   - Select the asset from the preview and place it on the board

5. **Save Your Work**:
   - **Save as CSV**: Exports board data for external processing
   - **Save as PNG**: Exports visual representation
   - **Load File**: Import previously saved boards

## File Structure

- `index.html`: Main HTML structure
- `style.css`: Styling and layout
- `script.js`: Core application logic
- `README.md`: This documentation

## Getting Started

1. Open `index.html` in a web browser
2. Start by selecting your desired grid size
3. Choose a tool and begin placing elements
4. Save your board when finished

The application runs entirely in the browser with no external dependencies required.
