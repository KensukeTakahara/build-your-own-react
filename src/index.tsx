import React from "./myReact";

const App = (props: any) => <h1>Hi {props.name}</h1>;

const element = <App name="foo" />;

const container = document.getElementById("root");
React.render(element, container);
