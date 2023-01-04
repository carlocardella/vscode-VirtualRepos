import { RepoNode } from "../Tree/nodes";
import { ExtensionContext } from "vscode";
import { GlobalStorageKeys } from "../GitHub/constants";
import { credentials, extensionContext, output, repoProvider } from "../extension";
import { getGitHubBranch, getGitHubRepository, getGitHubTree } from "../GitHub/api";
import { getOrRefreshFollowedUsers, getOrRefreshStarredRepos, getRepoDetails } from "../GitHub/commands";
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
    // private _sortType: SortType | undefined;
    get sortType(): SortType {
        // return this._sortType;
        return this.getFromGlobalState(extensionContext, GlobalStorageKeys.sortType) ?? SortType.name;
    }
    set sortType(value: SortType) {
        // this._sortType = value;
        this.addToGlobalState(extensionContext, GlobalStorageKeys.sortType, value);
    }

    /**
     * Repositories sort direction
     *
     * @public
     * @type {SortDirection}
     */
    // private _sortDirection: SortDirection | undefined;
    get sortDirection(): SortDirection {
        // return this._sortDirection;
        return this.getFromGlobalState(extensionContext, GlobalStorageKeys.sortDirection) ?? SortDirection.ascending;
    }
    set sortDirection(value: SortDirection) {
        // this._sortDirection = value;
        this.addToGlobalState(extensionContext, GlobalStorageKeys.sortDirection, value);
    }

    /**
     * Initialize or refresh the Store object
     *
     * @async
     */
    async init() {
        await getOrRefreshStarredRepos();
        await getOrRefreshFollowedUsers();
        const reposFromGlobalStorage = this.getRepoFromGlobalState(extensionContext);
        if (reposFromGlobalStorage.length === 0) {
            output?.appendLine("No repos found in global storage", output.messageType.info);
            return Promise.resolve([]);
        }

        let childNodes = this.repos;
        let repos = await Promise.all(
            reposFromGlobalStorage?.map(async (repo: string) => {
                let [owner, name] = getRepoDetails(repo);
                let repoFromGitHub = await getGitHubRepository(owner, name);
                if (repoFromGitHub) {
                    return Promise.resolve(repoFromGitHub as TRepo);
                }
                return Promise.reject();
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
                            output?.appendLine(`Error reading repo ${repo!.name}: ${error.response.data.message}`, output.messageType.error);
                        } else {
                            output?.appendLine(`${repo!.name}: ${error.response}`, output.messageType.error);
                        }
                    }
                })
        );

        this.repos = childNodes;

        this.sortType = this.getFromGlobalState(extensionContext, GlobalStorageKeys.sortType);
        this.sortDirection = this.getFromGlobalState(extensionContext, GlobalStorageKeys.sortDirection);
        let sortType = this.sortType;
        let sortDirection = this.sortDirection;

        if (sortType !== undefined && sortDirection !== undefined) {
            this.sortRepos(sortType, sortDirection);
        }

        repoProvider.refresh();
    }

    /**
     * Wrapper around init() to refresh the Store object
     */
    refresh() {
        this.init();
    }

    /**
     * Add a new value to the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeys} key Key to store the value under
     * @param {*} value Value to store, must be json serializable
     */
    public addToGlobalState(context: ExtensionContext, key: GlobalStorageKeys, value: any) {
        context.globalState.update(key, value);
    }

    /**
     * Read a value from the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeys} key Key to read the value from
     * @returns {*}
     */
    public getFromGlobalState(context: ExtensionContext, key: GlobalStorageKeys): any {
        return context.globalState.get(key);
    }

    /**
     * Remove a value from the global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @param {GlobalStorageKeys} key Key to remove from global storage
     */
    public removeFromGlobalState(context: ExtensionContext, key: GlobalStorageKeys) {
        context.globalState.update(key, undefined);
    }

    /**
     * Get repositories from global storage
     *
     * @public
     * @param {ExtensionContext} context Extension context
     * @returns {string[]}
     */
    public getRepoFromGlobalState(context: ExtensionContext): string[] {
        return context.globalState.get(GlobalStorageKeys.repoGlobalStorage, []);
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

        this.addToGlobalState(extensionContext, GlobalStorageKeys.sortType, sortType);
        this.addToGlobalState(extensionContext, GlobalStorageKeys.sortDirection, sortDirection);
        this.isSorted = true;

        output?.appendLine(`Sorted repos by ${SortType[sortType]} ${SortDirection[sortDirection]}`, output.messageType.info);

        this.repos = repos;
        // return repos;
    }

    /**
     * Remove all entries from global storage
     *
     * @param {ExtensionContext} context Extension context
     */
    clearGlobalStorage(context: ExtensionContext) {
        context.globalState.update(GlobalStorageKeys.repoGlobalStorage, []);
        context.globalState.update(GlobalStorageKeys.sortDirection, []);
        context.globalState.update(GlobalStorageKeys.sortType, []);

        output?.appendLine(`Cleared global storage`, output.messageType.info);
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
    async purgeRepoGlobalStorage(context: ExtensionContext, repos?: string[]): Promise<string[]> {
        let cleanedGlobalStorage: string[] = [];
        if (repos) {
            cleanedGlobalStorage = repos.filter((item) => item !== undefined);
            context.globalState.update(GlobalStorageKeys.repoGlobalStorage, cleanedGlobalStorage);
        } else {
            const globalStorage = context.globalState.get(GlobalStorageKeys.repoGlobalStorage, []) as string[];
            cleanedGlobalStorage = await Promise.all(
                globalStorage.map(async (repo) => {
                    let repoOwner = repo.split("/")[0];
                    let repoName = repo.split("/")[1];
                    let validRepo = await getGitHubRepository(repoOwner, repoName);
                    if (!validRepo) {
                        this.removeRepoFromGlobalStorage(context, repo);
                        output?.appendLine(`Removed ${repo} from global storage`, output.messageType.info);
                        return Promise.resolve(repo);
                    } else {
                        return Promise.reject();
                    }
                })
            );
        }

        return cleanedGlobalStorage;
    }

    /**
     * Remove a repository from global storage
     *
     * @param {ExtensionContext} context Extension context
     * @param {string} repoFullName Full name (owner/name) or the repository to remove from global storage
     */
    removeRepoFromGlobalStorage(context: ExtensionContext, repoFullName: string): void {
        let globalStorage = context.globalState.get(GlobalStorageKeys.repoGlobalStorage) as string[];
        if (globalStorage) {
            globalStorage = globalStorage.filter((item) => item.toLocaleLowerCase() !== repoFullName.toLocaleLowerCase());
            context.globalState.update(GlobalStorageKeys.repoGlobalStorage, globalStorage);

            this.init();

            output?.appendLine(`Removed ${repoFullName} from global storage`, output.messageType.info);
            output?.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
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
    async addRepoToGlobalStorage(context: ExtensionContext, value: string): Promise<void> {
        let globalStorage = this.getRepoFromGlobalState(context);

        let [owner, repoName] = ["", ""];
        if (value.indexOf("/") === -1) {
            owner = credentials.authenticatedUser.login;
            repoName = value;
        } else {
            [owner, repoName] = value.split("/");
        }

        globalStorage.push(`${owner}/${repoName}`);
        context.globalState.update(GlobalStorageKeys.repoGlobalStorage, globalStorage);

        this.init();

        output?.appendLine(`Added ${value} to global storage`, output.messageType.info);
        output?.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
    }
}
