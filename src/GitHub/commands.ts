import { commands, env, Uri, window, workspace, ProgressLocation } from "vscode";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { ContentNode, RepoNode } from "../Tree/nodes";
import {
    getGitHubRepoContent,
    newGitHubRepository,
    deleteGitHubRepository,
    getGitHubReposForAuthenticatedUser,
    getStarredGitHubRepositories,
    getGitHubUser,
    forkGitHubRepository,
    FileMode,
    TypeMode,
    createGitHubTree,
    createGitHubCommit,
    updateGitHubRef,
    unstarGitHubRepository,
    starGitHubRepository,
    unfollowGitHubUser,
    followGitHubUser,
    getGutHubFollowedUsers,
    updateGitHubRepository,
} from "./api";
import { TContent, TTreeRename, TRepo, TUser } from "./types";
import { credentials, extensionContext, output, repoFileSystemProvider, repoProvider, store } from "../extension";
import { byteArrayToString, charCodeAt, getFileNameFromUri, removeLeadingSlash, stringToByteArray } from "../utils";
import { StorageKeys } from "./constants";

/**
 * Returns the binary content of a file in the repository.
 * @date 8/26/2022 - 6:51:03 PM
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to get the file from.
 * @param {string} filePath The path to the file in the repository.
 * @returns {Promise<Uint8Array>}
 */
export async function getRepoFileContent(repo: RepoNode, file: TContent): Promise<Uint8Array> {
    let data: any;
    if (!file!.content) {
        data = await getGitHubRepoContent(repo.owner, repo.name, file!.path);
        file!.content = data;
    } else {
        data = file!.content;
    }

    return new Uint8Array(Buffer.from(data.content, "base64").toString("latin1").split("").map(charCodeAt));
}

/**
 * Returns repository owner and name from <owner>/<repo> string
 *
 * @export
 * @param {string} repo The repository string
 * @returns {[string, string]}
 */
export function getRepoDetails(repo: string): [string, string] {
    const parts = repo.split("/");
    return [parts[0], parts[1]];
}

/**
 * QuickPick items for the user to select which repository to open
 *
 * @enum {number}
 */
enum QuickPickItems {
    repoName = "$(rocket) Open repository",
    userRepos = "$(account) Open my repository",
    starredRepos = "$(star) Open starred repository",
}

/**
 * Ask the user to choose or enter a repository to open: <owner>/<repo>
 *
 * @export
 * @async
 * @returns {(Promise<string | undefined>)}
 */
export async function pickRepository() {
    return await new Promise((resolve, reject) => {
        let pick: string | string[] | undefined;

        let quickPick = window.createQuickPick();
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.placeholder = "Select or type the repository you would like to open";
        quickPick.canSelectMany = false;
        quickPick.matchOnDescription = true;

        quickPick.show();

        quickPick.items = [{ label: QuickPickItems.repoName }, { label: QuickPickItems.userRepos }, { label: QuickPickItems.starredRepos }];

        quickPick.onDidAccept(async () => {
            if (pick === QuickPickItems.repoName || (Array.isArray(pick) && pick.includes(QuickPickItems.repoName))) {
                let repo = await window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: "owner/repo",
                    title: "Enter the repository to open, e.g. 'owner/repo'",
                });
                if (repo) {
                    quickPick.items = [{ label: `${repo}` }];
                }
                quickPick.hide();
                resolve([repo]);
            } else if (pick === QuickPickItems.userRepos || (Array.isArray(pick) && pick.includes(QuickPickItems.userRepos))) {
                quickPick.busy = true;
                quickPick.placeholder = "Enter the repository to open, e.g. 'owner/repo'";
                const repos = extensionContext.globalState.get(StorageKeys.myRepos) as TRepo[];
                quickPick.busy = false;
                quickPick.canSelectMany = true;
                quickPick.items = repos!.map((repo) => ({ label: `${repo}` }));
                quickPick.show();
            } else if (pick === QuickPickItems.starredRepos || (Array.isArray(pick) && pick.includes(QuickPickItems.starredRepos))) {
                quickPick.busy = true;
                quickPick.placeholder = "Enter the repository to open, e.g. 'owner/repo'";
                const starredRepos = extensionContext.globalState.get(StorageKeys.starredRepos) as string[];
                quickPick.busy = false;
                quickPick.canSelectMany = true;
                quickPick.items = starredRepos.map((repo) => ({ label: repo }));
                quickPick.show();
            } else {
                output?.debug(`onDidAccept: ${pick}`);
                quickPick.hide();
                resolve(pick);
            }
        });

        quickPick.onDidChangeSelection(async (selection) => {
            pick = selection.map((item) => item.label);
            output?.debug(`onDidChangeSelection: ${pick}`);
        });
    });
}

