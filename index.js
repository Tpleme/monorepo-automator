#! /usr/bin/env node
import { program } from "commander";
import create from "./commands/create.js";
import add from "./commands/add.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

program
	.command("create [name]")
	.description("Create new monorepo project. Ex: create my-monorepo-project")
	.option("-p, --path [PATH]", "Set the path for the new project")
	.action((cmd, opts) => create(cmd, opts, rootDir));

program
	.command("add <appName>")
	.description("Add new app to project. Ex: add server")
	.option("-e, --env [ENV]", "Set development environment to the app. Ex: add client -e vite")
	.action((cmd, opts) => add(cmd, opts, rootDir));

program.parse();
