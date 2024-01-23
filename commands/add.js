import { existsSync, rmSync, readdirSync } from "fs";
import { promisifyQuestion } from "../utils/PromisifyInput.js";
import { promises as fsPromises } from "fs";
import { createDirectory, runCommandOnFolder } from "../cli_commands.js";
import { startAnimation, stopAnimation, setMessage } from "../utils/TerminalLoaderIndicator.js";
import chalk from "chalk";
import { select } from "../utils/SelectPrompt.js";
import SelectOptions from "../data/SelectOptions.js";
import { addScriptToPackageJson, appendToFile, buildPackageScripts } from "../utils/AppendToFile.js";
import { configText } from "../filesTemplate/viteconfig.js";

const okStyle = chalk.green.bold;
const errorStyle = chalk.red.bold;

export default async (cmd, opts) => {
	let appName = cmd ?? null;
	let devEnv = opts.env ?? null;
	let appPath = opts.path ?? null;

	try {
		appName = appName.replace(/\s/g, "_");

		const validName = new RegExp(/^[a-zA-Z0-9_-]+$/).test(appName);

		if (!validName) {
			handleError("Invalid project name. Project name must be a valid folder name format.");
		}

		if (!appPath) {
			await promisifyQuestion(
				`❔ Where do you want to create the app ${appName}? (leave empty for current path)`,
			).then(path => {
				if (path === "." || path.length === 0) {
					appPath = "./";
				} else {
					appPath = path;
				}
			});
		}

		//check if parent dir exists
		if (!existsSync(appPath)) {
			handleError(`${appPath} path does not exists`);
		}

		//checks if app folder already exists
		if (existsSync(`${appPath}${appName}`)) {
			handleError(`${appName} already exists in the project folder.`);
		}

		// console.log(okStyle(`✅ App ${appName} will be create on ${appPath}${appName}.`));
	} catch (err) {
		handleError(err);
		return;
	}

	try {
		if (!devEnv) {
			await select({
				question: "❔ Do you want to install any development environment?",
				options: SelectOptions,
			}).then(res => {
				devEnv = res;
			});
		}

		if (devEnv !== "none") {
			if (devEnv !== "vite") {
				handleError(`${devEnv} is not supported dev environment. Use vite instead.`, `${appPath}${appName}`);
				return;
			}

			const devEnvObject = SelectOptions.find(el => el.value === devEnv);

			if (!devEnvObject) handleError("Error: devEnvObject not found", `${appPath}${appName}`);

			const framework = await select({
				question: `❔ Pick a framework for the app ${appName}:`,
				options: devEnvObject.frameworks,
			});

			const devEnvObjectFramework = devEnvObject.frameworks.find(el => el.value === framework);

			if (!devEnvObjectFramework) handleError("Error: devEnvObjectFramework not found", `${appPath}${appName}`);

			const type = await select({
				question: "❔ Pick one:",
				options: devEnvObjectFramework.type,
			});

			startAnimation();

			setMessage(`Creating ${appName} - Installing and initializing vite`);
			//init vite
			await runCommandOnFolder(
				`${appPath}`,
				`npm create vite@latest ${appName} -- --template ${framework}${type.length === 0 ? "" : `-${type}`}`,
			);

			//install dependencies
			await runCommandOnFolder(`${appPath}${appName}`, "npm install");

			setMessage(`Creating ${appName} - Removing unnecessary files`);
			//remove eslintrc, README and gitignore
			if (existsSync(`${appPath}${appName}/.eslintrc.cjs`)) {
				await fsPromises.rm(`${appPath}${appName}/.eslintrc.cjs`);
			}

			if (existsSync(`${appPath}${appName}/.gitignore`)) {
				await fsPromises.rm(`${appPath}${appName}/.gitignore`);
			}

			if (existsSync(`${appPath}${appName}/README.md`)) {
				await fsPromises.rm(`${appPath}${appName}/README.md`);
			}

			setMessage(`Creating ${appName} - Setting package.json scripts`);

			//count the number of folders and add to calculate the default port number
			const numberOfFolders = readdirSync(appPath);

			//change package.json scripts, vite config and create envDir
			const contents = await fsPromises.readFile(`${appPath}${appName}/package.json`, "utf-8");
			const replacement = contents
				.replace(/"dev": "vite"/, `"dev": "vite --open --port ${3000 + numberOfFolders.length}"`)
				.replace(/"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",\n/, "");

			await fsPromises.writeFile(`${appPath}${appName}/package.json`, replacement);

			await buildPackageScripts(`${appPath}${appName}/package.json`);

			//Add start script to parent package.json
			if (existsSync(`${appPath}/package.json`)) {
				await addScriptToPackageJson(`${appPath}/package.json`, `cd ${appName} && npm run dev`, appName);
			}

			//update vite config file
			setMessage(`Creating ${appName} - Updating vite config`);
			const fileExtension = `${type === "ts" || type === "swc-ts" ? "ts" : "js"}`;

			if (existsSync(`${appPath}${appName}/vite.config.${fileExtension}`)) {
				await appendToFile(configText, 5, `${appPath}${appName}/vite.config.${fileExtension}`);
				await appendToFile(`import path from "path";`, 1, `${appPath}${appName}/vite.config.${fileExtension}`);
			}

			//create envDir
			setMessage(`Creating ${appName} - Setup env folder and files`);
			await createDirectory(`${appPath}${appName}/envDir`);

			//create env files
			await fsPromises.writeFile(`${appPath}${appName}/envDir/.env.production`, "", "utf-8");
			await fsPromises.writeFile(`${appPath}${appName}/envDir/.env.development`, "", "utf-8");
		} else {
			startAnimation();

			//create server folder
			setMessage(`Creating ${appName}`);
			await createDirectory(`${appPath}${appName}`);

			//init npm
			setMessage(`Creating ${appName} - Initializing npm`);
			await runCommandOnFolder(`${appPath}${appName}`, "npm init -y");

			//Add start script to parent package.json
			if (existsSync(`${appPath}/package.json`)) {
				await addScriptToPackageJson(`${appPath}/package.json`, `cd ${appName} && node index.js`, appName);
			}

			//create index.js file
			await fsPromises.writeFile(`${appPath}${appName}/index.js`, `//${appName} entry file`, "utf-8");
		}

		stopAnimation();
		console.log(okStyle(`\r✅ ${appName} app created`));
		process.exit(1);
	} catch (err) {
		handleError(err, `${appPath}${appName}`);
		return;
	}
};

const handleError = (err, path) => {
	console.log(errorStyle(`\n❌ ${err}`));
	if (path) {
		rmSync(path, { recursive: true, force: true });
	}

	process.exit(1);
};
