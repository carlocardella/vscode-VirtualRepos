import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import { commands, ExtensionContext, workspace, window, LogOutputChannel, version } from "vscode";
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
    showRemote,
    uploadFiles,
    viewRepoOwnerProfileOnGitHub,
    toggleRepoStar,
    getOrRefreshStarredRepos,
    getOrRefreshFollowedUsers,
    toggleFollowUser,
    copyUpstreamUrl,
    showUpstream,
    toggleRepoVisibility,
    getOrRefreshAuthenticatedUserRepos,
} from "./GitHub/commands";
import { TGitHubUser } from "./GitHub/types";
import { EXTENSION_NAME, GlobalStorageKeysForSync } from "./GitHub/constants";
import { getGitHubAuthenticatedUser } from "./GitHub/api";
import { SortDirection, SortType, Store } from "./FileSystem/storage";

export let output: LogOutputChannel;
export const credentials = new Credentials();
export let gitHubAuthenticatedUser: TGitHubUser;
export let extensionContext: ExtensionContext;
export const repoProvider = new RepoProvider();
export const repoFileSystemProvider = new RepoFileSystemProvider();
let pullInterval = config.get("PullInterval") * 1000;
let pullIntervalTimer: NodeJS.Timer | undefined = undefined;

export let store = new Store();

// @hack: https://angularfixing.com/how-to-access-textencoder-as-a-global-instead-of-importing-it-from-the-util-package/
import { TextEncoder as _TextEncoder } from "node:util";
import { TextDecoder as _TextDecoder } from "node:util";
import { setSortDirectionContext, setSortTypeContext } from "./utils";
declare global {
    var TextEncoder: typeof _TextEncoder;
    var TextDecoder: typeof _TextDecoder;
}

