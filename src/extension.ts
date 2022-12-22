import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import * as trace from "./tracing";
import { commands, ExtensionContext, workspace, window, ProgressLocation, Uri } from "vscode";
import { ContentNode, RepoNode, RepoProvider } from "./Tree/nodes";
import { RepoFileSystemProvider, REPO_SCHEME } from "./FileSystem/fileSystem";
import {
    addFile,
    cloneRepository,
    copyRemoteUrl,
    deleteFolder,
    deleteFile,
    deleteRepository,
    forkRepository,
    newRepository,
    pickRepository,
    renameFile,
    showOnRemote,
    uploadFiles,
    viewRepoOwnerProfileOnGitHub,
    toggleRepoStar,
} from "./GitHub/commands";
import { TGitHubUser } from "./GitHub/types";
import { addToGlobalStorage, clearGlobalStorage, getReposFromGlobalStorage, purgeGlobalStorage, removeFromGlobalStorage } from "./FileSystem/storage";
import { GLOBAL_STORAGE_KEY } from "./GitHub/constants";
import { getGitHubAuthenticatedUser, starGitHubRepository, unstarGitHubRepository } from "./GitHub/api";

export let output: trace.Output;
export const credentials = new Credentials();
export let gitHubAuthenticatedUser: TGitHubUser;
export let extensionContext: ExtensionContext;
export const repoProvider = new RepoProvider();
export const repoFileSystemProvider = new RepoFileSystemProvider();
let pullInterval = config.get("PullInterval") * 1000;
let pullIntervalTimer: NodeJS.Timer | undefined = undefined;

// @hack: https://angularfixing.com/how-to-access-textencoder-as-a-global-instead-of-importing-it-from-the-util-package/
import { TextEncoder as _TextEncoder } from "node:util";
import { TextDecoder as _TextDecoder } from "node:util";
declare global {
    var TextEncoder: typeof _TextEncoder;
    var TextDecoder: typeof _TextDecoder;
}

export async function activate(context: ExtensionContext) {
    extensionContext = context;
    if (config.get("EnableTracing")) {
        output = new trace.Output();
    }

    gitHubAuthenticatedUser = await getGitHubAuthenticatedUser();

    output?.appendLine("Virtual Repositories extension is now active!", output.messageType.info);

    await credentials.initialize(context);
    if (!credentials.isAuthenticated) {
        credentials.initialize(context);
    }

    const disposable = commands.registerCommand("VirtualRepos.getGitHubUser", async () => {
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
        commands.registerCommand("VirtualRepos.cloneRepository", async (node) => {
            cloneRepository(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.copyRemoteUrl", async (node) => {
            copyRemoteUrl(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.showOnRemote", async (node) => {
            showOnRemote(node);
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
        commands.registerCommand("VirtualRepos.addFile", async (node: ContentNode) => {
            const newFileUri = await addFile(node);

            repoProvider.refreshing = true;
            repoProvider.refresh();

            while (repoProvider.refreshing) {
                output?.appendLine(`waiting`, output.messageType.debug);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            output?.appendLine(`Open ${newFileUri}`, output.messageType.debug);
            commands.executeCommand("vscode.open", newFileUri);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.clearGlobalStorage", async () => {
            clearGlobalStorage(context);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteFile", async (node: ContentNode, nodes: ContentNode[]) => {
            const nodesToDelete = nodes || [node];

            await deleteFile(nodesToDelete);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.viewRepoOwnerProfileOnGitHub", async (repo: RepoNode) => {
            await viewRepoOwnerProfileOnGitHub(repo.owner);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.forkRepository", async (repo: RepoNode) => {
            await forkRepository(repo);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.starRepository", async (repo: RepoNode) => {
            await toggleRepoStar(repo).then(() => {
                repoProvider.refresh();
            });
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.unstarRepository", async (repo: RepoNode) => {
            await toggleRepoStar(repo).then(() => {
                repoProvider.refresh();
            });
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.renameFile", async (file: ContentNode) => {
            await renameFile(file);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteFolder", async (folder: ContentNode) => {
            await deleteFolder(folder);
        })
    );

    context.subscriptions.push(
        // extension activation point
        workspace.registerFileSystemProvider(REPO_SCHEME, repoFileSystemProvider, {
            isCaseSensitive: true,
        })
    );

    if (pullInterval > 0) {
        pullIntervalTimer = setInterval(() => {
            repoProvider.refresh();
        }, pullInterval);
    }
    if (pullInterval > 0) {
        output?.appendLine(`Set refresh interval to ${pullInterval / 1000} seconds`, trace.MessageType.info);
    }

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
                    output?.appendLine(`Updated refresh interval to ${pullInterval / 1000} seconds`, trace.MessageType.info);
                } else {
                    clearInterval(pullIntervalTimer);
                    output?.appendLine(`Disabled refresh interval`, trace.MessageType.info);
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
