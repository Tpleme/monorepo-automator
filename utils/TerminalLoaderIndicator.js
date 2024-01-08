let loader;
let message = "loading";

const startAnimation = () => {
	const P = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"];
	let x = 0;
	loader = setInterval(() => {
		process.stdout.write(`\r${P[x++]} ${message}`);
		x &= 7;
	}, 100);
};

const stopAnimation = () => {
	process.stdout.clearLine();
	clearInterval(loader);
};

const setMessage = msg => {
	message = msg;
};

module.exports = {
	startAnimation,
	stopAnimation,
	setMessage,
};
