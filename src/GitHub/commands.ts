import * as rest from "@octokit/rest";
import { TextDecoder } from "util";
import { store } from "../FileSystem/store";
import { RepoNode } from "../Tree/nodes";
import { credentials, gitHubAuthenticatedUser, output } from "./../extension";
import { COMMIT_MESSAGE } from "./constants";
import { TRepo, TGitHubTree, TGitHubUser, TGitHubBranch, TGitHubBranchList, TRepoContent, TGitHubUpdateContent } from "./types";

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
export async function getRepoFileContent(repo: RepoNode, file: TRepoContent): Promise<Uint8Array> {
    let data: any;
    if (!file.content) {
        data = await getGitHubRepoContent(repo.owner, repo.name, file.path);
        file.content = data;
    } else {
        data = file.content;
    }

    return new Uint8Array(Buffer.from(data.content, "base64").toString("latin1").split("").map(charCodeAt));
}

export async function setRepoFileContent(repo: RepoNode, file: TRepoContent, content: Uint8Array): Promise<TGitHubUpdateContent> {
    const fileContentString = (file.content = new TextDecoder().decode(content));
    file.content = fileContentString;

    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: repo.owner,
            repo: repo.name,
            path: file.path,
            message: `${COMMIT_MESSAGE} ${file.path}`,
            // message: `Repos: update file ${file.path}`,
            content: Buffer.from(fileContentString).toString("base64"),
            sha: file.sha,
        });

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
 * @returns {Promise<TGitHubTree>}
 */
export async function getGitHubTree(repo: TRepo, treeSHA: string): Promise<TGitHubTree | undefined> {
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

export async function getGitHubBranch(repo: TRepo, branchName: string): Promise<TGitHubBranch | undefined> {
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

export async function listGitHubBranches(repo: TRepo): Promise<TGitHubBranchList[] | undefined> {
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

export async function createOrUpdateFile(repo: TRepo, path: string, content: string, sha?: string): Promise<void> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: repo.owner.login,
            repo: repo.name,
            path,
            message: "Created file",
            // committer: {
            //     name: gitHubAuthenticatedUser.name!,
            //     email: gitHubAuthenticatedUser.email!,
            // },
            content,
            sha: sha,
        });

        // todo: update the virtual file system

        return Promise.resolve();
    } catch (e: any) {
        output.logError(repo, e);
    }

    return Promise.reject();
}
