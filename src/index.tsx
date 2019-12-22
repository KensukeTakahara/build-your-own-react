import React from "./myReact";

const element = (
  <div id="foo">
    <p>bar</p>
    <b />
    <button onClick={() => console.log("clicked")}>button</button>
  </div>
);

const container = document.getElementById("root");
React.render(element, container);
