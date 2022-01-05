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
    exit: Cell;
    visitedStack: Cell[] = [];
    delta = 0;
    lastUpdated = -1;

    constructor(maze: Maze, startPoint: Point, exitPoint: Point) {
        this.maze = maze;
        const current = maze.getCell(startPoint.x, startPoint.y); 
        const exit = maze.getCell(exitPoint.x, exitPoint.y);

        if (!current.isOutOfBounds(this.maze.size)) this.current = current; else throw new Error("Start position is out of bounds");
        if (!exit.isOutOfBounds(this.maze.size)) this.exit = exit; else throw new Error("Exit position is out of bounds");
    }
    
    update(ts: DOMHighResTimeStamp) {

        if (this.lastUpdated < 0) {
            this.lastUpdated = ts;
        }

        this.delta += ts - this.lastUpdated;
        if (this.delta < timeStepIntervalMs) {
            return;
        }

        if (!this.current.position.equals(this.exit.position)) {
            const next = this.getNextCell(this.current);
            if (next) {
                this.current.lastVisited = Date.now();
                this.visitedStack.push(this.current); 
                this.current = next;
            } else {
                const current = this.visitedStack.pop();
                if (current) {
                    this.current = current;
                } else {
                    throw new Error("Should never get here");
                }
            }
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
        const unvisitedNeighbours = neighbours.filter(neighbour => !neighbour.visited);

        if (unvisitedNeighbours.length === 0) {
            return this.pickEarliestVisitedCell(neighbours);
        }

        if (unvisitedNeighbours.length === 1) {
            return unvisitedNeighbours[0];
        }

        const orderedUnvisitedNeighbours = unvisitedNeighbours
            .sort((a, b) => b.availableDirections.length - a.availableDirections.length);

        const nextCellOnClearPathTowardsExit = this.findNextCellOnClearPathTowardsExit(current);
        if (nextCellOnClearPathTowardsExit) {
            return nextCellOnClearPathTowardsExit;
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

    private findNextCellOnClearPathTowardsExit(cell: Cell): Cell | false {
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
        return cell.position.equals(this.exit.position);
    }

    private pickRandomCellWithMostAvailableDirections(orderedUnvisitedNeighbours: Cell[]): Cell {
        const mostAvailableDirections = orderedUnvisitedNeighbours[0].availableDirections.length;
        const topRanking = orderedUnvisitedNeighbours.filter(x => x.availableDirections.length === mostAvailableDirections);
        const randomIndex = Math.floor(Math.random() * topRanking.length);
        return topRanking[randomIndex];
    }
}
