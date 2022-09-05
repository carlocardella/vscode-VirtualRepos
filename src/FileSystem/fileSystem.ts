import { Disposable, Event, EventEmitter, FileChangeEvent, FileStat, FileSystemError, FileSystemProvider, FileType, TextDocument, Uri } from "vscode";
import { getRepoFileContent, setRepoFileContent } from "../GitHub/commands";
import { TGitHubUpdateContent, TRepoContent } from "../GitHub/types";
import { RepoNode } from "../Tree/nodes";
import { store } from "./store";

export const REPO_SCHEME = "github-repo";
const REPO_QUERY = `${REPO_SCHEME}=`;

export class RepoFile implements FileStat {
    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.name = name;
        this.type = FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
    }
}

export class RepoDirectory implements FileStat {
    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.name = name;
        this.type = FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
    }
}

export class RepoFileSystemProvider implements FileSystemProvider {
    private _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
    readonly onDidChangeFile: Event<FileChangeEvent[]> = this._onDidChangeFile.event;

    async readFile(uri: Uri): Promise<Uint8Array> {
        const [repository, file] = RepoFileSystemProvider.getRepoInfo(uri)!;
        return await getRepoFileContent(repository, file);
    }

    static getRepoInfo(uri: Uri): [RepoNode, TRepoContent] | undefined {
        const match = RepoFileSystemProvider.getFileInfo(uri);

        if (!match) {
            // investigate: really needed? This likely always matches since getFileInfo does nothing more that parse the uri
            return;
        }

        const repository = store.repos.find((repo) => repo!.name === match[0])!;
        const file = repository!.tree?.tree.find((file: TRepoContent) => file.path === match[1]);

        return [repository, file];
    }

    watch(_resource: Uri): Disposable {
        // ignore, fires for all changes...
        return new Disposable(() => {});
    }

    static getFileUri(repoName: string, filePath: string = "") {
        return Uri.parse(`${REPO_SCHEME}://${repoName}/${filePath}`);
    }

    static getFileInfo(uri: Uri): [string, string] | undefined {
        const repo = uri.authority;
        const path = uri.path.startsWith("/") ? uri.path.substring(1) : uri.path;

        return [repo, path];
    }

    static isRepoDocument(document: TextDocument, repo?: string) {
        return document.uri.scheme === REPO_SCHEME && (!repo || document.uri.query === `${REPO_QUERY}${repo}`);
    }

    stat(uri: Uri): FileStat {
        if (uri.path === "/") {
            return {
                type: FileType.Directory,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 100,
            };
        }

        const fileInfo = RepoFileSystemProvider.getRepoInfo(uri);

        if (fileInfo && fileInfo[1]) {
            const type = fileInfo[1].type === "blob" ? FileType.File : FileType.Directory;

            return {
                type,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 100,
            };
        } else {
            throw FileSystemError.FileNotFound(uri);
        }
    }

    async delete(uri: Uri): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async rename(uri: Uri): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deleteDirectory(uri: Uri): Promise<void> {
        throw new Error("Method not implemented.");
    }

    readDirectory(uri: Uri): [string, FileType][] {
        throw new Error("Method not implemented.");
    }

    createDirectory(uri: Uri): void {
        // Folders do not really exist in Git, no action needed
    }

    writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean }): void | Thenable<void> {
        let repository = store.repos.find((repo) => repo!.name === uri.authority)!;
        let file = repository!.tree?.tree.find((file: TRepoContent) => file.path === uri.fsPath.substring(1));

        setRepoFileContent(repository, file, content).then((response: TGitHubUpdateContent) => {
            file.sha = response.content?.sha;
            file.size = response.content?.size;
            file.url = response.content?.git_url;
        });

        return Promise.resolve();
    }
}
