#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs");
const { promises: fsPromises } = require("fs");
const { fileSystemCompleter } = require("./utils/FileSystemCompleter");
const { createDirectory, runCommandOnFolder } = require("./commands/Commands");
const { startAnimation, stopAnimation, setMessage } = require("./utils/TerminalLoaderIndicator");

const templateFilesPath = "../@tpleme/monorepo-automator/filesTemplate";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

rl.question("❔ What is the name of the project?\n", name => {
	name = name.replace(/\s/g, "_");

	rl.question(`❔ Where do you want to create the project ${name}? (leave empty for current path)\n`, async path => {
		if (path === "." || path.length === 0) {
			path = "./";
		}

		if (!fs.existsSync(path)) {
			handleError(`❌ ${path} does not exists`);
		}

		try {
			await createDirectory(`${path}${name}`);

			await runCommandOnFolder(`${path}${name}`, "npm init -y");

			console.log(`✅ Project ${name} will be create on ${path}${name}.`);
		} catch (err) {
			handleError(err);
			return;
		}

		rl.question(
			"❔ Which subfolders should this project have? (ex: client(vite) backoffice(vite) server) (separate by space)\n",
			async folders => {
				const foldersArray = folders.split(" ");
				startAnimation();

				const mappedFolders = foldersArray.map((el, index) => ({
					folder: el.split("(")[0],
					devEnv: el.split("(")[1]?.replace(")", ""),
					path: `${path}${name}/${el.split("(")[0]}`,
					port: 3000 + index,
				}));

				for (let i = 0; i < mappedFolders.length; i++) {
					const app = mappedFolders[i];

					setMessage(`Creating ${app.folder}`);

					try {
						if (app.devEnv) {
							if (app.devEnv !== "vite") {
								handleError(
									`❌ ${app.devEnv} is an unrecognizable dev environment. Use vite`,
									`${path}${name}`,
								);
								return;
							}

							setMessage(`Creating ${app.folder} - Installing and initializing vite`);
							//init vite
							await runCommandOnFolder(
								`${path}${name}`,
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

							setMessage(`Creating ${app.folder} - Updating vite config`);
							//copy vite config template
							// await fsPromises.copyFile("./filesTemplate/vite.config.js", `${app.path}/vite.config.js`);
							await fsPromises.copyFile(
								`${templateFilesPath}/vite.config.js`,
								`${app.path}/vite.config.js`,
							);

							setMessage(`Creating ${app.folder} - Setup env folder and files`);
							//create envDir
							await createDirectory(`${app.path}/envDir`);

							//create env files
							await fsPromises.writeFile(`${app.path}/envDir/.env.production`, "", "utf-8");
							await fsPromises.writeFile(`${app.path}/envDir/.env.development`, "", "utf-8");

							continue;
						}

						setMessage(`Creating ${app.folder}`);
						//create server folder
						await createDirectory(`${app.path}`);

						setMessage(`Creating ${app.folder} - Initializing npm`);
						//init npm
						await runCommandOnFolder(`${app.path}`, "npm init -y");

						//create index.js file
						await fsPromises.writeFile(`${app.path}/index.js`, `//${app.folder} entry file`, "utf-8");
					} catch (err) {
						handleError(err, `${path}${name}`);
						return;
					}
				}

				setMessage(`Setting up ${name} - Install and initialize Biomejs`);
				//install biome
				try {
					await runCommandOnFolder(`${path}${name}`, "npm install --save-dev --save-exact @biomejs/biome");

					setMessage(`Setting up ${name} - Config biome, gitignore and readme files`);
					//copy biome and gitignore, and create readme
					// await fsPromises.copyFile("./filesTemplate/biome.json", `${path}${name}/biome.json`);
					// await fsPromises.copyFile("./filesTemplate/.gitignore", `${path}${name}/.gitignore`);

					await fsPromises.copyFile(`${templateFilesPath}/biome.json`, `${path}${name}/biome.json`);
					await fsPromises.copyFile(`${templateFilesPath}/.gitignore`, `${path}${name}/.gitignore`);

					await fsPromises.writeFile(`${path}${name}/README.md`, `#${name}`, "utf-8");

					setMessage(`Setting up ${name} - Updating biome schema`);
					//Update biome schema
					await runCommandOnFolder(`${path}${name}`, "npx @biomejs/biome migrate --write");
				} catch (err) {
					handleError(err, `${path}${name}`);
					return;
				}

				setMessage(`Setting up ${name} - Creating package.json scripts`);
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
					const contents = await fsPromises.readFile(`${path}${name}/package.json`, "utf-8");
					const replacement = contents.replace(
						/"test": "echo \\"Error: no test specified\\" && exit 1"/,
						parentScripts.join("\n    "),
					);

					await fsPromises.writeFile(`${path}${name}/package.json`, replacement);
				} catch (err) {
					handleError(err, `${path}${name}`);
					return;
				}

				stopAnimation();
				console.log("\r✅ Project created");
				rl.close();
			},
		);
	});
});

const handleError = (err, path) => {
	console.log(`\n❌ ${err}`);
	if (path) {
		fs.rmSync(path, { recursive: true, force: true });
	}

	rl.close();
};

rl.on("close", () => {
	process.exit(0);
});
