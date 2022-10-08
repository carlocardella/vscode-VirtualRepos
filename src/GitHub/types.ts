// https://github.com/octokit/plugin-rest-endpoint-methods.js/#typescript
// import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
// import { Uri } from "vscode";
// import { components } from "@octokit/openapi-types";

export enum ContentType {
    "dir" = "dir",
    "file" = "file",
    "symlink" = "symlink",
    "submodule" = "submodule",
}

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

export type TTree = {
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

export type TContent =
    | {
          content?: string | undefined;
          download_url?: string | undefined;
          encoding?: string | undefined;
          git_url?: string | undefined;
          html_url?: string | undefined;
          mode?: string | undefined;
          name?: string | undefined;
          path?: string | undefined;
          sha?: string | undefined;
          size?: number | undefined;
          type?: string | undefined;
          url?: string | undefined;
          _links?: {
              self: string;
              git: string;
              html: string;
          };
      }
    | undefined;

export type TBranch = {
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

export type TRepo = {
    name: string;
    owner: TUser;
    description?: string | null | undefined;
    url: string;
    default_branch: string;
    private: boolean;
    tree?: TTree;
    has_wiki: boolean;
    has_issues: boolean;
    has_pages: boolean;
};

export type TUser = {
    login: string;
    id: number;
    node_id?: string | null | undefined;
    avatar_url: string;
    gravatar_id?: string | null | undefined;
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

export type TRef = {
    ref: string;
    node_id: string;
    url: string;
    object: {
        type: string;
        sha: string;
        url: string;
    };
};
