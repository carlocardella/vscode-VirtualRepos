// https://github.com/octokit/plugin-rest-endpoint-methods.js/#typescript
// import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
// import { Uri } from "vscode";
// import { components } from "@octokit/openapi-types";
import { GetResponseTypeFromEndpointMethod, GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

import * as rest from "@octokit/rest";

export enum ContentType {
    "dir" = "dir",
    "file" = "file",
    "symlink" = "symlink",
    "submodule" = "submodule",
}

// export type TContentFile = components["schemas"]["content-file"];
// export type TContentDirectory = components["schemas"]["content-directory"];
// export type TRepoContent = components["schemas"]["repository"];
// export type TRepo = components["schemas"]["repository"];
// export type TRepo2 = components["schemas"]["simple-repository"];
// export type TContent = TContentFile & TContentDirectory;
// export type TPrivateUser = components["schemas"]["private-user"];
// export type TPublicUser = components["schemas"]["public-user"];
// export type TSimpleUser = components["schemas"]["simple-user"];
// export type TUser = TPrivateUser & TPublicUser & TSimpleUser;
// export type TGitHubTree = components["schemas"]["git-tree"];

// export type TRepoList = RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]["data"];

export type TGitHubUser = {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    name: string | null;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    hireable: boolean | null;
    bio: string | null;
    twitter_username?: string | null | undefined;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
};

export type TGitHubTree = {
    sha: string;
    url: string;
    truncated: boolean;
    tree: {
        path?: string | undefined;
        mode?: string | undefined;
        type?: string | undefined;
        sha?: string | undefined;
        size?: number | undefined;
        url?: string | undefined;
    }[];
};

// getGitHubRepoContent when path is a file
export type TGitHubRepoContent = {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    content: string;
    encoding: string;
    _links: {
        self: string;
        git: string;
        html: string;
    };
};

export type TRepoContent = {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    content: string;
    encoding: string;
    _links: {
        self: string;
        git: string;
        html: string;
    };
};

export type TRepo = {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
        // node_id: "MDQ6VXNlcjU3ODQ0MTU=";
        avatar_url: string;
        // gravatar_id: "";
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
    };
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    forks_url: string;
    keys_url?: string;
    collaborators_url?: string;
    teams_url?: string;
    hooks_url?: string;
    issue_events_url?: string;
    events_url?: string;
    assignees_url?: string;
    branches_url?: string;
    tags_url?: string;
    blobs_url?: string;
    git_tags_url?: string;
    git_refs_url?: string;
    trees_url?: string;
    statuses_url?: string;
    languages_url?: string;
    stargazers_url?: string;
    contributors_url?: string;
    subscribers_url?: string;
    subscription_url?: string;
    commits_url?: string;
    git_commits_url?: string;
    comments_url?: string;
    issue_comment_url?: string;
    contents_url?: string;
    compare_url?: string;
    merges_url?: string;
    archive_url?: string;
    downloads_url?: string;
    issues_url?: string;
    pulls_url?: string;
    milestones_url?: string;
    notifications_url?: string;
    labels_url?: string;
    releases_url?: string;
    deployments_url?: string;
    created_at?: string | null;
    updated_at?: string | null;
    pushed_at?: string | null;
    git_url?: string;
    ssh_url?: string;
    clone_url?: string;
    svn_url?: string;
    homepage: string | null;
    size: number;
    stargazers_count?: number;
    watchers_count?: number;
    language: string | null;
    has_issues?: boolean;
    has_projects?: boolean;
    has_downloads?: boolean;
    has_wiki?: boolean;
    has_pages?: boolean;
    forks_count: number;
    mirror_url?: string | null;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    license: {
        key: string;
        name: string;
        url: string | null;
        spdx_id: string | null;
        node_id: string;
        html_url?: string | undefined;
    } | null;
    allow_forking?: boolean;
    is_template?: boolean;
    web_commit_signoff_required?: boolean;
    topics?: string[] | undefined;
    visibility?: string | undefined;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    permissions?:
        | {
              admin: boolean;
              maintain?: boolean | undefined;
              push: boolean;
              triage?: boolean | undefined;
              pull: boolean;
          }
        | undefined;
    temp_clone_token?: string | null | undefined;
    allow_squash_merge?: boolean;
    allow_merge_commit?: boolean;
    allow_rebase_merge?: boolean;
    allow_auto_merge?: boolean;
    delete_branch_on_merge?: boolean;
    allow_update_branch?: boolean;
    use_squash_pr_title_as_default?: boolean;
    squash_merge_commit_message?: string;
    squash_merge_commit_title?: string;
    merge_commit_message?: string;
    merge_commit_title?: string;
    network_count?: number;
    subscribers_count?: number;
};

