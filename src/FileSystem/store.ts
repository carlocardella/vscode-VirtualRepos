import { TRepo } from "../GitHub/types";
import { RepoNode } from "../Tree/nodes";

export const store = {
    repos: [] as (RepoNode | undefined)[]
};
