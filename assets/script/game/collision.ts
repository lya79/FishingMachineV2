import { ESkill, Skill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";

/**
 * 遊戲關卡
 */
export enum EStage {
    None, // 還未初始化
    Level1, // 關卡1
    Level2, // 關卡2
    Level3, // 關卡3
}

export type ChangeStageHandler = (oldStage: EStage, newStage: EStage) => void;

export class Collision extends cc.Component { // TODO
    private stage: EStage;
    private changeStageHandler: ChangeStageHandler;

    public init() {
    }

    public onLoad() {
    }

    public onEnable() {
        this.stage = EStage.None;
    }

    public onDisable() {

    }

    /**
     * 設定初始關卡為1
     */
    public initStage(changeStageHandler: ChangeStageHandler) {
        this.changeStageHandler = changeStageHandler;

        this.setStage(EStage.Level1);
    }

    public AddBullet(
        roomLevel: number,
        tower: Tower,
        location: cc.Vec2,
        rotataion: number) {

    }

    /**
     * 設定遊戲關卡 
     */
    private setStage(newStage: EStage) {
        let oldStage = this.stage;
        this.changeStageHandler(oldStage, newStage);

        this.stage = newStage;
    }

    /**
     * 外部如果要使用只能用在測試
     */
    public nextStage() {
        switch (this.stage) {
            case EStage.None: // 關卡1
                this.setStage(EStage.Level1);
                break;
            case EStage.Level1: // 關卡1
                this.setStage(EStage.Level2);
                break;
            case EStage.Level2: // 關卡2
                this.setStage(EStage.Level3);
                break;
            case EStage.Level3: // 關卡3
                this.setStage(EStage.Level1);
                break;
        }
    }

    /**
     * 外部如果要使用只能用在測試
     */
    public AddFish(fishPath: string) {
        cc.log("AddFish:" + fishPath);
        let prefab = ResourcesManager.prefabMap.get(fishPath);
        if (!prefab) {
            cc.log("error: AddFish fishPath:" + fishPath);
            return;
        }

        let node = cc.instantiate(prefab);
        node.setPosition(2000, 2000); // 為了避免初始化畫時候出現一瞬間在 0,0位置, 因此要事先移到畫面外
        this.node.addChild(node);
    }
}