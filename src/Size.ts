export class Size {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  sub(width: number, height: number): Size {
    return new Size(this.width - width, this.height - height);
  }

  multiply(width: number, height: number): Size {
    return new Size(this.width * width, this.height * height);
  }
}
