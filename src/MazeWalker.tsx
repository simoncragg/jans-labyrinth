import { Maze } from "./Maze";
import { Point } from "./Point";
import { Size } from "./Size";
import { Cell } from "./Cell";
import { Direction } from "./Direction";
import { Rect } from "./Rect";
import { ColorTheme } from "./ColorTheme";

const timeStepIntervalMs = 500; //16.6666666667;

export class MazeWalker {

    maze: Maze;
    current: Cell;
    visitedStack: Cell[] = [];
    delta = 0;
    lastUpdated = -1;
    currentDirection = Direction.north;

    constructor(maze: Maze) {
        this.maze = maze;
        this.current = this.maze.start;
    }
    
    update(ts: DOMHighResTimeStamp) {

        if (this.lastUpdated < 0) {
            this.lastUpdated = ts;
        }

        this.delta += ts - this.lastUpdated;
        if (this.delta < timeStepIntervalMs) {
            return;
        }

        if (!this.current.position.equals(this.maze.exit.position)) {
            let next = this.getNextCell(this.current);
            if (next) {
                this.current.lastVisited = Date.now();
                this.visitedStack.push(this.current); 
            } else {
                next = this.visitedStack.pop();
            }

            if (!next) throw new Error("Next is undefined")
            this.currentDirection = this.getDirection(next);
            this.current = next;
        }

        this.delta = 0;
        this.lastUpdated = ts;
    }

    draw(ctx: CanvasRenderingContext2D | null, canvasSize: Size) {
        if (!ctx) throw new Error("Maze Walker has no context!");
        ctx.fillStyle = ColorTheme.visitedMarker;
        this.maze.cells
            .filter(cell => cell.visited)
            .forEach((cell) => {
                const { x, y, width, height } = this.getDrawRect(cell, canvasSize, 0.4);
                ctx.fillRect(x,  y, width, height)
            });

        ctx.fillStyle = ColorTheme.deadEndMarker;
        this.maze.cells
            .filter(cell => cell.isDeadEnd)
            .forEach((cell) => {
                const { x, y, width, height } = this.getDrawRect(cell, canvasSize, 0.4);
                ctx.fillRect(x,  y, width, height)
            });


        const { x, y, width, height } = this.getDrawRect(this.current, canvasSize, 0.6);
        ctx.fillStyle = ColorTheme.walker;
        ctx.fillRect(x,  y, width, height)
    }

    private getDrawRect(cell: Cell, canvasSize: Size, scale: number): Rect {
        const cellSize = Math.floor(canvasSize.width / this.maze.size.width);
        const rectSize = new Size(cellSize, cellSize).multiply(scale, scale);
        const x = (cell.position.x * cellSize) + (cellSize * ((1 - scale) / 2));
        const y = (cell.position.y * cellSize) + (cellSize * ((1 - scale) / 2));
        return new Rect(x, y, rectSize.width, rectSize.height);
    }

    private getNextCell(current: Cell): Cell | undefined {
        const neighbours = current.availableDirections.map(d => this.getNeighbour(current, d));
        const prospectiveNeighbours = neighbours.filter(neighbour => !neighbour.visited && !neighbour.isDeadEnd);

        if (prospectiveNeighbours.length === 0) {
            return this.pickEarliestVisitedCell(neighbours);
        }

        if (prospectiveNeighbours.length === 1) {
            return prospectiveNeighbours[0];
        }

        const orderedUnvisitedNeighbours = prospectiveNeighbours
            .sort((a, b) => b.availableDirections.length - a.availableDirections.length);

        if (this.isDirectionAboutToChange(prospectiveNeighbours)) {
            const nextCellOnClearStraightTowardsExit = this.findNextCellOnStraightPathTowardsExit(current);
            if (nextCellOnClearStraightTowardsExit) {
                return nextCellOnClearStraightTowardsExit;
            }
        }

        return this.pickRandomCellWithMostAvailableDirections(orderedUnvisitedNeighbours);
    }

    private getNeighbour(cell: Cell, direction: Direction): Cell {
        let point: Point;
        switch (direction) {
            case Direction.north: point = cell.position.sub(0, 1); break;
            case Direction.east: point = cell.position.add(1, 0); break;
            case Direction.south: point = cell.position.add(0, 1); break;
            case Direction.west: point = cell.position.sub(1, 0); break;
        }

        return this.maze.getCell(point.x, point.y);
    }
    
    private pickEarliestVisitedCell(availableNeighbours: Cell[]): Cell {
        const previouslyVisitedNeighbours = availableNeighbours
                .filter(neighbour => neighbour.visited)
                .sort((a, b) => (a.lastVisited as number) - (b.lastVisited as number));
        
        return previouslyVisitedNeighbours[0];
    }

    private isDirectionAboutToChange(prospectiveNeighbours: Cell[]): boolean {
        const possibleDirections = prospectiveNeighbours
            .flatMap(x => x.availableDirections)
            .filter((cell, i, arr) => arr.indexOf(cell) === i);
        
            return possibleDirections.indexOf(this.currentDirection) === -1;
    }

    private findNextCellOnStraightPathTowardsExit(cell: Cell): Cell | false {
        for (const direction of cell.availableDirections) {
            const neighbour = this.getNeighbour(cell, direction);
            let next = neighbour;
            while (!next.walls[direction]) {
                next = this.getNeighbour(next, direction);
                if (this.isExit(next)) {
                    console.log("exit found");
                    return neighbour;
                }
            }

            if (this.isExit(next)) {
                console.log("exit found");
                return neighbour;
            }
        }
        return false;
    }

    private isExit(cell: Cell): boolean {
        return cell.position.equals(this.maze.exit.position);
    }

    private pickRandomCellWithMostAvailableDirections(orderedUnvisitedNeighbours: Cell[]): Cell {
        const mostAvailableDirections = orderedUnvisitedNeighbours[0].availableDirections.length;
        const topRanking = orderedUnvisitedNeighbours.filter(x => x.availableDirections.length === mostAvailableDirections);
        const randomIndex = Math.floor(Math.random() * topRanking.length);
        return topRanking[randomIndex];
    }

    private getDirection(next: Cell): Direction {
        if (this.current.position.y > next.position.y) {
            return Direction.north;
        }
        if (this.current.position.x < next.position.x) {
            return Direction.east;
        }
        if (this.current.position.y < next.position.y) {
            return Direction.south;
        }
        if (this.current.position.x > next.position.x) {
            return Direction.west;
        }
        return this.currentDirection;
    }
}
