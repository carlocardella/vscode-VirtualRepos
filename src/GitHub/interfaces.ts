import { Uri } from "vscode";

export interface IRepo {
    name: string;
    iconPath: string;
}

export interface IRepoFile {
    path: string;
    size: number;
    sha: string;
    mode: string;
    contents: string | undefined;
    isDirectory: boolean;
    uri: Uri;
    name: string;
    files: IRepoFile[];
    iconPath: string;
}

export interface IRepoComment {
    id: string;
    body: string;
    user: IUser;
    createdAt: string;
    updatedAt: string;
    authorAssociation: "NONE" | "OWNER";
}

interface IUser {
    avatarUrl: string;
    htmlUrl: string;
    bio: string;
    blog: string;
    company: string;
    createdAt: string;
    email: string;
    eventsUrl: string;
    followers: number;
    followersUrl: string;
    following: number;
    followingUrl: string;
    gistsUrl: string;
    gravatarId: "";
    hireable: null;
    id: number;
    location: string;
    login: string;
    name: string;
    nodeId: string;
    organizationsUrl: string;
    publicGists: number;
    publicRepos: number;

    // avatar_url: "https://avatars.githubusercontent.com/u/5784415?v=4";
    // bio: "Senior Software Engineer at Microsoft, powershell/vscode/scripting/cloud enthusiast, too many interests to list";
    // blog: "https://www.cloudnotes.io";
    // company: "Microsoft";
    // created_at: "2013-10-27T01:30:29Z";
    // email: "carloc@microsoft.com";
    // events_url: "https://api.github.com/users/carlocardella/events{/privacy}";
    // followers: 26;
    // followers_url: "https://api.github.com/users/carlocardella/followers";
    // following: 38;
    // following_url: "https://api.github.com/users/carlocardella/following{/other_user}";
    // gists_url: "https://api.github.com/users/carlocardella/gists{/gist_id}";
    // gravatar_id: "";
    // hireable: null;
    // html_url: "https://github.com/carlocardella";
    // id: 5784415;
    // location: "Redmond, WA";
    // login: "carlocardella";
    // name: "Carlo Cardella";
    // node_id: "MDQ6VXNlcjU3ODQ0MTU=";
    // organizations_url: "https://api.github.com/users/carlocardella/orgs";
    // public_gists: 0;
    // public_repos: 22;
}
