import * as vscode from "vscode";

const CONFIG_SECTION = "VirtualRepos";

export function get(key: "PullInterval"): number;
export function get(key: "PushInterval"): number;
export function get(key: "PushOn"): string;
export function get(key: "MergeConflicts"): string;
export function get(key: "UseRepoOwnerAvatar"): boolean;

export function get(key: any) {
    const extensionConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return extensionConfig.get(key);
}

export async function set(key: string, value: any) {
    const extensionConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return extensionConfig.update(key, value, true);
}
