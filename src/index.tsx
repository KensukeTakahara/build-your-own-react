import React from "./myReact";

const element = (
  <div id="foo">
    <p>bar</p>
    <b />
  </div>
);

const container = document.getElementById("root");
React.render(element, container);