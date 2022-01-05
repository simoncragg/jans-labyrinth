import { Cell } from "./Cell";
import { Size } from "./Size";

export class Maze {
  size: Size;
  cells: Cell[] = [];

  constructor(size: Size) {
    this.size = size;
    for (let y = 0; y < this.size.height; y++) {
      for (let x = 0; x < this.size.width; x++) {
        this.cells.push(new Cell(x, y));
      }
    }
  }

  getCell(x: number, y: number): Cell {
    const cell = new Cell(x, y);
    if (cell.isOutOfBounds(this.size)) {
      return cell;
    }

    const i = x + this.size.width * y;
    return this.cells[i];
  }

  draw(context: CanvasRenderingContext2D | null, canvasSize: Size) {
    if (!context) {
      throw new Error("No context!");
    }

    const cellSize = Math.floor(canvasSize.width / this.size.width);

    for (const cell of this.cells) {
      cell.draw(context, cellSize);
    }
  }

  resetVisits() {
    this.cells.forEach((cell) => (cell.lastVisited = false));
  }
}
