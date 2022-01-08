import { Cell } from "./Cell";
import { ColorTheme } from "./ColorTheme";
import { Point } from "./Point";
import { Rect } from "./Rect";
import { Size } from "./Size";

export class Maze {
  size: Size;
  cells: Cell[] = [];
  start: Cell;
  exit: Cell;

  constructor(size: Size, startPoint: Point, exitPoint: Point) {
    this.size = size;
    for (let y = 0; y < this.size.height; y++) {
      for (let x = 0; x < this.size.width; x++) {
        this.cells.push(new Cell(x, y));
      }
    }
    this.start = this.getCell(startPoint.x, startPoint.y);
    if (this.start.isOutOfBounds(this.size))
      throw new Error("Start position is out of bounds");

    this.exit = this.getCell(exitPoint.x, exitPoint.y);
    if (this.exit.isOutOfBounds(this.size))
      throw new Error("Exit position is out of bounds");
  }

  getCell(x: number, y: number): Cell {
    const cell = new Cell(x, y);
    if (cell.isOutOfBounds(this.size)) {
      return cell;
    }

    const i = x + this.size.width * y;
    return this.cells[i];
  }

  draw(ctx: CanvasRenderingContext2D | null, canvasSize: Size) {
    if (!ctx) {
      throw new Error("No context!");
    }

    const cellSize = Math.floor(canvasSize.width / this.size.width);

    for (const cell of this.cells) {
      cell.draw(ctx, cellSize);
    }

    const { x, y, width, height } = this.getCellRect(
      this.exit,
      canvasSize,
      0.4
    );
    ctx.fillStyle = ColorTheme.exitMarker;
    ctx.fillRect(x, y, width, height);
  }

  resetVisits() {
    this.cells.forEach((cell) => (cell.lastVisited = false));
  }

  getCellRect(cell: Cell, canvasSize: Size, scale: number): Rect {
    const cellSize = Math.floor(canvasSize.width / this.size.width);
    const rectSize = new Size(cellSize, cellSize).multiply(scale, scale);
    const x = cell.position.x * cellSize + cellSize * ((1 - scale) / 2);
    const y = cell.position.y * cellSize + cellSize * ((1 - scale) / 2);
    return new Rect(x, y, rectSize.width, rectSize.height);
  }
}
