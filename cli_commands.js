import { exec, spawn } from "child_process";

export const createDirectory = async path => {
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

export const runCommandOnFolder = async (folder, commandString) => {
	const parts = commandString.split(" ");
	const command = parts.shift();
	const args = parts;

	return new Promise((resolve, reject) => {
		const cmd = spawn(command, args, { shell: true, detached: true, cwd: folder });

		let stdoutData = "";
		let stderrData = "";

		cmd.stdout.on("data", data => {
			stdoutData += data.toString();
		});

		cmd.stderr.on("data", data => {
			stderrData += data.toString();
			console.error(`stderr: ${data.toString()}`);
		});

		cmd.on("error", error => {
			reject(error.message);
		});

		cmd.on("close", code => {
			if (code === 0) {
				resolve(stdoutData.trim());
			} else {
				reject(`Exited with code ${code}\n${stderrData}`);
			}
		});
	});
};
