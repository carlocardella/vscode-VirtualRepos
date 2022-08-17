import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Repo, RepoFile } from "../GitHub/repos";

export class RepoNode extends TreeItem {
    constructor(public repo: Repo) {
        super(repo.name, TreeItemCollapsibleState.Collapsed);
    }
}

export class RepoFileNode extends TreeItem {
    constructor(public repo: Repo, public file: RepoFile) {
        super(
            file.name,
            file.isDirectory
                ? TreeItemCollapsibleState.Collapsed
                : TreeItemCollapsibleState.None
        );
    }
}
