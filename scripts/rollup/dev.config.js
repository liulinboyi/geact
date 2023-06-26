import typescript from 'rollup-plugin-typescript2';
import path from 'path';
import resolve from '@rollup/plugin-babel';
import babel from '@rollup/plugin-babel';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const tsConfig = { tsConfig: 'tsconfig.json' };

function resolvePkgPath(pkgName, isDist) {
	const pkgPath = path.resolve(__dirname, '../../packages');
	const distPath = path.resolve(__dirname, '../../dist/node_modules');
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
}

export default [
	{
		input: `${resolvePkgPath('geact', false)}/index.ts`,
		output: {
			file: `${resolvePkgPath('geact', true)}/index.js`,
			name: 'index.js',
			format: 'umd'
		},
		plugins: [
			typescript(tsConfig),
			resolve(),
			generatePackageJson({
				inputFolder: resolvePkgPath('geact', false),
				outputFolder: resolvePkgPath('geact', true),
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	{
		input: `${resolvePkgPath('geact', false)}/src/jsx.ts`,
		output: {
			file: `${resolvePkgPath('geact', true)}/jsx-dev-runtime.js`,
			name: 'jsx-dev-runtime.js',
			format: 'umd'
		},
		plugins: [typescript(tsConfig), resolve()]
	}
];
