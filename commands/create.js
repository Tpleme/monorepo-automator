const readline = require("readline");
const fs = require("fs");
const { promises: fsPromises } = require("fs");
const { fileSystemCompleter } = require("../utils/FileSystemCompleter");
const { createDirectory, runCommandOnFolder } = require("../cli_commands");
const { startAnimation, stopAnimation, setMessage } = require("../utils/TerminalLoaderIndicator");
const chalk = require("chalk");
const { dirname } = require("path");

const appDir = dirname(require.main.filename);

const questionStyle = chalk.cyan.bold;
const okStyle = chalk.green.bold;
const errorStyle = chalk.red.bold;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

const promisifyQuestion = question => {
	return new Promise(resolve => rl.question(questionStyle(question), res => resolve(res)));
};

const create = async (cmd, opts) => {
	let projectName = cmd ?? null;
	let projectPath = opts.path ?? null;

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

	try {
		if (!fs.existsSync(projectPath)) {
			handleError(`${projectPath} path does not exists`);
		}

		await createDirectory(`${projectPath}${projectName}`);

		await runCommandOnFolder(`${projectPath}${projectName}`, "npm init -y");

		console.log(okStyle(`✅ Project ${projectName} will be create on ${projectPath}${projectName}.`));
	} catch (err) {
		handleError(err);
		return;
	}

	const folders = await promisifyQuestion(
		"❔ Which subfolders should this project have? (ex: client(vite) backoffice(vite) server) (separate by space)\n",
	);

	const validFolders = new RegExp(/^([a-zA-Z]+(?:-[a-zA-Z]+)?(\([a-zA-Z]+(?:-[a-zA-Z]+)?\))?\s*)*$/).test(folders);

	if (!validFolders) {
		handleError(
			"Invalid subfolders format.\nSubfolder names must not contain special characters or numbers.\nAll subfolders must be separated by a space and can be followed by and development environment inside parenthesis. ",
			`${projectPath}${projectName}`,
		);
	}

	const foldersArray = folders.split(" ");
	startAnimation();

	const mappedFolders = foldersArray.map((el, index) => ({
		folder: el.split("(")[0],
		devEnv: el.split("(")[1]?.replace(")", ""),
		path: `${projectPath}${projectName}/${el.split("(")[0]}`,
		port: 3000 + index,
	}));

	for (let i = 0; i < mappedFolders.length; i++) {
		const app = mappedFolders[i];

		setMessage(`Creating ${app.folder}`);

		try {
			if (app.devEnv) {
				if (app.devEnv !== "vite") {
					handleError(
						`${app.devEnv} is not supported dev environment. Use vite instead.`,
						`${projectPath}${projectName}`,
					);
					return;
				}

				setMessage(`Creating ${app.folder} - Installing and initializing vite`);
				//init vite
				await runCommandOnFolder(
					`${projectPath}${projectName}`,
					`npm create vite@latest ${app.folder} -- --template react`,
				);

				//install dependencies
				await runCommandOnFolder(app.path, "npm install");

				setMessage(`Creating ${app.folder} - Removing unnecessary files`);
				//remove eslintrc, README and gitignore
				await fsPromises.rm(`${app.path}/.eslintrc.cjs`);
				await fsPromises.rm(`${app.path}/.gitignore`);
				await fsPromises.rm(`${app.path}/README.md`);

				setMessage(`Creating ${app.folder} - Setting package.json scripts`);
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
				setMessage(`Creating ${app.folder} - Updating vite config`);
				await fsPromises.copyFile(`${appDir}/filesTemplate/vite.config.js`, `${app.path}/vite.config.js`);

				//create envDir
				setMessage(`Creating ${app.folder} - Setup env folder and files`);
				await createDirectory(`${app.path}/envDir`);

				//create env files
				await fsPromises.writeFile(`${app.path}/envDir/.env.production`, "", "utf-8");
				await fsPromises.writeFile(`${app.path}/envDir/.env.development`, "", "utf-8");

				continue;
			}

			//create server folder
			setMessage(`Creating ${app.folder}`);
			await createDirectory(`${app.path}`);

			//init npm
			setMessage(`Creating ${app.folder} - Initializing npm`);
			await runCommandOnFolder(`${app.path}`, "npm init -y");

			//create index.js file
			await fsPromises.writeFile(`${app.path}/index.js`, `//${app.folder} entry file`, "utf-8");
		} catch (err) {
			handleError(err, `${projectPath}${projectName}`);
			return;
		}
	}

	//install biome
	setMessage(`Setting up ${projectName} - Install and initialize Biomejs`);
	try {
		await runCommandOnFolder(`${projectPath}${projectName}`, "npm install --save-dev --save-exact @biomejs/biome");

		//copy biome and gitignore, and create readme
		setMessage(`Setting up ${projectName} - Config biome, gitignore and readme files`);
		await fsPromises.copyFile(`${appDir}/filesTemplate/biome.json`, `${projectPath}${projectName}/biome.json`);
		await fsPromises.copyFile(`${appDir}/filesTemplate/.gitignore`, `${projectPath}${projectName}/.gitignore`);

		await fsPromises.writeFile(`${projectPath}${projectName}/README.md`, `#${projectName}`, "utf-8");

		//Update biome schema
		setMessage(`Setting up ${projectName} - Updating biome schema`);
		await runCommandOnFolder(`${projectPath}${projectName}`, "npx @biomejs/biome migrate --write");
	} catch (err) {
		handleError(err, `${projectPath}${projectName}`);
		return;
	}

	setMessage(`Setting up ${projectName} - Creating package.json scripts`);
	//config scripts on parent package.json
	const appsRunScripts = mappedFolders.map(el => {
		if (el.devEnv) return `"${el.folder}": "cd ${el.folder} && npm run dev",`;
		return `"${el.folder}": "cd ${el.folder} && node index.js",`;
	});

	const parentScripts = [
		...appsRunScripts,
		`"lint": "npx @biomejs/biome lint .",`,
		`"format": "npx @biomejs/biome format . --write",`,
		`"check": "npx @biomejs/biome check ."`,
	];

	try {
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
		fs.rmSync(path, { recursive: true, force: true });
	}

	rl.close();
};

rl.on("close", () => {
	process.exit(0);
});

module.exports = {
	create,
};
