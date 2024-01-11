#! /usr/bin/env node
const { program } = require("commander");
const { create } = require("./commands/create");

program
	.command("create [name]")
	.description("Create new monorepo project. Ex: create my-monorepo-project")
	.option("-p, --path [PATH]", "Set the path for the new project")
	.action(create);

program
	.command("add <app>")
	.description("Add new app to project. Ex: add server")
	.option("-e, --env [ENV]", "Set development environment to the app. Ex: add client -e vite")
	.action((cmd, opt) => console.log(cmd, opt));

program.parse();
