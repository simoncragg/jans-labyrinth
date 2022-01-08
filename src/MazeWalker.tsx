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
    deltaMs = 0;
    lastUpdated = 0;
    currentDirection = Direction.north;

    constructor(maze: Maze) {
        this.maze = maze;
        this.current = this.maze.start;
    }
    
    update(ts: DOMHighResTimeStamp) {

        this.deltaMs += (ts - this.lastUpdated);
        if (this.deltaMs < timeStepIntervalMs) {
            return;
        }

        if (!this.current.position.equals(this.maze.exit.position)) {
            let next = this.getNextCell();
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

        this.deltaMs = 0;
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

    private getNextCell(): Cell | undefined {
        const neighbours = this.current.availableDirections.map(d => this.getNeighbour(this.current, d));
        const unchartedNeighbours = neighbours.filter(neighbour => !neighbour.visited && !neighbour.isDeadEnd);

        if (unchartedNeighbours.length === 0) {
            return this.pickEarliestVisitedCell(neighbours);
        }

        if (unchartedNeighbours.length === 1) {
            const direction = this.getDirection(unchartedNeighbours[0]);
            if (direction !== this.currentDirection) {
                const deadEndPath = this.detectDeadEndPath(unchartedNeighbours[0], direction);
                if (deadEndPath && !deadEndPath.find(cell => this.isExit(cell))) {
                    deadEndPath?.forEach(cell => cell.isDeadEnd = true);
                    return this.current;
                }
            }
            return unchartedNeighbours[0];
        }

        const orderedUnvisitedNeighbours = unchartedNeighbours
            .sort((a, b) => b.availableDirections.length - a.availableDirections.length);

        if (this.isDirectionAboutToChange(unchartedNeighbours)) {
            const exitPath = this.detectExitPath(this.current);
            if (exitPath) {
                return exitPath[0];
            }
        }

        return this.pickOptimalNextCell(orderedUnvisitedNeighbours);
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

    private detectDeadEndPath(cell: Cell, direction: Direction): Cell[] | false {
        const oppositeDirection = direction < 2 ? direction + 2 : direction - 2;
        const deadEndPath = [] as Cell[];
        while (!cell.walls[direction]) {
            if (cell.availableDirections.length !== 2 || 
                cell.availableDirections.indexOf(direction) === -1 || 
                cell.availableDirections.indexOf(oppositeDirection) === -1) {
                break;
            }
            deadEndPath.push(cell);
            cell = this.getNeighbour(cell, direction);
        }

        if (cell.availableDirections.length === 1) {
            deadEndPath.push(cell);
            return deadEndPath;
        }
        return false;
    }

    private detectExitPath(cell: Cell): Cell[] | false {
        for (const direction of cell.availableDirections) {
            const exitPath: Cell[] = [];
            const neighbour = this.getNeighbour(cell, direction);
            let next = neighbour;
            do {
                exitPath.push(next);
                if (this.isExit(next)) {
                    console.log("exit found");
                    return exitPath;
                }
                next = this.getNeighbour(next, direction);
            } while (!next.walls[direction])

            if (this.isExit(next)) {
                console.log("exit found");
                return exitPath;
            }
        } 
        return false;
    }

    private pickOptimalNextCell(orderedUnvisitedNeighbours: Cell[]): Cell | undefined {
        const mostAvailableDirections = orderedUnvisitedNeighbours[0].availableDirections.length;
        const topRanking = orderedUnvisitedNeighbours.filter(x => x.availableDirections.length === mostAvailableDirections);
        const finalCandidates: Cell[] = [];

        for (const neighbour of topRanking) {
            const direction = this.getDirection(neighbour);
            const deadEndPath = this.detectDeadEndPath(neighbour, direction);
            const exitFound = deadEndPath && deadEndPath.find(cell => this.isExit(cell));
            if (exitFound) {
                return neighbour;
            }

            if (deadEndPath) {
                deadEndPath.forEach(cell => cell.isDeadEnd = true);
                continue;
            }
            finalCandidates.push(neighbour);
        }

        if (finalCandidates.length > 0) {
            const randomIndex = Math.floor(Math.random() * finalCandidates.length);
            return finalCandidates[randomIndex];
        }
        
        this.current.lastVisited = Date.now();
        return undefined;
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

    private isExit(cell: Cell): boolean {
        return cell.position.equals(this.maze.exit.position);
    }
}
