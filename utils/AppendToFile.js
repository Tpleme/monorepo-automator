import { readFileSync, writeFileSync } from "fs";

export async function appendToFile(replacement, line, file) {
	const lineNum = line || 0;
	const body = readFileSync(file).toString();

	const splittedBody = body.split("\n");
	splittedBody.splice(lineNum + 1, 0, replacement);
	const output = splittedBody.join("\n");
	writeFileSync(file, output);
}

export async function buildPackageScripts(file) {
	const content = JSON.parse(readFileSync(file).toString());

	const scripts = content.scripts;

	const newScripts = {
		...scripts,
		"build-patch": `npm version patch && ${scripts.build}`,
		"build-minor": `npm version minor && ${scripts.build}`,
		"build-major": `npm version major && ${scripts.build}`,
	};

	const output = { ...content, scripts: newScripts };

	writeFileSync(file, JSON.stringify(output, null, 4));
}

export async function addScriptToPackageJson(file, script, scriptName) {
	const content = JSON.parse(readFileSync(file).toString());

	const scripts = content.scripts;

	const newScripts = {
		...scripts,
		[scriptName]: script,
	};

	const output = { ...content, scripts: newScripts };
	writeFileSync(file, JSON.stringify(output, null, 4));
}
