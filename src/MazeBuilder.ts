import { Cell } from "./Cell";
import { Maze } from "./Maze";
import { Size } from "./Size";

export class MazeBuilder {
  private visitedStack: Cell[] = [];

  build(size: Size) {
    const maze = new Maze(size);

    let current: Cell | undefined = maze.getCell(0, 0);

    while (current) {
      current.lastVisited = Date.now();
      const next = this.getNextUnvisitedNeighbour(current, maze);
      if (next) {
        current.removeWalls(next);
        this.visitedStack.push(current);
        current = next;
      } else {
        current = this.visitedStack.pop();
      }
    }

    maze.resetVisits();
    return maze;
  }

  private getNextUnvisitedNeighbour(cell: Cell, maze: Maze): Cell | undefined {
    const { x: cellX, y: cellY } = cell.position;
    const n = maze.getCell(cellX, cellY - 1);
    const e = maze.getCell(cellX + 1, cellY);
    const s = maze.getCell(cellX, cellY + 1);
    const w = maze.getCell(cellX - 1, cellY);
    const neighbours = [n, e, s, w];

    const unvisitedNeighbours = neighbours.filter(
      (neighbour) =>
        !neighbour.isOutOfBounds(maze.size) && !neighbour.lastVisited
    );

    if (unvisitedNeighbours.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * unvisitedNeighbours.length);
    return unvisitedNeighbours[randomIndex];
  }
}
