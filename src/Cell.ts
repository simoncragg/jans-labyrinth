import { Point } from "./Point";

const north = 0;
const east = 1;
const south = 2;
const west = 3;

export class Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: boolean[];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = [true, true, true, true];
  }

  removeWalls(neighbour: Cell) {
    if (this.x === neighbour.x) {
      if (this.y < neighbour.y) {
        this.walls[south] = false;
        neighbour.walls[north] = false;
      } else {
        this.walls[north] = false;
        neighbour.walls[south] = false;
      }
    } else {
      if (this.x < neighbour.x) {
        this.walls[east] = false;
        neighbour.walls[west] = false;
      } else {
        this.walls[west] = false;
        neighbour.walls[east] = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, size: number) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x * size, this.y * size, size, size);

    if (this.walls[north]) {
      const startPoint = new Point(this.x * size, this.y * size);
      const endPoint = startPoint.add(size, 0);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[east]) {
      const startPoint = new Point(this.x * size, this.y * size).add(size, 0);
      const endPoint = startPoint.add(0, size);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[south]) {
      const startPoint = new Point(this.x * size, this.y * size).add(0, size);
      const endPoint = startPoint.add(size, 0);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[west]) {
      const startPoint = new Point(this.x * size, this.y * size);
      const endPoint = startPoint.add(0, size);
      this.drawLine(ctx, startPoint, endPoint);
    }
  }

  drawLine(ctx: CanvasRenderingContext2D, startPoint: Point, endPoint: Point) {
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
}
