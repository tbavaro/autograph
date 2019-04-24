import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./App";
import "./index.css";
import * as registerServiceWorker from "./registerServiceWorker";

console.log(`Autograph version ${process.env.REACT_APP_VERSION}`);
ReactDOM.render(
  <App />,
  document.getElementById("root") as HTMLElement
);

// don't use service workers, and unregister one if we find it.
// autograh is dependent upon being able to fetch the document from
// google drive / google sheets, so this isn't helpful.
registerServiceWorker.unregister();
