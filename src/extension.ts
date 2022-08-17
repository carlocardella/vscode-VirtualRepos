import { Credentials } from "./GitHub/authentication";
import * as config from "./config";
import * as tracing from "./tracing";
import { commands, ExtensionContext, window, workspace } from "vscode";

export let output: tracing.Output;

export async function activate(context: ExtensionContext) {
    const credentials = new Credentials();
    await credentials.initialize(context);

    const disposable = commands.registerCommand(
        "extension.getGitHubUser",
        async () => {
            const octokit = await credentials.getOctokit();
            const userInfo = await octokit.users.getAuthenticated();

            window.showInformationMessage(
                `Logged into GitHub as ${userInfo.data.login}`
            );
        }
    );

    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("gistpad.output")) {
                if (config.get("EnableTracing")) {
                    output = new tracing.Output();
                } else {
                    output.dispose();
                }
            }
        })
    );
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
