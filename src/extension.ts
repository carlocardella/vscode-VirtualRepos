// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Credentials } from "./GitHub/authentication";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const credentials = new Credentials();
    await credentials.initialize(context);

    const disposable = vscode.commands.registerCommand(
        "extension.getGitHubUser",
        async () => {
            const octokit = await credentials.getOctokit();
            const userInfo = await octokit.users.getAuthenticated();

            vscode.window.showInformationMessage(
                `Logged into GitHub as ${userInfo.data.login}`
            );
        }
    );

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
