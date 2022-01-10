import { mockRandom, resetMockRandom } from "jest-mock-random";
import { Direction } from "../Direction";
import { MazeBuilder } from "../MazeBuilder";
import { MazeWalker } from "../MazeWalker";
import { Point } from "../Point";
import { Size } from "../Size";

describe("maze walker", () => {
  afterEach(() => {
    resetMockRandom();
  });

  it("can find exit (no backtracking required)", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(2, 2);
    const exits = [new Point(1, 0)];

    const deterministicSequenceToStepSouth = [0.5];
    mockRandom(deterministicSequenceToStepSouth);

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
  });

  it("can find exit (requires backtracking and dead-end detection)", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(3, 2);
    const exits = [new Point(2, 0)];

    const deterministicSequenceForSteppingEastThenSouthThenWest = [
      0.1, 0.5, 0.5,
    ];
    mockRandom(deterministicSequenceForSteppingEastThenSouthThenWest);

    const maze = mazeBuilder.build(size, exits);
    const startPos = new Point(0, 0);
    const mazeWalker = new MazeWalker(maze, startPos, 0.0);

    const expectedStepsToReachExit = 5;
    for (let i = 0; i < expectedStepsToReachExit; i++) {
      const ts = performance.now();
      mazeWalker.update(ts);
    }

    expect(mazeWalker.currentCell.isExit).toBeTruthy();
    expect(mazeWalker.currentDirection).toBe(Direction.north);
    expect(maze.cells.filter((cell) => cell.isDeadEnd).length).toBe(1);
    expect(maze.cells[3].isDeadEnd).toBeTruthy();
  });
});
