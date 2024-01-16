import select from "@inquirer/select";
import input from "@inquirer/input";
import chalk from "chalk";

export const selectList = ({ message, choices }) => {
	return select({ message: chalk.cyan.bold(message), choices, prefix: "" });
};

//Need to have completer
export const question = message => input({ message: chalk.cyan.bold(message) });
