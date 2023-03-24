import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { credentials, extensionContext, output, store } from "../extension";
import { RepoFileSystemProvider, REPO_SCHEME } from "../FileSystem/fileSystem";
import { getGitHubRepoContent } from "../GitHub/api";
import { getOrRefreshFollowedUsers } from "../GitHub/commands";
import { TRepo, ContentType, TContent, TTree } from "../GitHub/types";
import * as config from "./../config";

export class RepoNode extends TreeItem {
    owner: string;
    tree?: TTree;
    name: string;
    private: boolean;
    uri: Uri;
    path: string;
    clone_url: string;
    fork: boolean;
    isStarred: boolean;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    created_at: string | undefined | null;
    pushed_at: string | undefined | null;

    constructor(public repo: TRepo, tree?: any) {
        super(repo.name, TreeItemCollapsibleState.Collapsed);

        this.private = repo.private;

        let icon: Uri | ThemeIcon;
        if (config.get("UseRepoOwnerAvatar")) {
            icon = Uri.parse(repo.owner.avatar_url);
        } else if (repo.fork) {
            icon = new ThemeIcon("repo-forked");
        } else if (this.private) {
            icon = new ThemeIcon("lock");
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
        this.fork = repo.fork;

        let starredRepos: string[] = extensionContext.globalState.get("starredRepos", []);
        this.isStarred = starredRepos.includes(this.full_name);
        this.stargazers_count = repo.stargazers_count;
        this.watchers_count = repo.watchers_count;
        this.forks_count = repo.forks_count;
        this.created_at = repo.created_at;
        this.pushed_at = repo.pushed_at;
    }

    // The constructor cannot be async, so we need to call this method to initialize the context value
    async init() {
        switch (this.isOwned) {
            case true:
                this.contextValue = "isOwnedRepo";

                if (this.fork) {
                    this.contextValue += ";isFork";
                }

                if (this.private) {
                    this.contextValue += ";isPrivate";
                } else {
                    this.contextValue += ";isPublic";
                }
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

        let forkCount = this.forks_count;
        let starsCount = this.stargazers_count;
        let watchersCount = this.watchers_count;

        // prettier-ignore
        let tooltip = ` ${this.repo.html_url}${"\n\n"} Description: ${this.repo.description ?? ""}${"\n\n"} Is forked: ${this.fork}${"\n"} Forks: ${forkCount}${"\n"} Stars: ${starsCount}${"\n"} Watchers: ${watchersCount}${"\n"} Created: ${this.created_at}${"\n"} Updated: ${this.pushed_at}`;
        this.tooltip = tooltip;
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

    get parent(): TRepo | undefined {
        return this.repo.parent;
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
    sorting = false;

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
            if (!this.sorting) {
                await store.init();
            }
        }

        this.refreshing = false;
        this.sorting = false;
        return Promise.resolve(store.repos);
    }

    private _onDidChangeTreeData: EventEmitter<RepoNode | undefined | null | void> = new EventEmitter<RepoNode | undefined | null | void>();
    readonly onDidChangeTreeData: Event<RepoNode | undefined | null | void> = this._onDidChangeTreeData.event;

    // refresh(node?: RepoNode): void;
    refresh(node?: RepoNode, sorting?: boolean): void {
        if (sorting) {
            this.sorting = true;
        }
        let message = node ? `Refresh repos: ${node?.full_name}` : "Refresh repos";
        output?.info(message);
        this._onDidChangeTreeData.fire(node);
    }
}
