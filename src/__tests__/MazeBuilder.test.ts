// let schema = ["S01", "432", "56E"];

import { MazeBuilder } from "../MazeBuilder";
import { Point } from "../Point";
import { Size } from "../Size";

describe("maze builder", () => {
  it("can build", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(3, 3);
    const exits = [new Point(2, 2)];

    const maze = mazeBuilder.build(size, exits);

    expect(maze.size).toBe(size);
  });
});
