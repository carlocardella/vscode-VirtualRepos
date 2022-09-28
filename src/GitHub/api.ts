import * as rest from "@octokit/rest";
import { TextDecoder } from "util";
import { credentials, output } from "../extension";
import { RepoNode } from "../Tree/nodes";
import { COMMIT_MESSAGE } from "./constants";
import { TBranch, TContent, TGitHubUpdateContent, TGitHubUser, TRepo, TTree } from "./types";

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
        const data = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {type: "owner"}, (response) => {
             return response.data;
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
 * Returns a  GitHub tree
 *
 * @export
 * @async
 * @param {TRepo} repo
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
 * @param {TRepo} repo The owner of the repo
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
 * Create a new GitHub repository
 *
 * @export
 * @async
 * @param {string} owner The owner of the repository
 * @param {string} repoName The name of the repository
 * @param {boolean} isPrivate Whether the repository should be private
 * @returns {(Promise<TRepo | undefined>)}
 */
export async function newGitHubRepository(owner: string, repoName: string, isPrivate: boolean): Promise<TRepo | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        let newRepo = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: isPrivate,
            auto_init: true,
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
        });

        return Promise.resolve(newRepo.data);
    } catch (e: any) {
        output?.appendLine(`${e.message}: ${owner}/${repoName}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Delete a GitHub repository
 * @date 9/26/2022 - 9:39:39 AM
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to delete
 * @returns {Promise<boolean>}
 */
// export async function deleteGitHubRepository(repo: TRepo): Promise<boolean>;
// export async function deleteGitHubRepository(owner: string, repoName: string): Promise<boolean>;
export async function deleteGitHubRepository(repo: TRepo): Promise<boolean> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        await octokit.repos.delete({
            owner: repo.owner.login,
            repo: repo.name,
        });

        return Promise.resolve(true);
    } catch (e: any) {
        output?.logError(repo, e);
    }

    return Promise.reject(false);
}

/**
 * Get starred repositories for the current user
 *
 * @export
 * @async
 * @returns {Promise<TRepo[]>}
 */
export async function getStarredGitHubRepositories(): Promise<TRepo[]> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const starredRepos = await octokit.paginate(octokit.activity.listReposStarredByAuthenticatedUser, (response) => {
            return response.data;
        });

        return Promise.resolve(starredRepos as TRepo[]);
    } catch (e: any) {
        output?.appendLine(e.message, output.messageType.error);
    }

    return Promise.reject([]);
}

/**
 * Get the current user's GitHub repositories
 *
 * @export
 * @async
 * @returns {Promise<TRepo[]>}
 */
export async function getAuthenticatedUserRepositories(): Promise<TRepo[]> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, (response) => {
            return response.data;
        });

        return Promise.resolve(repos as TRepo[]);
    } catch (e: any) {
        output?.appendLine(e.message, output.messageType.error);
    }

    return Promise.reject([]);
}
