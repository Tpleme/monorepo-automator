import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: [{ find: "@", replacement: path.resolve(__dirname, "src/assets") }],
	},
	envDir: "./envDir",
	css: {
		devSourcemap: true,
	},
	plugins: [react()],
	define: { APP_VERSION: JSON.stringify(process.env.npm_package_version) },
});
