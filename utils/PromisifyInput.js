import { createInterface } from "readline";
import fileSystemCompleter from "./FileSystemCompleter.js";
import chalk from "chalk";
import eraseLines from "./EraseLines.js";

export const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: fileSystemCompleter,
});

export const promisifyQuestion = question => {
	return new Promise(resolve =>
		rl.question(chalk.cyan.bold(`${question}\n`), res => {
			eraseLines(2);
			console.log(`${chalk.cyan.bold(question)} ${chalk.yellow(res)}`);
			resolve(res);
		}),
	);
};

//writes to process.stdout in Node.js are sometimes asynchronous and may occur over multiple ticks of the Node.js event loop.
//Calling process.exit(), however, forces the process to exit before those additional writes to stdout can be performed.
//This is bad because we have many stdout in the application and sometimes the desire code is not executed when SIGINT
rl.on("close", () => {
	// process.exit(0);
});
