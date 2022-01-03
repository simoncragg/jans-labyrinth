import { Cell } from "./Cell";
import { Size } from "./Size";

export class Maze {
  private size: Size;
  private cells: Cell[] = [];

  constructor(size: Size) {
    this.size = size;
    for (let y = 0; y < this.size.height; y++) {
      for (let x = 0; x < this.size.width; x++) {
        this.cells.push(new Cell(x, y));
      }
    }

    let current = this.getCell(0, 0);
    while (current) {
      const next = this.checkNeighbours(current);
      current = next;
    }
  }

  private checkNeighbours(cell: Cell): Cell | undefined {
    return cell ? undefined : cell; // todo: implement this function
  }

  private getCell(x: number, y: number): Cell | undefined {
    if (x < 0 || x > this.size.width - 1 || y < 0 || y > this.size.height - 1) {
      return undefined;
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
}
