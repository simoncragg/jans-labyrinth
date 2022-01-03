import { Cell } from "./Cell";
import { Maze } from "./Maze";
import { Size } from "./Size";

export class MazeBuilder {
  private visitedStack: Cell[] = [];

  build(size: Size) {
    const maze = new Maze(size);

    let current = maze.getCell(0, 0);
    while (current) {
      current.visited = true;
      const next = this.getNextUnvisitedNeighbour(current, maze);
      if (next) {
        current.removeWalls(next);
        //console.log("walls removed:\n", current, "\n", next);
        this.visitedStack.push(current);
        current = next;
      } else {
        current = this.visitedStack.pop();
        //console.log("pop", current);
      }
    }

    maze.resetVisits();
    return maze;
  }

  private getNextUnvisitedNeighbour(cell: Cell, maze: Maze): Cell | undefined {
    const n = maze.getCell(cell.x, cell.y - 1);
    const e = maze.getCell(cell.x + 1, cell.y);
    const s = maze.getCell(cell.x, cell.y + 1);
    const w = maze.getCell(cell.x - 1, cell.y);
    const neighbours = [n, e, s, w];

    const unvisitedNeighbours = neighbours.filter(
      (neighbour) => neighbour && !neighbour.visited
    );

    if (unvisitedNeighbours.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * unvisitedNeighbours.length);
    return unvisitedNeighbours[randomIndex];
  }
}