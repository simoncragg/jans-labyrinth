import { Maze } from "./Maze";
import { Point } from "./Point";
import { Size } from "./Size";
import { Cell } from "./Cell";
import { Direction } from "./Direction";
import { ColorTheme } from "./ColorTheme";

export class MazeWalker {

    timeStepIntervalMs = 500; //16.6666666667;

    maze: Maze;
    currentCell: Cell;
    currentDirection = Direction.north;
    visitedStack: Cell[] = [];
    deltaMs = 0;
    lastUpdated = 0;

    constructor(maze: Maze, startPos: Point, timeStepIntervalMs = 500) {
        this.maze = maze;
        this.currentCell = this.maze.getCell(startPos.x, startPos.y);
        if (this.currentCell.isOutOfBounds(this.maze.size)) {
            throw new Error(`Start cell ${this.currentCell.position} is out of bounds`);
        }
        this.timeStepIntervalMs = timeStepIntervalMs;
    }
    
    update(ts: DOMHighResTimeStamp) {

        this.deltaMs += (ts - this.lastUpdated);
        if (this.deltaMs < this.timeStepIntervalMs) {
            return;
        }

        if (!this.currentCell.isExit) {
            let next = this.getNextCell();
            if (next) {
                this.currentCell.lastVisited = performance.now();
                this.visitedStack.push(this.currentCell); 
            } else {
                next = this.visitedStack.pop();
            }

            if (!next) throw new Error("Next is undefined")
            this.currentDirection = this.getDirection(next);
            this.currentCell = next;
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

        const { x, y, width, height } = this.maze.getCellRect(this.currentCell, canvasSize, 0.6);
        ctx.fillStyle = ColorTheme.walker;
        ctx.fillRect(x,  y, width, height)
    }

    private getNextCell(): Cell | undefined {
        const neighbours = this.currentCell.directions.map(d => this.getNeighbour(this.currentCell, d));
        let unchartedNeighbours = neighbours.filter(neighbour => neighbour.uncharted);

        for (const neighbour of unchartedNeighbours) {
            const direction = this.getDirection(neighbour);
            const deadEndPath = this.detectDeadEndPath(neighbour, direction);
            if (deadEndPath) {
                const exitFound = deadEndPath.find(cell => cell.isExit);
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
            .sort((a, b) => b.directions.length - a.directions.length);

        if (this.isDirectionAboutToChange(unchartedNeighbours)) {
            const exitPath = this.detectExitPath(this.currentCell);
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
            .flatMap(x => x.directions)
            .filter((cell, i, arr) => arr.indexOf(cell) === i);
        
            return possibleDirections.indexOf(this.currentDirection) === -1;
    }

    private detectDeadEndPath(cell: Cell, direction: Direction): Cell[] | false {
        const oppositeDirection = direction < 2 ? direction + 2 : direction - 2;
        const deadEndPath = [] as Cell[];
        while (!cell.walls[direction]) {
            if (cell.directions.length !== 2 || 
                cell.directions.indexOf(direction) === -1 || 
                cell.directions.indexOf(oppositeDirection) === -1) {
                break;
            }
            deadEndPath.push(cell);
            cell = this.getNeighbour(cell, direction);
        }

        if (cell.directions.length === 1) {
            deadEndPath.push(cell);
            return deadEndPath;
        }
        return false;
    }

    private detectExitPath(cell: Cell): Cell[] | false {
        for (const direction of cell.directions) {
            const exitPath: Cell[] = [];
            const neighbour = this.getNeighbour(cell, direction);
            let next = neighbour;
            do {
                exitPath.push(next);
                if (next.isExit) {
                    console.log("exit found");
                    return exitPath;
                }
                next = this.getNeighbour(next, direction);
            } while (!next.walls[direction])

            if (next.isExit) {
                console.log("exit found");
                return exitPath;
            }
        } 
        return false;
    }

    private pickOptimalNextCell(orderedUnvisitedNeighbours: Cell[]): Cell | undefined {
        const mostAvailableDirections = orderedUnvisitedNeighbours[0].directions.length;
        const topRanking = orderedUnvisitedNeighbours.filter(x => x.directions.length === mostAvailableDirections);

        if (topRanking.length > 0) {
            const randomIndex = Math.floor(Math.random() * topRanking.length);
            return topRanking[randomIndex];
        }
        
        this.currentCell.lastVisited = performance.now();
        return undefined;
    }

    private getDirection(next: Cell): Direction {
        if (this.currentCell.position.y > next.position.y) {
            return Direction.north;
        }
        if (this.currentCell.position.x < next.position.x) {
            return Direction.east;
        }
        if (this.currentCell.position.y < next.position.y) {
            return Direction.south;
        }
        if (this.currentCell.position.x > next.position.x) {
            return Direction.west;
        }
        return this.currentDirection;
    }
}
