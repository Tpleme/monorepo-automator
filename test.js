import { emitKeypressEvents } from "readline";
import eraseLines from "./utils/EraseLines.js";
import { existsSync, rmSync } from "fs";
import { promisifyQuestion, rl } from "./utils/PromisifyInput.js";
import { promises as fsPromises } from "fs";
import { createDirectory, runCommandOnFolder } from "./cli_commands.js";
import { startAnimation, stopAnimation, setMessage } from "./utils/TerminalLoaderIndicator.js";
import chalk from "chalk";

const input = process.stdin;
const output = process.stdout;

export const select = async opts => {
	return new Promise((resolve, reject) => init(opts, resolve, reject));
};

async function init(opts, resolve, reject) {
	let { question, options, pointer } = opts;

	if (!pointer) pointer = "❯";

	if (!question || question.length === 0) {
		reject("Error: Must provide a question");
		return;
	}

	if (!options || options.length === 0) {
		reject(
			"Error: Must provide the options.\nOptions can be an array of string or an array of objects with value and name as parameters.",
		);
		return;
	}

	let selectIndex = 0;
	let isFirstTimeShowMenu = true;

	const mappedOptions = options.map(el => ({
		name: el.name ?? el,
		value: el.value ?? el,
		description: el.description ?? "",
	}));

	const createOptionMenu = () => {
		const optionLength = mappedOptions.length;
		if (isFirstTimeShowMenu) {
			isFirstTimeShowMenu = false;
		} else {
			eraseLines(optionLength);
		}
		const padding = getPadding(20);

		for (let i = 0; i < optionLength; i++) {
			const selectedOption =
				i === selectIndex
					? `${chalk.bold.green(pointer)} ${chalk.bold.green(mappedOptions[i].name)} ${
							chalk.dim(mappedOptions[i].description) ?? ""
					  }`
					: mappedOptions[i].name;

			output.write(`${padding + selectedOption}\n`);
		}
	};

	const keyPressedHandler = (_, key) => {
		const acceptedKeys = ["\r", "\x03", "\x1B", "\x1B[A", "\x1B[B"];

		if (key && acceptedKeys.includes(key.sequence)) {
			const optionLength = mappedOptions.length - 1;

			if (key.name === "down" || key.name === "up") {
				if (key.name === "down") selectIndex = selectIndex < optionLength ? selectIndex + 1 : 0;
				if (key.name === "up") selectIndex = selectIndex > 0 ? selectIndex - 1 : optionLength;
				createOptionMenu();
				return;
			}

			if (key.name === "escape" || (key.name === "c" && key.ctrl)) close(mappedOptions, reject);
			if (key.name === "return") enter(selectIndex, mappedOptions, resolve, question);
		}
	};

	output.write(`${chalk.cyan.bold(question)} ${chalk.dim("(Use up and down arrows to navigate)")}\n`);

	emitKeypressEvents(input);

	input.setRawMode(true);
	input.resume();
	hideCursor();
	input.on("keypress", keyPressedHandler);

	if (selectIndex >= 0) {
		createOptionMenu();
	}

	const enter = (selectIndex, options, resolve, question) => {
		eraseLines(options.length + 2);
		output.write(`${chalk.cyan.bold(question)} ${chalk.yellow(options[selectIndex].name)}\n`);
		input.removeListener("keypress", keyPressedHandler);
		input.setRawMode(false);
		input.pause();
		showCursor();
		resolve(options[selectIndex].value);
	};

	const close = (options, reject) => {
		eraseLines(options.length);
		input.removeListener("keypress", keyPressedHandler);
		input.setRawMode(false);
		input.pause();
		showCursor();
		reject("Operation canceled");
	};
}

const getPadding = (num = 10) => {
	let text = " ";
	for (let i = 0; i < num.length; i++) {
		text += " ";
	}
	return text;
};

const hideCursor = () => {
	output.write("\u001B[?25l");
};

const showCursor = () => {
	output.write("\u001B[?25h");
};

try {
	await promisifyQuestion("❔ Where do you want to create the project? (leave empty for current path)");

	await select({
		question: "❔ Do you want to install any development environment on?",
		options: [
			{ name: "Vite", value: "vite", description: "asdkasldkj" },
			{ name: "None", value: "none", description: "123jkasjdl" },
		],
	});

	await promisifyQuestion("❔ Where do you want to create the project? (leave empty for current path)");

	await select({
		question: "❔ aasaaaaaaaaaaaaaaaaaahhhh?",
		options: ["yes", "no", "maybe"],
	});
	await select({
		question: "❔ 123?",
		options: ["1", "2", "3"],
	});
} catch (err) {
	console.log(err);
}
