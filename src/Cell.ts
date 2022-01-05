import { Point } from "./Point";
import { Direction } from "./Direction";
import { ColorTheme } from "./ColorTheme";
import { Size } from "./Size";

export class Cell {
  position: Point;
  lastVisited: number | false;
  walls: boolean[];

  get visited(): boolean {
    return this.lastVisited !== false;
  }

  get openingsCount(): number {
    return this.walls.filter((wall) => !wall).length;
  }

  constructor(x: number, y: number) {
    this.position = new Point(x, y);
    this.walls = [true, true, true, true];
    this.lastVisited = false;
  }

  isOutOfBounds(mazeSize: Size): boolean {
    const { x, y } = this.position;
    return x < 0 || x > mazeSize.width - 1 || y < 0 || y > mazeSize.height - 1;
  }

  removeWalls(neighbour: Cell) {
    const { x, y } = this.position;
    if (x === neighbour.position.x) {
      if (y < neighbour.position.y) {
        this.walls[Direction.south] = false;
        neighbour.walls[Direction.north] = false;
      } else {
        this.walls[Direction.north] = false;
        neighbour.walls[Direction.south] = false;
      }
    } else {
      if (x < neighbour.position.x) {
        this.walls[Direction.east] = false;
        neighbour.walls[Direction.west] = false;
      } else {
        this.walls[Direction.west] = false;
        neighbour.walls[Direction.east] = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, size: number) {
    ctx.fillStyle = ColorTheme.mazeBackground;
    const { x, y } = this.position;

    ctx.fillRect(x * size, y * size, size, size);

    if (this.walls[Direction.north]) {
      const startPoint = new Point(x * size, y * size);
      const endPoint = startPoint.add(size, 0);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[Direction.east]) {
      const startPoint = new Point(x * size, y * size).add(size, 0);
      const endPoint = startPoint.add(0, size);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[Direction.south]) {
      const startPoint = new Point(x * size, y * size).add(0, size);
      const endPoint = startPoint.add(size, 0);
      this.drawLine(ctx, startPoint, endPoint);
    }

    if (this.walls[Direction.west]) {
      const startPoint = new Point(x * size, y * size);
      const endPoint = startPoint.add(0, size);
      this.drawLine(ctx, startPoint, endPoint);
    }
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    startPoint: Point,
    endPoint: Point
  ) {
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
}
