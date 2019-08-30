import { runInAction, toJS } from 'mobx';
import { Intent } from '@blueprintjs/core';
import { demapify } from 'es6-mapify';

import appState from '../stores/index';
import {
  ADD_NODE,
  ADD_NODES,
  ADD_SELECT_NODE,
  CHOOSE_EDGE_FILE,
  CHOOSE_GRAPH_FILE,
  CHOOSE_NODE_FILE,
  CHOOSE_STATE_FILE,
  CHOSEN_EDGE_FILE,
  CHOSEN_GRAPH_FILE,
  CHOSEN_NODE_FILE,
  CHOSEN_STATE_FILE,
  GET_NEIGHBORS,
  IMPORT_GRAPH,
  IMPORTED_GRAPH,
  LOAD_GRAPH_SQLITE,
  LOADED_GRAPH_SQLITE,
  LOADED_GRAPH_STATE,
  MENU_IMPORT_CSV,
  MENU_LOAD,
  MENU_NEW_PROJECT,
  MENU_SAVE_GRAPH_SQLITE,
  MENU_SAVE_GRAPH_STATE,
  CREATE_NEW_PROJECT,
  CREATED_NEW_PROJECT,
  OPEN_GRAPH,
  OPENED_GRAPH,
  FETCH_WORKSPACE_PROJECTS,
  FETCHED_WORKSPACE_PROJECTS,
  SAVE_GRAPH_SQLITE,
  SAVE_GRAPH_STATE,
  SAVED_GRAPH_JSON,
  SAVED_GRAPH_STATE,
  SEARCH_REQUEST,
  SEARCH_RESPONSE,
  SHOW_ITEM_IN_FOLDER,
  SAVED_GRAPH_STATE_TO_PROJECT,
  MENU_SAVE_GRAPH_STATE_TO_PROJECT,
  SAVE_GRAPH_STATE_TO_PROJECT,
  DELETE_FILE,
  RENAME_FILE,
  SHOW_WORKSPACE_FOLDER,
  LOAD_USER_CONFIG,
  LOADED_USER_CONFIG,
  SAVED_USER_CONFIG,
  SAVE_USER_CONFIG,
  CHANGE_WORKSPACE_FOLDER,
  CHANGED_WORKSPACE_FOLDER,
} from '../constants/index';
import { toaster } from '../notifications/client';

const { ipcRenderer } = require('electron');

