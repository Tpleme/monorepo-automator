import { createInterface } from "readline";
import fileSystemCompleter from "./FileSystemCompleter.js";
import chalk from "chalk";

//TODO: until inquirer builds a completer, we need to use readline for the questions,
//the thing is that this way we have 2 streams so the select questions prints 2 outputs

export const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

export const promisifyQuestion = question => {
	return new Promise(resolve => rl.question(chalk.cyan.bold(question), res => resolve(res)));
};

rl.on("close", () => {
	process.exit(0);
});
