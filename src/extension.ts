import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import * as trace from "./tracing";
import { commands, ExtensionContext, workspace, window } from "vscode";
import { RepoProvider } from "./Tree/nodes";

export let output: trace.Output;
export const credentials = new Credentials();

export async function activate(context: ExtensionContext) {
    if (config.get("EnableTracing")) {
        output = new trace.Output();
    }

    output?.appendLine("Repos extension is now active!", output.messageType.info);

    await credentials.initialize(context);
    if (!credentials.isAuthenticated) {
        credentials.initialize(context);
    }

    const repoProvider = new RepoProvider();

    const disposable = commands.registerCommand("extension.getGitHubUser", async () => {
        const octokit = await credentials.getOctokit();
        const userInfo = await octokit.users.getAuthenticated();

        output?.appendLine(`Logged to GitHub as ${userInfo.data.login}`, output.messageType.info);
    });

    context.subscriptions.push(
        commands.registerCommand("Repos.refreshTree", async () => {
            repoProvider.refresh();
        })
    );


    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("Repos.EnableTracing")) {
                if (config.get("EnableTracing")) {
                    output = new trace.Output();
                } else {
                    output.dispose();
                }
            }
        })
    );

    window.createTreeView("Repositories", {
        treeDataProvider: repoProvider,
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
