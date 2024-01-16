import { existsSync, rmSync } from "fs";
import { promisifyQuestion, rl } from "../utils/PromisifyInput.js";
import { selectList } from "../utils/InquirerPrompts.js";
import { promises as fsPromises } from "fs";
import { createDirectory, runCommandOnFolder } from "../cli_commands.js";
import { startAnimation, stopAnimation, setMessage } from "../utils/TerminalLoaderIndicator.js";
import chalk from "chalk";

const okStyle = chalk.green.bold;
const errorStyle = chalk.red.bold;

export default async (cmd, opts, appDir) => {
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
				`❔ Where do you want to create the app ${appName}? (leave empty for current path)\n`,
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

		console.log(okStyle(`✅ App ${appName} will be create on ${appPath}${appName}.`));
	} catch (err) {
		handleError(err);
		return;
	}

	try {
		if (!devEnv) {
			await selectList({
				message: "❔ Do you want to install any development environment?",
				choices: [
					{ name: "Vite", value: "vite" },
					{ name: "None", value: "none" },
				],
			}).then(res => {
				devEnv = res;
			});
		}

		if (devEnv !== "none") {
			if (devEnv !== "vite") {
				handleError(`${devEnv} is not supported dev environment. Use vite instead.`, `${appPath}${appName}`);
				return;
			}

			const framework = await selectList({
				message: `❔ Pick a framework for the app ${appName}?`,
				choices: [
					{ name: "Vue", value: "vue", description: `Build ${appName} using Vue` },
					{ name: "React", value: "react", description: `Build ${appName} using React` },
					{ name: "Preact", value: "preact", description: `Build ${appName} using Preact` },
					{ name: "Lit", value: "lit", description: `Build ${appName} using Lit` },
					{ name: "Svelte", value: "svelte", description: `Build ${appName} using Svelte` },
					{ name: "Qwik", value: "qwik", description: `Build ${appName} using Qwik` },
				],
			});

			startAnimation();

			setMessage(`Creating ${appName} - Installing and initializing vite`);
			//init vite
			await runCommandOnFolder(`${appPath}`, `npm create vite@latest ${appName} -- --template ${framework}`);

			//install dependencies
			await runCommandOnFolder(`${appPath}${appName}`, "npm install");

			setMessage(`Creating ${appName} - Removing unnecessary files`);
			//remove eslintrc, README and gitignore
			await fsPromises.rm(`${appPath}${appName}/.eslintrc.cjs`);
			await fsPromises.rm(`${appPath}${appName}/.gitignore`);
			await fsPromises.rm(`${appPath}${appName}/README.md`);

			setMessage(`Creating ${appName} - Setting package.json scripts`);

			//change package.json scripts, vite config and create envDir
			const contents = await fsPromises.readFile(`${appPath}${appName}/package.json`, "utf-8");
			const replacement = contents
				.replace(/"dev": "vite"/, `"dev": "vite --open --port ${3000}"`)
				.replace(
					/"build": "vite build"/,
					`"build-patch": "npm version patch && vite build",\n    "build-minor": "npm version minor && vite build",\n    "build-major": "npm version major && vite build"`,
				)
				.replace(/"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",\n/, "");

			await fsPromises.writeFile(`${appPath}${appName}/package.json`, replacement);
			//copy vite config template
			setMessage(`Creating ${appName} - Updating vite config`);
			await fsPromises.copyFile(`${appDir}/filesTemplate/vite.config.js`, `${appPath}${appName}/vite.config.js`);

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

			//create index.js file
			await fsPromises.writeFile(`${appPath}${appName}/index.js`, `//${appName} entry file`, "utf-8");
		}

		stopAnimation();
		console.log(okStyle(`\r✅ ${appName} app created`));
		rl.close();
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

	rl.close();
};
