import * as rest from "@octokit/rest";
import { TextDecoder, TextEncoder } from "util";
import { Uri, window, workspace } from "vscode";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
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
        output?.appendLine(`Could not get repositories for the authenticated user. ${e.message}`, output.messageType.error);
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
    if (!file!.content) {
        data = await getGitHubRepoContent(repo.owner, repo.name, file!.path);
        file!.content = data;
    } else {
        data = file!.content;
    }

    return new Uint8Array(Buffer.from(data.content, "base64").toString("latin1").split("").map(charCodeAt));
}

/**
 * Create a new file or update an existing file in a GitHub repository.
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to create the file in.
 * @param {TContent} file The file to create or update.
 * @param {Uint8Array} content The content of the file.
 * @returns {Promise<TGitHubUpdateContent>}
 */
export async function createOrUpdateFile(repo: RepoNode, file: TContent, content: Uint8Array): Promise<TGitHubUpdateContent> {
    const fileContentString = new TextDecoder().decode(content);
    file!.content = fileContentString;

    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        let data: any;
        if (!file?.sha) {
            // new file
            ({ data } = await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: file!.path!,
                message: `${COMMIT_MESSAGE} ${file!.path}`,
                content: Buffer.from(fileContentString).toString("base64"),
            }));
        } else {
            // the file already exists, update it
            ({ data } = await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: file!.path!,
                message: `${COMMIT_MESSAGE} ${file!.path}`,
                content: Buffer.from(fileContentString).toString("base64"),
                sha: file!.sha,
            }));

            // file = data.commit;
        }

        return Promise.resolve(data);
    } catch (e: any) {
        output?.logError(repo.repo, e);
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
        output?.logError(repo, e);
    }

    return Promise.reject(undefined);
}

/**
 * Refresh the GitHub tree for a given repository and branch
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to refresh the tree for
 * @param {string} branchName The branch to refresh the tree for
 * @returns {(Promise<TTree | undefined>)}
 */
export async function refreshGitHubTree(repo: TRepo, branchName: string): Promise<TTree | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.git.getRef({
            owner: repo.owner.login,
            repo: repo.name,
            ref: `heads/${branchName}`,
        });

        return getGitHubTree(repo, data.object.sha);
    } catch (e: any) {
        output?.logError(repo, e);
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
        output?.logError(repo, e);
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
        output?.logError(repo, e);
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
        output?.logError(repo, e);
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
        output?.appendLine(`${e.message}: ${owner}/${repoName}`, output.messageType.error);
    }

    return undefined;
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

    return pick;
}

/**
 * Converts a string to a byte array
 *
 * @export
 * @param {string} value The string to convert
 * @returns {*}
 */
export function stringToByteArray(value: string) {
    return new TextEncoder().encode(value);
}

/**
 * Create a new file in a GitHub repository
 *
 * @export
 * @async
 * @param {ContentNode} e The TreeItem containing the file to create
 * @returns {*}
 */
export async function addFile(e: ContentNode) {
    const newFileName = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "path/filename", title: "Enter the filename (optional path)" });
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
}

/**
 * Delete the file or folder from the repository
 *
 * @export
 * @async
 * @param {ContentNode} node TreeView node to delete
 * @returns {*}
 */
export async function deleteNode(node: ContentNode) {
    const confirm = await window.showWarningMessage(`Are you sure you want to delete '${node.path}'?`, "Yes", "No", "Cancel");
    if (confirm !== "Yes") {
        return;
    }

    const fileSystemProvider = new RepoFileSystemProvider();
    fileSystemProvider.delete(node.uri);
}

/**
 * Delete the selected files from GitHub
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to delete the files from
 * @param {TContent} file The file to delete
 * @returns {*}
 */
export async function deleteGitHubFile(repo: TRepo, file: TContent) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        await octokit.repos.deleteFile({
            owner: repo.owner.login,
            repo: repo.name,
            path: file!.path!,
            message: `Delete ${file!.path!}`,
            sha: file!.sha!,
        });
    } catch (e: any) {
        output?.logError(repo, e);
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
    const files = await window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, title: "Select files to upload" });
    if (!files) {
        return Promise.reject();
    }

    const fileSystemProvider = new RepoFileSystemProvider();
    files.forEach(async (file) => {
        const content = await workspace.fs.readFile(file);
        let uriPath = "path" in destination ? destination.path : "";
        let uriFile = file.path.split("/").pop();
        let uri = Uri.from({
            scheme: REPO_SCHEME,
            authority: destination.repo.name,
            path: `${uriPath}/${uriFile}`,
        });

        await fileSystemProvider.writeFile(uri, content, {
            create: true,
            overwrite: false,
        });
    });

    return Promise.reject();
}
