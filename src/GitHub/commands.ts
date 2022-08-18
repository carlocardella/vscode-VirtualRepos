import * as rest from "@octokit/rest";
import { output } from "../extension";
import { credentials } from "./../extension";
import * as octoTypes from "./types";

export async function getGitHubUser(): Promise<
    octoTypes.getUserResponse["data"]
> {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });
    const userInfo = await octokit.users.getAuthenticated();

    return Promise.resolve(userInfo.data);
}

export async function getGitHubRepos() {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const userRepos = await octokit.repos.listForAuthenticatedUser({
        type: "owner",
    });

    return Promise.resolve(userRepos.data);
}
