import React, { useEffect, useRef } from "react";
import { Maze } from "./Maze";
import { MazeBuilder } from "./MazeBuilder";
import { MazeWalker } from "./MazeWalker";
import { Point } from "./Point";
import { Size } from "./Size";
import { ColorTheme as ColorTheme } from "./ColorTheme";

const mazeSize: Size = new Size(100, 50);
const canvasSize: Size = new Size(1200, 600);
const exitPoint: Point = new Point(mazeSize.width - 1, mazeSize.height - 1);

const App = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeBuilderRef = useRef(new MazeBuilder());
  const mazeRef = useRef<Maze>(mazeBuilderRef.current.build(mazeSize));
  const mazeWalkerRef = useRef<MazeWalker>(new MazeWalker(mazeRef.current, new Point(0, 0), exitPoint));
  
  const update = (ts: DOMHighResTimeStamp) => {
  mazeWalkerRef.current.update(ts);

  const canvas = canvasRef.current as HTMLCanvasElement;
  if (!canvas) throw new Error("No canvas!");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No context!");
  mazeRef.current.draw(ctx, canvasSize);
  mazeWalkerRef.current.draw(ctx, canvasSize);
  window.requestAnimationFrame(update);
 };

  useEffect(() => {
      const canvas = canvasRef.current as HTMLCanvasElement;
      if (!canvas) throw new Error("No canvas!");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No context!");
      ctx.strokeStyle = ColorTheme.mazeWall;
      mazeRef.current.draw(ctx, canvasSize);
      window.requestAnimationFrame(update);
      mazeWalkerRef.current.draw(ctx, canvasSize);
  });

  return (
    <>
      <h1>Jan&apos;s Labyrinth</h1>
      <canvas id="maze" ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />
    </>
  );
};

export default App;