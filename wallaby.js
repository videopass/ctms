module.exports = function (w) {
	return {
		files: ['*.ts'],

		tests: ['**/__tests__/*.test.ts'],

		env: {
			type: 'node',
		},

		debug: true,
		// or any other supported testing framework:
		// https://wallabyjs.com/docs/integration/overview.html#supported-testing-frameworks
		testFramework: 'jest',
	}
}
