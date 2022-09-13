import * as rest from "@octokit/rest";
import { TextDecoder, TextEncoder } from "util";
import { Uri, window, workspace } from "vscode";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { store } from "../FileSystem/storage";
import { ContentNode, RepoNode } from "../Tree/nodes";
import { credentials, output } from "./../extension";
import { COMMIT_MESSAGE } from "./constants";
import { TRepo, TTree, TGitHubUser, TBranch, TContent, TGitHubUpdateContent } from "./types";

/**
 * Get the authenticated GitHub user
 *
 * @export
 * @async
 * @returns {Promise<TGitHubUser>}
 */
export async function getGitHubAuthenticatedUser(): Promise<TGitHubUser> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.users.getAuthenticated();

    return Promise.resolve(data);
}

/**
 * Get the list of repositories for the authenticated user.
 *
 * @export
 * @async
 * @returns {Promise<TRepo[]>}
 */
export async function getGitHubReposForAuthenticatedUser(): Promise<TRepo[] | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.listForAuthenticatedUser({
            type: "owner",
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.appendLine(`Could not get repositories for the authenticated user. ${e.message}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Lists the contents of a directory (or file) in a repository.
 *
 * @export
 * @async
 * @param {string} owner Owner of the repository
 * @param {string} repoName Name of the repository
 * @param {?string} [path] Path to the directory (or file)
 * @returns {Promise<any>}
 */
export async function getGitHubRepoContent(owner: string, repoName: string, path?: string): Promise<any> {
    // @update: any
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    path = path ?? "";
    const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: path,
    });

    return Promise.resolve(data);
}

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
    if (!file.content) {
        data = await getGitHubRepoContent(repo.owner, repo.name, file.path);
        file.content = data;
    } else {
        data = file.content;
    }

    return new Uint8Array(Buffer.from(data.content, "base64").toString("latin1").split("").map(charCodeAt));
}

export async function createOrUpdateFile(repo: RepoNode, file: TContent, content: Uint8Array): Promise<TGitHubUpdateContent> {
    const fileContentString = new TextDecoder().decode(content);
    file.content = fileContentString;

    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        let data: any;
        if (file.mode === 100644) {
            // todo: file.mode should be an enum
            data = await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: file.path,
                message: `${COMMIT_MESSAGE} ${file.path}`,
                content: Buffer.from(fileContentString).toString("base64"),
            });
        } else {
            data = await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: file.path,
                message: `${COMMIT_MESSAGE} ${file.path}`,
                content: Buffer.from(fileContentString).toString("base64"),
                sha: file.sha,
            });
        }

        return Promise.resolve(data);
    } catch (e: any) {
        output.logError(repo.repo, e);
    }

    return Promise.reject();
}

/**
 * Helper function, returns the character an position zero of a string.
 *
 * @param {string} c The string to filter
 * @returns {*}
 */
function charCodeAt(c: string) {
    return c.charCodeAt(0);
}

/**
 * Returns a  GitHub tree
 *
 * @export
 * @async
 * @param {string} repoOwner The repo to get the tree of
 * @param {string} repoName
 * @param {string} treeSHA
 * @returns {Promise<TTree>}
 */
export async function getGitHubTree(repo: TRepo, treeSHA: string): Promise<TTree | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.git.getTree({
            owner: repo.owner.login,
            repo: repo.name,
            tree_sha: treeSHA,
            recursive: "true",
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.logError(repo, e);
    }

    return Promise.reject(undefined);
}

/**
 * Returns a GitHub repo
 *
 * @export
 * @async
 * @param {string} repoOwner The owner of the repo
 * @param {string} repoName The name of the repo
 * @returns {Promise<TRepo>}
 */
export async function getGitHubRepo(repo: TRepo, repoName: string): Promise<TRepo | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.get({
            owner: repo.owner.login,
            repo: repoName,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.logError(repo, e);
    }

    return Promise.reject(undefined);
}

/**
 * Returns a GitHub branch
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to get the branch from
 * @param {string} branchName The name of the branch
 * @returns {(Promise<TBranch | undefined>)}
 */
export async function getGitHubBranch(repo: TRepo, branchName: string): Promise<TBranch | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.getBranch({
            owner: repo.owner.login,
            repo: repo.name,
            branch: branchName,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.logError(repo, e);
    }

    return undefined;
}

/**
 * Lists the branches of a repository.
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to get the branches from
 * @returns {(Promise<TGitHubBranchList[] | undefined>)}
 */
export async function listGitHubBranches(repo: TRepo): Promise<TBranch[] | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.listBranches({
            owner: repo.owner.login,
            repo: repo.name,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.logError(repo, e);
    }

    return Promise.reject(undefined);
}

export async function createFolder(): Promise<void> {
    throw new Error("Not implemented");
}

/**
 * Open a new GitHub repository
 *
 * @export
 * @async
 * @param {string} owner The owner of the repository
 * @param {string} repoName The name of the repository
 * @returns {(Promise<TRepo | undefined>)}
 */
export async function openRepository(owner: string, repoName: string): Promise<TRepo | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.get({
            owner,
            repo: repoName,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output.appendLine(e.Message, output.messageType.error);
    }

    return Promise.reject();
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
 * Ask the user to enter a repository to open: <owner>/<repo>
 *
 * @export
 * @async
 * @returns {(Promise<string | undefined>)}
 */
export async function pickRepository(): Promise<string | undefined> {
    const pick = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "owner/repo", title: "Enter the repository to open, e.g. 'owner/repo'" });
    if (!pick) {
        return Promise.reject();
    }

    return pick;
}

export function stringToByteArray(value: string) {
    return new TextEncoder().encode(value);
}

export async function addFile(e: ContentNode) {
    // todo: add the file to the tree
    const newFileName = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "filename", title: "Enter the filename" });
    if (!newFileName) {
        return;
    }

    const [repoName, path] = RepoFileSystemProvider.getFileInfo(e.uri)!;
    const content = "";

    const fileSystemProvider = new RepoFileSystemProvider();
    fileSystemProvider.writeFile(Uri.parse(`${REPO_SCHEME}://${repoName}/${path}/${newFileName}`), stringToByteArray(content), {
        create: true,
        overwrite: true,
    });

    // todo: add the file to GitHub

    // todo: add file to local storage

    // todo: refresh the tree
}

export async function deleteNode(node: ContentNode) {
    // const [repoName, path] = RepoFileSystemProvider.getFileInfo(node.uri)!;
    // const fileSystemProvider = new RepoFileSystemProvider();
    // const fileExists = await fileSystemProvider.exists(node.uri);
    // if (fileExists) {
    //     fileSystemProvider.delete(node.uri);
    // }
    const fileSystemProvider = new RepoFileSystemProvider();
    fileSystemProvider.delete(node.uri);
}

export async function deleteGitHubFile(repo: TRepo, path: string) {
    
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        await octokit.repos.deleteFile({
            owner: repo.owner.login,
            repo: repo.name,
            path,
            message: `Delete ${path}`,
            sha: "todo",
        });
    } catch (e: any) {
        output.logError(repo, e);
    }
}
