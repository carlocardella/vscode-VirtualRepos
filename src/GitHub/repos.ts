import { IRepo, IRepoComment, IRepoFile } from "./interfaces";
import { Uri } from "vscode";
import { output } from "./../extension";

export class Repo implements IRepo {
    name: string;
    iconPath: string;

    constructor(name: string, iconPath: string) {
        this.name = name;
        this.iconPath = iconPath;
    }
}

export class RepoFile implements IRepoFile {
    path: string;
    size: number;
    sha: string;
    mode: string;
    contents: string | undefined;
    isDirectory: boolean;
    uri: Uri;
    iconPath: string;

    constructor(
        path: string,
        size: number,
        sha: string,
        mode: string,
        contents: string | undefined,
        isDirectory: boolean,
        uri: Uri,
        iconPath: string
    ) {
        this.path = path;
        this.size = size;
        this.sha = sha;
        this.mode = mode;
        this.contents = contents;
        this.isDirectory = isDirectory;
        this.uri = uri;
        this.iconPath = iconPath;
    }

    get name(): string {
        output.appendLine(
            "RepoFile.name not implemented",
            output.messageType.error
        );
        return "";
    }

    get files(): IRepoFile[] {
        output.appendLine(
            "RepoFile.files not implemented",
            output.messageType.error
        );
        return [];
    }

    get isFile(): boolean {
        output.appendLine(
            "RepoFile.isFile not implemented",
            output.messageType.error
        );
        return !this.isDirectory;
    }

    get comments(): IRepoComment[] {
        output.appendLine(
            "RepoFile.comments not implemented",
            output.messageType.error
        );
        return [];
    }
}

