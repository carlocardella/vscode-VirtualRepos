import * as rest from "@octokit/rest";
import { credentials } from "./../extension";
import { TContent, TRepoContent, TSimpleUser } from "./types";
// import { IRepo, Repo } from './interfaces';
import { RepoContentNode } from "../Tree/nodes";
import { TRepo } from "./types";

export async function getGitHubUser(): Promise<TSimpleUser> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });
    const { data } = await octokit.users.getAuthenticated();

    return Promise.resolve(data);
}

export async function getGitHubRepo(): Promise<TRepo[]> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const { data } = await octokit.repos.listForAuthenticatedUser({
        type: "owner",
    });

    return Promise.resolve(data);
}

export async function getGitHubRepoContent(
    owner: string,
    repoName: string,
    path?: string
): Promise<any> {
    // @update: any
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    path = path ?? "";
    const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: path,
    });

    return Promise.resolve(data);
}