export async function activate(context: ExtensionContext) {
    extensionContext = context;

    if (parseFloat(version) >= 1.74) {
        output = window.createOutputChannel(EXTENSION_NAME, { log: true });
    }
    output?.info(`Virtual Repositories ${extensionContext.extension.packageJSON.version} is now active!`);

    gitHubAuthenticatedUser = await getGitHubAuthenticatedUser();
    await credentials.initialize(context);
    if (!credentials.isAuthenticated) {
        credentials.initialize(context);
    }

    const disposable = commands.registerCommand("VirtualRepos.getGitHubUser", async () => {
        const octokit = await credentials.getOctokit();
        const userInfo = await octokit.users.getAuthenticated();

        output?.info(`Logged to GitHub as ${userInfo.data.login}`);
    });

    await store.init();
    setSortTypeContext(store.sortType);
    setSortDirectionContext(store.sortDirection);

    output?.info(`Logged to GitHub as ${gitHubAuthenticatedUser.login}`);

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.refreshTree", async () => {
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.getGlobalStorage", () => {
            const reposFromGlobalStorage = store.getRepos(context);
            output?.debug(`Virtual Repos: ${reposFromGlobalStorage}`);
            output?.debug(`Sort Direction: ${store.get(extensionContext, GlobalStorageKeysForSync.sortDirection)}`);
            output?.debug(`Sort Type: ${store.get(extensionContext, GlobalStorageKeysForSync.sortType)}`);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.openRepository", async () => {
            const pick = (await pickRepository()) as string[];
            if (pick) {
                output?.info(`Picked repository: ${pick}`);
                let refresh: false;
                await Promise.all(
                    pick.map(async (repo: string) => {
                        await store.addRepo(context, repo);
                    })
                );
                repoProvider.refresh();
            } else {
                output?.info("Open repository cancelled by uer");
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.uploadFile", async (node) => {
            uploadFiles(node);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.purgeGlobalStorage", async () => {
            store.purgeRepo(extensionContext);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.closeRepository", async (node) => {
            await store.removeRepo(context, node.repo.full_name);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.downloadRepository", async (node) => {
            throw new Error("Not implemented");
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.newPrivateRepository", async () => {
            await newRepository(true);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.newPublicRepository", async () => {
            await newRepository(false);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteRepository", async (node) => {
            await deleteRepository(node);
            repoProvider.refresh();
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
        commands.registerCommand("VirtualRepos.copyUpstreamUrl", async (node) => {
            copyUpstreamUrl(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.showOnRemote", async (node) => {
            showRemote(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.showOnUpstream", async (node) => {
            showUpstream(node);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.makeRepoPrivate", async (repo) => {
            if (repo instanceof RepoNode) {
                toggleRepoVisibility(repo);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.makeRepoPublic", async (repo) => {
            if (repo instanceof RepoNode) {
                toggleRepoVisibility(repo);
            }
        })
    );

    // sort repos
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByName", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.name);
            store.sortRepos(SortType.name, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByCreationTime", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.creationTime);
            store.sortRepos(SortType.creationTime, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByForks", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.forks);
            store.sortRepos(SortType.forks, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByStars", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.stars);
            store.sortRepos(SortType.stars, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByUpdateTime", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.updateTime);
            store.sortRepos(SortType.updateTime, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortRepoByWatchers", async () => {
            const sortDirection = store.get(extensionContext, GlobalStorageKeysForSync.sortDirection);
            setSortTypeContext(SortType.watchers);
            store.sortRepos(SortType.watchers, sortDirection);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortAscending", async () => {
            const sortType = store.get(extensionContext, GlobalStorageKeysForSync.sortType);
            setSortDirectionContext(SortDirection.ascending);
            store.sortRepos(sortType, SortDirection.ascending);
            repoProvider.refresh(undefined, true);
        })
    );
    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.sortDescending", async () => {
            const sortType = store.get(extensionContext, GlobalStorageKeysForSync.sortType);
            setSortDirectionContext(SortDirection.descending);
            store.sortRepos(sortType, SortDirection.descending);
            repoProvider.refresh(undefined, true);
        })
    );

    // sort empty
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByNameEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByCreationTimeEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByForksEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByStarsEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByUpdateTimeEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortRepoByWatchersEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortAscendingEmpty", async () => {}));
    context.subscriptions.push(commands.registerCommand("VirtualRepos.sortDescendingEmpty", async () => {}));

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.removeFromGlobalStorage", async () => {
            const reposFromGlobalStorage = await store.getRepos(context);
            const repoToRemove = await window.showQuickPick(reposFromGlobalStorage, {
                placeHolder: "Select repository to remove from global storage",
                ignoreFocusOut: true,
                canPickMany: false,
            });
            if (repoToRemove) {
                await store.removeRepo(context, repoToRemove);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.addFile", async (node: ContentNode) => {
            const newFileUri = await addFile(node);

            repoProvider.refreshing = true;
            repoProvider.refresh();

            while (repoProvider.refreshing) {
                output?.debug(`waiting for ${newFileUri}`);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            output?.debug(`Open ${newFileUri}`);
            commands.executeCommand("vscode.open", newFileUri);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.clearGlobalStorage", async () => {
            store.clear(context);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.deleteFile", async (node: ContentNode, nodes: ContentNode[]) => {
            const nodesToDelete = nodes || [node];

            await deleteFile(nodesToDelete);
            repoProvider.refresh();
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
        commands.registerCommand("VirtualRepos.followUser", async (repo: RepoNode) => {
            await toggleFollowUser(repo.owner).then(() => {
                repoProvider.refresh();
            });
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.unfollowUser", async (repo: RepoNode) => {
            await toggleFollowUser(repo.owner).then(() => {
                repoProvider.refresh();
            });
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.renameFile", async (file: ContentNode) => {
            await renameFile(file);
            repoProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.refreshStarredRepos", async () => {
            await getOrRefreshStarredRepos(undefined, true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand("VirtualRepos.refreshFollowedUsers", async () => {
            await getOrRefreshFollowedUsers(undefined, true);
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
        output?.info(`Set refresh interval to ${pullInterval / 1000} seconds`);
    }

    // register global storage
    const keysForSync = [GlobalStorageKeysForSync.repoGlobalStorage];
    context.globalState.setKeysForSync(keysForSync);

    const treeView = window.createTreeView("virtualReposView", {
        treeDataProvider: repoProvider,
        showCollapseAll: true,
        canSelectMany: true,
    });

    // refresh starred repos and followed users every hour
    pullIntervalTimer = setInterval(async () => {
        await getOrRefreshStarredRepos(undefined, true);
        await getOrRefreshFollowedUsers(undefined, true);
        await getOrRefreshAuthenticatedUserRepos(undefined, true);
    }, 3600000);

    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("VirtualRepos.PullInterval")) {
                if (config.get("PullInterval") > 0) {
                    pullInterval = config.get("PullInterval") * 1000;

                    clearInterval(pullIntervalTimer);
                    pullIntervalTimer = setInterval(() => {
                        repoProvider.refresh();
                    }, pullInterval);
                    output?.info(`Updated refresh interval to ${pullInterval / 1000} seconds`);
                } else {
                    clearInterval(pullIntervalTimer);
                    output?.info(`Disabled refresh interval`);
                }
            }

            if (e.affectsConfiguration("VirtualRepos.UseRepoOwnerAvatar")) {
                repoProvider.refresh();
                output?.info(`UseRepoOwnerAvatar changed`);
            }
        })
    );

    // tv.reveal(store.repos);

    // window.registerTreeDataProvider("Repositories", repoProvider);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