/*

allow_forking:true
archive_url:'https://api.github.com/repos/carlocardella/AzClassicModule/{archive_format}{/ref}'
archived:false
assignees_url:'https://api.github.com/repos/carlocardella/AzClassicModule/assignees{/user}'
blobs_url:'https://api.github.com/repos/carlocardella/AzClassicModule/git/blobs{/sha}'
branches_url:'https://api.github.com/repos/carlocardella/AzClassicModule/branches{/branch}'
clone_url:'https://github.com/carlocardella/AzClassicModule.git'
collaborators_url:'https://api.github.com/repos/carlocardella/AzClassicModule/collaborators{/collaborator}'
comments_url:'https://api.github.com/repos/carlocardella/AzClassicModule/comments{/number}'
commits_url:'https://api.github.com/repos/carlocardella/AzClassicModule/commits{/sha}'
compare_url:'https://api.github.com/repos/carlocardella/AzClassicModule/compare/{base}...{head}'
contents_url:'https://api.github.com/repos/carlocardella/AzClassicModule/contents/{+path}'
contributors_url:'https://api.github.com/repos/carlocardella/AzClassicModule/contributors'
created_at:'2020-06-15T15:16:30Z'
default_branch:'master'
deployments_url:'https://api.github.com/repos/carlocardella/AzClassicModule/deployments'
description:'Manage Azure Service Manager (RDFE, classic) resources through Azure Resource Manager (ARM) Resource Providers.'
disabled:false
downloads_url:'https://api.github.com/repos/carlocardella/AzClassicModule/downloads'
events_url:'https://api.github.com/repos/carlocardella/AzClassicModule/events'
fork:false
forks:1
forks_count:1
forks_url:'https://api.github.com/repos/carlocardella/AzClassicModule/forks'
full_name:'carlocardella/AzClassicModule'
git_commits_url:'https://api.github.com/repos/carlocardella/AzClassicModule/git/commits{/sha}'
git_refs_url:'https://api.github.com/repos/carlocardella/AzClassicModule/git/refs{/sha}'
git_tags_url:'https://api.github.com/repos/carlocardella/AzClassicModule/git/tags{/sha}'
git_url:'git://github.com/carlocardella/AzClassicModule.git'
has_downloads:true
has_issues:true
has_pages:false
has_projects:true
has_wiki:true
homepage:''
hooks_url:'https://api.github.com/repos/carlocardella/AzClassicModule/hooks'
html_url:'https://github.com/carlocardella/AzClassicModule'
id:272472681
is_template:false
issue_comment_url:'https://api.github.com/repos/carlocardella/AzClassicModule/issues/comments{/number}'
issue_events_url:'https://api.github.com/repos/carlocardella/AzClassicModule/issues/events{/number}'
issues_url:'https://api.github.com/repos/carlocardella/AzClassicModule/issues{/number}'
keys_url:'https://api.github.com/repos/carlocardella/AzClassicModule/keys{/key_id}'
labels_url:'https://api.github.com/repos/carlocardella/AzClassicModule/labels{/name}'
language:'PowerShell'
languages_url:'https://api.github.com/repos/carlocardella/AzClassicModule/languages'
license:
    key: 'mit'
    name:'MIT License'
    node_id: 'MDc6TGljZW5zZTEz'
    spdx_id: 'MIT'
    url: 'https://api.github.com/licenses/mit'
merges_url:'https://api.github.com/repos/carlocardella/AzClassicModule/merges'
milestones_url:'https://api.github.com/repos/carlocardella/AzClassicModule/milestones{/number}'
mirror_url:null
name:'AzClassicModule'
node_id:'MDEwOlJlcG9zaXRvcnkyNzI0NzI2ODE='
notifications_url:'https://api.github.com/repos/carlocardella/AzClassicModule/notifications{?since,all,participating}'
open_issues:0
open_issues_count:0
owner:
    avatar_url:https://avatars.githubusercontent.com/u/5784415?v=4'
    events_url:https://api.github.com/users/carlocardella/events{/privacy}'
    followers_url:https://api.github.com/users/carlocardella/followers'
    following_url:https://api.github.com/users/carlocardella/following{/other_user}'
    gists_url:https://api.github.com/users/carlocardella/gists{/gist_id}'
    gravatar_id:''
    html_url: 'https://github.com/carlocardella'
    id: 5784415
    login: 'carlocardella'
    node_id: 'MDQ6VXNlcjU3ODQ0MTU='
    organizations_url: 'https://api.github.com/users/carlocardella/orgs'
    received_events_url: 'https://api.github.com/users/carlocardella/received_events'
    repos_url: 'https://api.github.com/users/carlocardella/repos'
    site_admin: false
    starred_url: 'https://api.github.com/users/carlocardella/starred{/owner}{/repo}'
    subscriptions_url: 'https://api.github.com/users/carlocardella/subscriptions'
    type: 'User'
    url: 'https://api.github.com/users/carlocardella'
permissions:
    admin: true
    maintain: true
    pull: true
    push: true
    triage: true
private:false
pulls_url:'https://api.github.com/repos/carlocardella/AzClassicModule/pulls{/number}'
pushed_at:'2021-12-10T17:42:19Z'
releases_url:'https://api.github.com/repos/carlocardella/AzClassicModule/releases{/id}'
size:50
ssh_url:'git@github.com:carlocardella/AzClassicModule.git'
stargazers_count:0
stargazers_url:'https://api.github.com/repos/carlocardella/AzClassicModule/stargazers'
statuses_url:'https://api.github.com/repos/carlocardella/AzClassicModule/statuses/{sha}'
subscribers_url:'https://api.github.com/repos/carlocardella/AzClassicModule/subscribers'
subscription_url:'https://api.github.com/repos/carlocardella/AzClassicModule/subscription'
svn_url:'https://github.com/carlocardella/AzClassicModule'
tags_url:'https://api.github.com/repos/carlocardella/AzClassicModule/tags'
teams_url:'https://api.github.com/repos/carlocardella/AzClassicModule/teams'
topics:
    0: 'arm'
    1: 'azure-resource-provider'
    2: 'azure-service-manager'
    3: 'module'
    4: 'powershell'
    5: 'rdfe'
trees_url:'https://api.github.com/repos/carlocardella/AzClassicModule/git/trees{/sha}'
updated_at:'2021-12-10T17:42:22Z'
url:'https://api.github.com/repos/carlocardella/AzClassicModule'
visibility:'public'
watchers:0
watchers_count:0
web_commit_signoff_required:false

 */
