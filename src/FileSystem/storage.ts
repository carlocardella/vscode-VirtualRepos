import { RepoNode } from "../Tree/nodes";
import { ExtensionContext } from "vscode";
import { GLOBAL_STORAGE_KEY } from "../GitHub/constants";
import { output, repoProvider } from "../extension";

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
export function addToGlobalStorage(context: ExtensionContext, value: string): void {
    let globalStorage: string[] = getReposFromGlobalStorage(context);
    globalStorage.push(value);
    context.globalState.update(GLOBAL_STORAGE_KEY, globalStorage);

    repoProvider.refresh();

    output.appendLine(`Added ${value} to global storage`, output.messageType.info);
    output.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
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

        output.appendLine(`Removed ${value} from global storage`, output.messageType.info);
        output.appendLine(`Global storage: ${globalStorage}`, output.messageType.info);
    }
}

/**
 * Get the list of repositories from Global Storage
 *
 * @export
 * @param {ExtensionContext} context Extension context
 * @returns {string[]}
 */
export function getReposFromGlobalStorage(context: ExtensionContext): string[] {
    return context.globalState.get(GLOBAL_STORAGE_KEY, []);
}

export function clearGlobalStorage(context: ExtensionContext) { 
    context.globalState.update(GLOBAL_STORAGE_KEY, []);
    output.appendLine(`Cleared global storage`, output.messageType.info);
    repoProvider.refresh();
}