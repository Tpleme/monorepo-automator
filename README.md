<p align='center'>
   <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/tpleme/monorepo-automator">
   <img alt="GitHub License" src="https://img.shields.io/npm/dm/%40tpleme%2Fmonorepo-automator">
   <img alt="GitHub License" src="https://img.shields.io/github/license/tpleme/monorepo-automator">
   <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/monorepo-automator">
   <img alt="NPM Version" src="https://img.shields.io/npm/v/monorepo-automator">

</p>

# Monorepo Automator

**Create Monorepo Projects with Ease**

Monorepo Automator is a powerful tool designed to streamline the process of setting up monorepository projects. Whether you're working on a complex application or managing multiple packages, Monorepo Automator simplifies the initial setup, allowing you to focus on building outstanding software.

## Features:

- **Automatic Monorepo Setup:** Instantly generate a well-structured monorepository with just a few commands. Say goodbye to manual configuration and repetitive tasks.

- **Vite Environment Integration:** Seamlessly incorporate Vite into your monorepo projects. Enjoy fast, efficient development with Vite's lightning-fast build times.

- **Linting and Formatting with Biome:** Ensure code consistency and quality across your entire codebase. Monorepo Automator integrates with Biome to provide comprehensive linting and formatting configurations.

- **Package.json Configuration:** Save time on package.json setup. Monorepo Automator takes care of configuring all necessary package.json files, so you can focus on coding instead of project management.

## Getting Started:

### Installing
Install monorepo-automator globally:
```bash
npm install -g @tpleme/monorepo-automator
```
You can also use monorepo-automator without installation, just make sure you have npx installed (npx is shipped by default with npm since 5.2.0)
```bash
npx @tpleme/monorepo-automator create
```

### Usage
You can run this script anywhere, it will ask for a path to your new project.

1. Create a monorepo project:
```bash
monorepo-automator create
```
2. Follow the prompts;

## Commands
- ### Create
```bash
monorepo-automator create [name] [options]
```
Create commands helps you create a monorepo project with all the folders, configurations, linting, etc... You can provide a name and options, such as a path using flag `-p`, but this is not mandatory.

Option | Description
---|---
`-p` or `--path` | Provide path where you want to create the monorepo project

##
- ### Add
```bash
monorepo-automator add <name> [options]
```
Add a new app to you already existent monorepo project, this command requires you to provide a name for this app. You can also provide a development environment with the flag `-e`. (Currently only supporting vite)

Option | Description
---|---
`-e` or `--env` | Provide a development environment to the new app, ex: vite 

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
MIT