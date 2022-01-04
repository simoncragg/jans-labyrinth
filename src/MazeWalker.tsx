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
    lastUpdateTimestamp: number | undefined;

    constructor(maze: Maze, startPoint: Point, exitPoint: Point) {
        this.maze = maze;
        const current = maze.getCell(startPoint.x, startPoint.y); 
        const exit = maze.getCell(exitPoint.x, exitPoint.y);

        if (current) this.current = current; else throw new Error("Invalid start position");
        if (exit) this.exit = exit; else throw new Error("Invalid exit position");
    }
    
    update(ts: DOMHighResTimeStamp) {

        if (!this.lastUpdateTimestamp) {
            this.lastUpdateTimestamp = ts;
        }

        this.delta += ts - this.lastUpdateTimestamp;
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
        this.lastUpdateTimestamp = ts;
    }

    draw(ctx: CanvasRenderingContext2D | null, canvasSize: Size) {
        if (!ctx) throw new Error("Maze Walker has no context!");

        ctx.fillStyle = ColorTheme.visitedMarker;
        this.maze.cells
            .filter(cell => cell.lastVisited ?? false)
            .forEach(cell => {
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
        const availableDirections = Array<number>();
        for (let i = 0; i < current.walls.length; i++) {
            if (!current.walls[i]) {
                availableDirections.push(i);
            }
        }

        const availableNeighbours = availableDirections.map(direction => this.getNeighbour(current, direction));
        const unVisitedNeighbours = availableNeighbours.filter(neighbour => !neighbour?.lastVisited ?? false);

        if (unVisitedNeighbours.length > 0) {
            const randomIndex = Math.floor(Math.random() * unVisitedNeighbours.length);
            const cell = unVisitedNeighbours[randomIndex];
            if (!cell) throw new Error("Cell cannot be undefined here");
            return cell;
        }

        const previouslyVisitedNeighbours = availableNeighbours
            .filter(neighbour => neighbour?.lastVisited ?? false)
            .sort((a, b) => (a?.lastVisited as number ?? 0) - (b?.lastVisited as number ?? 0));

        const cell = previouslyVisitedNeighbours[0];
        if (!cell) throw new Error("Cell cannot be undefined here");
        return cell;
    }

    private getNeighbour(current: Cell, direction: Direction): Cell | undefined {
        let point: Point | undefined;
        console.log("current.position", current.position);
        switch (direction) {
            case 0: point = current.position.sub(0, 1); break;
            case 1: point = current.position.add(1, 0); break;
            case 2: point = current.position.add(0, 1); break;
            case 3: point = current.position.sub(1, 0); break;
            default: throw new Error(`Invalid direction ${direction}`);
        }

        
        console.log("direction", direction);
        console.log("point", point);
        
        return point 
            ? this.maze.getCell(point.x, point.y) 
            : undefined;
    }
}