import {
    commands,
    Disposable,
    Event,
    EventEmitter,
    FileChangeEvent,
    FileChangeType,
    FileStat,
    FileSystemError,
    FileSystemProvider,
    FileType,
    TextDocument,
    Uri,
} from "vscode";
import { repoProvider } from "../extension";
import { createOrUpdateFile, getRepoFileContent } from "../GitHub/commands";
import { TGitHubUpdateContent, TContent } from "../GitHub/types";
import { FileContent, RepoNode } from "../Tree/nodes";
import { store } from "./storage";

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

    constructor() {
        this._onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
    }

    async readFile(uri: Uri): Promise<Uint8Array> {
        const [repository, file] = RepoFileSystemProvider.getRepoInfo(uri)!;
        return await getRepoFileContent(repository, file);
    }

    static getRepoInfo(uri: Uri): [RepoNode, TContent] | undefined {
        const match = RepoFileSystemProvider.getFileInfo(uri);

        if (!match) {
            // investigate: really needed? This likely always matches since getFileInfo does nothing more that parse the uri
            return;
        }

        const repository = store.repos.find((repo) => repo!.name === match[0])!;
        const file = repository!.tree?.tree.find((file: TContent) => file.path === match[1]);

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
        const repoName = uri.authority;
        const path = uri.path.startsWith("/") ? uri.path.substring(1) : uri.path;

        return [repoName, path];
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
        // const repository = store.repos.find((repo) => repo!.name === match[0])!;
        // const file = repository!.tree?.tree.find((file: TContent) => file.path === match[1]);
        throw new Error("Method not implemented.");
    }

    async rename(uri: Uri): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deleteDirectory(uri: Uri): Promise<void> {
        // Folders do not really exist in Git, no action needed
    }

    readDirectory(uri: Uri): [string, FileType][] {
        throw new Error("Method not implemented.");
    }

    createDirectory(uri: Uri): void {
        // Folders do not really exist in Git, no action needed
    }

    writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean }): Promise<void> {
        let repository = store.repos.find((repo) => repo!.name === uri.authority)!;
        let file: TContent = repository!.tree?.tree.find((file: TContent) => file.path === uri.path.substring(1));

        if (!file) {
            file = new FileContent();
            file.path = uri.path.substring(1);
            createOrUpdateFile(repository, file, content).then((response: TGitHubUpdateContent) => {
                file.sha = response.content?.sha;
                file.size = response.content?.size;
                file.url = response.content?.git_url;
            });

            this._onDidChangeFile.fire([{ type: FileChangeType.Created, uri }]); // investigate: needed?
            repoProvider.refresh();
            // commands.executeCommand("vscode.open", uri, );
        } else {
            file.path = uri.path.substring(1);
            createOrUpdateFile(repository, file, content).then((response: TGitHubUpdateContent) => {
                file.sha = response.content?.sha;
                file.size = response.content?.size;
                file.url = response.content?.git_url;
            });

            this._onDidChangeFile.fire([{ type: FileChangeType.Created, uri }]); // investigate: needed?
            // repoProvider.refresh();
        }

        return Promise.resolve();
    }
}
