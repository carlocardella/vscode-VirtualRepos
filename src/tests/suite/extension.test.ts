import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	const requests: string[] = [];

	suiteSetup(async function () {
		this.timeout(30000);
		const extension = vscode.extensions.getExtension('carlocardella.vscode-VirtualRepos');
		assert.ok(extension, 'Extension must be discoverable');
		assert.strictEqual(extension.isActive, false, 'Mock dependencies before activation');
		const bundledExtension: typeof import('../../extension') = require(path.join(extension.extensionPath, extension.packageJSON.main));
		const originalFetch = globalThis.fetch;
		const originalGetAccessToken = bundledExtension.credentials.getAccessToken;
		const originalInitialize = bundledExtension.credentials.initialize;
		globalThis.fetch = async (input) => {
			const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
			assert.strictEqual(url.origin, 'https://api.github.com');
			assert.ok(['/user', '/user/starred', '/user/following', '/user/repos'].includes(url.pathname), `Unexpected request: ${url.pathname}`);
			requests.push(url.pathname);
			return new Response(JSON.stringify(url.pathname === '/user' ? { login: 'virtual-repos-test' } : []), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		};
		bundledExtension.credentials.getAccessToken = async () => undefined;
		bundledExtension.credentials.initialize = async () => {
			bundledExtension.credentials.isAuthenticated = true;
		};
		try {
			await extension.activate();
			assert.strictEqual(extension.isActive, true);
		} finally {
			globalThis.fetch = originalFetch;
			bundledExtension.credentials.getAccessToken = originalGetAccessToken;
			bundledExtension.credentials.initialize = originalInitialize;
		}
	});

	test('Activation initializes GitHub data through Octokit', () => {
		for (const endpoint of ['/user', '/user/starred', '/user/following', '/user/repos']) {
			assert.ok(requests.includes(endpoint), `Expected request to ${endpoint}`);
		}
	});

	test('Activation registers repository commands', async () => {
		const commands = await vscode.commands.getCommands(true);
		for (const command of ['VirtualRepos.openRepository', 'VirtualRepos.closeRepository', 'VirtualRepos.refreshTree', 'VirtualRepos.addFile', 'VirtualRepos.renameFile', 'VirtualRepos.deleteFile']) {
			assert.ok(commands.includes(command), `Missing command: ${command}`);
		}
	});

	test('Activation registers the writable repository filesystem', () => {
		assert.strictEqual(vscode.workspace.fs.isWritableFileSystem('github-repo'), true);
	});

	test('Refresh command runs successfully', async () => {
		await vscode.commands.executeCommand('VirtualRepos.refreshTree');
	});
});
