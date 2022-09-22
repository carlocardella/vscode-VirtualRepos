import { RepoNode } from "../Tree/nodes";
import { ExtensionContext } from "vscode";
import { GLOBAL_STORAGE_KEY } from "../GitHub/constants";
import { output, repoProvider } from "../extension";
import { openRepository } from "../GitHub/commands";

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
export async function addToGlobalStorage(context: ExtensionContext, value: string): Promise<void> {
    let globalStorage = await getReposFromGlobalStorage(context);
    globalStorage.push(value);
    context.globalState.update(GLOBAL_STORAGE_KEY, globalStorage);

    repoProvider.refresh();

    output?.appendLine(`Added ${value} to global storage`, output.messageType.info);
    output?.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
}

/**
 * Remove a repository from the list of repositories in Global Storage
 *
 * @export
 * @param {ExtensionContext} context Extension context
 * @param {string} value Repository to remove
 */
export function removeFromGlobalStorage(context: ExtensionContext, value: string): void {
    let globalStorage = context.globalState.get(GLOBAL_STORAGE_KEY) as string[];
    if (globalStorage) {
        globalStorage = globalStorage.filter((item) => item !== value);
        context.globalState.update(GLOBAL_STORAGE_KEY, globalStorage);

        repoProvider.refresh();

        output?.appendLine(`Removed ${value} from global storage`, output.messageType.info);
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
export async function getReposFromGlobalStorage(context: ExtensionContext): Promise<string[]> {
    return context.globalState.get(GLOBAL_STORAGE_KEY, []);
    // return await purgeGlobalStorage(context);
}

export function clearGlobalStorage(context: ExtensionContext) {
    context.globalState.update(GLOBAL_STORAGE_KEY, []);
    output?.appendLine(`Cleared global storage`, output.messageType.info);
    repoProvider.refresh();
}

export async function purgeGlobalStorage(context: ExtensionContext, repos?: string[]): Promise<string[]> {
    let cleanedGlobalStorage: string[] = [];
    if (repos) {
        cleanedGlobalStorage = repos.filter((item) => item !== undefined);
        context.globalState.update(GLOBAL_STORAGE_KEY, cleanedGlobalStorage);
    } else {
        const globalStorage = context.globalState.get(GLOBAL_STORAGE_KEY, []) as string[];
        cleanedGlobalStorage = await Promise.all(
            globalStorage.map(async (repo) => {
                let repoOwner = repo.split("/")[0];
                let repoName = repo.split("/")[1];
                let validRepo = await openRepository(repoOwner, repoName);
                if (validRepo) {
                    return Promise.resolve(`${validRepo.owner.login}/${validRepo.name}`);
                } else {
                    return Promise.reject();
                }
            })
        );
    }

    return cleanedGlobalStorage;
}
