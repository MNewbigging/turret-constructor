import { assetManager } from "../assets/asset-manager";
import { GameState } from "../game/game-state";
import { action, makeAutoObservable, observable } from "mobx";

export class AppState {
  @observable loaded = false;
  @observable started = false;

  gameState?: GameState;

  constructor() {
    makeAutoObservable(this);

    // Give loading UI time to mount
    setTimeout(() => this.loadGame(), 10);
  }

  @action startGame = () => {
    this.gameState = new GameState();
    this.started = true;
  };

  private async loadGame() {
    assetManager.load().then(this.onLoad);
  }

  @action private onLoad = () => {
    this.loaded = true;
  };
}
