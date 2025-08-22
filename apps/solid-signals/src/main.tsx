import { render } from "solid-js/web";
import App from "./App";

import { Perf } from "./lib/perf";

Perf.installPerfGlobals();
render(() => <App />, document.getElementById("root")!);
