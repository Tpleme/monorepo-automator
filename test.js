import { addScriptToPackageJson } from "./utils/AppendToFile.js";

await addScriptToPackageJson("./asd/package.json", "cd client && node index.js", "client");