/**
 * Create a new file in a GitHub repository
 *
 * @export
 * @async
 * @param {ContentNode} e The TreeItem containing the file to create
 * @returns {*}
 */
export async function addFile(e: ContentNode | RepoNode): Promise<Uri | undefined> {
    const newFileName = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "path/filename", title: "Enter the filename (optional path)" });
    if (!newFileName) {
        return;
    }

    const [repoOwner, repoName, path] = RepoFileSystemProvider.getFileInfo(e.uri)!;
    const content = "";

    const newFileUri = Uri.parse(`${REPO_SCHEME}://${repoOwner}/${repoName}/${path}/${newFileName}`); // @ugly: if the file is created under root, path is empty and the output is '//'
    // prettier-ignore
    await repoFileSystemProvider.writeFile(
        newFileUri, stringToByteArray(content), {
        create: true,
        overwrite: true,
    });

    return Promise.resolve(newFileUri);
}

/**
 * Delete the file or folder from the repository
 *
 * @export
 * @async
 * @param {ContentNode} nodes TreeView nodes to delete
 * @returns {*}
 */
export async function deleteFile(nodes: ContentNode[]) {
    let confirm: "Yes" | "No" | undefined = undefined;
    let message: string;
    nodes.length === 1
        ? (message = `Are you sure you want to delete '${nodes[0].label}'?`)
        : (message = `Are you sure you want to delete ${nodes.length} files?`);

    confirm = await window.showWarningMessage(message, { modal: true }, "Yes", "No");
    if (confirm !== "Yes") {
        return;
    }

    let tree = nodes.map((node) => {
        return {
            path: node.path,
            mode: FileMode.file,
            type: TypeMode.blob,
            sha: null,
        } as TTreeRename;
    });

    const repo = store.repos.find((repo) => repo!.full_name === `${nodes[0].owner}/${nodes[0].repo.name}`)!;

    let newTree = await createGitHubTree(repo, tree);
    let newCommit = await createGitHubCommit(repo, `Delete ${tree.map((t) => t.path)}`, newTree!.sha!, [repo.tree?.sha!]);
    let updatedRef = await updateGitHubRef(repo, `heads/${repo.repo.default_branch}`, newCommit!.sha);

    if (updatedRef) {
        output?.info(`Deleted ${tree.map((t) => t.path)}`);
        repoProvider.refresh(repo);
    }
}

/**
 * Upload files from the local disk to GitHub
 *
 * @export
 * @async
 * @param {(ContentNode | RepoNode)} destination The destination to upload the files to
 * @returns {Promise<void>}
 */
