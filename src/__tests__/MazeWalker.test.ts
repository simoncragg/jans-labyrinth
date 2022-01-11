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

    const deterministicSequenceForSteppingSouth = [0.5];
    mockRandom(deterministicSequenceForSteppingSouth);

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

  it("can find exit (with dead-end detection and backtracking)", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(4, 3);
    const exits = [new Point(2, 0)];

    // East, South, East, East, North {East} {Backtrack 2} {South} {West} {West} {West} {North}
    const deterministicSequenceForStepping = [0.1, 0.5, 0.1, 0.5, 0.1];
    mockRandom(deterministicSequenceForStepping);

    const maze = mazeBuilder.build(size, exits);
    const startPos = new Point(0, 0);
    const mazeWalker = new MazeWalker(maze, startPos, 0.0);

    const deterministicSequenceForSteppingSouth = [0.5];
    mockRandom(deterministicSequenceForSteppingSouth);

    const expectedStepsToReachExit = 14;
    for (let i = 0; i < expectedStepsToReachExit; i++) {
      const ts = performance.now();
      mazeWalker.update(ts);
    }

    expect(mazeWalker.currentCell.isExit).toBeTruthy();
    expect(mazeWalker.currentDirection).toBe(Direction.west);
    expect(maze.cells.filter((cell) => cell.isDeadEnd).length).toBe(1);
    expect(maze.cells[4].isDeadEnd).toBeTruthy();
  });

  it("can find exit (requires dead-end detection)", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(3, 2);
    const exits = [new Point(2, 0)];

    // East, South, West {Backtrack 1} {East} {North}
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

  it("can take exit branch", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(5, 3);
    const exits = [new Point(4, 2)];

    // E,E,S,S,W,W {North} {East} {Backtrack 4} {East} E {North} W {North} {East}
    const deterministicSequenceForBuilderSteps = [
      0.1, 0.1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    ];
    mockRandom(deterministicSequenceForBuilderSteps);

    const maze = mazeBuilder.build(size, exits);
    const startPos = new Point(0, 0);
    const mazeWalker = new MazeWalker(maze, startPos, 0.0);

    const expectedStepsToReachExit = 6;
    for (let i = 0; i < expectedStepsToReachExit; i++) {
      const ts = performance.now();
      mazeWalker.update(ts);
    }

    expect(mazeWalker.currentCell.isExit).toBeTruthy();
    expect(mazeWalker.currentDirection).toBe(Direction.east);
    expect(maze.cells.filter((cell) => cell.isDeadEnd).length).toBe(0);
  });
});
