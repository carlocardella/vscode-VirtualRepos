import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { output } from "../extension";
import { RepoFileSystemProvider } from "../FileSystem/fileSystem";
import { store } from "../FileSystem/store";
import { getGitHubReposForAuthenticatedUser, getGitHubRepoContent, getGitHubTree, getGitHubBranch } from "../GitHub/commands";
import { TRepo, ContentType, TRepoContent } from "../GitHub/types";

export class RepoNode extends TreeItem {
    owner: string;
    tree?: any;
    name: string;

    constructor(public repo: TRepo, tree?: any) {
        super(repo.name, TreeItemCollapsibleState.Collapsed);

        this.tooltip = `${repo.name}`;
        let iconName = "repo";
        this.iconPath = new ThemeIcon(iconName);
        this.repo = repo;
        this.owner = repo.owner.login;
        this.tree = tree;
        this.name = repo.name;
    }
}

export class RepoContentNode extends TreeItem {
    owner: string;
    repo: TRepo;
    path: string;
    repoName: string;
    uri: Uri;

    constructor(public node: TRepoContent, repo: TRepo) {
        super(node.name, node.type === ContentType.file ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed);

        this.tooltip = node.path;
        this.iconPath = node.type === ContentType.file ? ThemeIcon.File : ThemeIcon.Folder;
        this.path = node.path;
        this.uri = RepoFileSystemProvider.getFileUri(repo.name, this.path);
        this.owner = repo.owner.login;
        this.node = node;
        this.repo = repo;
        this.repoName = repo.name;

        if (node.type === ContentType.file) {
            this.command = {
                command: "vscode.open",
                title: "Open file",
                arguments: [this.uri, { preview: true }],
            };
        }
    }
}

export class RepoProvider implements TreeDataProvider<RepoContentNode> {
    getTreeItem = (node: RepoContentNode) => node;

    async getChildren(element?: RepoContentNode): Promise<any[]> {
        // @update: any
        if (element) {
            const content = await getGitHubRepoContent(element.owner, element.repo.name, element?.node?.path);
            let childNodes = Object.values(content)
                .map((node) => new RepoContentNode(<TRepoContent>node, element.repo))
                .sort((a, b) => a.node.name.localeCompare(b.node.name))
                .sort((a, b) => a.node.type.localeCompare(b.node.type));

            return Promise.resolve(childNodes);
        } else {
            let repos = await getGitHubReposForAuthenticatedUser();

            let childNodes = await Promise.all(
                repos!.map(async (repo: TRepo) => {
                    try {
                        let branch = await getGitHubBranch(repo, repo.default_branch);
                        let tree = (await getGitHubTree(repo, branch!.commit.sha)) ?? undefined;
                        return new RepoNode(repo, tree);
                    } catch (error: any) {
                        if (error.name === "HttpError") {
                            output?.appendLine(`Error reading repo ${repo.name}: ${error.response.data.message}`, output.messageType.error);
                        } else {
                            output?.appendLine(`${repo.name}: ${error.response}`, output.messageType.error);
                        }
                    }
                })
            );

            store.repos = childNodes ?? [];
            return Promise.resolve(childNodes);
        }
    }

    private _onDidChangeTreeData: EventEmitter<RepoContentNode | undefined | null | void> = new EventEmitter<RepoContentNode | undefined | null | void>();
    readonly onDidChangeTreeData: Event<RepoContentNode | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