export default function registerIPC() {
  ipcRenderer.on(LOADED_USER_CONFIG, (event, loadedObject) => {
    // Overwrite PreferenceStore values according to user config values,
    // if present.
    if (loadedObject.darkMode) {
      appState.preferences.darkMode = true;
    }
    if (loadedObject.workspace && loadedObject.workspace != '') {
      appState.preferences.workspacePath = loadedObject.workspace;
    }
  });

  ipcRenderer.on(SAVED_USER_CONFIG, (event) => {
    toaster.show({
      message: "User configuration saved",
      intent: Intent.SUCCESS,
      iconName: 'saved',
    });
  });

  ipcRenderer.on(LOADED_GRAPH_SQLITE, (event, loadedObject) => {
    runInAction('load saved graph', () => {
      appState.graph.rawGraph = loadedObject.rawGraph;
      appState.graph.metadata = loadedObject.metadata;
    });
  });

  ipcRenderer.on(OPENED_GRAPH, (event, loadedObject) => {
    runInAction('load saved graph and state', () => {
      console.log(loadedObject);
      appState.graph.rawGraph = loadedObject.rawGraph;
      appState.graph.metadata = loadedObject.metadata;
      if (loadedObject.state) {
        appState.graph.loadImmediateStates(loadedObject.state);
      }
    });
  });

  ipcRenderer.on(LOADED_GRAPH_STATE, (event, loadedObject) => {
    appState.graph.loadImmediateStates(loadedObject);
  });

  ipcRenderer.on(SAVED_GRAPH_STATE, (event, savedFilePath) => {
    toaster.show({
      message: `Saved graph snapshot file to ${savedFilePath}`,
      intent: Intent.SUCCESS,
      iconName: 'saved',
      action: {
        onClick: () => ipcRenderer.send(SHOW_ITEM_IN_FOLDER, savedFilePath),
        text: 'Show in Folder',
      },
    });
  });

  ipcRenderer.on(SAVED_GRAPH_STATE_TO_PROJECT, (event, snapshotName) => {
    toaster.show({
      message: `Saved to snapshot ${snapshotName}`,
      intent: Intent.SUCCESS,
      iconName: 'saved',
    });
  });

  ipcRenderer.on(SAVED_GRAPH_JSON, (event, savedFilePath) => {
    toaster.show({
      message: `Saved graph file to ${savedFilePath}`,
      intent: Intent.SUCCESS,
      iconName: 'saved',
      action: {
        onClick: () => ipcRenderer.send(SHOW_ITEM_IN_FOLDER, savedFilePath),
        text: 'Show in Folder',
      },
    });
  });

  ipcRenderer.on(CHOSEN_NODE_FILE, (event, path) => {
    appState.import.importConfig.nodeFile.path = path;
  });

  ipcRenderer.on(CHOSEN_EDGE_FILE, (event, path) => {
    appState.import.importConfig.edgeFile.path = path;
  });

  ipcRenderer.on(CHOSEN_GRAPH_FILE, (event, path) => {
    appState.import.graphFile = path;
  });

  ipcRenderer.on(CHOSEN_STATE_FILE, (event, path) => {
    appState.import.stateFile = path;
  });

  ipcRenderer.on(IMPORTED_GRAPH, (event) => {
    appState.import.loading = false;
    appState.import.dialogOpen = false;
    appState.project.isFetching = true;
    fetchWorkspaceProjects();
  });

  ipcRenderer.on(ADD_NODES, (event, toAdd) => {
    runInAction('add nodes and edges to graph', () => {
      appState.graph.rawGraph.nodes = appState.graph.rawGraph.nodes.concat(
        toAdd.nodes,
      );
      appState.graph.rawGraph.edges = appState.graph.rawGraph.edges.concat(
        toAdd.edges,
      );
    });
  });

  ipcRenderer.on(ADD_SELECT_NODE, (event, toAdd) => {
    runInAction('add nodes and edges to graph', () => {
      appState.graph.rawGraph.nodes = appState.graph.rawGraph.nodes.concat(
        toAdd.nodes,
      );
      appState.graph.rawGraph.edges = appState.graph.rawGraph.edges.concat(
        toAdd.edges,
      );
    });

    appState.graph.frame.setLastNode(toAdd.nodes[0].node_id);
    appState.graph.frame.dragLastNode();
  });

  ipcRenderer.on(SEARCH_RESPONSE, (event, candidates) => {
    var cands = JSON.parse(candidates);
    var ckeys = cands.map(x => x.node_id);
    appState.search.allCands = Object.values(cands);
    appState.search.pageNum = 0;
    appState.search.nPerPage = 10;
    appState.search.numCandidates = appState.search.allCands.length;
    appState.search.maxPage = parseInt(
      appState.search.allCands.length / appState.search.nPerPage,
    );
    appState.search.pages = [...Array(appState.search.maxPage).keys()];
    appState.search.candidates = appState.search.allCands.slice(0, 10);
    appState.search.panelOpen = true;
    if (appState.graph.frame) {
      appState.graph.frame.highlightNodeIds(ckeys, true);
    }
  });

  ipcRenderer.on(LOADED_GRAPH_STATE, (event, stateStr) => {
    appState.graph.loadImmediateStates(stateStr);
  });

  ipcRenderer.on(CREATED_NEW_PROJECT, () => {
    fetchWorkspaceProjects();
  });

  ipcRenderer.on(FETCHED_WORKSPACE_PROJECTS, (event, projects) => {
    appState.project.isFetching = false;
    appState.project.projects = projects;
    // Update mobx state on projects, useful for updating the components after deleting/renaming etc.
    if (appState.project.currentProject !== null) {
      // There is a project currently selected (showing in a ProjectDetailDialog etc.)
      // This fetch needs to update the dialog also
      const temp = appState.project.projects.filter((project) => {
        return project.projectPath === appState.project.currentProject.projectPath;
      });
      if (temp.length === 1) {
        appState.project.currentProject = temp[0];
      } else {
        appState.project.currentProject = null;
      }
      
    }
  });

  ipcRenderer.on(CHANGED_WORKSPACE_FOLDER, (events, newWorkspaceDirectory) => {
    appState.preferences.workspacePath = newWorkspaceDirectory;
    appState.preferences.saveUserConfig();
  });

  ipcRenderer.on(MENU_NEW_PROJECT, () => {
    appState.project.isNewProjectDialogOpen = true;
  });

  ipcRenderer.on(MENU_LOAD, () => {
    appState.preferences.openDialogOpen = true;
  });

  ipcRenderer.on(MENU_IMPORT_CSV, () => {
    appState.import.dialogOpen = true;
  });

  ipcRenderer.on(MENU_SAVE_GRAPH_STATE, () => {
    // Original implementation for opening a traditional system-level save file dialog
    // ipcRenderer.send(SAVE_GRAPH_STATE, appState.graph.saveImmediateStates());
    
    // New implementation opening a dialog that saves snapshot to project
    appState.project.isSaveSnapshotDialogOpen = true;
  });

  ipcRenderer.on(MENU_SAVE_GRAPH_STATE_TO_PROJECT, () => {
    requestSaveSnapshot();
  });

  ipcRenderer.on(MENU_SAVE_GRAPH_SQLITE, requestSaveSQLite);
}

