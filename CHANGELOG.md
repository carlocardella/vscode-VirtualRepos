# Change Log

All notable changes to the "vscode-VirtualRepos" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Repository management

* Clone repository
* Download repository (tar/zip)
* Fork repository
* Star repository
* Open starred repository
  * Choose from a list
* Unstar repository
* Change repository visibility (private/public)

### Repository content

* Rename file
* Rename folder
* Delete multiple files
  * Delete folder (delete all files in folder)
* Move file
  * Move multiple files
* Move folder

## [0.0.8] - 2022-09-26

### Added

* `New repository` to create a new repo from the extension; use the format `owner/reponame` or `organization/reponame` to create the repo for the specific owner or Organiation. If you only pass the repository name, the new repo will be created for the authenticated user (you)
* `Delete repository`. VSCode authenticated identity must have `repo_delete` permission

## [0.0.7] - @todo

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