export type TGitHubBranchList = {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected?: boolean | undefined;
    protection?:
        | {
              url?: string | undefined;
              enabled?: boolean | undefined;
              required_status_checks?: {
                  url?: string | undefined;
                  enforcement_level?: string | undefined;
                  contexts: string[];
                  checks: {
                      context: string;
                      app_id: number | null;
                  }[];
              };
              contexts_url?: string | undefined;
              strict?: boolean | undefined;
          }
        | undefined;
    protection_url?: string | undefined;
};

// export type TRepoBranch = GetResponseDataTypeFromEndpointMethod<typeof octokit.repos.listBranches>;

export type TGitHubBranch = {
    name: string;
    commit: {
        sha: string;
        node_id: string;
        commit?: {
            author: {
                name?: string | undefined;
                email?: string | undefined;
                date?: string | undefined;
            } | null;
            committer: {
                name?: string | undefined;
                email?: string | undefined;
                date?: string | undefined;
            } | null;
            message: string;
            tree: {
                sha: string;
                url: string;
            };
            url: string;
            comment_count: number;
            verification?:
                | {
                      verified: boolean;
                      reason: string;
                      payload: string | null;
                      signature: string | null;
                  }
                | undefined;
        };
        url: string;
        html_url: string;
        comments_url: string;
        author: {
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string | null;
            gravatar_id: string | null;
            url: string;
            html_url: string | null;
        } | null;
        // author: TGitHubUser | null;
        committer: {
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            name?: string | null | undefined;
            email?: string | null | undefined;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
        } | null;
        parents: {
            sha: string;
            url: string;
            html_url?: string | undefined;
        }[];
    };
    _links?: {
        self: string;
        html: string;
    };
    protected: boolean;
    protection: {
        enabled?: boolean | undefined;
        required_status_checks?:
            | {
                  enforcement_level?: string | undefined;
                  contexts: string[] | null;
                  checks: {
                      context: string;
                      app_id: number | null;
                  }[];
              }
            | undefined;
    };
    protection_url: string;
};

export type TGitHubUpdateContent = {
    commit?:
        | {
              sha?: string | undefined;
              node_id?: string | undefined;
              url?: string | undefined;
              html_url?: string | undefined;
              author?:
                  | {
                        name?: string | undefined;
                        email?: string | undefined;
                        date?: string | undefined;
                    }
                  | undefined;
              committer?:
                  | {
                        name?: string | undefined;
                        email?: string | undefined;
                        date?: string | undefined;
                    }
                  | undefined;
              tree?:
                  | {
                        sha?: string | undefined;
                        url?: string | undefined;
                    }
                  | undefined;
              message?: string | undefined;
              parents?:
                  | {
                        url?: string | undefined;
                        html_url?: string | undefined;
                        sha?: string | undefined;
                    }[]
                  | undefined;
              verification?:
                  | {
                        verified?: boolean | undefined;
                        reason?: string | undefined;
                        signature?: string | null | undefined;
                        payload?: string | null | undefined;
                    }
                  | undefined;
          }
        | undefined;
    content: {
        name?: string | undefined;
        path?: string | undefined;
        sha?: string | undefined;
        size?: number | undefined;
        url?: string | undefined;
        html_url?: string | undefined;
        git_url?: string | undefined;
        download_url?: string | undefined;
        type?: string | undefined;
        _links?:
            | {
                  self?: string | undefined;
                  git?: string | undefined;
                  html?: string | undefined;
              }
            | undefined;
    } | null;
};

export type TGitHubOrganization = {};