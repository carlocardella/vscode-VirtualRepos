# Virtual Repos

![preview](https://img.shields.io/badge/-preview-orange)

[![Publish Extension](https://github.com/carlocardella/vscode-VirtualRepos/actions/workflows/PublishExtension.yml/badge.svg)](https://github.com/carlocardella/vscode-VirtualRepos/actions/workflows/PublishExtension.yml)
![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/carlocardella.vscode-virtualRepos)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/carlocardella.vscode-virtualRepos)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/carlocardella.vscode-virtualRepos)
![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/carlocardella.vscode-virtualRepos)
[![GitHub issues](https://img.shields.io/github/issues/carlocardella/vscode-VirtualRepos.svg)](https://github.com/carlocardella/vscode-VirtualRepos/issues)
[![GitHub license](https://img.shields.io/github/license/carlocardella/vscode-VirtualRepos.svg)](https://github.com/carlocardella/vscode-VirtualRepos/blob/master/LICENSE.md)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/carlocardella/vscode-VirtualRepos.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fcarlocardella%2Fvscode-VirtualRepos)
<!-- [![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/carlocardella/vscode-texttoolbox) -->

[Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CarloCardella.vscode-virtualrepos)

<!-- [Download for VS Codium](https://open-vsx.org/extension/carlocardella/vscode-texttoolbox) -->

Virtual Repos is a Visual Studio Code extension that allows to open and edit a remote repository (e.g. on GitHub) without cloning, committing or pushing your changes. It all happens automatically.

The extension is still missing lots of features I want to add (as time permits) and you can expect bugs (but hopefully nothing destructive), anyway this is a `preview` extension and you can expect bugs here and there. Please report bugs or issues and ask for features you would like to see. Check [Changelog](CHANGELOG.md) for the latest status, what's planned and what has already been released.

## Getting started

Install the extension from the VSCode Marketplace.

## Repository management

### Open a repo

Use the `Open repository` command to open an existing repo from GitHub, you can choose from three options:

1. `Open repository`: open any repository you have access to, enter the name as `owner/repoName`

   *Note: If you just enter the repo name, the extension assumes you own it, this is the same as using `Open my repository`*

2. `Open my repository`: open a repository from a list of repos you own
3. `Open starred repository`: open one of your Starred repos

The repository will load automatically (of course, make sure you are connected to the Internet), you can then browse it, open, edit, add, delete files as if they where on your local file system even without cloning the repo.

_open repository_

![open repository](https://user-images.githubusercontent.com/5784415/192892207-46f5418e-5696-4373-ae80-71cb160e8e25.gif)

_open my repository_

![open my repository](https://user-images.githubusercontent.com/5784415/192892464-bee3d23f-5688-4dfd-a343-c844ae39e135.gif)

#### Sync repositories across devices

You can sync your open repositories across multiple devices by enabling [Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync) in Visual Studio Code.

*Node: you may need to Refresh the Virtual Repos view to see the latest repos added or removed from another machine.*

### Create new repo

You can create a new repository (public or private), other repo operations (delete, star, fork, clone, download) will come in future releases.

![create private repo](https://user-images.githubusercontent.com/5784415/192894098-2cb95397-6696-467a-ab9c-6ca272f460b0.gif)

## Automatic commits

Changes are committed automatically after the file is saved. The commit message is `VirtualRepos: update file <filePath>`.

## Repo owner's avatar

Imagine you fork a repo and then open both your fork and its upstream, you would see something like this in your TreeView:

![multiple repos with the same name](https://user-images.githubusercontent.com/5784415/194788228-d99b47ea-177d-448b-8001-8843955cc553.png)

Which one is your fork and which one is upstream?

Well, you can hover with your mouse on the repo name to show the tooltip and get `owner/reponame`, or switch `VirtualRepos.UseRepoOwnerAvatar` to `true` (default is `false`) to replace the standard repo icon with the repo owner's GitHub avatar:

![UserRepoOwnerAvatar](https://user-images.githubusercontent.com/5784415/194788262-4eb6ad81-f924-4a42-a642-eec4c10a60b0.gif)

## Fork repository

If you opened a repository you do not own, you can now fork it from the context menu. Once forked, the repository is automatically added to the Virtual Repositories list.

## Tracing

You can enable `VirtualRepos.EnableTracing` in your User or Workspace settings to enable tracing in a `Virtual Repositories` output channel; this is off by default but it can be useful for troubleshooting errors or if you are curious to see what the extension is doing under the hood.

![image](https://user-images.githubusercontent.com/5784415/192893074-ffeb0ec1-1932-45ed-a961-1c15492c1a9e.png)

## My other extensions

<!-- * [Virtual Repos](https://github.com/carlocardella/vscode-VirtualRepos): Virtual Repos is a Visual Studio Code extension that allows to open and edit a remote repository (e.g. on GitHub) without cloning, committing or pushing your changes. It all happens automatically -->
* [Virtual Gists](https://github.com/carlocardella/vscode-VirtualGists): Virtual Gists is a Visual Studio Code extension that allows to open and edit a remote gist (e.g. on GitHub) without cloning, committing or pushing your changes. It all happens automatically
* [Virtual Git](https://github.com/carlocardella/vscode-VirtualGit): VSCode extension path with my extensions to work with virtual repositories and gists based on a virtual file system
* [Text Toolbox](https://github.com/carlocardella/vscode-TextToolbox): Collection of tools for text manipulation, filtering, sorting etc...
* [File System Toolbox](https://github.com/carlocardella/vscode-FileSystemToolbox): VSCode extension to work with the file system, path auto-complete on any file type
* [Changelog Manager](https://github.com/carlocardella/vscode-ChangelogManager): VSCode extension, helps to build a changelog for your project, either in markdown or plain text files. The changelog format follows Keep a changelog
* [Hogwarts colors for Visual Studio Code](https://github.com/carlocardella/hogwarts-colors-for-vscode): Visual Studio theme colors inspired by Harry Potter, Hogwarts and Hogwarts Houses colors and banners

## Acknowledgements

Virtual Repositories is freely inspired by these fine extensions:

* [GistPad](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gistfs)
* [WikiLens](https://marketplace.visualstudio.com/items?itemName=lostintangent.wikilens)
* [GitDoc](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gitdoc)
* [Dendron](https://marketplace.visualstudio.com/items?itemName=dendron.dendron)
* [Foam](https://marketplace.visualstudio.com/items?itemName=foam.foam-vscode)
