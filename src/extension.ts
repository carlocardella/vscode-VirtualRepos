import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import * as trace from "./tracing";
import { commands, ExtensionContext, workspace, window } from "vscode";
import { RepoProvider } from "./Tree/nodes";
import { RepoFileSystemProvider, REPO_SCHEME } from "./FileSystem/fileSystem";
import { getGitHubAuthenticatedUser, pickRepository } from "./GitHub/commands";
import { TGitHubUser } from "./GitHub/types";
import { error } from "console";
import { addToGlobalStorage, clearGlobalStorage, removeFromGlobalStorage } from "./FileSystem/storage";
import { GLOBAL_STORAGE_KEY } from "./GitHub/constants";

export let output: trace.Output;
export const credentials = new Credentials();
export let gitHubAuthenticatedUser: TGitHubUser;
export let extensionContext: ExtensionContext;
export const repoProvider = new RepoProvider();

export async function activate(context: ExtensionContext) {
    extensionContext = context;
    if (config.get("EnableTracing")) {
        output = new trace.Output();
    }

    gitHubAuthenticatedUser = await getGitHubAuthenticatedUser();

    output?.appendLine("Repos extension is now active!", output.messageType.info);

    await credentials.initialize(context);
    if (!credentials.isAuthenticated) {
        credentials.initialize(context);
    }

    const disposable = commands.registerCommand("extension.getGitHubUser", async () => {
        const octokit = await credentials.getOctokit();
        const userInfo = await octokit.users.getAuthenticated();

        output?.appendLine(`Logged to GitHub as ${userInfo.data.login}`, output.messageType.info);
    });

    context.subscriptions.push(
        commands.registerCommand("Repos.refreshTree", async () => {
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("Repos.openRepository", async () => {
            const pick = await pickRepository();
            if (pick) {
                addToGlobalStorage(context, pick);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("Repos.closeRepository", async (e) => {
            removeFromGlobalStorage(context, e.repo.full_name);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("Repos.addFolder", async () => {
            throw error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("Repos.addFile", async () => {
            throw error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("Repos.clearGlobalStorage", async () => {
            clearGlobalStorage(context);
        })
    );

    const repoFileSystemProvider = new RepoFileSystemProvider();
    context.subscriptions.push(
        workspace.registerFileSystemProvider(REPO_SCHEME, repoFileSystemProvider, {
            isCaseSensitive: true,
        })
    );

    // register global storage
    const keysForSync = [GLOBAL_STORAGE_KEY];
    context.globalState.setKeysForSync(keysForSync);

    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("Repos.EnableTracing")) {
                if (config.get("EnableTracing")) {
                    output = new trace.Output();
                } else {
                    output.dispose();
                }
            }
        })
    );

    let tv = window.createTreeView("Repositories", {
        treeDataProvider: repoProvider,
    });

    window.registerTreeDataProvider("Repositories", repoProvider);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