export async function uploadFiles(destination: ContentNode | RepoNode): Promise<void> {
    const files = await window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, title: "Select the files to upload" });
    if (!files) {
        return Promise.reject();
    }

    await window.withProgress({ title: "Uploading files...", location: ProgressLocation.Notification }, async () => {
        let tree = await Promise.all(
            files.map(async (file) => {
                return {
                    path: removeLeadingSlash(destination.path + "/" + getFileNameFromUri(file)),
                    mode: FileMode.file,
                    type: TypeMode.blob,
                    content: byteArrayToString(await workspace.fs.readFile(file)),
                } as TTreeRename;
            })
        );

        const repo = store.repos.find((repo) => repo!.full_name === `${destination.repo.owner.login}/${destination.repo.name}`)!;

        let newTree = await createGitHubTree(repo, tree);
        let newCommit = await createGitHubCommit(repo, `Upload ${tree.map((t) => t.path)}`, newTree!.sha!, [repo.tree?.sha!]);
        let updatedRef = await updateGitHubRef(repo, `heads/${repo.repo.default_branch}`, newCommit!.sha);

        if (updatedRef) {
            output?.info(`Uploaded ${tree.map((t) => t.path)}`);
            repoProvider.refresh();
        }
    });

    return Promise.reject();
}

/**
 * Create a new repository
 * @date 9/26/2022 - 10:06:19 AM
 *
 * @export
 * @async
 * @param {boolean} isPrivate Whether the repository should be private or not
 * @returns {Promise<void>}
 */
export async function newRepository(isPrivate: boolean): Promise<void> {
    const newRepo = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "repo name", title: "Enter the repository name" });
    if (!newRepo) {
        return Promise.reject();
    }

    let [owner, repoName] = ["", ""];
    if (newRepo.indexOf("/") === -1) {
        owner = credentials.authenticatedUser.login;
        repoName = newRepo;
    } else {
        [owner, repoName] = newRepo.split("/");
    }

    // create the repository
    const githubRepo = await newGitHubRepository(owner, repoName, isPrivate);

    if (githubRepo) {
        //add the new repository to the tree view
        await store.addRepo(extensionContext, `${githubRepo.owner.login}/${githubRepo.name}`);
    }
}

/**
 * Delete a repository
 * @date 9/26/2022 - 10:05:56 AM
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to delete
 * @returns {Promise<void>}
 */
export async function deleteRepository(repo: RepoNode): Promise<void> {
    const confirm = await window.showWarningMessage(`Are you sure you want to delete '${repo.name}'?`, { modal: true }, "Yes", "No");
    if (confirm !== "Yes") {
        return Promise.reject();
    }

    const deleted = await deleteGitHubRepository(repo.repo);
    if (deleted) {
        await store.removeRepo(extensionContext, `${repo.repo.owner.login}/${repo.name}`);
    }
}

/**
 * Clone the selected repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to clone
 * @returns {*}
 */
export async function cloneRepository(repo: RepoNode) {
    output?.info(`Cloning ${repo.repo.clone_url}`);
    commands.executeCommand("git.clone", repo.repo.clone_url);
}

/**
 * Copy the repository or file URL to the clipboard
 *
 * @export
 * @param {(RepoNode | ContentNode)} node The node to copy the URL for
 */
export function copyRemoteUrl(node: RepoNode | ContentNode) {
    let url: string | undefined;

    if (node instanceof RepoNode) {
        url = node.repo.html_url;
    }
    if (node instanceof ContentNode) {
        url = node.nodeContent?.html_url;
    }

    if (url) {
        env.clipboard.writeText(url);
        output?.info(`Copied ${url} to the clipboard`);
    }
}

/**
 * Shows the selected repository or file on remote
 *
 * @export
 * @param {(RepoNode | ContentNode)} node The node to show on remote
 */
export function showRemote(node: RepoNode | ContentNode) {
    let url: string | undefined;

    if (node instanceof RepoNode) {
        url = node.repo.html_url;
    }
    if (node instanceof ContentNode) {
        url = node.nodeContent?.html_url;
    }

    if (url) {
        env.openExternal(Uri.parse(url));
        output?.info(`Show ${url} on remote`);
    }
}

/**
 * View the repository owner's profile on GitHub
 *
 * @export
 * @async
 * @param {string} username The username of the owner
 * @returns {*}
 */
export async function viewRepoOwnerProfileOnGitHub(username: string) {
    const user = await getGitHubUser(username);
    if (user) {
        env.openExternal(Uri.parse(user.html_url));
    }
}

