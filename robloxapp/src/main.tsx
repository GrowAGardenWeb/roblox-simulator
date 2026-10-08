// The original exported application uses its own bundled React runtime.
// Keeping the matching renderer prevents duplicate-React hook errors.
// @ts-expect-error The recovered source bundle does not include declarations.
import App from "./original/App.js";
// @ts-expect-error The recovered source bundle does not include declarations.
import { mountOriginalApp } from "./original/runtime.js";
import "./original/styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root application element");
}

mountOriginalApp(App, root);
