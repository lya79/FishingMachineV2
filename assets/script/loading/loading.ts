import { EAction, Loader, ResourcesArgs } from '../common/loader';
import { ResourcesManager } from "../common/resource";
import { EAction as EAudioAction, AudioManager } from "../common/audio";

const { ccclass, property } = cc._decorator;

/**
 * finish: 用來判斷是否已經停止載入
 * err: 用來判斷是否成功載入資源
 */
export type Handler = (finish: boolean, err: Error) => void;

@ccclass
export class LoadingComponent extends cc.Component {
    private running: boolean;

    private handler: Handler;

    private numOfRes: number; // 目前已經載入的資源數量
    private totalOfRes: number; // 總共要載入的資源數量

    private error: Error; // loading過程中是否出錯

    private progresBar: cc.ProgressBar;

    public init(handler: Handler): boolean {
        this.running = false;
        this.numOfRes = 0; // 目前已經載入的資源數量
        this.totalOfRes = 0; // 總共要載入的資源數量
        this.error = null;
        this.handler = null;

        this.handler = handler;
        if (!this.handler) {
            cc.log('error: handler is null');
            return false;
        }

        let node = this.node.getChildByName('progress');
        if (!node) {
            cc.log('error: node not found: progress');
            return false;
        }

        let progresBar: cc.ProgressBar = node.getComponent(cc.ProgressBar);
        if (!progresBar) {
            cc.log('error: script not found: cc.ProgressBar');
            return false;
        }
        this.progresBar = progresBar;
        this.setProgress(0);

        return true;
    }

    public Load() {
        if (this.running) {
            return;
        }

        this.running = true;

        this.schedule(this.timeCallback, 0.03) // 每 0.03s更新一次進度條和檢查是否完成載入

        this.loadRes();
    }

    public onDisable() {
        cc.log('停止更新載入資源進度條');
        this.unschedule(this.timeCallback);
    }

    private timeCallback() {
        if (!this.running) {
            return;
        }

        this.updateProgress();

        if (this.isFinish()) {
            this.running = false;
            this.handler(true, this.error);
            return;
        }
    }

    private updateProgress() {
        let value: number;
        if (this.numOfRes == this.totalOfRes) {
            value = 1;
        } else {
            value = this.numOfRes / this.totalOfRes;
        }
        this.setProgress(value);
    }

    private setProgress(value: number) {
        if (value > 1) {
            value = 1;
        } else if (value < 0) {
            value = 0;
        }
        this.progresBar.progress = value;
    }

    private isFinish(): boolean {
        if (this.error) {
            return true;
        }

        if (this.numOfRes >= this.totalOfRes) {
            return true;
        }

        return false;
    }

    private loadRes() {
        let self = this;

        let run = async function (): Promise<void> {
            {  // 資源載入 level 1-4 子彈
                self.totalOfRes += 4;
                let max = 4;
                for (let i = 1; i <= max; i++) {
                    let ok = await self.loadLevel1BulletPrefab(i);
                    if (!ok) {
                        self.error = new Error(`error: loadLevel1BulletPrefab fail`);
                        return;
                    }
                    self.numOfRes += 1;
                }
            }

            {  // 資源載入 level 1-4 漁網
                self.totalOfRes += 4;
                let max = 4;
                for (let i = 1; i <= max; i++) {
                    let ok = await self.loadFishingnetPrefab(i);
                    if (!ok) {
                        self.error = new Error(`error: loadFishingnetPrefab fail`);
                        return;
                    }
                    self.numOfRes += 1;
                }
            }

            {  // 資源載入
                self.totalOfRes += 1;
                let ok = await self.loadPlsit();
                if (!ok) {
                    self.error = new Error(`error: loadPlsit fail`);
                    return;
                }
                self.numOfRes += 1;
            }

            {  // 音效載入
                self.totalOfRes += 1;
                let ok = await self.loadAudio();
                if (!ok) {
                    self.error = new Error(`error: loadAudio fail`);
                    return;
                }
                self.numOfRes += 1;
            }
        }

        run();
    }

    private async loadLevel1BulletPrefab(level: number): Promise<boolean> {
        let name = `level${level}Bullet`;
        let path = 'prefab/' + name;
        let type = cc.Prefab;
        let result = await Loader.Resources(EAction.loadRes, new ResourcesArgs(path, type));
        if (result instanceof Error) {
            cc.log('err Loader.Resources, err:' + result);
            return false;
        }

        let level1Bullet: cc.Prefab = <cc.Prefab>result;

        ResourcesManager.prefabMap.set(name, level1Bullet);

        return true;
    }

    private async loadFishingnetPrefab(level: number): Promise<boolean> { // fishingnet_lv1
        let name = `fishingnet_lv${level}`;
        let path = 'prefab/' + name;
        let type = cc.Prefab;
        let result = await Loader.Resources(EAction.loadRes, new ResourcesArgs(path, type));
        if (result instanceof Error) {
            cc.log('err Loader.Resources, err:' + result);
            return false;
        }

        let level1Bullet: cc.Prefab = <cc.Prefab>result;

        ResourcesManager.prefabMap.set(name, level1Bullet);

        return true;
    }

    private async loadPlsit(): Promise<boolean> {
        let path = 'images/SS_Symbol_Atlas_01';
        let type = cc.SpriteAtlas;
        let result = await Loader.Resources(EAction.loadRes, new ResourcesArgs(path, type));
        if (result instanceof Error) {
            cc.log('err Loader.Resources, err:' + result);
            return false;
        }

        let spriteAtlas: cc.SpriteAtlas = <cc.SpriteAtlas>result;
        ResourcesManager.spriteAtlasMap.set('SS_Symbol_Atlas_01', spriteAtlas);

        return true;
    }

    private async loadAudio(): Promise<boolean> {
        let path = 'audio';
        let type = cc.AudioClip;
        let result = await Loader.Resources(EAction.loadResDir, new ResourcesArgs(path, type));
        if (result instanceof Error) {
            cc.log('err Loader.Resources, err:' + result);
            return false;
        }

        let audioClipArr: cc.AudioClip[] = <cc.AudioClip[]>result;
        for (let i = 0; i < audioClipArr.length; i++) {
            AudioManager.addAudio(audioClipArr[i].name, audioClipArr[i]);
        }

        return true;
    }
}