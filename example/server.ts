import { setup } from "../server.ts";

import * as $0 from "./pages/[name].tsx";
import * as $1 from "./pages/index.tsx";

setup([[$0, "./pages/[name].tsx"], [$1, "./pages/index.tsx"]], import.meta.url);
