import { observable } from "mobx";

export default class PreferencesStore {
  @observable dialogOpen = false;

  @observable openDialogOpen = false;

  @observable darkMode = false;
}
