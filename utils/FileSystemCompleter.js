import { parse, sep } from "path";
import { promises as fsPromises } from "fs";

export default function fileSystemCompleter(line, callback) {
	let { dir, base } = parse(line);

	fsPromises
		.readdir(dir, { withFileTypes: true })
		.then(dirEntries => {
			// for an exact match that is a directory, read the contents of the directory
			if (dirEntries.find(entry => entry.name === base && entry.isDirectory())) {
				dir = dir === "/" || dir === sep ? `${dir}${base}` : `${dir}/${base}`;
				return fsPromises.readdir(dir, { withFileTypes: true });
			}
			return dirEntries.filter(entry => entry.name.startsWith(base));
		})
		.then(matchingEntries => {
			if (dir === sep || dir === "/") {
				dir = "";
			}
			const hits = matchingEntries
				.filter(entry => entry.isFile() || entry.isDirectory())
				.map(entry => `${dir}/${entry.name}${entry.isDirectory() && !entry.name.endsWith("/") ? "/" : ""}`);
			callback(null, [hits, line]);
		})
		.catch(() => callback(null, [[], line]));
}
