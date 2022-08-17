import { Uri } from "vscode";

export interface IRepo {
    name: string;
    iconPath: string;
}

export interface IRepoFile {
    path: string;
    size: number;
    sha: string;
    mode: string;
    contents: string | undefined;
    isDirectory: boolean;
    uri: Uri;
    name: string;
    files: IRepoFile[];
    iconPath: string;
}

export interface IRepoComment {
    id: string;
    body: string;
    user: IUser;
    createdAt: string;
    updatedAt: string;
    authorAssociation: "NONE" | "OWNER";
}

interface IUser {
    id: number;
    login: string;
    avatarUrl: string;
    htmlUrl: string;
}
