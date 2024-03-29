import { RepoNode } from "../Tree/nodes";
import { ExtensionContext } from "vscode";
import { GlobalStorageKeysForSync } from "../GitHub/constants";
import { credentials, extensionContext, output } from "../extension";
import { getGitHubBranch, getGitHubRepository, getGitHubTree } from "../GitHub/api";
import { getOrRefreshAuthenticatedUserRepos, getOrRefreshFollowedUsers, getOrRefreshStarredRepos, getRepoDetails } from "../GitHub/commands";
import { TRepo } from "../GitHub/types";

/**
 * Properties to sort repositories by
 *
 * @export
 * @enum {number}
 */
export enum SortType {
    name = "name",
    stars = "stars",
    forks = "forks",
    creationTime = "creationTime",
    updateTime = "updateTime",
    watchers = "watchers",
}

/**
 * Direction to sort repositories by
 *
 * @export
 * @enum {number}
 */
export enum SortDirection {
    ascending = "ascending",
    descending = "descending",
}

/**
 * Class to store and manage repositories; used as source for the TreeVIew
 *
 * @export
 * @class Store
 * @typedef {Store}
 */
export class Store {
    /**
     * Repositories array
     *
     * @public
     * @type {((RepoNode | undefined)[])}
     */
    public repos: (RepoNode | undefined)[] = [];

    /**
     * Indicates whether the repositories are sorted
     *
     * @public
     * @type {boolean}
     */
    public isSorted = false;

    /**
     * Repositories sort by property
     *
     * @public
     * @type {SortType}
     */
    get sortType(): SortType {
        return this.get(extensionContext, GlobalStorageKeysForSync.sortType) ?? SortType.name;
    }
    set sortType(value: SortType) {
        this.add(extensionContext, GlobalStorageKeysForSync.sortType, value);
    }

    /**
     * Repositories sort direction
     *
     * @public
     * @type {SortDirection}
     */
    get sortDirection(): SortDirection {
        return this.get(extensionContext, GlobalStorageKeysForSync.sortDirection) ?? SortDirection.ascending;
    }
    set sortDirection(value: SortDirection) {
        this.add(extensionContext, GlobalStorageKeysForSync.sortDirection, value);
    }

    /**
     * Initialize or refresh the Store object
     *
     * @async
     */
    async init(forceRefreshFromGitHub?: boolean) {
        await getOrRefreshStarredRepos(undefined, forceRefreshFromGitHub);
        await getOrRefreshFollowedUsers(undefined, forceRefreshFromGitHub);
        await getOrRefreshAuthenticatedUserRepos(undefined, forceRefreshFromGitHub);
        const reposFromGlobalStorage = this.getRepos(extensionContext);
        if (reposFromGlobalStorage.length === 0) {
            output?.info("No repos found in global storage");
            return Promise.resolve((this.repos = []));
        }

        // @investigate: if the user is just removing a repo, do we need to re-fetch all of them?

        let childNodes = this.repos;
        let repos = await Promise.all(
            reposFromGlobalStorage?.map(async (repo: string) => {
                let [owner, name] = getRepoDetails(repo);
                let repoFromGitHub = await getGitHubRepository(owner, name);
                if (repoFromGitHub) {
                    return Promise.resolve(repoFromGitHub as TRepo);
                }
            })
        );

        childNodes = await Promise.all(
            repos
                .filter((repo) => repo !== undefined)
                .map(async (repo) => {
                    try {
                        let branch = await getGitHubBranch(repo!, repo!.default_branch);
                        let tree = (await getGitHubTree(repo!, branch!.commit.sha)) ?? undefined;
                        let repoNode = new RepoNode(repo!, tree);
                        await repoNode.init();
                        return repoNode;
                    } catch (error: any) {
                        if (error.name === "HttpError") {
                            output?.error(`Error reading repo ${repo!.name}: ${error.response.data.message}`);
                        } else {
                            output?.error(`${repo!.name}: ${error.response}`);
                        }
                    }
                })
        );

        this.repos = childNodes;

        this.sortType = this.get(extensionContext, GlobalStorageKeysForSync.sortType) ?? SortType.name;
        this.sortDirection = this.get(extensionContext, GlobalStorageKeysForSync.sortDirection) ?? SortDirection.ascending;
        if (this.sortType.length === 0) {
            this.sortType = SortType.name;
        }
        if (this.sortDirection.length === 0) {
            this.sortDirection = SortDirection.ascending;
        }
        let sortType = this.sortType;
        let sortDirection = this.sortDirection;

        if (sortType !== undefined && sortDirection !== undefined) {
            this.sortRepos(sortType, sortDirection);
        }
    }

    /**
     * Add a new value to the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeysForSync} key Key to store the value under
     * @param {*} value Value to store, must be json serializable
     */
    public add(context: ExtensionContext, key: GlobalStorageKeysForSync, value: any) {
        context.globalState.update(key, value);
    }

    /**
     * Read a value from the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeysForSync} key Key to read the value from
     * @returns {*}
     */
    public get(context: ExtensionContext, key: GlobalStorageKeysForSync): any {
        return context.globalState.get(key);
    }

    /**
     * Remove a value from the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeysForSync} key Key to remove from global storage
     */
    public remove(context: ExtensionContext, key: GlobalStorageKeysForSync) {
        context.globalState.update(key, undefined);
    }

