import { Maze } from "./Maze";
import { Point } from "./Point";
import { Size } from "./Size";
import { Cell } from "./Cell";
import { Direction } from "./Direction";
import { ColorTheme } from "./ColorTheme";

const timeStepIntervalMs = 500; //16.6666666667;

export class MazeWalker {

    maze: Maze;
    current: Cell;
    visitedStack: Cell[] = [];
    deltaMs = 0;
    lastUpdated = 0;
    currentDirection = Direction.north;

    constructor(maze: Maze, startPos: Point) {
        this.maze = maze;
        this.current = this.maze.getCell(startPos.x, startPos.y);
        if (this.current.isOutOfBounds(this.maze.size)) {
            throw new Error(`Start cell ${this.current.position.toString()} is out of bounds`);
        }
    }
    
    update(ts: DOMHighResTimeStamp) {

        this.deltaMs += (ts - this.lastUpdated);
        if (this.deltaMs < timeStepIntervalMs) {
            return;
        }

        if (!this.isExit(this.current)) {
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
                const { x, y, width, height } = this.maze.getCellRect(cell, canvasSize, 0.4);
                ctx.fillRect(x,  y, width, height)
            });

        const prevStrokeStyle = ctx.strokeStyle;
        ctx.strokeStyle = ColorTheme.visitedMarker;
        this.maze.cells
            .filter(cell => cell.isDeadEnd)
            .forEach((cell) => {
                const { x, y, width, height } = this.maze.getCellRect(cell, canvasSize, 0.4);
                ctx.strokeRect(x,  y, width, height)
            });
        ctx.strokeStyle = prevStrokeStyle

        const { x, y, width, height } = this.maze.getCellRect(this.current, canvasSize, 0.6);
        ctx.fillStyle = ColorTheme.walker;
        ctx.fillRect(x,  y, width, height)
    }

    private getNextCell(): Cell | undefined {
        const neighbours = this.current.availableDirections.map(d => this.getNeighbour(this.current, d));
        let unchartedNeighbours = neighbours.filter(neighbour => neighbour.uncharted);

        for (const neighbour of unchartedNeighbours) {
            const direction = this.getDirection(neighbour);
            const deadEndPath = this.detectDeadEndPath(neighbour, direction);
            if (deadEndPath) {
                const exitFound = deadEndPath.find(cell => this.isExit(cell));
                if (exitFound) {
                    return neighbour;
                }
                deadEndPath.forEach(cell => cell.isDeadEnd = true);
                continue;
            }
        }
        unchartedNeighbours = unchartedNeighbours.filter(neighbour => neighbour.uncharted);

        if (unchartedNeighbours.length === 0) {
            return this.pickEarliestVisitedCell(neighbours);
        }

        if (unchartedNeighbours.length === 1) {
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

        if (topRanking.length > 0) {
            const randomIndex = Math.floor(Math.random() * topRanking.length);
            return topRanking[randomIndex];
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
        return this.maze.exits.filter(exit => exit.position.equals(cell.position)).length === 1;
    }
}
