import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";


describe("app component", () => {
  it("renders h1 title `Jan's Labyrinth`", () => {
    const { container } = render(<App />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <h1>
        Jan's Labyrinth
      </h1>
    `);
  });
});
