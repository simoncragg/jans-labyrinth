export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(x: number, y: number): Point {
    return new Point(this.x + x, this.y + y);
  }

  sub(x: number, y: number): Point {
    return new Point(this.x - x, this.y - y);
  }

  equals(p: Point): boolean {
    return this.x === p.x && this.y === p.y;
  }

  toString() {
    return `(${this.x},${this.y})`;
  }
}
