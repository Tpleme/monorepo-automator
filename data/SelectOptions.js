export default [
	{
		name: "Vite",
		value: "vite",
		description: "Use vite development environment to build your app.",
		frameworks: [
			{
				name: "Vue",
				value: "vue",
				description: "Build using Vue",
				type: [
					{
						name: "Typescript",
						value: "ts",
						description: "Build to use typescript",
					},
					{
						name: "Javascript",
						value: "",
						description: "Build to use javascript",
					},
				],
			},
			{
				name: "React",
				value: "react",
				description: "Build using React",
				type: [
					{
						name: "Typescript",
						value: "ts",
						description: "Build to use typescript",
					},
					{
						name: "Typescript with SWC",
						value: "swc-ts",
						description: "Build to use typescript with SWC",
					},
					{
						name: "Javascript",
						value: "",
						description: "Build to use javascript",
					},
					{
						name: "Javascript with SWC",
						value: "swc",
						description: "Build to use javascript with SWC",
					},
				],
			},
			{
				name: "Preact",
				value: "preact",
				description: "Build using Preact",
				type: [
					{ name: "Typescript", value: "ts", description: "Build to use typescript" },
					{ name: "Javascript", value: "", description: "Build to use javascript" },
				],
			},
			{
				name: "Lit",
				value: "lit",
				description: "Build using Lit",
				type: [
					{ name: "Typescript", value: "ts", description: "Build to use typescript" },
					{ name: "Javascript", value: "", description: "Build to use javascript" },
				],
			},
			{
				name: "Svelte",
				value: "svelte",
				description: "Build using Svelte",
				type: [
					{ name: "Typescript", value: "ts", description: "Build to use typescript" },
					{ name: "Javascript", value: "", description: "Build to use javascript" },
				],
			},
			{
				name: "Qwik",
				value: "qwik",
				description: "Build using Qwik",
				type: [
					{ name: "Typescript", value: "ts", description: "Build to use typescript" },
					{ name: "Javascript", value: "js", description: "Build to use javascript" },
				],
			},
		],
	},
	{
		name: "None",
		value: "none",
		description: "Don't use any development environment.",
	},
];
