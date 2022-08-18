import * as rest from "@octokit/rest";
import { output } from "../extension";
import { credentials } from "./../extension";

export async function getGitHubUser() {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });
    const userInfo = await octokit.users.getAuthenticated();

    return userInfo.data;
}

export async function getGitHubRepos() {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });

    const userRepos = await octokit.repos.listForAuthenticatedUser({visibility: "all", per_page: 100});

    return userRepos.data;
}
