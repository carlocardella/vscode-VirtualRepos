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
} from "./api";
import { TContent, TTreeRename } from "./types";
import { credentials, extensionContext, output, repoFileSystemProvider, repoProvider } from "../extension";
import { addToGlobalStorage, getReposFromGlobalStorage, removeFromGlobalStorage, store } from "../FileSystem/storage";
import { charCodeAt, stringToByteArray } from "../utils";

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
    myRepos = "$(account) Open my repository",
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
        let pick: string | undefined;

        let quickPick = window.createQuickPick();
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.title = "Select or type the repository you would like to open";
        quickPick.canSelectMany = false;

        quickPick.show();

        quickPick.items = [{ label: QuickPickItems.repoName }, { label: QuickPickItems.myRepos }, { label: QuickPickItems.starredRepos }];

        quickPick.onDidAccept(async () => {
            if (pick === QuickPickItems.repoName) {
                let accepted = await window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: "owner/repo",
                    title: "Enter the repository to open, e.g. 'owner/repo'",
                });
                quickPick.hide();
                resolve(accepted);
            } else if (pick === QuickPickItems.myRepos) {
                quickPick.busy = true;
                quickPick.placeholder = "Enter the repository to open, e.g. 'owner/repo'";
                const repos = await getGitHubReposForAuthenticatedUser();
                quickPick.busy = false;
                quickPick.items = repos!.map((repo) => ({ label: `${repo.owner.login}/${repo.name}` }));
                quickPick.show();
            } else if (pick === QuickPickItems.starredRepos) {
                quickPick.busy = true;
                quickPick.placeholder = "Enter the repository to open, e.g. 'owner/repo'";
                const starredRepos = await getStarredGitHubRepositories();
                quickPick.busy = false;
                quickPick.items = starredRepos.map((repo) => ({ label: `${repo.owner.login}/${repo.name}` }));
                quickPick.show();
            } else {
                output?.appendLine(`onDidAccept: ${pick}`, output.messageType.debug);
                quickPick.hide();
                resolve(pick);
            }
        });

        quickPick.onDidChangeSelection(async (selection) => {
            pick = selection[0].label;
            output?.appendLine(`onDidChangeSelection: ${pick}`, output.messageType.debug);
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
export async function addFile(e: ContentNode | RepoNode) {
    const newFileName = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "path/filename", title: "Enter the filename (optional path)" });
    if (!newFileName) {
        return;
    }

    const [repoOwner, repoName, path] = RepoFileSystemProvider.getFileInfo(e.uri)!;
    const content = "";

    // prettier-ignore
    repoFileSystemProvider.writeFile(
        Uri.parse(`${REPO_SCHEME}://${repoOwner}/${repoName}/${path}/${newFileName}`), stringToByteArray(content), {
        create: true,
        overwrite: true,
    });
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
        output?.appendLine(`Deleted ${tree.map((t) => t.path)}`, output.messageType.info);
        repoProvider.refresh();
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

    files.forEach(async (file) => {
        const content = await workspace.fs.readFile(file);
        let uriPath = "path" in destination ? destination.path : "";
        let uriFile = file.path.split("/").pop();
        let uri = Uri.from({
            scheme: REPO_SCHEME,
            authority: destination.repo.name,
            path: `${uriPath}/${uriFile}`,
        });

        await repoFileSystemProvider.writeFile(uri, content, {
            create: true,
            overwrite: false,
        });
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
        await addToGlobalStorage(extensionContext, `${githubRepo.owner.login}/${githubRepo.name}`);
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
        removeFromGlobalStorage(extensionContext, `${repo.repo.owner.login}/${repo.name}`);
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
    output?.appendLine(`Cloning ${repo.repo.clone_url}`, output.messageType.info);
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
        output?.appendLine(`Copied ${url} to the clipboard`, output.messageType.info);
    }
}

/**
 * Shows the selected repository or file on remote
 *
 * @export
 * @param {(RepoNode | ContentNode)} node The node to show on remote
 */
export function showOnRemote(node: RepoNode | ContentNode) {
    let url: string | undefined;

    if (node instanceof RepoNode) {
        url = node.repo.html_url;
    }
    if (node instanceof ContentNode) {
        url = node.nodeContent?.html_url;
    }

    if (url) {
        env.openExternal(Uri.parse(url));
        output?.appendLine(`Show ${url} on remote`, output.messageType.info);
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
        await addToGlobalStorage(extensionContext, `${forkedRepo.owner.login}/${forkedRepo.name}`);
        output?.appendLine(`Forked ${repo.name} to ${forkedRepo.owner.login}/${forkedRepo.name}`, output.messageType.info);
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
    output?.appendLine(`Rename "${file.path}" to "${newFileName}"`, output.messageType.info);
    await repoFileSystemProvider.rename(oldUri, newUri, { overwrite: false });
}

export async function deleteFolder(folder: ContentNode) {
    const confirm = await window.showWarningMessage(`Are you sure you want to delete "${folder.path}"?`, { modal: true }, "Yes", "No");
    if (confirm !== "Yes") {
        return;
    }

    output?.appendLine(`Delete "${folder.path}"`, output.messageType.info);
    await repoFileSystemProvider.deleteDirectory(folder.uri);
}
