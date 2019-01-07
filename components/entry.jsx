import React from "react";
import ReactDOM from "react-dom";
import App from "./app";

document.addEventListener("DOMContentLoaded", () => {
	const root = document.createElement("div");
	root.setAttribute("id", "root");

	const meta = document.createElement("meta");
	meta.name = "viewport";
	meta.content = "width=device-width, initial-scale=1";

	document.body.appendChild(root);
	document.head.appendChild(meta);

	let state;
	try {
		state = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
	} catch (e) {
		console.warn("Unable to parse state from url, resorting to default");
	}

	if (state && typeof state === "object") {
		ReactDOM.render(<App state={state} />, root);
	} else {
		ReactDOM.render(<App />, root);
	}
});
