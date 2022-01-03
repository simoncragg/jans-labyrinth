export class Cell {
  x: number;
  y: number;
  visited: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.visited = false;
  }

  draw(context: CanvasRenderingContext2D, size: number) {
    context.fillStyle = "#8000ff";
    context.fillRect(this.x * size, this.y * size, size, size);
  }
}
