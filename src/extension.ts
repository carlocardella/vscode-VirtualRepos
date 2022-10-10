import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import * as trace from "./tracing";
import { commands, ExtensionContext, workspace, window, ProgressLocation } from "vscode";
import { ContentNode, RepoProvider } from "./Tree/nodes";
import { RepoFileSystemProvider, REPO_SCHEME } from "./FileSystem/fileSystem";
import { addFile, deleteNode, deleteRepository, newRepository, pickRepository, uploadFiles } from "./GitHub/commands";
import { TGitHubUser } from "./GitHub/types";
import { addToGlobalStorage, clearGlobalStorage, getReposFromGlobalStorage, purgeGlobalStorage, removeFromGlobalStorage } from "./FileSystem/storage";
import { GLOBAL_STORAGE_KEY } from "./GitHub/constants";
import { getGitHubAuthenticatedUser } from "./GitHub/api";

export let output: trace.Output;
export const credentials = new Credentials();
export let gitHubAuthenticatedUser: TGitHubUser;
export let extensionContext: ExtensionContext;
export const repoProvider = new RepoProvider();
export const repoFileSystemProvider = new RepoFileSystemProvider();
let pullInterval = config.get("PullInterval") * 1000;
let pullIntervalTimer: NodeJS.Timer | undefined = undefined;

export async function activate(context: ExtensionContext) {
    extensionContext = context;
    if (config.get("EnableTracing")) {
        output = new trace.Output();
    }

    gitHubAuthenticatedUser = await getGitHubAuthenticatedUser();

    output?.appendLine("Virtual Repositories: extension is now active!", output.messageType.info);

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
        commands.registerCommand("VirtualRepos.refreshTree", async () => {
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.getGlobalStorage", async () => {
            const reposFromGlobalStorage = await getReposFromGlobalStorage(context);
            if (reposFromGlobalStorage.length > 0) {
                output?.appendLine(`Global storage: ${reposFromGlobalStorage}`, output.messageType.info);
            } else {
                output?.appendLine(`Global storage is empty`, output.messageType.info);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.openRepository", async () => {
            const pick = (await pickRepository()) as string;
            if (pick) {
                output?.appendLine(`Picked repository: ${pick}`, output.messageType.info);
                await addToGlobalStorage(context, pick);
            } else {
                output?.appendLine("Open repository cancelled by uer", output.messageType.info);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.uploadFile", async (node) => {
            uploadFiles(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.purgeGlobalStorage", async () => {
            purgeGlobalStorage(extensionContext);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.closeRepository", async (node) => {
            removeFromGlobalStorage(context, node.repo.full_name);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.downloadRepository", async (node) => {
            throw new Error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.newPrivateRepository", async () => {
            newRepository(true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.newPublicRepository", async () => {
            newRepository(false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteRepository", async (node) => {
            deleteRepository(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.forkRepository", async (node) => {
            throw new Error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.cloneRepository", async (node) => {
            throw new Error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.removeFromGlobalStorage", async () => {
            const reposFromGlobalStorage = await getReposFromGlobalStorage(context);
            const repoToRemove = await window.showQuickPick(reposFromGlobalStorage, {
                placeHolder: "Select repository to remove from global storage",
                ignoreFocusOut: true,
                canPickMany: false,
            });
            if (repoToRemove) {
                removeFromGlobalStorage(context, repoToRemove);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.addFile", async (node) => {
            window.withProgress(
                {
                    location: ProgressLocation.Notification,
                    title: `New file`,
                    cancellable: true,
                },
                () => {
                    return addFile(<ContentNode>node);
                }
            );
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.clearGlobalStorage", async () => {
            clearGlobalStorage(context);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteNode", async (node) => {
            window.withProgress(
                {
                    location: ProgressLocation.Notification,
                    title: `Deleting "${node.owner}/${node.path}"`,
                    cancellable: true,
                },
                () => {
                    return deleteNode(<ContentNode>node);
                }
            );
        })
    );

    context.subscriptions.push(
        // extension activation point
        workspace.registerFileSystemProvider(REPO_SCHEME, repoFileSystemProvider, {
            isCaseSensitive: true,
        })
    );
    pullIntervalTimer = setInterval(() => {
        repoProvider.refresh();
    }, pullInterval);

    // register global storage
    const keysForSync = [GLOBAL_STORAGE_KEY];
    context.globalState.setKeysForSync(keysForSync);

    const treeView = window.createTreeView("virtualReposView", {
        treeDataProvider: repoProvider,
        showCollapseAll: true,
        canSelectMany: true,
    });

    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("VirtualRepos.EnableTracing")) {
                if (config.get("EnableTracing")) {
                    output = new trace.Output();
                } else {
                    output?.dispose();
                }
            }

            if (e.affectsConfiguration("VirtualRepos.PullInterval")) {
                if (config.get("PullInterval") > 0) {
                    pullInterval = config.get("PullInterval") * 1000;

                    clearInterval(pullIntervalTimer);
                    pullIntervalTimer = setInterval(() => {
                        repoProvider.refresh();
                    }, pullInterval);
                } else {
                    clearInterval(pullIntervalTimer);
                }
            }

            if (e.affectsConfiguration("VirtualRepos.UseRepoOwnerAvatar")) {
                repoProvider.refresh();
                output?.appendLine("UseRepoOwnerAvatar changed", output.messageType.info);
            }
        })
    );

    // tv.reveal(store.repos);

    // window.registerTreeDataProvider("Repositories", repoProvider);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
