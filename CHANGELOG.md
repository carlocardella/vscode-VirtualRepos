# Change Log

All notable changes to the "vscode-VirtualRepos" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

See the [list of open enhancements on GitHub](https://github.com/carlocardella/vscode-VirtualRepos/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Aenhancement)

### Wiki

* Manage doc repo as wiki

### Other

* Push changes at configurable intervals (only if there are changes to push) rather than other on save; users may have auto-save enabled, that would generate lots of small push changes and potentially exceed the GitHub [API rate limit](https://docs.github.com/en/rest/rate-limit#about-the-rate-limit-api)
* Sort repository list in TreeView
* Adopt new [Log Output Channel](https://code.visualstudio.com/updates/v1_72#_log-output-channel) when the API will be finalized

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
