import { existsSync, rmSync } from "fs";
import { promisifyQuestion, rl, list } from "../utils/PromisifyInput.js";
import { promises as fsPromises } from "fs";
import { createDirectory, runCommandOnFolder } from "../cli_commands.js";
import { startAnimation, stopAnimation, setMessage } from "../utils/TerminalLoaderIndicator.js";
import chalk from "chalk";

const okStyle = chalk.green.bold;
const errorStyle = chalk.red.bold;

export default async (cmd, opts, appDir) => {
	let projectName = cmd ?? null;
	let projectPath = opts.path ?? null;

	try {
		if (!projectName) {
			await promisifyQuestion("❔ What is the name of the project?\n").then(name => {
				projectName = name;
			});
		}

		projectName = projectName.replace(/\s/g, "_");

		const validName = new RegExp(/^[a-zA-Z0-9_-]+$/).test(projectName);
		if (!validName) {
			handleError("Invalid project name. Project name must be a valid folder name format.");
		}

		if (!projectPath) {
			await promisifyQuestion(
				`❔ Where do you want to create the project ${projectName}? (leave empty for current path)\n`,
			).then(path => {
				if (path === "." || path.length === 0) {
					projectPath = "./";
				} else {
					projectPath = path;
				}
			});
		}

		if (!existsSync(projectPath)) {
			handleError(`${projectPath} path does not exists`);
		}

		if (existsSync(`${projectPath}${projectName}`)) {
			handleError(`Folder ${projectName} already exists on the ${projectPath} folder.`);
		}

		await createDirectory(`${projectPath}${projectName}`);

		await runCommandOnFolder(`${projectPath}${projectName}`, "npm init -y");

		console.log(okStyle(`✅ Project ${projectName} will be create on ${projectPath}${projectName}.`));
	} catch (err) {
		handleError(err);
		return;
	}

	try {
		const folders = await promisifyQuestion(
			"❔ Which apps should this project have? (ex: client,backoffice,server) (separate by comma)\n",
		);

		const apps = folders.split(",").map((el, index) => ({
			name: el,
			path: `${projectPath}${projectName}/${el}`,
			port: 3000 + index,
		}));

		for (let i = 0; i <= apps.length - 1; i++) {
			const app = apps[i];

			const isNameValid = new RegExp(/^[a-zA-Z0-9_-]+$/).test(app.name);

			if (!isNameValid) {
				handleError(
					"Invalid app name format.\nApp names must not contain special characters.",
					`${projectPath}${projectName}`,
				);
			}

			await list({
				name: "devEnv",
				message: `❔ Do you want to install any development environment on ${app.name}?`,
				choices: ["vite", "none"],
			}).then(res => {
				app.devEnv = res.devEnv;
			});
		}

		startAnimation();

		for (let i = 0; i < apps.length; i++) {
			const app = apps[i];

			setMessage(`Creating ${app.name}`);

			if (app.devEnv !== "none") {
				if (app.devEnv !== "vite") {
					handleError(
						`${app.devEnv} is not supported dev environment. Use vite instead.`,
						`${projectPath}${projectName}`,
					);
					return;
				}

				setMessage(`Creating ${app.name} - Installing and initializing vite`);
				//init vite
				await runCommandOnFolder(
					`${projectPath}${projectName}`,
					`npm create vite@latest ${app.name} -- --template react`,
				);

				//install dependencies
				await runCommandOnFolder(app.path, "npm install");

				setMessage(`Creating ${app.name} - Removing unnecessary files`);
				//remove eslintrc, README and gitignore
				await fsPromises.rm(`${app.path}/.eslintrc.cjs`);
				await fsPromises.rm(`${app.path}/.gitignore`);
				await fsPromises.rm(`${app.path}/README.md`);

				setMessage(`Creating ${app.name} - Setting package.json scripts`);
				//change package.json scripts, vite config and create envDir
				const contents = await fsPromises.readFile(`${app.path}/package.json`, "utf-8");
				const replacement = contents
					.replace(/"dev": "vite"/, `"dev": "vite --open --port ${app.port}"`)
					.replace(
						/"build": "vite build"/,
						`"build-patch": "npm version patch && vite build",\n    "build-minor": "npm version minor && vite build",\n    "build-major": "npm version major && vite build"`,
					)
					.replace(
						/"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",\n/,
						"",
					);

				await fsPromises.writeFile(`${app.path}/package.json`, replacement);

				//copy vite config template
				setMessage(`Creating ${app.name} - Updating vite config`);
				await fsPromises.copyFile(`${appDir}/filesTemplate/vite.config.js`, `${app.path}/vite.config.js`);

				//create envDir
				setMessage(`Creating ${app.name} - Setup env folder and files`);
				await createDirectory(`${app.path}/envDir`);

				//create env files
				await fsPromises.writeFile(`${app.path}/envDir/.env.production`, "", "utf-8");
				await fsPromises.writeFile(`${app.path}/envDir/.env.development`, "", "utf-8");

				continue;
			}

			//create server folder
			setMessage(`Creating ${app.name}`);
			await createDirectory(`${app.path}`);

			//init npm
			setMessage(`Creating ${app.name} - Initializing npm`);
			await runCommandOnFolder(`${app.path}`, "npm init -y");

			//create index.js file
			await fsPromises.writeFile(`${app.path}/index.js`, `//${app.name} entry file`, "utf-8");
		}

		//install biome
		setMessage(`Setting up ${projectName} - Install and initialize Biomejs`);
		await runCommandOnFolder(`${projectPath}${projectName}`, "npm install --save-dev --save-exact @biomejs/biome");

		//copy biome and gitignore, and create readme
		setMessage(`Setting up ${projectName} - Config biome, gitignore and readme files`);
		await fsPromises.copyFile(`${appDir}/filesTemplate/biome.json`, `${projectPath}${projectName}/biome.json`);
		await fsPromises.copyFile(`${appDir}/filesTemplate/.gitignore`, `${projectPath}${projectName}/.gitignore`);

		await fsPromises.writeFile(`${projectPath}${projectName}/README.md`, `#${projectName}`, "utf-8");

		//Update biome schema
		setMessage(`Setting up ${projectName} - Updating biome schema`);
		await runCommandOnFolder(`${projectPath}${projectName}`, "npx @biomejs/biome migrate --write");

		setMessage(`Setting up ${projectName} - Creating package.json scripts`);
		//config scripts on parent package.json
		const appsRunScripts = apps.map(el => {
			if (el.devEnv) return `"${el.name}": "cd ${el.name} && npm run dev",`;
			return `"${el.name}": "cd ${el.name} && node index.js",`;
		});

		const parentScripts = [
			...appsRunScripts,
			`"lint": "npx @biomejs/biome lint .",`,
			`"format": "npx @biomejs/biome format . --write",`,
			`"check": "npx @biomejs/biome check ."`,
		];

		const contents = await fsPromises.readFile(`${projectPath}${projectName}/package.json`, "utf-8");
		const replacement = contents.replace(
			/"test": "echo \\"Error: no test specified\\" && exit 1"/,
			parentScripts.join("\n    "),
		);

		await fsPromises.writeFile(`${projectPath}${projectName}/package.json`, replacement);
	} catch (err) {
		handleError(err, `${projectPath}${projectName}`);
		return;
	}

	stopAnimation();
	console.log(okStyle(`\r✅ ${projectName} project created`));
	rl.close();
};

const handleError = (err, path) => {
	console.log(errorStyle(`\n❌ ${err}`));
	if (path) {
		rmSync(path, { recursive: true, force: true });
	}

	rl.close();
};
