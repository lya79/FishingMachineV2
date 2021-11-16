import { ESkill, Skill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";
import { SettingManager, FishPath } from "../common/setting";
import { Bullet } from "./bullet"
import { Fish } from "./fish";

export type ChangeStageHandler = (oldStage: number, newStage: number) => void;

export class Collision extends cc.Component {
    private stage: number;
    private changeStageHandler: ChangeStageHandler;

    public init() {
    }

    public onLoad() {
        { // 測試用途的按鈕, 不使用的按鈕要設定 active為 false
            let showFishBtn = true; // 測試各種魚
            let showNextStageBtn = true; // 測試關卡切換

            let testBtn = this.node.parent.getChildByName("testBtn");

            if (showFishBtn) {
                let btnNode = testBtn.getChildByName("fishBtn");
                let inputNode = testBtn.getChildByName("fishInput");

                btnNode.active = true;
                inputNode.active = true;

                let self = this;
                btnNode.on(cc.Node.EventType.TOUCH_START, function () {
                    let name = inputNode.getComponent(cc.EditBox).string;
                    let obj = SettingManager.getRandomPath();
                    self.AddFish(new FishPath(name, 1, 1, 1, obj.pathArr, obj.speedOfPoint));
                }, this);
            }

            if (showNextStageBtn) {
                let nextStageNode = testBtn.getChildByName("nextStage");

                nextStageNode.active = true;

                let self = this;
                nextStageNode.on(cc.Node.EventType.TOUCH_START, function () {
                    self.nextStage();
                }, this);
            }
        }
    }

    public onEnable() {
        this.stage = 0;
    }

    public onDisable() {

    }

    /**
     * 設定初始關卡為1
     */
    public initStage(changeStageHandler: ChangeStageHandler) {
        this.changeStageHandler = changeStageHandler;

        this.nextStage();
    }

    public AddBullet(
        roomLevel: number,
        tower: Tower,
        location: cc.Vec2,
        rotataion: number) {
        // let name = 'bullet';
        // let prefab = ResourcesManager.prefabMap.get(name);
        // if (!prefab) {
        //     cc.log("error: prefab not found name:" + name);
        //     return;
        // }
        // let node = cc.instantiate(prefab);
        // node.name = name;
        // node.setPosition(2000, 2000); 
        // this.node.addChild(node);
    }

    /**
     * 外部如果要使用只能用在測試
     */
    private nextStage() {
        let oldStage = this.stage;
        let newStage = oldStage + 1;
        {
            let arr = SettingManager.getGameLevel();
            let maxStage = arr[0];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] > maxStage) {
                    maxStage = arr[i];
                }
            }
            if (newStage > maxStage) {
                newStage = 1;
            }
        }

        this.stage = newStage

        this.changeStageHandler(oldStage, newStage);
    }

    /**
     * 外部如果要使用只能用在測試
     * example: fish_1
     */
    private AddFish(fishPath: FishPath) {
        let name: string = fishPath.getName();
        let scale: number = fishPath.getScale();

        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found, name:" + name);
            return;
        }

        let node = cc.instantiate(prefab);
        node.name = name;
        node.scale = scale;
        let fish = node.addComponent(Fish);
        fish.init(fishPath);
        fish.startFish();

        this.node.addChild(node);
    }

    /**
     * 開始計時新關卡
     */
    public startFish() {
        let self = this;

        // 預先設定幾秒後切換關卡
        let stageDelay = SettingManager.getGameDelayByGameLevel(this.stage);
        this.scheduleOnce(function () {
            self.nextStage();
        }, stageDelay);

        // 預先設定好每一種魚要在什麼時間出現
        let fishArr = SettingManager.getFishPathArr(this.stage);
        for (let i = 0; i < fishArr.length; i++) {
            let fishPath = fishArr[i];

            let handler = function (fishPath: FishPath) {
                self.scheduleOnce(function () {
                    self.AddFish(fishPath);
                }, fishPath.getDelay());
            }

            handler(fishPath);
        }
    }

    /**
     * 要求所有目前在畫面上的魚在2.22秒內離場, 
     * 並且還未出現的魚不在進場
     */
    public clearFish() {
        this.unscheduleAllCallbacks();    // 停止增加魚

        // 將目前畫面上全部的魚都加速離開
        let lenght = this.node.children.length
        for (let i = 0; i < lenght; i++) {
            let fish = this.node.children[i].getComponent(Fish);
            if (!fish) {
                continue;
            }
            fish.clearFish();
        }
    }
}