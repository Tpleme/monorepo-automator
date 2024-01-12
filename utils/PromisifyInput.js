import { createInterface } from "readline";
import fileSystemCompleter from "./FileSystemCompleter.js";
import chalk from "chalk";
import inquirer from "inquirer";

export const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

export const promisifyQuestion = question => {
	return new Promise(resolve => rl.question(chalk.cyan.bold(question), res => resolve(res)));
};

export const list = ({ name, message, choices }) => {
	return inquirer.prompt({
		type: "list",
		name,
		message: chalk.cyan.bold(message),
		choices,
		prefix: "",
	});
};

rl.on("close", () => {
	process.exit(0);
});
