import { ESkill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";
import { SettingManager, FishPath } from "../common/setting";
import { Bullet } from "./bullet"
// import { Fish } from "./fish";
import { Fish } from "./fish";
import { EWallet, EWalletResultAction, User } from "../common/user";

export type ChangeStageHandler = (oldStage: number, newStage: number) => void;

export class Collision extends cc.Component {

    public init() {
    }

    public onLoad() {
    }

    public onEnable() {
        // let self = this;
        // this.schedule(function () {
        //     cc.log("count: " + self.getAllFishNode().length);
        // }, 0.01);
    }

    public onDisable() {
        this.unscheduleAllCallbacks();
    }

    /**
     * 找出目前還活著的魚
     * 而且顯示在畫面上(部分魚因為路線關係會超出邊界還活著)
     */
    public getAllFishNode(): cc.Node[] {
        let arr: cc.Node[] = [];
        let length = this.node.children.length;
        for (let i = 0; i < length; i++) {
            let node = this.node.children[i];
            if (!cc.isValid(node)) {
                continue;
            }

            let fish = node.getComponent(Fish);
            if (!fish) {
                continue;
            }

            if (fish.isLockState()) {
                continue;
            }

            if (!fish.isInCanvas()) {
                continue;
            }

            arr.push(node);
        }
        return arr;
    }

    /**
     * 開始計時新關卡
     */
    public startFish() {
        let self = this;

        // 預先設定好每一種魚要在什麼時間出現
        let fishArr = SettingManager.getFishPathArr(User.getGameState());
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
        this.unscheduleAllCallbacks(); // 停止增加魚

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

    /**
     * 外部如果要使用只能用在測試
     * example: fish_1
     */
    public AddFish(fishPath: FishPath) {
        let name: string = fishPath.getName();
        let scale: number = fishPath.getScale();

        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found, name:" + name);
            return;
        }

        let node = cc.instantiate(prefab);
        node.name = name;
        let fish = node.addComponent(Fish);
        fish.init(fishPath, name, scale);

        this.node.addChild(node);
    }

    /**
     * 畫面加入子彈
     */
    public AddBullet(
        roomLevel: number,
        tower: Tower,
        location: cc.Vec2,
        rotataion: number) {

        let name = 'bullet';
        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found name:" + name);
            return;
        }

        let node = cc.instantiate(prefab);
        node.name = name;
        node.setPosition(2000, 2000);

        let bullet = node.addComponent(Bullet);
        bullet.init(roomLevel, tower, location, rotataion);

        this.node.addChild(node);
    }
}