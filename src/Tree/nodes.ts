import { commands, Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { credentials, extensionContext, output } from "../extension";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { store, getReposFromGlobalStorage } from "../FileSystem/storage";
import { getGitHubBranch, getGitHubRepoContent, getGitHubTree, getStarredGitHubRepositories, openRepository } from "../GitHub/api";
import { getRepoDetails, getStarredRepos, refreshStarredRepos } from "../GitHub/commands";
import { TRepo, ContentType, TContent, TTree } from "../GitHub/types";
import * as config from "./../config";

export class RepoNode extends TreeItem {
    owner: string;
    tree?: TTree;
    name: string;
    uri: Uri;
    path: string;
    clone_url: string;
    fork: boolean;
    starred: boolean;

    constructor(public repo: TRepo, tree?: any) {
        super(repo.name, TreeItemCollapsibleState.Collapsed);

        let icon: Uri | ThemeIcon;
        if (config.get("UseRepoOwnerAvatar")) {
            icon = Uri.parse(repo.owner.avatar_url);
        } else if (repo.fork) {
            icon = new ThemeIcon("repo-forked");
        } else {
            icon = new ThemeIcon("repo");
        }

        this.iconPath = icon;

        const tooltip = repo.description ? `${repo.html_url}${"\n"}${"\n"}${repo.description}` : repo.html_url;
        this.tooltip = tooltip;

        this.repo = repo;
        this.owner = repo.owner.login;
        this.tree = tree;
        this.name = repo.name;
        this.uri = Uri.parse(`${REPO_SCHEME}://${repo.owner.login}/${repo.name}`);
        //         Uri.parse(`${REPO_SCHEME}://${repo.owner.login}/${repo.name}/${filePath}`);
        this.path = "/";
        this.description = repo.default_branch;
        this.clone_url = repo.clone_url;
        // this.contextValue = this.isOwned ? "isOwnedRepo" : "repo";
        this.fork = repo.fork;

        let starredRepos: string[] = extensionContext.globalState.get("starredRepos", []);
        // if (starredRepos.length === 0) {
        //     getStarredGitHubRepositories().then((repos) => {
        //         starredRepos = repos.map((repo) => {
        //             return `${repo.owner.login}/${repo.name}`;
        //         });
        //         extensionContext.globalState.update("starredRepos", starredRepos);
        //         commands.executeCommand("setContext", "starredRepos", starredRepos);
        //     });
        // }
        this.starred = starredRepos.includes(this.full_name);
        switch (this.isOwned) {
            case true:
                this.contextValue = "isOwnedRepo";
                break;
            case false:
                if (this.starred) {
                    this.contextValue = "starredRepo";
                } else {
                    this.contextValue = "unstarredRepo";
                }
                break;
        }
    }

    get isOwned() {
        return this.owner === credentials.authenticatedUser.login;
    }

    get full_name() {
        return `${this.owner}/${this.name}`;
    }
}

export class ContentNode extends TreeItem {
    owner: string;
    repo: TRepo;
    path: string;
    uri: Uri;
    sha: string;

    constructor(public nodeContent: TContent, repo: TRepo) {
        super(nodeContent!.name!, nodeContent?.type === ContentType.file ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed);

        this.tooltip = nodeContent?.path;
        this.iconPath = nodeContent?.type === ContentType.file ? ThemeIcon.File : ThemeIcon.Folder;
        this.contextValue = nodeContent?.type === ContentType.file ? "file" : "folder";
        if (repo.owner.login === credentials.authenticatedUser.login) {
            if (nodeContent?.type === ContentType.file) {
                this.contextValue = "isOwnedFile";
            } else {
                this.contextValue = "isOwnedFolder";
            }
        }
        this.path = nodeContent?.path ?? "/";
        this.uri = RepoFileSystemProvider.getFileUri(repo, this.path);
        this.resourceUri = this.uri;
        this.owner = repo.owner.login;
        this.nodeContent = nodeContent;
        this.repo = repo;
        this.sha = nodeContent?.sha ?? "";

        if (nodeContent?.type === ContentType.file) {
            this.command = {
                command: "vscode.open",
                title: "Open file",
                arguments: [this.uri, { preview: true }],
            };
        }
    }
}

export class RepoProvider implements TreeDataProvider<ContentNode> {
    refreshing = false;

    getTreeItem = (node: ContentNode) => node;

    async getChildren(element?: ContentNode): Promise<any[]> {
        // @update: any
        this.refreshing = true;

        if (element) {
            const content = await getGitHubRepoContent(element.owner, element.repo.name, element?.nodeContent?.path);
            let childNodes = Object.values(content)
                .map((node) => new ContentNode(<TContent>node, element.repo))
                .sort((a, b) => a.nodeContent!.name!.localeCompare(b.nodeContent!.name!))
                .sort((a, b) => a.nodeContent!.type!.localeCompare(b.nodeContent!.type!));

            this.refreshing = false;
            return Promise.resolve(childNodes);
        } else {
            await getStarredRepos();
            const reposFromGlobalStorage = await getReposFromGlobalStorage(extensionContext);
            if (reposFromGlobalStorage.length === 0) {
                output?.appendLine("No repos found in global storage", output.messageType.info);
                this.refreshing = false;
                return Promise.resolve([]);
            }

            let repos = await Promise.all(
                reposFromGlobalStorage?.map(async (repo: string) => {
                    let [owner, name] = getRepoDetails(repo);
                    let repoFromGitHub = await openRepository(owner, name);
                    if (repoFromGitHub) {
                        return repoFromGitHub;
                    }
                    return;
                })
            );

            let childNodes = await Promise.all(
                repos
                    .filter((repo) => repo !== undefined)
                    .map(async (repo) => {
                        try {
                            let branch = await getGitHubBranch(repo!, repo!.default_branch);
                            let tree = (await getGitHubTree(repo!, branch!.commit.sha)) ?? undefined;
                            return new RepoNode(repo!, tree);
                        } catch (error: any) {
                            if (error.name === "HttpError") {
                                output?.appendLine(`Error reading repo ${repo!.name}: ${error.response.data.message}`, output.messageType.error);
                            } else {
                                output?.appendLine(`${repo!.name}: ${error.response}`, output.messageType.error);
                            }
                        }
                    })
            );

            store.repos = childNodes ?? [];
            this.refreshing = false;
            return Promise.resolve(store.repos);
        }
    }

    private _onDidChangeTreeData: EventEmitter<ContentNode | undefined | null | void> = new EventEmitter<ContentNode | undefined | null | void>();
    readonly onDidChangeTreeData: Event<ContentNode | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(node?: ContentNode): void {
        output?.appendLine("Refreshing repos", output.messageType.info);
        this._onDidChangeTreeData.fire(node);
    }
}
