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

export const runCommandOnFolder = async (folder, command, args) => {
	return new Promise((resolve, reject) => {
		const cmd = spawn(command, args, { shell: true, detached: true, cwd: folder });

		cmd.stdout.on("data", data => {
			resolve(data);
		});

		cmd.stderr.on("data", data => {
			reject(data);
			console.log(`stderr: ${data}`);
		});

		cmd.on("error", error => {
			reject(error.message);
			console.log(`error: ${error.message}`);
		});

		// cmd.on("close", code => {
		// 	console.log(`child process exited with code ${code}`);
		// });
	});
};
