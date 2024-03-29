# Change Log

All notable changes to the "vscode-VirtualRepos" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

See the [list of open enhancements on GitHub](https://github.com/carlocardella/vscode-VirtualRepos/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Aenhancement)
## [0.1.2] - 2023-04-07

### Fixed

* [#48 Cached Starred Repos and My Repos are not refreshed](https://github.com/carlocardella/vscode-VirtualRepos/issues/48)

## [0.1.1] - 2023-04-03

### Changed

* `Open Repository...` allows to open multiple repos at once, when selecting from `Open my repository` and `Open starred repository`

### Fixed

* Fixed a couple of bugs around global storage handling and refreshing the treeview

## [0.1.0] - 2023-03-23

### Changed

* Updated minimum VSCode required version to 1.66 so support the updated GitHub authentication flow
* For VSCode version 1.74 or higher, use the built-in [Log Output Channel](https://code.visualstudio.com/updates/v1_74#_log-output-channel)
* Removed custom tracing logic for VSCode versions older than 1.74
## [0.0.31] - 2023-01-10

### Fixed

* [#45 Sort menu duplicate commands](https://github.com/carlocardella/vscode-VirtualRepos/issues/45)

## [0.0.30] - 2023-01-07

### Changed

* Reordered inline commands for folder and repositories
* Update repository tooltip
* Tweak tracing messages
* Improve TreeView refresh, show refresh progress bar more consistently

## [0.0.29] - 2023-01-03

### Changed

* The sort commands menu uses "toggle" items: the currently selected sert type and direction are identified with a checkmark

### Fixed

* Minor bug fixes and code refactoring

## [0.0.28] - 2022-12-31

### Added

* Toggle GitHub repository visibility (public or private)

### Fixed

* [#42 Error when creating new file under a folder (/folder/newfile.md)](https://github.com/carlocardella/vscode-VirtualRepos/issues/42)
* Various other smaller fixes

### Changed

* Private repositories are represented by a lock icon

## [0.0.27] - 2022-12-30

### Added

* Sort repositories by name, stars, forks, watchers, creation time, update time
* `Copy upstream url` (available for forked repos only)
* `Show upstream` (available for forked repos only)

### Changed

* Renamed `Show on remote` to `Show remote` to be consistent with the new `Show upstream`

See the [list of open enhancements on GitHub](https://github.com/carlocardella/vscode-VirtualRepos/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Aenhancement)

## [0.0.26] - 2022-12-24

### Added

* [#37 Follow//unfollow a user on GitHub](https://github.com/carlocardella/vscode-VirtualRepos/issues/37)
* The extension now requires `user:follow` authentication context on GitHub, this is needed to be able to follow/unfollow a user. You will need to re-authorize the extension in VSCode after update

## [0.0.25] - 2022-12-22

### Fixed

* [#38 Fix star/unstar icon in treeview at extension startup](https://github.com/carlocardella/vscode-VirtualRepos/issues/38)

## [0.0.24] - 2022-12-22

### Added

* Star and unstar an open repository
  * Starred repositories are refreshed from GitHub every hour
  * You can also use the `Refresh starred repositories from GitHub` command to force the refresh as needed

## [0.0.23] - 2022-12-13

### Changed

* Forked repos use a "forked" icon rather than the generic "repo" icon
* Upload multiple files in onw shot: [#1](https://github.com/carlocardella/vscode-VirtualRepos/issues/1)

## [0.0.22] - 2022-12-12

### Added

* Select and delete multiple files in a repo with one click

### Changed

* Improved new file experience: now the newly created file is automatically opened in the editor

## [0.0.21] - 2022-12-05

### Added

* Rename file/folder command in context menu
* Delete folder and all its content, command in context menu
  * _Known issue_: The `Delete folder` currently works only with folders in the repository root, this is being tracked in [#29](https://github.com/carlocardella/vscode-VirtualRepos/issues/29)

### Fixed

* Restored `Clone` and `Fork` context menu commands, removed by mistake in the previous release

## [0.0.20] - 2022-11-26

### Added

* `Fork repository`: if you opened a repository you do not own, you can now fork it from the context menu. Once forked, the repository is automatically added to the Virtual Repositories list
* View repository owner profile on GitHub

### Fixed

* Fixed write/delete actions in context menu, show then only when the user has write permission on the repository

## [0.0.19] - 2022-11-18

### Added

* Added `Copy remote url` in context menu
* Added `Show on remote` in context menu

### Changed

* Updated node modules

## [0.0.18] - 2022-11-15

### Fixed

* Fixed [#13](https://github.com/carlocardella/vscode-VirtualRepos/issues/13): Wrong refresh rage with VirtualRepos.PullInterval

## [0.0.17] - 2022-11-09

### Added

* Clone repository

### Changed

* Updated context menu commands
* Code refactoring and various bug fixes and improvements

## [0.0.16] - 2022-10-11

### Fixed

* Fix for [Files do not open on github.dev](https://github.com/carlocardella/vscode-VirtualRepos/issues/7)
* Fix for [Add file apparently does not do anything in github.dev](https://github.com/carlocardella/vscode-VirtualRepos/issues/8)
* Fix for [Error creating new file in the browser](https://github.com/carlocardella/vscode-VirtualRepos/issues/10)

## [0.0.15] - 2022-10-09

### Fixed

* Address [Handle multiple repos with the same name](https://github.com/carlocardella/vscode-VirtualRepos/issues/5)

### Added

* New setting `VirtualRepos.UseRepoOwnerAvatar` (default: `false`)
  * Useful if you open multiple repos with the same name, for example a fork in your GitHub account and its upstream. Or simply if you prefer to use the repo owner's avatar instead of the generic repo icon

## [0.0.14] - 2022-10-09

### Fixed

* Fix [Create new file does not work in repo root](https://github.com/carlocardella/vscode-VirtualRepos/issues/3)
* Fix `Delete File` command

## [0.0.13] - 2022-10-08

### Fixed

* Fixed timer on `PullInterval`

## [0.0.12] - 2022-10-07

### Changed

* Updated GitHub scope to allow to delete an owned repository: current scopes `const SCOPES = ["user:email, repo, delete_repo"];`

### Added

* Added setting `VirtualRepos.PullInterval`: Interval in seconds to pull changes from the remote repository; set to 0 (zero) to disable

## [0.0.11] - 2022-09-29

### Changed

* Updated View Container icon
* Enable [Web Extension](https://code.visualstudio.com/api/extension-guides/web-extensions)
* Support [Workspace Trust](https://code.visualstudio.com/api/extension-guides/workspace-trust)

## [0.0.10] - 2022-09-28

### Changed

* Fix TreeView file icons, use the user's theme
* ❗ Make the repo public, first Marketplace release (in preview)

### Changed

* New extension icon

## [0.0.9] - 2022-09-27

### Changed

* The `Open Repository` command now allows to select a repository to open from the list of owned repos or starred repos. Of course it is still possible to enter manually enter the name of any repository as `owner/repoName`
* Updated available commands when hovering on the TreeView items

## [0.0.8] - 2022-09-26

### Added

* `New repository` to create a new repo from the extension; use the format `owner/reponame` or `organization/reponame` to create the repo for the specific owner or Organiation. If you only pass the repository name, the new repo will be created for the authenticated user (you)
* `Delete repository`. VSCode authenticated identity must have `repo_delete` permission

## [0.0.7] - 2022-09-23

### Added

* `Remove from Global Storage` allows to remove a repository from Global Storage, even if it does not show up in the TreeView. Invalid repositories are not added to the TreeView are to the Global Storage, this command is useful to selectively remove those bad repositories.

### Changed

* `Purge Global Storage` now internally use `Remove from Global Storage` to remove all invalid repositories

## [0.0.6] - 2022-09-23

### Fixed

* Fixed `Close Repository` command

## [0.0.5] - 2022-09-22

### Added

* Added `Get Global Storage`, help to see (in the Output channel) the current extension storage
* Added `Purge Global Storage` to remove invalid repos and items

### Fixed

* Fixes around output tracing and global storage management

### Changed

* Updated tree context menu commands and groups

## [0.0.4] - 2022-09-18

### Added

* `Upload file(s)...` from local disk to remote repository

## [0.0.3] - 2022-09-18

### Changed

* Renamed View to `Virtual Repositories`
* Optimized context menu commands

## [0.0.2] - 2022-09-15

### Added

* Create file
  * Folders can be created passing a path as file name, e.g. `folder/file`
* Delete file

## [0.0.1] - 2022-09-04

### Added

* Browse repository tree
* Open file
* Update file (automatic commit)
