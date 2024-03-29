import chalk from "chalk";

let loader;
let message = "loading";

export const startAnimation = () => {
	const P = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"];
	let x = 0;
	loader = setInterval(() => {
		process.stdout.clearLine();
		process.stdout.write(chalk.white.bold(`\r${P[x++]} ${message}`));
		x &= 7;
	}, 100);
};

export const stopAnimation = () => {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	clearInterval(loader);
};

export const setMessage = msg => {
	message = msg;
};
