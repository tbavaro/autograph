import * as React from "react";
import * as ReactDOM from "react-dom";

import "./index.css";
import * as registerServiceWorker from "./registerServiceWorker";
import Root from "./Root";

console.log(`Autograph version ${process.env.REACT_APP_VERSION}`);
ReactDOM.render(
  <Root />,
  document.getElementById("root") as HTMLElement
);

// don't use service workers, and unregister one if we find it.
// autograh is dependent upon being able to fetch the document from
// google drive / google sheets, so this isn't helpful.
registerServiceWorker.unregister();
