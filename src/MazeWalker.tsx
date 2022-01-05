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

        if (!current.isOutOfBounds(this.maze.size)) this.current = current; else throw new Error("Start position is out of bounds");
        if (!exit.isOutOfBounds(this.maze.size)) this.exit = exit; else throw new Error("Exit position is out of bounds");
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
            .filter(cell => cell.visited)
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
        const unvisitedNeighboursByOpeningsDesc = availableNeighbours
            .filter(neighbour => !neighbour.visited)
            .sort((a, b) => b.openingsCount- a.openingsCount);

        if (unvisitedNeighboursByOpeningsDesc.length > 0) {
            const highestNeighbourCount = unvisitedNeighboursByOpeningsDesc[0].openingsCount;
            
            const topRankingNeighbours = unvisitedNeighboursByOpeningsDesc
                .filter(neighbour => neighbour.openingsCount === highestNeighbourCount);

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

    private getNeighbour(current: Cell, direction: Direction): Cell {
        let point: Point;
        switch (direction) {
            case 0: point = current.position.sub(0, 1); break;
            case 1: point = current.position.add(1, 0); break;
            case 2: point = current.position.add(0, 1); break;
            case 3: point = current.position.sub(1, 0); break;
            default: throw new Error(`Invalid direction ${direction}`);
        }

        return this.maze.getCell(point.x, point.y);
    }
}