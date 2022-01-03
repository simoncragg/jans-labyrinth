import { Cell } from "./Cell";
import { Size } from "./Size";

export class Maze {
  private size: Size;
  private cells: Cell[] = [];
  private visitedStack: Cell[] = [];

  constructor(size: Size) {
    this.size = size;
    for (let y = 0; y < this.size.height; y++) {
      for (let x = 0; x < this.size.width; x++) {
        this.cells.push(new Cell(x, y));
      }
    }

    let current = this.getCell(0, 0);
    while (current) {
      current.visited = true;
      const next = this.checkNeighbours(current);
      if (next) {
        current.removeWalls(next);
        //console.log("walls removed:\n", current, "\n", next);
        this.visitedStack.push(current);
        current = next;
      } else {
        current = this.visitedStack.pop();
        //console.log("pop", current);
      }
    }

    this.cells.forEach((cell) => (cell.visited = false));
    console.log("done building");

    console.log(this.cells[9999]);
  }

  private checkNeighbours(cell: Cell): Cell | undefined {
    const n = this.getCell(cell.x, cell.y - 1);
    const e = this.getCell(cell.x + 1, cell.y);
    const s = this.getCell(cell.x, cell.y + 1);
    const w = this.getCell(cell.x - 1, cell.y);
    const neighbours = [n, e, s, w];

    const unvisitedNeighbours = neighbours.filter(
      (neighbour) => neighbour && !neighbour.visited
    );

    if (unvisitedNeighbours.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * unvisitedNeighbours.length);
    return unvisitedNeighbours[randomIndex];
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
