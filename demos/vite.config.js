import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({ jsxImportSource: 'geact', jsxRuntime: 'automatic' }),
		replace({
			__DEV__: process.env.NODE_ENV !== 'production'
		})
	],
	resolve: {
		alias: [
			{
				find: 'geact',
				replacement: path.resolve(__dirname, '../packages/geact')
			},
			// {
			// 	find: 'react-dom',
			// 	replacement: path.resolve(__dirname, '../packages/react-dom')
			// }
		]
	},
	optimizeDeps: {
		exclude: ['geact', 'react']
	}
});
