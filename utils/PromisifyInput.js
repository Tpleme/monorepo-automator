import { createInterface } from "readline";
import fileSystemCompleter from "./FileSystemCompleter.js";
import chalk from "chalk";
import ansiEraseLines from "./AnsiEraseLines.js";

export const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

export const promisifyQuestion = question => {
	return new Promise(resolve =>
		rl.question(chalk.cyan.bold(question), res => {
			// process.stdout.write(ansiEraseLines(1));
			// process.stdout.write("\u001B[2k\u001B[2A\u001B[G");
			// process.stdout.write(`${chalk.cyan.bold("aksld")} ${chalk.yellow(res)}`);
			resolve(res);
		}),
	);
};

rl.on("close", () => {
	process.exit(0);
});
