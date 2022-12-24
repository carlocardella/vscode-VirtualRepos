import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { credentials, extensionContext, output, repoFileSystemProvider } from "../extension";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { store, getReposFromGlobalStorage } from "../FileSystem/storage";
import { getGitHubBranch, getGitHubRepoContent, getGitHubTree, openRepository } from "../GitHub/api";
import { getOrRefreshFollowedUsers, getOrRefreshStarredRepos, getRepoDetails } from "../GitHub/commands";
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
    isStarred: boolean;

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
        this.isStarred = starredRepos.includes(this.full_name);
    }

    // The constructor cannot be async, so we need to call this method to initialize the context value
    async init() {
        switch (this.isOwned) {
            case true:
                this.contextValue = "isOwnedRepo";
                break;
            case false:
                if (this.isStarred) {
                    this.contextValue = "starredRepo";
                } else {
                    this.contextValue = "notStarredRepo";
                }

                let isFollowedUser = await this.isFollowedUser;
                if (isFollowedUser) {
                    this.contextValue += ";followedUser";
                } else {
                    this.contextValue += ";notFollowedUser";
                }
                break;
        }
    }

    get isFollowedUser() {
        let isFollowedUser = false;

        return new Promise((resolve, reject) => {
            getOrRefreshFollowedUsers().then((followedUsers) => {
                if (followedUsers) {
                    isFollowedUser = followedUsers.includes(this.owner);
                    resolve(isFollowedUser);
                }
            });
        });

        return isFollowedUser;
    }

    get isOwned(): boolean {
        return this.owner === credentials.authenticatedUser.login;
    }

    get full_name(): string {
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

export class RepoProvider implements TreeDataProvider<RepoNode | ContentNode> {
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
            await getOrRefreshStarredRepos();
            await getOrRefreshFollowedUsers();
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
                            let repoNode = new RepoNode(repo!, tree);
                            await repoNode.init();
                            return repoNode;
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

    private _onDidChangeTreeData: EventEmitter<RepoNode | undefined | null | void> = new EventEmitter<RepoNode | undefined | null | void>();
    readonly onDidChangeTreeData: Event<RepoNode | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(node?: RepoNode): void {
        output?.appendLine("Refreshing repos", output.messageType.info);
        this._onDidChangeTreeData.fire(node);
    }
}
