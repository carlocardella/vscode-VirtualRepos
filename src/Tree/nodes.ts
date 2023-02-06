import {
    CancellationToken,
    DataTransfer,
    DataTransferItem,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    ThemeIcon,
    TreeDataProvider,
    TreeDragAndDropController,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    window,
} from "vscode";
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
                command: "open",
                title: "Open file",
                arguments: [this.uri, { preview: true }],
            };
        }
    }
}

export class RepoProvider implements TreeDataProvider<RepoNode | ContentNode>, TreeDragAndDropController<RepoNode | ContentNode> {
    refreshing = false;
    sorting = false;

    dropMimeTypes = ["application/vnd.code.tree.testViewDragAndDrop"];
    dragMimeTypes = ["text/uri-list"];

    constructor(context: ExtensionContext) {
        const view = window.createTreeView("virtualReposView", {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: true,
            dragAndDropController: this,
        });
        context.subscriptions.push(view);
    }
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
        output?.appendLine(message, output.messageType.info);
        this._onDidChangeTreeData.fire(node);
    }

    // public getParent(element: RepoNode): RepoNode {
    //     return this._getParent(element.name);
    // }

    // Drag and drop controller

    public async handleDrop(target: RepoNode | undefined, sources: DataTransfer, token: CancellationToken): Promise<void> {
        const transferItem = sources.get("application/vnd.code.tree.testViewDragAndDrop");
        if (!transferItem) {
            return;
        }

        const treeItems = store.repos!;

        // const treeItems: RepoNode[] = transferItem.value;
        // let roots = this._getLocalRoots(treeItems);
        // // Remove nodes that are already target's parent nodes
        // roots = roots.filter((r) => !this._isChild(this._getTreeElement(r.key), target));
        // if (roots.length > 0) {
        //     // Reload parents of the moving elements
        //     const parents = roots.map((r) => this.getParent(r));
        //     roots.forEach((r) => this._reparentNode(r, target));
        //     this._onDidChangeTreeData.fire([...parents, target]);
        // }
    }

    public async handleDrag(source: RepoNode[], treeDataTransfer: DataTransfer, token: CancellationToken): Promise<void> {
        treeDataTransfer.set("application/vnd.code.tree.testViewDragAndDrop", new DataTransferItem(source));
    }

    // Helper methods

    _isChild(node: RepoNode, child: RepoNode | undefined): boolean {
        if (!child) {
            return false;
        }
        for (const prop in node) {
            if (prop === child.name) {
                return true;
            } else {
                const isChild = this._isChild((node as any)[prop], child);
                if (isChild) {
                    return isChild;
                }
            }
        }
        return false;
    }

    // From the given nodes, filter out all nodes who's parent is already in the the array of Nodes.
    // _getLocalRoots(nodes: RepoNode[]): RepoNode[] {
    //     const localRoots = [];
    //     for (let i = 0; i < nodes.length; i++) {
    //         const parent = this.getParent(nodes[i]);
    //         if (parent) {
    //             const isInList = nodes.find((n) => n.name === parent.name);
    //             if (isInList === undefined) {
    //                 localRoots.push(nodes[i]);
    //             }
    //         } else {
    //             localRoots.push(nodes[i]);
    //         }
    //     }
    //     return localRoots;
    // }

    // Remove node from current position and add node to new target element
    // _reparentNode(node: RepoNode, target: RepoNode | undefined): void {
    //     const element: any = {};
    //     element[node.name] = this._getTreeElement(node.name);
    //     const elementCopy = { ...element };
    //     this._removeNode(node);
    //     const targetElement = this._getTreeElement(target?.name);
    //     if (Object.keys(element).length === 0) {
    //         targetElement[node.name] = {};
    //     } else {
    //         Object.assign(targetElement, elementCopy);
    //     }
    // }

    // Remove node from tree
    // _removeNode(element: RepoNode, tree?: any): void {
    //     const subTree = tree ? tree : this.tree;
    //     for (const prop in subTree) {
    //         if (prop === element.name {
    //             const parent = this.getParent(element);
    //             if (parent) {
    //                 const parentObject = this._getTreeElement(parent.name);
    //                 delete parentObject[prop];
    //             } else {
    //                 delete this.tree[prop];
    //             }
    //         } else {
    //             this._removeNode(element, subTree[prop]);
    //         }
    //     }
    // }

    // _getChildren(key: string | undefined): string[] {
    //     if (!key) {
    //         return Object.keys(this.tree);
    //     }
    //     const treeElement = this._getTreeElement(key);
    //     if (treeElement) {
    //         return Object.keys(treeElement);
    //     }
    //     return [];
    // }

    // _getTreeItem(key: string): TreeItem {
    //     const treeElement = this._getTreeElement(key);
    //     // An example of how to use codicons in a MarkdownString in a tree item tooltip.
    //     const tooltip = new MarkdownString(`$(zap) Tooltip for ${key}`, true);
    //     return {
    //         label: /**TreeItemLabel**/ <any>{ label: key, highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0 },
    //         tooltip,
    //         collapsibleState: treeElement && Object.keys(treeElement).length ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
    //         resourceUri: Uri.parse(`/tmp/${key}`),
    //     };
    // }

    // _getTreeElement(element: string | undefined, tree?: any): any {
    //     if (!element) {
    //         return this.tree;
    //     }
    //     const currentNode = tree ?? this.tree;
    //     for (const prop in currentNode) {
    //         if (prop === element) {
    //             return currentNode[prop];
    //         } else {
    //             const treeElement = this._getTreeElement(element, currentNode[prop]);
    //             if (treeElement) {
    //                 return treeElement;
    //             }
    //         }
    //     }
    // }

    // _getParent(element: string, parent?: string, tree?: any): any {
    //     const currentNode = tree ?? this.tree;
    //     for (const prop in currentNode) {
    //         if (prop === element && parent) {
    //             return this._getNode(parent);
    //         } else {
    //             const parent = this._getParent(element, prop, currentNode[prop]);
    //             if (parent) {
    //                 return parent;
    //             }
    //         }
    //     }
    // }

    // _getNode(key: string): RepoNode {
    //     if (!this.nodes[key]) {
    //         this.nodes[key] = new Key(key);
    //     }
    //     return this.nodes[key];
    // }
}