export function requestLoadSQLite() {
  ipcRenderer.send(LOAD_GRAPH_SQLITE);
}

export function addNode(node_id) {
  ipcRenderer.send(ADD_NODE, node_id);
}

export function requestNeighbors(
  node_id,
  attr = 'degree',
  num = '10',
  order = 'desc',
) {
  ipcRenderer.send(GET_NEIGHBORS, node_id, attr, num, order);
}

function requestSaveSQLite() {
  ipcRenderer.send(
    SAVE_GRAPH_SQLITE,
    JSON.stringify({
      graph: toJS(appState.graph.rawGraph),
      metadata: toJS(appState.graph.metadata),
      nodes: toJS(appState.graph.nodes),
      overrides: toJS(demapify(appState.graph.overrides)),
      nodePositions: appState.graph.frame.getPositions(),
    }),
  );
}

export function requestChooseNodeFile(hasHeader) {
  ipcRenderer.send(CHOOSE_NODE_FILE, hasHeader);
}

export function requestChooseEdgeFile(hasHeader) {
  ipcRenderer.send(CHOOSE_EDGE_FILE, hasHeader);
}

export function requestChooseGraphFile() {
  ipcRenderer.send(CHOOSE_GRAPH_FILE);
}

export function requestChooseStateFile() {
  ipcRenderer.send(CHOOSE_STATE_FILE);
}

export function requestOpen() {
  ipcRenderer.send(
    OPEN_GRAPH,
    appState.import.graphFile,
    appState.import.stateFile,
  );
}

// Request to delete a file specified at filePath
export function requestDelete(filePath) {
  ipcRenderer.send(DELETE_FILE, filePath);
}

/**
 * Request to rename a file specified at filePath
 * @param filePath where the file to be renamed is located
 * @param newName new file name with extension
 */
export function requestRename(filePath, newName) {
  ipcRenderer.send(RENAME_FILE, filePath, newName);
}

export function requestSaveSnapshot(snapshotName) {
  if (!snapshotName) {
    // Default: Use the currently opened snapshot name (if no snapshot opened, the default name in the ProjectStore will be used)
    ipcRenderer.send(SAVE_GRAPH_STATE_TO_PROJECT, appState.graph.saveImmediateStates(), appState.project.currentProject.projectPath, appState.project.currentSnapshotName);
  } else {
    ipcRenderer.send(SAVE_GRAPH_STATE_TO_PROJECT, appState.graph.saveImmediateStates(), appState.project.currentProject.projectPath, snapshotName);
  }
}

export function requestImportGraphFromCSV(hasNodeFile, delimiter, newProjectName) {
  if (!newProjectName) {
    newProjectName = 'Test Project';
  }
  appState.import.loading = true;
  ipcRenderer.send(IMPORT_GRAPH, {
    hasNodeFile,
    nodes: {
      path: appState.import.importConfig.nodeFile.path,
      hasColumns: appState.import.importConfig.nodeFile.hasColumns,
      columns: toJS(appState.import.importConfig.nodeFile.columns),
      mapping: toJS(appState.import.importConfig.nodeFile.mapping),
    },
    edges: {
      path: appState.import.importConfig.edgeFile.path,
      hasColumns: appState.import.importConfig.edgeFile.hasColumns,
      columns: toJS(appState.import.importConfig.edgeFile.columns),
      mapping: toJS(appState.import.importConfig.edgeFile.mapping),
      createMissing: appState.import.importConfig.edgeFile.createMissing,
    },
    delimiter,
    newProjectName
  });
}

export function runSearch(searchStr) {
  ipcRenderer.send(SEARCH_REQUEST, searchStr, appState.graph.searchOrder);
}

export function fetchWorkspaceProjects() {
  ipcRenderer.send(FETCH_WORKSPACE_PROJECTS);
}

export function requestCreateNewProject(projectMetadata) {
  ipcRenderer.send(CREATE_NEW_PROJECT, projectMetadata);
}

export function requestOpenWorkspaceFolder() {
  ipcRenderer.send(SHOW_WORKSPACE_FOLDER);
}

export function requestLoadUserConfig() {
  ipcRenderer.send(LOAD_USER_CONFIG);
}

export function requestSaveUserConfig(userConfig) {
  ipcRenderer.send(SAVE_USER_CONFIG, userConfig);
}

export function requestChangeWorkspace() {
  ipcRenderer.send(CHANGE_WORKSPACE_FOLDER);
}