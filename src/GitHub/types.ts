// https://github.com/octokit/plugin-rest-endpoint-methods.js/#typescript
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { Uri } from "vscode";
import { components } from "@octokit/openapi-types";

// export type TRepo =
//     RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]["data"];
// export type TUser =
//     RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]["data"];
// type RepoContent =
//     RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];

// export type TContent = RepoContent extends Array<infer T> ? T : RepoContent;
// export type TContent = RepoContent & {
//     type: ContentType;
// };

export enum ContentType {
    "dir" = "dir",
    "file" = "file",
    "symlink" = "symlink",
    "submodule" = "submodule",
}

export type TContentFile = components["schemas"]["content-file"];
export type TContentDirectory = components["schemas"]["content-directory"];
export type TRepoContent = components["schemas"]["repository"];
export type TRepo = components["schemas"]["repository"];
export type TContent = TContentFile & TContentDirectory;
export type TPrivateUser = components["schemas"]["private-user"];
export type TPublicUser = components["schemas"]["public-user"];
export type TSimpleUser = components["schemas"]["simple-user"];
export type TUser = TPrivateUser & TPublicUser & TSimpleUser;

// export type repoContent = {
//     download_url: string;
//     git_url: string;
//     html_url: string;
//     name: string;
//     path: string;
//     sha: string;
//     size: number;
//     type: contentType;
//     url: string;
//     _links: _links;
// };

// export enum contentType{
//     "dir"="dir",
//     "file"="file",
//     "symlink"="symlink",
//     "submodule"="submodule",
// }

// type _links = {
//     git: string;
//     html: string;
//     self: string;
// };

// export type fileContent = {
//     fork: boolean;
//     forks: number;
//     forks_count: number;
//     forks_url: string;
//     full_name: string;
//     git_commits_url: string;
//     git_refs_url: string;
//     git_tags_url: string;
//     git_url: string;
//     has_downloads: boolean;
//     has_issues: boolean;
//     has_pages: boolean;
//     has_projects: boolean;
//     has_wiki: boolean;
//     homepage: string;
//     hooks_url: string;
//     html_url: string;
//     id: number;
//     is_template: boolean;
//     issue_comment_url: string;
//     issue_events_url: string;
//     issues_url: string;
//     keys_url: string;
//     labels_url: string;
//     language: string;
//     languages_url: string;
//     license: license;
//     merges_url: string;
//     milestones_url: string;
//     mirror_url: string;
//     name: string;
//     node_id: string;
//     notifications_url: string;
//     open_issues: number;
//     open_issues_count: number;
//     owner: owner;
//     permission: permission;
//     private: false;
//     pulls_url: string;
//     pushed_at: string;
//     releases_url: string;
//     size: number;
//     ssh_url: string;
//     stargazers_count: number;
//     stargazers_url: string;
//     statuses_url: string;
//     subscribers_url: string;
//     subscription_url: string;
//     svn_url: string;
//     tags_url: string;
//     teams_url: string;
//     topics: string[];
//     trees_url: string;
//     updated_at: string;
//     url: string;
//     visibility: string;
//     watchers: number;
//     watchers_count: number;
//     web_commit_signoff_required: boolean;
// };

// type topics = {
//     name: string;
// };
// type permission = {
//     admin: true;
//     maintain: true;
//     pull: true;
//     push: true;
//     triage: true;
// };

// type license = {
//     key: string;
//     name: string;
//     node_id: string;
//     spdx_id: string;
//     url: string;
// };

// type owner = {
//     avatar_url: string;
//     events_url: string;
//     followers_url: string;
//     following_url: string;
//     gists_url: string;
//     gravatar_id: "";
//     html_url: string;
//     id: number;
//     login: string;
//     node_id: string;
//     organizations_url: string;
//     received_events_url: string;
//     repos_url: string;
//     site_admin: boolean;
//     starred_url: string;
//     subscriptions_url: string;
//     type: string;
//     url: string;
// };
