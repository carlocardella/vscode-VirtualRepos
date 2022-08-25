import {
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
} from "vscode";
import { getGitHubRepo, getGitHubRepoContent } from "../GitHub/commands";
import { TRepo, TContent, ContentType } from "../GitHub/types";

export class RepoNode extends TreeItem {
    owner: string;

    constructor(public repo: TRepo) {
        super(repo.name, TreeItemCollapsibleState.Collapsed);

        this.tooltip = `${repo.name}`;
        let iconName = "repo";
        this.iconPath = new ThemeIcon(iconName);
        this.repo = repo;
        this.owner = repo.owner.login;
    }
}

export class RepoContentNode extends TreeItem {
    owner: string;
    repo: TRepo;
    path: string;

    constructor(public node: TContent, repo: TRepo) {
        super(
            node.name,
            node.type === ContentType.file
                ? TreeItemCollapsibleState.None
                : TreeItemCollapsibleState.Collapsed
        );

        this.tooltip = node.path;
        this.iconPath =
            node.type === ContentType.file ? ThemeIcon.File : ThemeIcon.Folder;
        if (node.type === ContentType.file) {
            this.command = {
                command: "vscode.open",
                title: "Open file",
                arguments: [Uri.parse(node.html_url!), { preview: true }],
            };
        }

        this.owner = repo.owner.login;
        this.node = node;
        this.repo = repo;
        this.path = node.path;
    }
}

export class RepoProvider implements TreeDataProvider<RepoContentNode> {
    getTreeItem = (node: RepoContentNode) => node;

    async getChildren(element?: RepoContentNode): Promise<any[]> {
        // @update: any
        if (element) {
            const content = await getGitHubRepoContent(
                element.owner,
                // "carlocardella",
                element.repo.name, // this exists despite the error
                element?.node?.path
            );
            let childNodes = Object.values(content)
                .map(
                    (node) => new RepoContentNode(<TContent>node, element.repo)
                )
                .sort((a, b) => a.node.name.localeCompare(b.node.name))
                .sort((a, b) => a.node.type.localeCompare(b.node.type));

            return Promise.resolve(childNodes);
        } else {
            let repos = await getGitHubRepo();
            let childNodes = repos.map((repo: TRepo) => new RepoNode(repo));

            return Promise.resolve(childNodes);
        }
    }
}
