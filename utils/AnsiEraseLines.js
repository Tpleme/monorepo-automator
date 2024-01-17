const ansiEraseLines = count => {
	//adapted from sindresorhus ansi-escape module
	const ESC = "\u001B[";
	const eraseLine = `${ESC}2K`;
	const cursorUp = (count = 1) => `${ESC + count}A`;
	const cursorLeft = `${ESC}G`;

	let clear = "";

	for (let i = 0; i < count; i++) {
		clear += eraseLine + (i < count - 1 ? cursorUp() : "");
	}

	if (count) {
		clear += cursorLeft;
	}

	return clear;
};

export default ansiEraseLines;
