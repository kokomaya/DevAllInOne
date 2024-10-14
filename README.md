# Views & View Containers

This Repo is designed try to collect all activities in vscode. 

this repo is based on ms vscode example https://github.com/microsoft/vscode-extension-samples

This sample provides following views

- Node dependencies view
- Ftp file explorer view

Following example shows Node dependencies view in Package Explorer View container.

![Package Explorer](./resources/package-explorer.png)

## VS Code API

This sample uses following contribution points, activation events and APIs

### Contribution Points

- `views`
- `viewsContainers`
- `menu`
  - `view/title`
  - `view/item/context`

### Activation Events

- `onView:${viewId}`

### APIs

- `window.createTreeView`
- `window.registerTreeDataProvider`
- `TreeView`
- `TreeDataProvider`

Refer to [Usage](./USAGE.md) document for more details.

## Running the Sample

- Open this example in VS Code Insiders
- `npm install`
- `npm run watch`
- `F5` to start debugging
- Node dependencies view is shown in Package explorer view container in Activity bar.
- FTP file explorer view should be shown in Explorer
