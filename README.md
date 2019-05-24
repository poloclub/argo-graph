# Argo Graph (Alpha)

Large-scale cross-platform interactive graph visualization tool built on top of WebGL and Electron.

## Documentation

[See our website for documentation. (We are currently in the process of adding more documentation)](https://poloclub.github.io/argo-graph)

## Development

### Prerequisites

`electron-forge` and `node-gyp` need to be installed globally if not already.

Argo uses `electron-forge` version 5 (currently the latest stable version as of May 2019). See [electron-forge](https://github.com/electron-userland/electron-forge/) and [node-gyp](https://github.com/nodejs/node-gyp) to install.

```
npm install -g node-gyp
npm install -g electron-forge
```

We need `node-gyp` to be installed correctly since Argo contains native dependencies.

After these are installed, run `npm install` to install all the regular dependencies.

### Build and Package for production

`npm run make` will output all possible deliverables that could be built on your OS. See `package.json` for the exact `electron-forge` configurations.

