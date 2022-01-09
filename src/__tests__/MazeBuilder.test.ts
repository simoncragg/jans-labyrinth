import { mockRandom, resetMockRandom } from "jest-mock-random";
import { Direction } from "../Direction";
import { MazeBuilder } from "../MazeBuilder";
import { Point } from "../Point";
import { Size } from "../Size";

describe("maze builder", () => {
  it.only("can build", () => {
    const mazeBuilder = new MazeBuilder();
    const size = new Size(2, 2);
    const exits = [new Point(1, 0)];

    const expectedCellDirections = [
      [Direction.south],
      [Direction.south],
      [Direction.north, Direction.east],
      [Direction.north, Direction.west],
    ];

    mockRandom([0.5]); // Math.floor(0.5 * 2) === 1

    const maze = mazeBuilder.build(size, exits);

    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const cell = maze.getCell(x, y);
        const expectedDirections = expectedCellDirections.shift();
        expect(cell.directions.length).toBe(expectedDirections?.length);
        for (let i = 0; i < cell.directions.length; i++) {
          expect(cell.directions[i]).toBe(expectedDirections?.[i]);
        }
      }
    }

    expect(maze.cells[1].position.equals(exits[0])).toBeTruthy();

    resetMockRandom();
  });
});
