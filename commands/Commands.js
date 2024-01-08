const { exec, spawn } = require("child_process");

const createDirectory = async path => {
	return new Promise((resolve, reject) => {
		exec(`mkdir ${path}`, (error, _stdout, stderr) => {
			if (error) {
				reject(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				reject(`stderr: ${stderr}`);
				return;
			}
			resolve();
		});
	});
};

const runCommandOnFolder = async (folder, command) => {
	return new Promise((resolve, reject) => {
		const cmd = spawn(`${command}`, { shell: true, detached: true, cwd: folder });

		cmd.stdout.on("data", data => {
			resolve(data);
			// console.log(`stdout: ${data}`);
		});

		cmd.stderr.on("data", data => {
			reject(data);
			console.log(`stderr: ${data}`);
		});

		cmd.on("error", error => {
			reject(error.message);
			console.log(`error: ${error.message}`);
		});

		cmd.on("close", code => {
			// console.log(`child process exited with code ${code}`);
		});
	});
};

module.exports = {
	createDirectory,
	runCommandOnFolder,
};
