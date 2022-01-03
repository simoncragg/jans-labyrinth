import React, { useEffect, useRef } from "react";
import { Maze } from "./Maze";
import { Size } from "./Size";

const App = () => {

  const mazeSize: Size = new Size(10, 10);
  const canvasSize: Size = new Size(500, 500);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maze = useRef<Maze>(new Maze(mazeSize));
  
  // const update = (ts: DOMHighResTimeStamp) => {};

  useEffect(() => {
      const canvas = canvasRef.current as HTMLCanvasElement;
      if (!canvas) throw new Error("No canvas!");
      maze.current.draw(canvas.getContext("2d"), canvasSize);
      //window.requestAnimationFrame(update);
  });

  return (
    <>
      <h1>Jan&apos;s Labyrinth</h1>
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />
    </>
  );
};

export default App;