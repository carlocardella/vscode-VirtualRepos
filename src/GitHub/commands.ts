import * as rest from "@octokit/rest";
import { RepoNode } from "../Tree/nodes";
import { credentials } from "./../extension";
import { TRepo, TGitHubTree, TGitHubUser, TGitHubBranch, TGitHubBranchList } from "./types";

/**
 * Get the authenticated GitHub user
 *
 * @export
 * @async
 * @returns {Promise<TGitHubUser>}
 */
export async function getGitHubUser(): Promise<TGitHubUser> {
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
export async function getGitHubReposForAuthenticatedUser(): Promise<TRepo[]> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.repos.listForAuthenticatedUser({
        type: "owner",
    });

    return Promise.resolve(data);
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
export async function getRepoFile(repo: RepoNode, filePath: string): Promise<Uint8Array> {
    const data = await getGitHubRepoContent(repo.owner, repo.name, filePath);

    return new Uint8Array(Buffer.from(data.content, "base64").toString("latin1").split("").map(charCodeAt));
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
export async function getGitHubTree(repoOwner: string, repoName: string, treeSHA: string): Promise<TGitHubTree> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.git.getTree({
        owner: repoOwner,
        repo: repoName,
        tree_sha: treeSHA,
        recursive: "true",
    });

    return Promise.resolve(data);
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
export async function getGitHubRepo(repoOwner: string, repoName: string): Promise<TRepo> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.repos.get({
        owner: repoOwner,
        repo: repoName,
    });

    return Promise.resolve(data);
}

export async function getGitHubBranch(repo: TRepo, branchName: string): Promise<TGitHubBranch> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.repos.getBranch({
        owner: repo.owner.login,
        repo: repo.name,
        branch: branchName,
    });

    return Promise.resolve(data);
}

export async function listGitHubBranches(repo: TRepo): Promise<TGitHubBranchList[]> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.repos.listBranches({
        owner: repo.owner.login,
        repo: repo.name,
    });

    return Promise.resolve(data);
}