    /**
     * Get repositories from global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @returns {string[]}
     */
    public getRepos(context: ExtensionContext): string[] {
        let repos = this.get(context, GlobalStorageKeysForSync.repoGlobalStorage) ?? [];
        if (repos.length === 0) {
            return [];
        }

        return repos;
    }

    /**
     * Sort repositories
     *
     * @param {SortType} sortType Sort by property
     * @param {SortDirection} sortDirection Sort direction
     */
    sortRepos(sortType: SortType, sortDirection: SortDirection) {
        let repos = this.repos as RepoNode[];

        switch (sortType) {
            case SortType.name:
                repos.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                break;
            case SortType.stars:
                repos.sort((a, b) => {
                    return a.stargazers_count - b.stargazers_count;
                });
                break;
            case SortType.forks:
                repos.sort((a, b) => {
                    return a.forks_count - b.forks_count;
                });
                break;
            case SortType.creationTime:
                repos.sort((a, b) => {
                    return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
                });
                break;
            case SortType.updateTime:
                repos.sort((a, b) => {
                    return new Date(a.pushed_at!).getTime() - new Date(b.pushed_at!).getTime();
                });
                break;
            case SortType.watchers:
                repos.sort((a, b) => {
                    return a.watchers_count - b.watchers_count;
                });
                break;
        }

        if (sortDirection === SortDirection.descending) {
            repos.reverse();
        }

        this.add(extensionContext, GlobalStorageKeysForSync.sortType, sortType);
        this.add(extensionContext, GlobalStorageKeysForSync.sortDirection, sortDirection);
        this.isSorted = true;

        output?.info(`Sorted repos by ${SortType[sortType]} ${SortDirection[sortDirection]}`);

        this.repos = repos;
        // return repos;
    }

    /**
     * Remove all entries from global storage
     *
     * @param {ExtensionContext} context Extension context
     */
    clear(context: ExtensionContext) {
        context.globalState.update(GlobalStorageKeysForSync.repoGlobalStorage, []);
        context.globalState.update(GlobalStorageKeysForSync.sortDirection, []);
        context.globalState.update(GlobalStorageKeysForSync.sortType, []);

        output.info("Cleared global storage");
        this.init();
    }

    /**
     * Remove invalid repositories from global storage
     *
     * @async
     * @param {ExtensionContext} context Extension context
     * @param {?string[]} [repos] Repositories to validate
     * @returns {Promise<string[]>}
     */
    async purgeRepo(context: ExtensionContext, repos?: string[]): Promise<string[]> {
        output?.debug("Purging global storage");
        let cleanedGlobalStorage: string[] = [];
        if (repos) {
            cleanedGlobalStorage = repos.filter((item) => item !== undefined);
            context.globalState.update(GlobalStorageKeysForSync.repoGlobalStorage, cleanedGlobalStorage);
        } else {
            const globalStorage = context.globalState.get(GlobalStorageKeysForSync.repoGlobalStorage, []) as string[];
            await Promise.all(
                globalStorage.map(async (repo) => {
                    let repoOwner = repo.split("/")[0];
                    let repoName = repo.split("/")[1];
                    let validRepo = await getGitHubRepository(repoOwner, repoName);
                    if (!validRepo) {
                        await this.removeRepo(context, repo);
                        return Promise.resolve(repo);
                    } else {
                        return Promise.reject();
                    }
                })
            );
            output?.debug(`Purged global storage: ${context.globalState.get(GlobalStorageKeysForSync.repoGlobalStorage, [])}`);
        }

        return context.globalState.get(GlobalStorageKeysForSync.repoGlobalStorage, []);
    }

    /**
     * Remove a repository from global storage
     *
     * @param {ExtensionContext} context Extension context
     * @param {string} repoFullName Full name (owner/name) or the repository to remove from global storage
     */
    async removeRepo(context: ExtensionContext, repoFullName: string): Promise<void> {
        let globalStorage = context.globalState.get(GlobalStorageKeysForSync.repoGlobalStorage) as string[];
        if (globalStorage) {
            globalStorage = globalStorage.filter((item) => item.toLocaleLowerCase() !== repoFullName.toLocaleLowerCase());
            context.globalState.update(GlobalStorageKeysForSync.repoGlobalStorage, globalStorage);

            await this.init();

            output?.info(`Removed ${repoFullName} from global storage`);
            output?.info(`Global storage: ${globalStorage}`);
        }
    }

    /**
     * Add a repository to global storage
     *
     * @async
     * @param {ExtensionContext} context Extension context
     * @param {string} value Repository full name (owner/name) to add to global storage
     * @returns {Promise<void>}
     */
    async addRepo(context: ExtensionContext, value: string): Promise<boolean> {
        let globalStorage = this.getRepos(context);

        let [owner, repoName] = ["", ""];
        if (value.indexOf("/") === -1) {
            owner = credentials.authenticatedUser.login;
            repoName = value;
        } else {
            [owner, repoName] = value.split("/");
        }

        let fullName = `${owner}/${repoName}`;

        if (globalStorage.includes(fullName)) {
            output?.info(`${fullName} is already in global storage`);
            return false;
        }

        globalStorage.push(fullName);
        context.globalState.update(GlobalStorageKeysForSync.repoGlobalStorage, globalStorage);

        this.init();

        output?.info(`Added ${fullName} to global storage`);
        output?.info(`Global storage: ${globalStorage}`);

        return true;
    }

    async refresh() {
        await this.init(true);
    }
}
