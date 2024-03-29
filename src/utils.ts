import { commands, Uri } from "vscode";
import { extensionContext, store } from "./extension";
import { REPO_SCHEME } from "./FileSystem/fileSystem";
import { SortDirection, SortType } from "./FileSystem/storage";
import { GlobalStorageKeysForSync } from "./GitHub/constants";

/**
 * Given a URI, returns the repository full_name (owner/name).
 *
 * @export
 * @async
 * @param {Uri} uri The URI to get the repository from.
 * @returns {string | undefined}
 */
export function getRepoFullNameFromUri(uri: Uri): string | undefined {
    if (uri.scheme === REPO_SCHEME) {
        const owner = uri.authority;
        const repoName = uri.path.split("/")[1];

        return `${owner}/${repoName}`;
    }
}

export function getRepoNameFromUri(uri: Uri): string | undefined {
    if (uri.scheme === REPO_SCHEME) {
        return uri.path.split("/")[1];
    }
}

/**
 * Given a URI, returns "owner/path"
 *
 * @export
 * @param {Uri} uri The URI to get the owner and path from.
 * @returns {(string | undefined)}
 */
export function getOwnerAndPathFromUri(uri: Uri): string | undefined {
    if (uri.scheme === REPO_SCHEME) {
        return uri.toString().split("/").slice(2).join("/");
    }
}

/**
 * Given a Uri, returns the file path without the repo name.
 *
 * @export
 * @param {Uri} uri The URI to get the path from.
 * @returns {(string | undefined)}
 */
export function getFilePathWithoutRepoNameFromUri(uri: Uri): string | undefined {
    if (uri.scheme === REPO_SCHEME) {
        let path = uri.path.split("/").slice(2).join("/");
        // .match(/[^\/]+.*/)![0];
        return removeLeadingSlash(path);
    }
}

/**
 * Remove the leading slash(es) from a string.
 *
 * @export
 * @param {string} path The path to remove the leading slash(es) from.
 * @returns {string}
 */
export function removeLeadingSlash(path: string): string {
    return path.match(/[^\/]+.*/)![0];
}

export function encodeText(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text, "base64").toString("latin1").split("").map(charCodeAt));
}

export function decodeText(text: string): string {
    return Buffer.from(text).toString("base64");
}

/**
 * Helper function, returns the character an position zero of a string.
 *
 * @param {string} c The string to filter
 * @returns {*}
 */
export function charCodeAt(c: string) {
    return c.charCodeAt(0);
}

export function getFileNameFromUri(uri: Uri): string {
    return uri.path.split("/").pop()!;
}

/**
 * Converts a string to a byte array
 *
 * @export
 * @param {string} value The string to convert
 * @returns {Uint8Array}
 */
export function stringToByteArray(value: string): Uint8Array {
    return new TextEncoder().encode(value);
}

/**
 * Converts a byte array to a string
 *
 * @export
 * @param {Uint8Array} value The byte array to convert
 * @returns {string}
 */
export function byteArrayToString(value: Uint8Array): string {
    return new TextDecoder().decode(value);
}

/**
 * Add SortType to global storage and set context.
 *
 * @export
 * @param {SortType} sortType The sort type to set.
 */
export function setSortTypeContext(sortType: SortType) {
    Object.keys(SortType).forEach((key) => {
        if (key === sortType) {
            commands.executeCommand("setContext", `VirtualRepos.sortType.${key}`, true);
        } else {
            commands.executeCommand("setContext", `VirtualRepos.sortType.${key}`, false);
        }
    });
    store.sortType = sortType;
    store.add(extensionContext, GlobalStorageKeysForSync.sortType, sortType);
}

/**
 * Add SortDirection to global storage and set context.
 *
 * @export
 * @param {SortDirection} sortDirection The sort direction to set.
 */
export function setSortDirectionContext(sortDirection: SortDirection) {
    Object.keys(SortDirection).forEach((key) => {
        if (key === sortDirection) {
            commands.executeCommand("setContext", `VirtualRepos.sortDirection.${key}`, true);
        } else {
            commands.executeCommand("setContext", `VirtualRepos.sortDirection.${key}`, false);
        }
    });
    store.sortDirection = sortDirection;
    store.add(extensionContext, GlobalStorageKeysForSync.sortDirection, sortDirection);
}
