import { Octokit } from "@octokit/rest";
import { output } from "../extension";
import { credentials } from "./../extension";
import { Endpoints } from "@octokit/types";

const octokit = new Octokit();

export type listUserReposParameters =
    Endpoints["GET /repos/{owner}/{repo}"]["parameters"];

export type listUserReposResponse = Endpoints["GET /repos/{owner}/{repo}"]["response"];

export type getUserResponse = Endpoints["GET /user"]["response"];

// async function listRepos(
//     options: listUserReposParameters
// ): Promise<listUserReposResponse["data"]> {
//     return Promise.reject();
// }
