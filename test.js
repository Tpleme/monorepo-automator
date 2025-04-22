import { addScriptToPackageJson } from "./utils/AppendToFile.js";
import { runCommandOnFolder } from "./cli_commands.js";

// await addScriptToPackageJson("./asd/package.json", "cd client && node index.js", "client");

await runCommandOnFolder("./teste", "npm create vite@latest client -- --template react");
await runCommandOnFolder("./teste/client", "npm install");