/**
 * Fork a repository into the authenticated user's account
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to fork
 * @returns {unknown}
 */
export async function forkRepository(repo: RepoNode) {
    const forkedRepo = await forkGitHubRepository(repo.repo);
    if (forkedRepo) {
        await store.addRepo(extensionContext, `${forkedRepo.owner.login}/${forkedRepo.name}`);
        output?.info(`Forked ${repo.name} to ${forkedRepo.owner.login}/${forkedRepo.name}`);
        return Promise.resolve();
    }

    return Promise.reject();
}

/**
 * Rename a repo file
 *
 * @export
 * @async
 * @param {ContentNode} file The file to rename
 * @returns {*}
 */
export async function renameFile(file: ContentNode) {
    const newFileName = await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "new file name",
        title: "Enter the new file name",
        value: file.label as string,
    });
    if (!newFileName) {
        return;
    }

    const newUri = RepoFileSystemProvider.getFileUri(file.repo, newFileName);
    const oldUri = file.uri;
    output?.info(`Rename "${file.path}" to "${newFileName}"`);
    await repoFileSystemProvider.rename(oldUri, newUri, { overwrite: false });
}

/**
 * Delete a folder from a repository
 *
 * @export
 * @async
 * @param {ContentNode} folder The folder to delete
 * @returns {*}
 */
export async function deleteFolder(folder: ContentNode) {
    const confirm = await window.showWarningMessage(`Are you sure you want to delete "${folder.path}"?`, { modal: true }, "Yes", "No");
    if (confirm !== "Yes") {
        return;
    }

    output?.info(`Delete "${folder.path}"`);
    await repoFileSystemProvider.deleteDirectory(folder.uri);
}

/**
 * Star or unstar a repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to star or unstar
 * @returns {*}
 */
export async function toggleRepoStar(repo: RepoNode) {
    let starredRepos = await getOrRefreshStarredRepos();
    if (repo.isStarred) {
        await unstarGitHubRepository(repo);
        starredRepos = starredRepos?.filter((r) => r !== repo.full_name);
        repo.isStarred = false;
        output?.info(`Unstarred ${repo.full_name}`);
    } else {
        await starGitHubRepository(repo);
        starredRepos?.push(repo.full_name);
        repo.isStarred = true;
        output?.info(`Starred ${repo.full_name}`);
    }

    await getOrRefreshStarredRepos(starredRepos);
}

/**
 * Return or refresh the list of starred repositories
 *
 * @export
 * @async
 * @param {?(string[] | TRepo[])} [starredRepoNames] The list of starred repositories
 * @param {?boolean} [forceRefreshFromGitHub] Force refresh from GitHub
 * @returns {(Promise<string[] | undefined>)}
 */
export async function getOrRefreshStarredRepos(starredRepoNames?: string[] | TRepo[], forceRefreshFromGitHub?: boolean): Promise<string[] | undefined> {
    if (!starredRepoNames) {
        starredRepoNames = extensionContext.globalState.get<string[]>(StorageKeys.starredRepos, []);
    }

    if (starredRepoNames?.length === 0 || forceRefreshFromGitHub) {
        output?.info("Fetching starred repositories from GitHub");
        starredRepoNames = await getStarredGitHubRepositories();
        starredRepoNames = starredRepoNames.map((repo) => `${repo.owner.login}/${repo.name}`);
        extensionContext.globalState.update(StorageKeys.starredRepos, starredRepoNames);
    } else {
        starredRepoNames = starredRepoNames as string[];
    }

    extensionContext.globalState.update(StorageKeys.starredRepos, starredRepoNames);
    commands.executeCommand("setContext", StorageKeys.starredRepos, starredRepoNames);
    return Promise.resolve(starredRepoNames);
}

