import { IRepo, IRepoComment, IRepoFile } from "./interfaces";
import { Uri } from "vscode";
import { output } from "./../extension";

export class Repo implements IRepo {
    name: string;
    iconPath: string;

    constructor(name: string, iconPath: string) {
        this.name = name;
        this.iconPath = iconPath;
    }
}

export class RepoFile implements IRepoFile {
    path: string;
    size: number;
    sha: string;
    mode: string;
    contents: string | undefined;
    isDirectory: boolean;
    uri: Uri;
    iconPath: string;

    constructor(
        path: string,
        size: number,
        sha: string,
        mode: string,
        contents: string | undefined,
        isDirectory: boolean,
        uri: Uri,
        iconPath: string
    ) {
        this.path = path;
        this.size = size;
        this.sha = sha;
        this.mode = mode;
        this.contents = contents;
        this.isDirectory = isDirectory;
        this.uri = uri;
        this.iconPath = iconPath;
    }

    get name(): string {
        output.appendLine(
            "RepoFile.name not implemented",
            output.messageType.error
        );
        return "";
    }

    get files(): IRepoFile[] {
        output.appendLine(
            "RepoFile.files not implemented",
            output.messageType.error
        );
        return [];
    }

    get isFile(): boolean {
        output.appendLine(
            "RepoFile.isFile not implemented",
            output.messageType.error
        );
        return !this.isDirectory;
    }

    get comments(): IRepoComment[] {
        output.appendLine(
            "RepoFile.comments not implemented",
            output.messageType.error
        );
        return [];
    }
}
