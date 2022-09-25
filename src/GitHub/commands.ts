import { TextEncoder } from "util";
import { Uri, window, workspace } from "vscode";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { ContentNode, RepoNode } from "../Tree/nodes";
import { getGitHubRepoContent } from "./api";
import { TContent } from "./types";

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
export async function getRepoFileContent(repo: RepoNode, file: TContent): Promise<Uint8Array> {
    let data: any;
    if (!file!.content) {
        data = await getGitHubRepoContent(repo.owner, repo.name, file!.path);
        file!.content = data;
    } else {
        data = file!.content;
    }

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
 * Returns repository owner and name from <owner>/<repo> string
 *
 * @export
 * @param {string} repo The repository string
 * @returns {[string, string]}
 */
export function getRepoDetails(repo: string): [string, string] {
    const parts = repo.split("/");
    return [parts[0], parts[1]];
}

/**
 * Ask the user to enter a repository to open: <owner>/<repo>
 *
 * @export
 * @async
 * @returns {(Promise<string | undefined>)}
 */
export async function pickRepository(): Promise<string | undefined> {
    const pick = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "owner/repo", title: "Enter the repository to open, e.g. 'owner/repo'" });

    return pick;
}

/**
 * Converts a string to a byte array
 *
 * @export
 * @param {string} value The string to convert
 * @returns {*}
 */
export function stringToByteArray(value: string) {
    return new TextEncoder().encode(value);
}

/**
 * Create a new file in a GitHub repository
 *
 * @export
 * @async
 * @param {ContentNode} e The TreeItem containing the file to create
 * @returns {*}
 */
export async function addFile(e: ContentNode) {
    const newFileName = await window.showInputBox({ ignoreFocusOut: true, placeHolder: "path/filename", title: "Enter the filename (optional path)" });
    if (!newFileName) {
        return;
    }

    const [repoName, path] = RepoFileSystemProvider.getFileInfo(e.uri)!;
    const content = "";

    const fileSystemProvider = new RepoFileSystemProvider();
    fileSystemProvider.writeFile(Uri.parse(`${REPO_SCHEME}://${repoName}/${path}/${newFileName}`), stringToByteArray(content), {
        create: true,
        overwrite: true,
    });
}

/**
 * Delete the file or folder from the repository
 *
 * @export
 * @async
 * @param {ContentNode} node TreeView node to delete
 * @returns {*}
 */
export async function deleteNode(node: ContentNode) {
    const confirm = await window.showWarningMessage(`Are you sure you want to delete '${node.path}'?`, "Yes", "No", "Cancel");
    if (confirm !== "Yes") {
        return;
    }

    const fileSystemProvider = new RepoFileSystemProvider();
    fileSystemProvider.delete(node.uri);
}

/**
 * Upload files from the local disk to GitHub
 *
 * @export
 * @async
 * @param {(ContentNode | RepoNode)} destination The destination to upload the files to
 * @returns {Promise<void>}
 */
export async function uploadFiles(destination: ContentNode | RepoNode): Promise<void> {
    const files = await window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, title: "Select files to upload" });
    if (!files) {
        return Promise.reject();
    }

    const fileSystemProvider = new RepoFileSystemProvider();
    files.forEach(async (file) => {
        const content = await workspace.fs.readFile(file);
        let uriPath = "path" in destination ? destination.path : "";
        let uriFile = file.path.split("/").pop();
        let uri = Uri.from({
            scheme: REPO_SCHEME,
            authority: destination.repo.name,
            path: `${uriPath}/${uriFile}`,
        });

        await fileSystemProvider.writeFile(uri, content, {
            create: true,
            overwrite: false,
        });
    });

    return Promise.reject();
}
