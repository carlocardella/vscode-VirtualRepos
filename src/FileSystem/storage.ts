import { RepoNode } from "../Tree/nodes";
import { ExtensionContext } from "vscode";
import { REPO_GLOBAL_STORAGE_KEY, GlobalStorageKeys } from "../GitHub/constants";
import { credentials, output, repoProvider } from "../extension";
import { openRepository } from "../GitHub/api";

export const store = {
    repos: [] as (RepoNode | undefined)[],
};

/**
 * Add a repository to the list of repositories in Global Storage
 *
 * @export
 * @param {ExtensionContext} context Extension context
 * @param {string} value Repository to add
 */
export async function addRepoToGlobalStorage(context: ExtensionContext, value: string): Promise<void> {
    let globalStorage = await getRepoFromGlobalStorage(context);

    let [owner, repoName] = ["", ""];
    if (value.indexOf("/") === -1) {
        owner = credentials.authenticatedUser.login;
        repoName = value;
    } else {
        [owner, repoName] = value.split("/");
    }

    globalStorage.push(`${owner}/${repoName}`);
    context.globalState.update(REPO_GLOBAL_STORAGE_KEY, globalStorage);

    repoProvider.refresh();

    output?.appendLine(`Added ${value} to global storage`, output.messageType.info);
    output?.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
}

export function addToGlobalState(context: ExtensionContext, key: GlobalStorageKeys, value: any): void {
    context.globalState.update(key, value);
}

export function getFromGlobalState(context: ExtensionContext, key: GlobalStorageKeys): any {
    return context.globalState.get(key) || undefined;
}

/**
 * Remove a repository from the list of repositories in Global Storage
 *
 * @export
 * @param {ExtensionContext} context Extension context
 * @param {string} repoFullName Repository to remove
 */
export function removeRepoFromGlobalStorage(context: ExtensionContext, repoFullName: string): void {
    let globalStorage = context.globalState.get(REPO_GLOBAL_STORAGE_KEY) as string[];
    if (globalStorage) {
        globalStorage = globalStorage.filter((item) => item.toLocaleLowerCase() !== repoFullName.toLocaleLowerCase());
        context.globalState.update(REPO_GLOBAL_STORAGE_KEY, globalStorage);

        repoProvider.refresh();

        output?.appendLine(`Removed ${repoFullName} from global storage`, output.messageType.info);
        output?.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
    }
}

/**
 * Get the list of repositories from Global Storage
 *
 * @export
 * @param {ExtensionContext} context Extension context
 * @returns {string[]}
 */
export async function getRepoFromGlobalStorage(context: ExtensionContext): Promise<string[]> {
    return context.globalState.get(REPO_GLOBAL_STORAGE_KEY, []);
}

/**
 * Remove all repositories from Global Storage
 *
 * @export
 * @param {ExtensionContext} context
 */
export function clearGlobalStorage(context: ExtensionContext) {
    context.globalState.update(REPO_GLOBAL_STORAGE_KEY, []);
    output?.appendLine(`Cleared global storage`, output.messageType.info);
    repoProvider.refresh();
}

/**
 * Remove invalid repositories from Global Storage
 *
 * @export
 * @async
 * @param {ExtensionContext} context Extension context
 * @param {?string[]} [repos] Repositories to check
 * @returns {Promise<string[]>}
 */
export async function purgeRepoGlobalStorage(context: ExtensionContext, repos?: string[]): Promise<string[]> {
    let cleanedGlobalStorage: string[] = [];
    if (repos) {
        cleanedGlobalStorage = repos.filter((item) => item !== undefined);
        context.globalState.update(REPO_GLOBAL_STORAGE_KEY, cleanedGlobalStorage);
    } else {
        const globalStorage = context.globalState.get(REPO_GLOBAL_STORAGE_KEY, []) as string[];
        cleanedGlobalStorage = await Promise.all(
            globalStorage.map(async (repo) => {
                let repoOwner = repo.split("/")[0];
                let repoName = repo.split("/")[1];
                let validRepo = await openRepository(repoOwner, repoName);
                if (!validRepo) {
                    removeRepoFromGlobalStorage(context, repo);
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
