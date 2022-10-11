import { Uri } from "vscode";
import { REPO_SCHEME } from "./FileSystem/fileSystem";

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
