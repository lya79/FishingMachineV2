import { ESkill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";
import { SettingManager, FishPath } from "../common/setting";
import { Bullet } from "./bullet"
// import { Fish } from "./fish";
import { Fish } from "./fishV2";
import { EWallet, EWalletResultAction, User } from "../common/user";

export type ChangeStageHandler = (oldStage: number, newStage: number) => void;

export class Collision extends cc.Component {

    public init() {
    }

    public onLoad() {
    }

    public onEnable() {
    }

    public onDisable() {
        this.unscheduleAllCallbacks();
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
        node.scale = scale;
        let fish = node.addComponent(Fish);
        fish.init(fishPath, name);
        
        this.node.addChild(node);

        fish.startFish();
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

        this.node.addChild(node);

        let bullet = node.addComponent(Bullet);
        bullet.init(roomLevel, tower, location, rotataion);
        bullet.startBullet();
    }
}