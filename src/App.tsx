import React, { useEffect, useRef } from "react";
import { Maze } from "./Maze";
import { Size } from "./Size";

const App = () => {

  const mazeSize: Size = new Size(100, 100);
  const canvasSize: Size = new Size(1200, 600);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maze = useRef<Maze>(new Maze(mazeSize));
  
  // const update = (ts: DOMHighResTimeStamp) => {};

  useEffect(() => {
      const canvas = canvasRef.current as HTMLCanvasElement;
      if (!canvas) throw new Error("No canvas!");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No context!");
      context.strokeStyle = "#eeeeee";
      maze.current.draw(context, canvasSize);
      //window.requestAnimationFrame(update);
  });

  return (
    <>
      <h1>Jan&apos;s Labyrinth</h1>
      <canvas id="maze" ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />
    </>
  );
};

export default App;