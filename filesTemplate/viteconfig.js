export const configText = `    resolve: {
        alias: [{ find: "@", replacement: path.resolve(__dirname, "src/assets") }],
    },
    envDir: "./envDir",
    css: {
        devSourcemap: true,
    },
    define: { APP_VERSION: JSON.stringify(process.env.npm_package_version) },`;
