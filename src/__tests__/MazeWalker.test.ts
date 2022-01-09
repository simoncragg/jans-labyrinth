import { mockRandom, resetMockRandom } from "jest-mock-random";
import { Direction } from "../Direction";
import { MazeBuilder } from "../MazeBuilder";
import { MazeWalker } from "../MazeWalker";
import { Point } from "../Point";
import { Size } from "../Size";

describe("maze walker", () => {
  it.only("can find exit", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(2, 2);
    const exits = [new Point(1, 0)];

    mockRandom([0.5]); // Math.floor(0.5 * 2) === 1

    const maze = mazeBuilder.build(size, exits);
    const startPos = new Point(0, 0);
    const mazeWalker = new MazeWalker(maze, startPos, 0.0);

    const expectedStepsToReachExit = 3;
    for (let i = 0; i < expectedStepsToReachExit; i++) {
      const ts = performance.now();
      mazeWalker.update(ts);
    }

    expect(mazeWalker.currentCell.isExit).toBeTruthy();
    expect(mazeWalker.currentDirection).toBe(Direction.north);

    resetMockRandom();
  });
});