export async function getOrRefreshAuthenticatedUserRepos(repoNames?: string[] | TRepo[], forceRefreshFromGitHub?: boolean): Promise<string[] | undefined> {
    if (!repoNames) {
        repoNames = extensionContext.globalState.get<string[]>(StorageKeys.myRepos, []);
    }

    if (repoNames?.length === 0 || forceRefreshFromGitHub) {
        output?.info("Fetching my repositories from GitHub");
        repoNames = await getGitHubReposForAuthenticatedUser();
        repoNames = repoNames.map((repo) => `${repo.owner.login}/${repo.name}`);
        extensionContext.globalState.update(StorageKeys.myRepos, repoNames);
    } else {
        repoNames = repoNames as string[];
    }

    extensionContext.globalState.update(StorageKeys.myRepos, repoNames);
    commands.executeCommand("setContext", StorageKeys.myRepos, repoNames);
    return Promise.resolve(repoNames);
}

/**
 * Follow or unfollow a user on GitHub
 *
 * @export
 * @async
 * @param {string} user The user to follow or unfollow
 * @returns {*}
 */
export async function toggleFollowUser(user: string) {
    let followingUsers = await getOrRefreshFollowedUsers();
    if (followingUsers) {
        let isFollowedUser = followingUsers?.includes(user);

        if (isFollowedUser) {
            await unfollowGitHubUser(user);
            followingUsers = followingUsers?.filter((u) => u !== user);
            output?.info(`Unfollowed ${user}`);
        } else {
            await followGitHubUser(user);
            followingUsers?.push(user);
            output?.info(`Followed ${user}`);
        }

        await getOrRefreshFollowedUsers(followingUsers);
    }
}

/**
 * Return or refresh the list of followed users
 *
 * @export
 * @async
 * @param {?(string[] | TUser[])} [followedUsers] The list of followed users
 * @param {?boolean} [forceRefreshFromGitHub] Force refresh from GitHub
 * @returns {(Promise<string[] | undefined>)}
 */
export async function getOrRefreshFollowedUsers(followedUsers?: string[] | TUser[], forceRefreshFromGitHub?: boolean): Promise<string[] | undefined> {
    if (!followedUsers) {
        followedUsers = extensionContext.globalState.get<string[]>("followedUsers", []);
    }

    if (followedUsers?.length === 0 || forceRefreshFromGitHub) {
        output?.info("Fetching followed users from GitHub");
        followedUsers = await getGutHubFollowedUsers();
        followedUsers = followedUsers!.map((user) => user.login);
        extensionContext.globalState.update("followedUsers", followedUsers);
    } else {
        followedUsers = followedUsers as string[];
    }

    extensionContext.globalState.update("followedUsers", followedUsers);
    commands.executeCommand("setContext", "followedUsers", followedUsers);
    return Promise.resolve(followedUsers);
}

/**
 * Copy the upstream URL to the clipboard
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to copy the upstream URL from
 * @returns {*}
 */
export async function copyUpstreamUrl(repo: RepoNode) {
    await env.clipboard.writeText(repo.parent!.html_url);
}

/**
 * Open the upstream URL in the browser
 *
 * @export
 * @param {RepoNode} node The repository to open the upstream URL from
 */
export function showUpstream(node: RepoNode) {
    let url = node.parent!.html_url;

    if (url) {
        env.openExternal(Uri.parse(url));
        output?.info(`Show upstream ${url}`);
    }
}

/**
 * Toggle visibility of a GitHub repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to toggle the visibility of
 * @returns {*}
 */
export async function toggleRepoVisibility(repo: RepoNode) {
    let visibility = repo.private ? "public" : "private";
    let confirm = await window.showWarningMessage(`Are you sure you want to make "${repo.name}" ${visibility}?`, { modal: true }, "Yes", "No");

    if (confirm !== "Yes") {
        return;
    }

    output?.info(`Toggle visibility of ${repo.full_name} to ${visibility}`);
    await updateGitHubRepository(repo, !repo.private, undefined);
    repo.private = !repo.private;
    store.init();
}
