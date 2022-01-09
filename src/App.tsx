import React, { useEffect, useRef } from "react";
import { Maze } from "./Maze";
import { MazeBuilder } from "./MazeBuilder";
import { MazeWalker } from "./MazeWalker";
import { Point } from "./Point";
import { Size } from "./Size";
import { ColorTheme as ColorTheme } from "./ColorTheme";

const mazeSize = new Size(20, 10);
const canvasSize = new Size(1200, 600);
const startPoint = new Point(0, 0)
const exitPoints = [new Point(mazeSize.width - 1, mazeSize.height - 1)];

const App = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mazeBuilderRef = useRef(new MazeBuilder());
  const mazeRef = useRef<Maze>(mazeBuilderRef.current.build(mazeSize, exitPoints));
  const mazeWalkerRef = useRef<MazeWalker>(new MazeWalker(mazeRef.current, startPoint));
  
  const update = (ts: DOMHighResTimeStamp) => {
    mazeWalkerRef.current.update(ts);
    mazeRef.current.draw(ctxRef.current, canvasSize);
    mazeWalkerRef.current.draw(ctxRef.current, canvasSize);
    window.requestAnimationFrame(update);
  };

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) throw new Error("No canvas!");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No context!");
    ctxRef.current= ctx;
    ctx.strokeStyle = ColorTheme.mazeWall;
    mazeRef.current.draw(ctx, canvasSize);
    window.requestAnimationFrame(update);
  });

  return (
    <>
      <h1>Jan&apos;s Labyrinth</h1>
      <canvas id="maze" ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />
    </>
  );
};

export default App;