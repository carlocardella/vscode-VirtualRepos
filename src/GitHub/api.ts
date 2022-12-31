import * as rest from "@octokit/rest";
import { credentials, output } from "../extension";
import { RepoNode } from "../Tree/nodes";
import { decodeText } from "../utils";
import { TBranch, TCommit, TContent, TGitHubUpdateContent, TGitHubUser, TRef, TRepo, TTree, TTreeRename, TUser } from "./types";

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
        const data = await octokit.paginate(octokit.repos.listForAuthenticatedUser, { type: "owner" }, (response) => {
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
                message: `VirtualRepos: create ${file!.path}`,
                content: decodeText(fileContentString),
            }));
        } else {
            // the file already exists, update it
            ({ data } = await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: file!.path!,
                message: `VirtualRepos: update ${file!.path}`,
                content: decodeText(fileContentString),
                sha: file!.sha,
            }));
        }

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error writing file ${repo.owner}/${repo.name}/${file!.path}. ${e.message.trim()}`, output.messageType.error);
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
export async function getGitHubTree(repo: TRepo, treeSHA: string): Promise<TTree | TTreeRename | undefined> {
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
export async function refreshGitHubTree(repo: TRepo, branchName: string): Promise<TTree | TTreeRename | undefined> {
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
 * Get a GitHub repository
 *
 * @export
 * @async
 * @param {string} owner The owner of the repository
 * @param {string} repoName The name of the repository
 * @returns {(Promise<TRepo | undefined>)}
 */
export async function getGitHubRepository(owner: string, repoName: string): Promise<TRepo | undefined> {
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
 * Get details about a GitHub user
 *
 * @export
 * @async
 * @param {string} username The username of the user to get details for
 * @returns {(Promise<TUser | undefined>)}
 */
export async function getGitHubUser(username: string): Promise<TUser | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.users.getByUsername({
            username,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Cannot find user ${username}: ${e.message}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Fork a GitHub repository into the authenticate user's account
 *
 * @export
 * @async
 * @param {TRepo} repo The repository to fork
 * @returns {(Promise<TRepo | undefined>)}
 */
export async function forkGitHubRepository(repo: TRepo): Promise<TRepo | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.createFork({
            owner: repo.owner.login,
            repo: repo.name,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.logError(repo, e);
    }

    return Promise.reject(undefined);
}

/**
 * Create a new Tree on GitHub
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to create the tree in
 * @param {TTreeRename[]} newTree Contents of the new tree
 * @returns {(Promise<TTree | undefined>)}
 */
export async function createGitHubTree(repo: RepoNode, newTree: TTreeRename[], deleteFolder?: boolean): Promise<TTree | TTreeRename | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        let options: any;
        if (deleteFolder) {
            options = { owner: repo.owner, repo: repo.name, tree: newTree };
        } else {
            const base_tree = repo!.tree!.sha;
            options = { owner: repo.owner, repo: repo.name, base_tree, tree: newTree };
        }
        const { data } = await octokit.git.createTree(options);

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error creating new Tree: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * File Mode for a GitHub tree
 * The file mode; one of 100644 for file (blob), 100755 for executable (blob), 040000 for subdirectory (tree), 160000 for submodule (commit), or 120000 for a blob that specifies the path of a symlink
 *
 * @export
 * @enum {number}
 */
export enum FileMode {
    file = "100644",
    executable = "100755",
    subdirectory = "040000",
    submodule = "160000",
    symlink = "120000",
}

/**
 * Type Mode
 *
 * @export
 * @enum {number}
 */
export enum TypeMode {
    blob = "blob",
    tree = "tree",
    commit = "commit",
}

/**
 * Create a new commit on GitHub
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to create the commit on
 * @param {string} message The commit message
 * @param {string} tree The tree SHA
 * @param {string[]} parents The parent SHAs
 * @returns {(Promise<TCommit | undefined>)}
 */
export async function createGitHubCommit(repo: RepoNode, message: string, tree: string, parents: string[]): Promise<TCommit | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.git.createCommit({
            owner: repo.owner,
            repo: repo.name,
            message,
            tree,
            parents,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error creating new commit: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Update a reference in the git database on GitHub
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to update the reference in
 * @param {string} ref The reference to update
 * @param {string} sha The SHA to update the reference to
 * @returns {(Promise<TRef | undefined>)}
 */
export async function updateGitHubRef(repo: RepoNode, ref: string, sha: string): Promise<TRef | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.git.updateRef({
            owner: repo.owner,
            repo: repo.name,
            ref,
            sha,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error updating ref: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Star a GitHub repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to star
 * @returns {unknown}
 */
export async function starGitHubRepository(repo: RepoNode) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.activity.starRepoForAuthenticatedUser({
            owner: repo.owner,
            repo: repo.name,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error starring repository ${repo.full_name}: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

/**
 * Unstar a GitHub repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to unstar
 * @returns {unknown}
 */
export async function unstarGitHubRepository(repo: RepoNode) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.activity.unstarRepoForAuthenticatedUser({
            owner: repo.owner,
            repo: repo.name,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error unstarring repository ${repo.full_name}: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

export async function followGitHubUser(user: string) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.users.follow({ username: user });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error following user ${user}: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

export async function unfollowGitHubUser(user: string) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.users.unfollow({ username: user });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error unfollowing user ${user}: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

export async function getGutHubFollowedUsers(): Promise<TUser[] | undefined> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.users.listFollowedByAuthenticatedUser();

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error getting followed users: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}

export async function isFollowedUser(user: TUser): Promise<boolean> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const response = await octokit.users.checkFollowingForUser({ username: credentials.authenticatedUser.name!, target_user: user.login });

        if (response.status === 204) {
            return Promise.resolve(true);
        }
    } catch (e: any) {
        output?.appendLine(`Error checking if user ${user.login} is followed: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(false);
}

/**
 * Update a GitHub repository
 *
 * @export
 * @async
 * @param {RepoNode} repo The repository to update
 * @param {?string} [name] The new name of the repository
 * @param {?boolean} [isPrivate] Whether the repository should be private or not
 * @param {?boolean} [has_wiki] Whether the repository should have a wiki or not
 * @returns {unknown}
 */
export async function updateGitHubRepository(repo: RepoNode, isPrivate?: boolean, has_wiki?: boolean) {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    try {
        const { data } = await octokit.repos.update({
            owner: repo.owner,
            repo: repo.name,
            private: isPrivate,
            has_wiki: has_wiki,
        });

        return Promise.resolve(data);
    } catch (e: any) {
        output?.appendLine(`Error updating repository ${repo.full_name}: ${e.message.trim()}`, output.messageType.error);
    }

    return Promise.reject(undefined);
}
