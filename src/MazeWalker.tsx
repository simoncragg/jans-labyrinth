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
                    throw new Error("Hmm, what to do now?");
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

    private getNextCell(current: Cell): Cell {
        const availableNeighbours = current.availableDirections.map(d => this.getNeighbour(current, d));
        const orderedUnvisitedNeighbours = availableNeighbours
            .filter(neighbour => !neighbour.visited)
            .sort((a, b) => b.availableDirections.length- a.availableDirections.length);

        if (orderedUnvisitedNeighbours.length > 0) {

            if (orderedUnvisitedNeighbours.length === 1) {
                return orderedUnvisitedNeighbours[0];
            }

            for (const direction of current.availableDirections) {
                const neighbour = this.getNeighbour(current, direction);
                let cell = neighbour;
                while (!cell.walls[direction]) {
                    cell = this.getNeighbour(cell, direction);
                    if (this.isExit(cell)) {
                        console.log("exit found");
                        return neighbour;
                    }
                }

                if (this.isExit(cell)) {
                    console.log("exit found");
                    return neighbour;
                }
            }

            const highestNeighbourCount = orderedUnvisitedNeighbours[0].availableDirections.length;
            const topRankingNeighbours = orderedUnvisitedNeighbours
                .filter(neighbour => neighbour.availableDirections.length === highestNeighbourCount);

            const randomIndex = Math.floor(Math.random() * topRankingNeighbours.length);
            const cell = topRankingNeighbours[randomIndex];
            if (!cell) throw new Error("Cell cannot be undefined here");
            return cell;
        }

        const previouslyVisitedNeighbours = availableNeighbours
            .filter(neighbour => neighbour.visited)
            .sort((a, b) => (a.lastVisited as number) - (b.lastVisited as number));

        const cell = previouslyVisitedNeighbours[0];
        if (!cell) throw new Error("Cell cannot be undefined here");
        return cell;
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
    
    private isExit(cell: Cell): boolean {
        return cell.position.equals(this.exit.position);
    }
}