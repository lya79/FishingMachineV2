import { ESkill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";
import { SettingManager, FishPath } from "../common/setting";
import { Bullet } from "./bullet"
// import { Fish } from "./fish";
import { Fish } from "./fish";
import { EWallet, EWalletResultAction, User } from "../common/user";
import { EAction as EAudioAction, AudioManager } from "../common/audio";

export class Collision extends cc.Component {
    public init() { }

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

    private bgMusic(stage: number): string {
        switch (stage) {
            case 1:
                return `BG_Leave_01`;
            case 2:
                return `BG_Leave_02`;
            case 3:
                return `BG_Leave_03`;
            default:
                cc.log("error: 無效的遊戲關卡:" + stage);
                return `BG_Leave_01`;
        }
    }

    /**
     * 外部如果要使用只能用在測試
     * example: fish_1
     */
    public AddFish(fishPath: FishPath) {
        if (fishPath.getName() == "fish_22") {
            AudioManager.operator(EAudioAction.Pause, false, this.bgMusic(User.getGameState()));
            AudioManager.play("BG_FortuneGod", true, true);
        } else if (fishPath.getName() == "fish_23") {
            AudioManager.operator(EAudioAction.Pause, false, this.bgMusic(User.getGameState()));
            AudioManager.play("BG_Boss", true, true);
        }

        if (fishPath.getNotice()) {// 特殊魚進場前會通知
            let name = fishPath.getNotice();
            let prefab = ResourcesManager.prefabMap.get(name);
            if (!prefab) {
                cc.log("error: prefab not found name:" + name);
                return;
            }

            let effectNode = cc.instantiate(prefab);
            effectNode.name = name;
            effectNode.setPosition(0, 0);

            this.node.addChild(effectNode);

            cc.tween(effectNode)
                .delay(3)
                .call(() => {
                    effectNode.destroy();
                })
                .start();
        }

        let fishNode: cc.Node;
        {
            let name: string = fishPath.getName();
            let scale: number = fishPath.getScale();

            let prefab = ResourcesManager.prefabMap.get(name);
            if (!prefab) {
                cc.log("error: prefab not found, name:" + name);
                return;
            }

            fishNode = cc.instantiate(prefab);
            fishNode.name = name;
            let fish = fishNode.addComponent(Fish);
            fish.init(fishPath, name, scale);

            if (fishPath.getName() != "fish_23") {
                this.node.addChild(fishNode);
                return;
            }
        }

        let name = "boss_in"; // 神龍進場動畫
        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found name:" + name);
            return;
        }

        let effectNode = cc.instantiate(prefab);
        effectNode.name = name;
        effectNode.setPosition(0, 0);

        let self = this;
        cc.tween(effectNode)
            .delay(3)
            .call(() => {
                this.node.addChild(effectNode);
            })
            .delay(2)
            .call(() => {
                fishNode.opacity = 0;
                self.node.addChild(fishNode);
                cc.tween(fishNode).to(0.5, { opacity: 255 }).start();

                effectNode.destroy();
            })
            .start();
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

        let uuid = User.getFocusUUID();
        if (uuid) {
            bullet.setFocusUUID(uuid);
        }

        this.node.addChild(node);
    }
}