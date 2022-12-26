import { TRepo } from "../GitHub/types";

export enum SortType {
    Name,
    Stars,
    Forks,
    CreationTime,
    UpdateTime,
    Watchers,
}

export enum SortDirection {
    Ascending,
    Descending,
}

export function sortRepos(repos: TRepo[], sortType: SortType, sortDirection: SortDirection): TRepo[] {
    switch (sortType) {
        case SortType.Name:
            repos.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            break;
        case SortType.Stars:
            repos.sort((a, b) => {
                return a.stargazers_count - b.stargazers_count;
            });
            break;
        case SortType.Forks:
            repos.sort((a, b) => {
                return a.forks_count - b.forks_count;
            });
            break;
        case SortType.CreationTime:
            repos.sort((a, b) => {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
            break;
        case SortType.UpdateTime:
            repos.sort((a, b) => {
                return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            });
            break;
        case SortType.Watchers:
            repos.sort((a, b) => {
                return a.watchers_count - b.watchers_count;
            });
            break;
    }

    if (sortDirection === SortDirection.Descending) {
        repos.reverse();
    }

    return repos;
}

// export async function askSort