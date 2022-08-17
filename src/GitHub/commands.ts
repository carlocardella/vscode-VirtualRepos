import * as rest from "@octokit/rest";
import { output } from "../extension";
import { credentials } from "./../extension";

export async function getGitHubUser() {
    const octokit = new rest.Octokit({
        auth: await credentials.getAccessToken(),
    });
    const userInfo = await octokit.users.getAuthenticated();
    output.appendLine(`${userInfo.data}`, output.messageType.info);

    return userInfo.data.name;
}

export async function getGitHubRepos() {
    const octokit = new rest.Octokit();
    return await (
        await octokit.repos.listForAuthenticatedUser()
    ).data.toString();
}
