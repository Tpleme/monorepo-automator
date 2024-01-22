const eraseLines = count => {
	process.stdout.cursorTo(0);
	process.stdout.moveCursor(0, -count);
	process.stdout.clearScreenDown();
};

export default eraseLines;
