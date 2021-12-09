
import { EWallet, EWalletResultAction, User } from "../common/user";
import { EAction as EAudioAction, AudioManager } from "../common/audio";
import { SettingManager, FishPath, Collision as CollisionObj, ESkill, Tower as SettingTower } from "../common/setting";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { Tower } from "./tower";
import { Collision } from "./collision";
import { Background } from "./background";
import { ResourcesManager } from "../common/resource";
import { Bullet } from "./bullet";
import { Fish } from "./fish";
import { Info1 } from "./info1";
import { Info2 } from "./info2";
import { Bullet0402 } from "./bullet0402";

const { ccclass, property } = cc._decorator;

// FIXME 有瞄準魚的情況下, 如果點擊畫面空白處需要取消瞄準
@ccclass
export class Game extends cc.Component {
    private lobbyHandler: Function;

    private lobbyNode: cc.Node;

    private infoBtnNode: cc.Node;

    private muteOnNode: cc.Node;
    private muteOffNode: cc.Node;

    private plusBetNode: cc.Node;
    private minusBetNode: cc.Node;
    private betValueNode: cc.Node;

    private walletValueNode: cc.Node;

    private focusOnNode: cc.Node;
    private focusOffNode: cc.Node;

    private autoOnNode: cc.Node;
    private autoOffNode: cc.Node;

    private towerNode: cc.Node;
    private originLocationOfTower: cc.Vec2; // 暫存砲塔預設位置
    private locationOfFire: cc.Vec2; // 砲塔發射時預計要退後的位置
    private distance = 15;// 砲塔發射子彈時預計要後退的距離

    private crosshairDefNode: cc.Node;

    private collisionNode: cc.Node;

    private bgNode: cc.Node;

    private info1Node: cc.Node;
    private info2Node: cc.Node;

    public init(lobbyHandler: Function): boolean {
        this.lobbyHandler = lobbyHandler;
        if (!this.lobbyHandler) {
            cc.log('error: handler is null');
            return false;
        }
        return true;
    }

    public onLoad() {
        if (SettingManager.addFish) {
            let testBtn = this.node.getChildByName("testBtn");
            let btnNode = testBtn.getChildByName("fishBtn");
            let inputNode = testBtn.getChildByName("fishInput");

            btnNode.active = true;
            inputNode.active = true;

            let self = this;
            btnNode.on(cc.Node.EventType.TOUCH_START, function () {
                {
                    let name = inputNode.getComponent(cc.EditBox).string;
                    let obj = SettingManager.getRandomPath();
                    let notice;
                    if (name == "fish_22") {
                        notice = "notice_in_fish_22";
                    } else if (name == "fish_23") {
                        obj = SettingManager.getRandomPathForFish23();
                        notice = "notice_in_fish_23";
                    }
                    let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj, notice);
                    self.collisionNode.getComponent(Collision).AddFish(fishPath);
                }

                // {
                //     let name = "fish_2";
                //     let obj = SettingManager.getRandomPath();
                //     let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj);
                //     self.collisionNode.getComponent(Collision).AddFish(fishPath);
                // }
                // {
                //     let name = "fish_13";
                //     let obj = SettingManager.getRandomPath();
                //     let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj);
                //     self.collisionNode.getComponent(Collision).AddFish(fishPath);
                // }
                // {
                //     let name = "fish_19";
                //     let obj = SettingManager.getRandomPath();
                //     let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj);
                //     self.collisionNode.getComponent(Collision).AddFish(fishPath);
                // }
            }, this);
        }

        if (SettingManager.changeGameStage) {
            let testBtn = this.node.getChildByName("testBtn");
            let nextStageNode = testBtn.getChildByName("nextStage");

            nextStageNode.active = true;

            let self = this;
            nextStageNode.on(cc.Node.EventType.TOUCH_START, function () {
                self.nextGameState();
            }, this);
        }

        this.info1Node = this.node.getChildByName("info1");
        if (!this.info1Node) {
            cc.log('error: info1Node is null');
            return;
        }

        this.info1Node.addComponent(Info1);
        this.info1Node.active = true; // 只出現一次, 因此寫在 onload

        this.info2Node = this.node.getChildByName("info2");
        if (!this.info2Node) {
            cc.log('error: info2Node is null');
            return;
        }

        this.info2Node.addComponent(Info2);

        this.bgNode = this.node.getChildByName("bg");
        if (!this.bgNode) {
            cc.log('error: bgNode is null');
            return;
        }

        let btnNode = this.node.getChildByName("btn");
        if (!btnNode) {
            cc.log('error: btnNode is null');
            return;
        }

        this.lobbyNode = btnNode.getChildByName("lobby");
        if (!this.lobbyNode) {
            cc.log('error: lobbyNode is null');
            return;
        }

        this.infoBtnNode = btnNode.getChildByName("info");
        if (!this.infoBtnNode) {
            cc.log('error: infoBtnNode is null');
            return;
        }

        this.collisionNode = this.node.getChildByName("collision");
        if (!this.collisionNode) {
            cc.log('error: collisionNode is null');
            return;
        }

        {
            let crosshairNode = this.node.getChildByName("crosshair");
            if (!crosshairNode) {
                cc.log('error: crosshairNode is null');
                return;
            }

            this.crosshairDefNode = crosshairNode.getChildByName("default");
            if (!this.crosshairDefNode) {
                cc.log('error: crosshairDefNode is null');
                return;
            }
        }

        this.plusBetNode = btnNode.getChildByName("plusBet");
        if (!this.plusBetNode) {
            cc.log('error: plusBetNode is null');
            return;
        }

        this.minusBetNode = btnNode.getChildByName("minusBet");
        if (!this.minusBetNode) {
            cc.log('error: minusBetNode is null');
            return;
        }

        this.betValueNode = btnNode.getChildByName("bet").getChildByName("value");
        if (!this.betValueNode) {
            cc.log('error: betValueNode is null');
            return;
        }

        this.walletValueNode = this.node.getChildByName("wallet").getChildByName("value");
        if (!this.walletValueNode) {
            cc.log('error: walletValueNode is null');
            return;
        }

        {
            let muteNode = btnNode.getChildByName("sound");
            if (!btnNode) {
                cc.log('error: muteNode is null');
                return;
            }

            this.muteOnNode = muteNode.getChildByName("on");
            if (!this.muteOnNode) {
                cc.log('error: muteOnNode is null');
                return;
            }

            this.muteOffNode = muteNode.getChildByName("off");
            if (!this.muteOffNode) {
                cc.log('error: muteOffNode is null');
                return;
            }
        }

        {
            let focusNode = btnNode.getChildByName("focus");
            if (!btnNode) {
                cc.log('error: focusNode is null');
                return;
            }

            this.focusOnNode = focusNode.getChildByName("on");
            if (!this.focusOnNode) {
                cc.log('error: focusOnNode is null');
                return;
            }

            this.focusOffNode = focusNode.getChildByName("off");
            if (!this.focusOffNode) {
                cc.log('error: focusOffNode is null');
                return;
            }
        }

        {
            let autoNode = btnNode.getChildByName("auto");
            if (!btnNode) {
                cc.log('error: autoNode is null');
                return;
            }

            this.autoOnNode = autoNode.getChildByName("on");
            if (!this.autoOnNode) {
                cc.log('error: autoOnNode is null');
                return;
            }

            this.autoOffNode = autoNode.getChildByName("off");
            if (!this.autoOffNode) {
                cc.log('error: autoOffNode is null');
                return;
            }
        }

        this.towerNode = this.node.getChildByName("tower");
        if (!this.towerNode) {
            cc.log('error: towerNode is null');
            return;
        }

        this.bgNode.addComponent(Background);
        this.towerNode.addComponent(Tower);
        this.collisionNode.addComponent(Collision);

        this.originLocationOfTower = this.towerNode.getPosition(); // 暫存砲塔初始位置
    }

    public onEnable() {
        User.setGameState(0); // 初始化遊戲關卡
        User.setTowerIndex(0); // 初始化砲塔為最小級
        User.setTowerMode(0);

        this.updateWalletValue();
        this.updateBetValue();
        this.updateMuteBtn();
        this.initCrosshairNode();
        this.updateTowerMode();
        this.setTowerLevel(SettingManager.getTowerByRoomLevel(User.getRoomLevel())[User.getTowerIndex()].getLevel());
        this.updateRotationOfTower(0, new cc.Vec2(this.originLocationOfTower.x, this.originLocationOfTower.y - this.distance));


        this.schedule(this.collisionHandler, 0.05);

        {
            let self = this;
            let startFishHandler = function () {
                self.lobbyNode.active = true;
                self.collisionNode.getComponent(Collision).startFish();
            };
            let clearFishHandler = function () {
                self.lobbyNode.active = false;
                self.collisionNode.getComponent(Collision).clearFish();
            };

            this.bgNode.getComponent(Background).init(startFishHandler, clearFishHandler);
            this.towerNode.getComponent(Tower).init();
            this.collisionNode.getComponent(Collision).init();

            // this.schedule(function () {// XXX 用來確認是否有 node沒釋放, 導致 node無限增長
            //     cc.log("count: " + self.collisionNode.childrenCount);
            // }, 0.01);
        }

        {// 初始化關卡切換排程
            User.setGameState(0);
            this.nextGameState();

            let tmp = 0; // 計時
            let self = this;
            let tmpOldUUID: string;
            this.schedule(function (dt) {
                if (SettingManager.isFireSkill0402()) {
                    return;
                }

                if (!SettingManager.isFireSkill0402()) { // 切換關卡
                    tmp += dt;
                    let delay = SettingManager.getGameDelayByGameStage(User.getGameState());
                    if (tmp >= delay) {
                        tmp = 0;
                        self.nextGameState();
                    }
                }

                { // 判斷 focus
                    let isFocus = function (uuid: string): boolean {
                        if (User.getTowerMode() != 2) {
                            return false;
                        }

                        if (!uuid) {
                            return false;
                        }

                        let fishNode = self.collisionNode.getChildByUuid(uuid);
                        if (!fishNode || !cc.isValid(fishNode)) {
                            return false;
                        }

                        let fish = fishNode.getComponent(Fish);
                        if (!fish || fish.isLockState()) {
                            return false;
                        }

                        return true;
                    }

                    if (tmpOldUUID) {
                        let fishNode = self.collisionNode.getChildByUuid(tmpOldUUID);
                        if (fishNode && cc.isValid(fishNode)) {
                            let focus = fishNode.getChildByName("focus");
                            if (focus) {
                                focus.active = false;
                            }
                        }
                    }


                    let tmpNewUUID = User.getFocusUUID();

                    let touchFish = false;
                    if (tmpNewUUID != tmpOldUUID) {
                        touchFish = true;
                    }

                    if (!isFocus(tmpNewUUID)) {
                        if (User.getTowerMode() == 2) {
                            self.stopAutoFire();
                        }
                    } else {
                        if (tmpOldUUID) {
                            let fishNode = self.collisionNode.getChildByUuid(tmpOldUUID);
                            if (fishNode && cc.isValid(fishNode)) {
                                let focus = fishNode.getChildByName("focus");
                                if (focus) {
                                    focus.active = false;
                                }
                            }
                        }

                        let fishNode = self.collisionNode.getChildByUuid(tmpNewUUID);
                        let worldPosition = self.collisionNode.convertToWorldSpaceAR(fishNode.getPosition());

                        let focusNode = fishNode.getChildByName("focus");// 在魚的身上顯示 focus圖示
                        if (focusNode) {
                            focusNode.active = true;
                        } else {
                            let name = 'focus';
                            let prefab = ResourcesManager.prefabMap.get(name);
                            if (!prefab) {
                                cc.log("error: prefab not found name:" + name);
                                return;
                            }

                            let node = cc.instantiate(prefab);
                            node.name = name;
                            node.setPosition(0, 0);

                            fishNode.addChild(node);
                        }

                        // 砲塔追著魚轉動
                        self.updateTower(worldPosition, (touchFish ? "TOUCH_FISH" : "MOVE_FISH"));
                    }

                    tmpOldUUID = tmpNewUUID;
                }
            }, 0.01);
        }

        this.lobbyNode.on(cc.Node.EventType.TOUCH_START, this.backLobby, this);

        this.infoBtnNode.on(cc.Node.EventType.TOUCH_START, this.showInfo, this);

        this.muteOnNode.on(cc.Node.EventType.TOUCH_START, this.changeMute, this);
        this.muteOffNode.on(cc.Node.EventType.TOUCH_START, this.changeMute, this);

        this.plusBetNode.on(cc.Node.EventType.TOUCH_START, this.plusBet, this);
        this.minusBetNode.on(cc.Node.EventType.TOUCH_START, this.minusBet, this);

        this.focusOnNode.on(cc.Node.EventType.TOUCH_START, this.changeFocus, this);
        this.focusOffNode.on(cc.Node.EventType.TOUCH_START, this.changeFocus, this);

        this.autoOnNode.on(cc.Node.EventType.TOUCH_START, this.changeAuto, this);
        this.autoOffNode.on(cc.Node.EventType.TOUCH_START, this.changeAuto, this);

        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.updateMouseMove, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.updateMouseMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.updateMouseMove, this); // node內放開
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.updateMouseMove, this); // node外放開
    }

    public onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.updateMouseMove, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.updateMouseMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.updateMouseMove, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.updateMouseMove, this);

        this.focusOnNode.off(cc.Node.EventType.TOUCH_START, this.changeFocus, this);
        this.focusOffNode.off(cc.Node.EventType.TOUCH_START, this.changeFocus, this);

        this.autoOnNode.off(cc.Node.EventType.TOUCH_START, this.changeAuto, this);
        this.autoOffNode.off(cc.Node.EventType.TOUCH_START, this.changeAuto, this);

        this.plusBetNode.off(cc.Node.EventType.TOUCH_START, this.plusBet, this);
        this.minusBetNode.off(cc.Node.EventType.TOUCH_START, this.minusBet, this);

        this.muteOnNode.off(cc.Node.EventType.TOUCH_START, this.changeMute, this);
        this.muteOffNode.off(cc.Node.EventType.TOUCH_START, this.changeMute, this);

        this.lobbyNode.off(cc.Node.EventType.TOUCH_START, this.backLobby, this);

        this.infoBtnNode.off(cc.Node.EventType.TOUCH_START, this.showInfo, this);

    }

    private showInfo() {
        this.info2Node.active = true;
    }

    private nextGameState() {
        let oldStage = User.getGameState();
        let newStage = oldStage + 1;
        if (newStage > 3) {
            newStage = 1;
        }

        cc.log("切換道關卡:" + oldStage + " => " + newStage);

        User.setGameState(newStage);

        this.bgNode.getComponent(Background).changeStageHandler(oldStage, newStage);
    }

    private initCrosshairNode() {
        this.crosshairDefNode.active = false;
    }

    private plusBet(event) {
        if (SettingManager.isReadySkill0402()) {
            return;
        }

        AudioManager.play(`UI_Bet_Add`, true, false);
        this.changeBet(true);
    }

    private minusBet(event) {
        if (SettingManager.isReadySkill0402()) {
            return;
        }

        AudioManager.play(`UI_Bet_Less`, true, false);
        this.changeBet(false);
    }


    private changeBet(plus: boolean) {
        let roomLevel = User.getRoomLevel();
        let towerIndex = User.getTowerIndex();
        let towerLength = SettingManager.getTowerByRoomLevel(roomLevel).length;

        let newTowerIndex = towerIndex;

        if (plus) {
            newTowerIndex += 1;
            if (newTowerIndex >= towerLength) {
                newTowerIndex = 0;
            }
        } else {
            newTowerIndex -= 1;
            if (newTowerIndex < 0) {
                newTowerIndex = towerLength - 1;
            }
        }

        let oldTowerLevel = SettingManager.getTowerByRoomLevel(roomLevel)[towerIndex].getLevel();
        let newTowerLevel = SettingManager.getTowerByRoomLevel(roomLevel)[newTowerIndex].getLevel();

        let changeTower = oldTowerLevel != newTowerLevel; // 換武器
        if (changeTower) {
            AudioManager.play(`UI_GunChange`, true, false);

            this.setTowerLevel(newTowerLevel);
        }

        User.setTowerIndex(newTowerIndex);

        this.updateBetValue();
    }

    private setTowerLevel(level: number) {
        this.towerNode.getComponent(Tower).setLevel(level);
    }

    /**
     * 更新 bet數值
     */
    private updateBetValue() {
        let label = this.betValueNode.getComponent(cc.Label);
        if (!label) {
            cc.log("error: cc.Label not found");
            return false;
        }

        let roomLevel = User.getRoomLevel();
        let towerIndex = User.getTowerIndex();
        let tower = SettingManager.getTowerByRoomLevel(roomLevel)[towerIndex];
        let bet = Mul(tower.getBet().toString(), tower.getBase().toString());
        label.string = bet.toString();
    }

    /**
     * 更新錢包餘額
     */
    private updateWalletValue(value?: number) {
        if (value && value > 0) {
            let result = User.operatorWallet(EWallet.Deposit, value.toString());
            if (result.result != EWalletResultAction.Success) {
                cc.log('error: 返獎到玩家錢包失敗, result:' + result.result.toString());
                return false;
            }
        }

        let result = User.operatorWallet(EWallet.Query, null);
        if (result.result != EWalletResultAction.Success) {
            cc.log('error: 玩家錢包初始化失敗, result:' + result.result.toString());
            return;
        }

        let label = this.walletValueNode.getComponent(cc.Label);
        if (!label) {
            cc.log("error: cc.Label not found");
            return false;
        }

        label.string = result.newValue;
    }

    private backLobby(event) {
        if (SettingManager.isReadySkill0402()) {
            return;
        }

        AudioManager.play(`UI_Menu_Click`, true, false);

        this.unscheduleAllCallbacks();

        let length = this.collisionNode.children.length;
        for (let i = 0; i < length; i++) {
            let node: cc.Node = this.collisionNode.children[i];

            let bullet = node.getComponent(Bullet);
            if (bullet) {
                if (bullet.isLock()) {
                    continue;
                }

                let tower = bullet.getTower();
                let bet = Mul(tower.getBet().toString(), tower.getBase().toString());

                User.operatorWallet(EWallet.Deposit, bet);
                cc.log("返還押注:" + bet);
            }

            node.cleanup();
            node.destroy();
        }

        this.lobbyHandler();
    }

    private changeMute() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        if (this.isMute()) {
            AudioManager.unmute(true);
            AudioManager.unmute(false);
        } else {
            AudioManager.setVolume(true, 0.0);
            AudioManager.setVolume(false, 0.0);
        }

        this.updateMuteBtn();
    }

    private updateMuteBtn() {
        cc.log("靜音: " + this.isMute());

        let mute = this.isMute();
        this.muteOnNode.active = !mute;
        this.muteOffNode.active = mute;
    }

    private isMute(): boolean {
        return AudioManager.isMute(true) && AudioManager.isMute(false);
    }

    private startAutoFire() {
        this.schedule(this.fire, 0.2, cc.macro.REPEAT_FOREVER, 0.3); // 設定的時間要大於 fire func執行的時間
    }

    private stopAutoFire() {
        this.unschedule(this.fire);
    }

    private changeAuto() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        this.stopAutoFire();

        if (User.getTowerMode() == 1) {
            User.setTowerMode(0);
        } else if (User.getTowerMode() != 1) {
            User.setTowerMode(1);
        }

        this.updateTowerMode();
    }

    private changeFocus() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        this.stopAutoFire();

        if (User.getTowerMode() == 2) {
            User.setTowerMode(0);
        } else if (User.getTowerMode() != 2) {
            User.setTowerMode(2);
        }

        this.updateTowerMode();
    }

    private updateTowerMode() {
        this.autoOffNode.active = false;
        this.autoOnNode.active = false;

        this.focusOffNode.active = false;
        this.focusOnNode.active = false;

        this.crosshairDefNode.active = false;

        User.setFocusUUID(null);

        switch (User.getTowerMode()) {// 砲塔模式, 0:預設, 1:自動, 2:瞄準
            case 0:
                this.focusOffNode.active = true;
                this.autoOffNode.active = true;
                break;
            case 1:
                this.focusOffNode.active = true;
                this.autoOnNode.active = true;
                break;
            case 2:
                this.focusOnNode.active = true;
                this.autoOffNode.active = true;
                break;
        }
    }

    public updateMouseMove(event: cc.Event.EventTouch) {
        if (SettingManager.isFireSkill0402()) {
            return;
        }

        this.updateTower(event.getLocation(), event.getType());
    }

    public updateTower(location: cc.Vec2, eventType: string) {
        let locationOfTouch = this.node.convertToNodeSpaceAR(location); // 將點擊的位置由世界座標轉換成 this.node裡面的相對座標

        if (eventType == cc.Node.EventType.TOUCH_START && !this.isCrosshairArea(locationOfTouch)) {
            return;
        }

        if (User.getTowerMode() == 2) { // 瞄準射擊
            if (eventType == "TOUCH_FISH") {
                let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
                this.updateRotationOfTower(obj.rotation, obj.backLocation);

                this.stopAutoFire();
                this.startAutoFire();
            } else if (eventType == "MOVE_FISH") {
                let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
                this.updateRotationOfTower(obj.rotation, obj.backLocation);
            }

            return;
        }

        if (User.getTowerMode() == 1) { // 自動射擊
            if (eventType == cc.Node.EventType.TOUCH_START) {
                let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
                this.updateRotationOfTower(obj.rotation, obj.backLocation);

                this.crosshairDefNode.setPosition(locationOfTouch);
                this.crosshairDefNode.active = true;

                this.stopAutoFire();
                this.startAutoFire();
            }

            return;
        }

        if (User.getTowerMode() == 0) { // 手動射擊
            switch (eventType) {
                case cc.Node.EventType.TOUCH_MOVE:
                case cc.Node.EventType.TOUCH_START:
                    this.crosshairDefNode.active = true;
                    break;
                case cc.Node.EventType.TOUCH_END:// node內放開
                case cc.Node.EventType.TOUCH_CANCEL:// node外放開
                    this.crosshairDefNode.active = false;
                    break;
                default:
                    break;
            }

            let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
            this.updateRotationOfTower(obj.rotation, obj.backLocation);

            this.crosshairDefNode.setPosition(locationOfTouch);

            if (eventType == cc.Node.EventType.TOUCH_START) {
                this.fire();
                this.stopAutoFire();
                this.startAutoFire();
            } else if (eventType == cc.Node.EventType.TOUCH_END || eventType == cc.Node.EventType.TOUCH_CANCEL) {
                this.stopAutoFire();
            }

            return;
        }
    }

    private updateRotationOfTower(rotation: number, locationOfFire: cc.Vec2) {
        this.towerNode.rotation = rotation;
        this.locationOfFire = locationOfFire;
    }

    private fire() {
        if (SettingManager.isReadySkill0402()) {
            return;
        }

        // 扣款並且檢查是否有足夠的餘額
        let roomLevel = User.getRoomLevel();
        let towerIndex = User.getTowerIndex();
        let tower = SettingManager.getTowerByRoomLevel(roomLevel)[towerIndex];
        let bet = (Mul(tower.getBet().toString(), tower.getBase().toString())).toString();

        let result = User.operatorWallet(EWallet.Pay, bet);

        this.updateWalletValue();

        if (result.result != EWalletResultAction.Success) {
            cc.log(`玩家錢包扣款失敗, 錯誤類型:${result.result}, 壓注:${bet}, 餘額:${result.oldValue}`);
            return;
        }


        // 產生子彈並且發射子彈
        this.collisionNode.getComponent(Collision).AddBullet(
            roomLevel,
            tower,
            this.originLocationOfTower, // 使用砲塔原始位置作為基準點
            this.towerNode.rotation, // 砲塔目前旋轉角度
        );

        let time1 = 0.03;
        let time2 = 0.07;
        { // 播放發射動畫
            let location: cc.Vec2 = this.locationOfFire;

            let tower = this.towerNode.getComponent(Tower);

            AudioManager.play(tower.getAudioOfFire(), true, false);

            let fireNode = tower.getFireNode();
            cc.tween(fireNode)
                .to(time1, { opacity: 255 })
                .to(time2, { opacity: 0 })
                .start();

            cc.tween(this.towerNode)
                .to(time1, { position: location })
                .to(time2, { position: this.originLocationOfTower })
                .start();
        }
    }

    /**
     * 更新砲塔旋轉角度
     * 依據玩家點擊的位置
     */
    private calculatorRotation(locationOfTouch: cc.Vec2, locationOfTower: cc.Vec2): { rotation: number, backLocation: cc.Vec2 } {
        let x = locationOfTouch.x;
        let y = locationOfTouch.y;

        let px = locationOfTower.x;
        let py = locationOfTower.y;

        let pointA = new cc.Vec2(px, py); // 砲塔位置
        let pointB = new cc.Vec2(x, y); // 滑鼠位置
        let pointC = new cc.Vec2(px, y); // 基準點

        let newRotation = this.getAngle(pointA, pointB, pointC); // 砲塔要旋轉的角度

        if (x < px) {
            newRotation *= -1;
        }

        if (pointA.y > pointC.y) {
            if (x < px) {
                newRotation = -180 - newRotation;
            } else if (x > px) {
                newRotation = 180 - newRotation;
            }
        }

        let backLocation: cc.Vec2;
        {// 發射時候砲塔後退的座標點
            let r = Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2));

            let x = (this.distance * (pointB.x - pointA.x)) / r + pointA.x;
            let y = (this.distance * (pointB.y - pointA.y)) / r + pointA.y;

            let dx = x - pointA.x;
            let dy = y - pointA.y;

            backLocation = new cc.Vec2(pointA.x - dx, pointA.y - dy);
        }

        return { rotation: newRotation, backLocation: backLocation };
    }

    private getAngle(A: cc.Vec2, B: cc.Vec2, C: cc.Vec2) {
        let AB = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
        let AC = Math.sqrt(Math.pow(A.x - C.x, 2) + Math.pow(A.y - C.y, 2));
        let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        let cosA = (
            Math.pow(AB, 2) + Math.pow(AC, 2) - Math.pow(BC, 2)
        ) / (
                2 * AB * AC
            );
        let angleA = Math.round(Math.acos(cosA) * 180 / Math.PI);
        return angleA;
    }

    private isCrosshairArea(location: cc.Vec2): boolean { // XXX 需要改善作法避免手動設定觸碰範圍
        let x = location.x;
        let y = location.y;

        if (x < -73 && y > 330) { // 左上角按鈕區塊
            return false;
        }

        if (x > 170 && y > 235) { // 右上角按鈕區塊
            return false;
        }

        if (x > 32 && y < -271) { // 右下角砲塔區塊
            return false;
        }

        if (y < -390) { // 底部錢包區塊
            return false;
        }

        return true;
    }

    private getDistance(a: cc.Vec2, b: cc.Vec2): number {
        let x = a.x - b.x;
        let y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    }

    private collisionHandler(dt) {
        let collisionArrlength = SettingManager.collisionArr.length;
        if (collisionArrlength <= 0) {
            return;
        }

        let self = this;

        class Attacked {
            fishNode: cc.Node;

            normal: boolean;
            skillArr: ESkill[];

            durationTime: number;
            pauseMoveTime: number;
            pauseSelfActionTime: number;

            constructor() {
                this.normal = false;
                this.skillArr = [];
                this.durationTime = 0;
                this.pauseMoveTime = 0;
                this.pauseSelfActionTime = 0;
            }
        }

        for (let i = 0; i < collisionArrlength; i++) {
            let collision = SettingManager.collisionArr.shift();

            { // 檢查魚是否已經失效
                let fishNode = collision.fishCollider.parent;
                if (!cc.isValid(fishNode)) {
                    continue;
                }

                let fish = fishNode.getComponent(Fish);
                if (!fish) {
                    continue;
                }

                if (fish.isLockState()) {
                    continue;
                }
            }

            let bet: number; // 押注
            {
                let bulletNode = collision.bulletCollider;
                let bullet0402 = bulletNode.getComponent(Bullet0402);
                if (bullet0402 && cc.isValid(bullet0402)) {
                    bet = bullet0402.getTower().getBet() * bullet0402.getTower().getBase();
                } else {
                    let bulletNode = collision.bulletCollider.parent;
                    let bullet = bulletNode.getComponent(Bullet);

                    if (!cc.isValid((bulletNode) || bullet.isLock())) {
                        continue;// 子彈已經碰撞過避免多次碰撞
                    }

                    { // 檢查子彈瞄準的目標
                        let focusUUID = bullet.getFocusUUID();
                        if (focusUUID) {
                            let exist = false;
                            let allFishNodeArr = self.collisionNode.getComponent(Collision).getAllFishNode();// 目前還活著而且顯示在畫面上的全部魚
                            for (let i = 0; i < allFishNodeArr.length; i++) {
                                if (allFishNodeArr[i].uuid == focusUUID) {
                                    exist = true;
                                    break;
                                }
                            }
                            if (exist) {
                                if (collision.fishCollider.parent.uuid != focusUUID) {
                                    continue; // 瞄準的魚還活著因此略過其他魚
                                }
                            }
                        }
                    }

                    bet = bullet.getTower().getBet() * bullet.getTower().getBase();

                    bullet.attack(0.8); // 播放子彈碰撞的動畫
                }
            }

            let attackedArr: Attacked[] = [];// 需要被技能攻擊的魚

            let fishNode = collision.fishCollider.parent;
            let fish = fishNode.getComponent(Fish);

            let normalBullet = true;
            {
                let bulletNode = collision.bulletCollider;
                let bullet0402 = bulletNode.getComponent(Bullet0402);
                if (bullet0402) {
                    normalBullet = false;

                    let attacked = new Attacked();
                    attackedArr.push(attacked);
                    attacked.fishNode = fishNode;
                    attacked.normal = false;
                    attacked.skillArr.push(ESkill.Level_4_2);
                    attacked.durationTime = 3;
                    attacked.pauseMoveTime = 0;
                    attacked.pauseSelfActionTime = 0;
                }
            }

            if (normalBullet) { // 播放動畫
                let bulletNode = collision.bulletCollider.parent;
                let bullet = bulletNode.getComponent(Bullet);
                let tower = bullet.getTower();

                {
                    let attacked = new Attacked();
                    attackedArr.push(attacked);
                    attacked.fishNode = fishNode;
                    attacked.normal = true;
                }

                for (let i = 0; i < tower.getSkillArr().length; i++) {
                    let skill = tower.getSkillArr()[i];
                    let skillInfo = SettingManager.getSkillInfo(
                        fish.getFishName(),
                        skill,
                        tower.getLevel(),
                        tower.getBase(),
                        tower.getBet(),
                    );

                    if (!SettingManager.isActive(skillInfo.probability)) {// 是否發動技能
                        continue;
                    }

                    if (skill == ESkill.Level_4_2) {
                        let sleep = skillInfo.durationTime * 1000;
                        let success = SettingManager.lockReadySkill0402(sleep); // XXX level4大砲技能發射時避免重複發射
                        if (!success) {
                            continue;
                        }

                        let skillArr = [...tower.getSkillArr()];
                        let tmpTower = new SettingTower(
                            tower.getLevel(),
                            tower.getBet(),
                            tower.getBase(),
                            skillArr,
                        );

                        this.activeSkill03And0402(tmpTower, skillInfo.durationTime);
                        continue;
                    }


                    let count = getRandomInt(skillInfo.min, skillInfo.max); // 技能攻擊的數量(不包含被普通攻擊的魚)
                    let allFishNodeArr = self.collisionNode.getComponent(Collision).getAllFishNode();// 目前還活著而且顯示在畫面上的全部魚
                    for (let i = 0; i < allFishNodeArr.length; i++) {
                        let targetFishNode = allFishNodeArr[i];
                        if (targetFishNode.uuid == fishNode.uuid) {
                            continue;
                        }

                        if (count <= 0) {
                            break;
                        }

                        count -= 1;

                        let attacked = new Attacked();
                        attackedArr.push(attacked);
                        attacked.fishNode = targetFishNode;
                        attacked.normal = false;
                    }

                    if (skill == ESkill.Level_2) {
                        AudioManager.play(`UI_Skin_Freezing`, true, false);
                        for (let k = 0; k < attackedArr.length; k++) {
                            let attacked = attackedArr[k];

                            if (attacked.fishNode.name == "fish_22" || attacked.fishNode.name == "fish_23") {
                                continue; // 特殊魚免疫冰凍技能
                            }

                            self.activeSkill02(attacked.fishNode, skillInfo.durationTime);

                            let exist = false;
                            for (let j = 0; j < attacked.skillArr.length; j++) {
                                if (attacked.skillArr[j] == skill) {
                                    exist = true;
                                    break;
                                }
                            }
                            if (!exist) {
                                attacked.skillArr.push(skill);
                            }

                            if (skillInfo.durationTime > attacked.durationTime) {
                                attacked.durationTime = skillInfo.durationTime;
                            }

                            if (skillInfo.pauseMoveTime > attacked.pauseMoveTime) {
                                attacked.pauseMoveTime = skillInfo.pauseMoveTime;
                            }

                            if (skillInfo.pauseSelfActionTime > attacked.pauseSelfActionTime) {
                                attacked.pauseSelfActionTime = skillInfo.pauseSelfActionTime;
                            }
                        }
                    } else if (skill == ESkill.Level_3 || skill == ESkill.Level_4_1) {
                        if (skill == ESkill.Level_3) {
                            AudioManager.play(`UI_Skin_Lightning`, true, false);
                        }
                        for (let k = 0; k < attackedArr.length; k++) {
                            let attacked = attackedArr[k];
                            let first = k == 0;
                            let prevFishNode: cc.Node = attacked.fishNode;
                            let nextFishNode: cc.Node = null;
                            if (k + 1 < attackedArr.length) {
                                nextFishNode = attackedArr[k + 1].fishNode;
                            }

                            self.activeSkill03And0401(
                                skill,
                                first,
                                prevFishNode,
                                nextFishNode,
                                skillInfo.durationTime,
                                SettingManager.getFishInfo(fish.getFishName()).size,
                            );

                            let exist = false;
                            for (let j = 0; j < attacked.skillArr.length; j++) {
                                if (attacked.skillArr[j] == skill) {
                                    exist = true;
                                    break;
                                }
                            }
                            if (!exist) {
                                attacked.skillArr.push(skill);
                            }

                            if (skillInfo.durationTime > attacked.durationTime) {
                                attacked.durationTime = skillInfo.durationTime;
                            }

                            if (skillInfo.pauseMoveTime > attacked.pauseMoveTime) {
                                attacked.pauseMoveTime = skillInfo.pauseMoveTime;
                            }

                            if (skillInfo.pauseSelfActionTime > attacked.pauseSelfActionTime) {
                                attacked.pauseSelfActionTime = skillInfo.pauseSelfActionTime;
                            }
                        }
                    }
                }
            }

            for (let i = 0; i < attackedArr.length; i++) {// 對魚進行技能攻擊和普通子彈攻擊
                let attacked = attackedArr[i];
                let fishNode = attacked.fishNode;
                let normal = attacked.normal;
                let skillArr = attacked.skillArr;
                let durationTime = attacked.durationTime;
                let pauseMoveTime = attacked.pauseMoveTime;
                let pauseSelfActionTime = attacked.pauseSelfActionTime;
                let fishInfo = SettingManager.getFishInfo(fishNode.getComponent(Fish).getFishName());
                let bulletNode = collision.bulletCollider.parent;
                let bullet = bulletNode.getComponent(Bullet);

                let tower: SettingTower;
                if (bullet) {
                    tower = bullet.getTower();
                } else {
                    let bulletNode = collision.bulletCollider;
                    let bullet0402 = bulletNode.getComponent(Bullet0402);
                    if (bullet0402) {
                        tower = bullet0402.getTower();
                    } else {
                        cc.log("error: 例外錯誤不應該發生");
                    }
                }

                let dead: boolean = false;
                let rotataion: boolean = false;

                for (let i = 0; i < skillArr.length; i++) {
                    let skill = skillArr[i];
                    let skillInfo = SettingManager.getSkillInfo(
                        fishNode.getComponent(Fish).getFishName(),
                        skill,
                        tower.getLevel(),
                        tower.getBase(),
                        tower.getBet(),
                    );

                    dead = SettingManager.isActive(skillInfo.probability2);// 技能擊殺是否成功

                    if (dead) {
                        rotataion = (skill == ESkill.Level_4_2); // 特殊規則: 最高級技能擊殺魚的情況下, 魚要旋轉離場.
                        break;
                    }
                }

                if (!dead && normal) {
                    let normalAttack = SettingManager.getNormalAttackInfo(
                        fishNode.getComponent(Fish).getFishName(),
                        tower.getLevel(),
                        tower.getBase(),
                        tower.getBet(),
                    );
                    dead = SettingManager.isActive(normalAttack.probability); // 普通攻擊擊殺是否成功
                }

                if (dead) { // 攻擊成功獲得獎勵
                    AudioManager.play(`UI_CoinGet`, true, false);

                    { // 機率觸發魚被擊殺的音效
                        let playAudioProbability = SettingManager.getFishInfo(fishNode.getComponent(Fish).getFishName()).probability;
                        if (SettingManager.isActive(playAudioProbability)) {
                            let audioName: string;

                            if (fishNode.getComponent(Fish).getFishName() == "fish_23") {
                                let v = getRandomInt(1, 2);
                                audioName = `Kill_Boss_0${v}`;
                            } else if (fishInfo.winMin < 10) {
                                let v = getRandomInt(1, 5);
                                audioName = `Kill_LowFish_0${v}`;
                            } else if (fishInfo.winMin >= 10 && fishInfo.winMin < 50) {
                                let v = getRandomInt(1, 4);
                                audioName = `Kill_MediumFish_0${v}`;
                            } else {
                                let v = getRandomInt(1, 4);
                                audioName = `Kill_HighFish_0${v}`;
                            }

                            if (audioName) {
                                AudioManager.play(audioName, true, false);
                            }
                        }
                    }

                    // 錢包增加金額
                    let winStr: string;
                    {
                        let win = fishInfo.winMin;
                        if (fishInfo.winMax > fishInfo.winMin) {
                            win = getRandomInt(fishInfo.winMin, fishInfo.winMax);
                        }

                        winStr = Mul(win.toString(), bet.toString()); // 實際獲得的獎勵
                    }

                    self.updateWalletValue(parseFloat(winStr)); // 更新錢包

                    let fishPosX = fishNode.getPosition().x;
                    let fishPosY = fishNode.getPosition().y;

                    if (fishInfo.bonusKind >= 1) { // 高倍數返獎才觸發
                        {
                            let name = "coin_2";
                            let prefab = ResourcesManager.prefabMap.get(name);
                            if (!prefab) {
                                cc.log("error: prefab not found name:" + name);
                                return;
                            }

                            let effectNode = cc.instantiate(prefab);
                            effectNode.name = name;
                            effectNode.scale = 1.6;
                            effectNode.setPosition(fishPosX, fishPosY);

                            fishNode.parent.addChild(effectNode);

                            cc.tween(effectNode).delay(2).call(() => { effectNode.destroy(); }).start();
                        }

                        { // 畫面左下角顯示獎勵
                            let name = "bonus_notice";
                            let prefab = ResourcesManager.prefabMap.get(name);
                            if (!prefab) {
                                cc.log("error: prefab not found name:" + name);
                                return;
                            }

                            let oldNode = fishNode.parent.getChildByName(name); // 舊的刪除掉
                            if (oldNode) {
                                oldNode.destroy();
                            }

                            let effectNode = cc.instantiate(prefab);
                            effectNode.name = name;
                            effectNode.setPosition(-147, -330); // 固定就可以了節省計算

                            effectNode.getChildByName("score").getComponent(cc.Label).string = winStr;

                            { // 處理顯示的魚
                                let tmpFishName = fishNode.getComponent(Fish).getFishName();
                                let tmpFishPrefab = ResourcesManager.prefabMap.get(tmpFishName);
                                if (!tmpFishPrefab) {
                                    cc.log("error: prefab not found name:" + tmpFishName);
                                    return;
                                }

                                let tmpFishEffectNode = cc.instantiate(tmpFishPrefab);
                                tmpFishEffectNode.name = name;
                                tmpFishEffectNode.rotation = 90;
                                if (tmpFishName == "fish_22" || tmpFishName == "fish_23") {
                                    tmpFishEffectNode.rotation = 0;
                                }

                                // 寬度固定, 高度則依據寬度動態調整
                                let targetWidth: number;
                                let targetScale: number;

                                let oldWidth = tmpFishEffectNode.getChildByName(fishNode.getComponent(Fish).getFishName()).width;
                                let oldHeight = tmpFishEffectNode.getChildByName(fishNode.getComponent(Fish).getFishName()).height;

                                targetWidth = 100;
                                targetScale = (targetWidth / tmpFishEffectNode.getChildByName(fishNode.getComponent(Fish).getFishName()).width);
                                tmpFishEffectNode.setPosition(0, 0);

                                tmpFishEffectNode.scale = targetScale;

                                effectNode.getChildByName("fish").addChild(tmpFishEffectNode);
                            }

                            fishNode.parent.addChild(effectNode);

                            cc.tween(effectNode).delay(2).call(() => { effectNode.destroy(); }).start();
                        }
                    }

                    { // 錢幣跑到砲塔動畫
                        let name = "coin";
                        let prefab = ResourcesManager.prefabMap.get(name);
                        if (!prefab) {
                            cc.log("error: prefab not found name:" + name);
                            return;
                        }

                        let count = fishInfo.winMin;// 獲得幾倍就產生幾顆錢幣

                        let tmpFishName = fishNode.getComponent(Fish).getFishName();

                        for (let i = 0; i < count; i++) {
                            // 錢幣的顯示範圍會落在魚的身上
                            let coinPosX = getRandomInt(fishPosX, fishPosX);
                            let coinPosY = getRandomInt(fishPosY, fishPosY);

                            let effectNode = cc.instantiate(prefab);
                            effectNode.name = name;
                            effectNode.setPosition(coinPosX, coinPosY);
                            effectNode.scale = 1.8;
                            fishNode.parent.addChild(effectNode);

                            let offsetX;
                            let offsetY;

                            if (tmpFishName == "fish_22") { // 財神的金幣要噴灑在整個畫面
                                let w = fishNode.parent.width / 2;
                                let h = fishNode.parent.height / 2;

                                offsetX = getRandomInt(0, w) * (getRandomInt(0, 1) == 0 ? 1 : -1);
                                offsetY = getRandomInt(0, h) * (getRandomInt(0, 1) == 0 ? 1 : -1);
                            } else {
                                offsetX = getRandomInt(0, 60) * (getRandomInt(0, 1) == 0 ? 1 : -1);
                                offsetY = getRandomInt(0, 60) * (getRandomInt(0, 1) == 0 ? 1 : -1);

                                offsetX += coinPosX;
                                offsetY += coinPosY;
                            }

                            cc.tween(effectNode)
                                .to(0.2, { position: new cc.Vec2(offsetX, offsetY) })
                                .delay(0.5)
                                .to(0.8, { position: new cc.Vec2(140, -370) }) // 直接固定就好省下運算
                                .call(() => { effectNode.destroy(); })
                                .start();
                        }
                    }

                    { // 錢幣金額動畫
                        let name = "score";
                        let prefab = ResourcesManager.prefabMap.get(name);
                        if (!prefab) {
                            cc.log("error: prefab not found name:" + name);
                            return;
                        }

                        let effectNode = cc.instantiate(prefab);
                        effectNode.name = name;
                        effectNode.scale = 1.3;
                        effectNode.getChildByName("score").getComponent(cc.Label).string = winStr;
                        effectNode.setPosition(fishPosX, fishPosY);
                        fishNode.parent.addChild(effectNode);
                        cc.tween(effectNode).delay(2).call(() => { effectNode.destroy(); }).start();
                    }
                }

                fishNode.getComponent(Fish).attacked(dead, rotataion, durationTime, pauseMoveTime, pauseSelfActionTime);
            }

            let bulletNode = collision.bulletCollider.parent;
            let bullet = bulletNode.getComponent(Bullet);
            if (bullet) {
                bulletNode.destroy();
            }
        }
    }

    private activeSkill03And0402(tower: SettingTower, durationTime: number) {
        let name = "skill_4_2";
        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found name:" + name);
            return;
        }

        let effectNode = cc.instantiate(prefab);
        effectNode.name = name;

        {
            let originLocationOfTower = this.originLocationOfTower; // 使用砲塔原始位置作為基準點
            let rotation = this.towerNode.rotation; // 砲塔目前旋轉角度

            effectNode.rotation = rotation;

            const offsetOfStartPos = 70;

            let dx = Math.sin((rotation * Math.PI) / 180) * offsetOfStartPos;
            let dy = Math.cos((rotation * Math.PI) / 180) * offsetOfStartPos;

            let startX = originLocationOfTower.x + dx;
            let startY = originLocationOfTower.y + dy;

            effectNode.setPosition(startX, startY);
        }


        this.collisionNode.addChild(effectNode);

        {
            let self = this;
            let fireFlag = false;
            let animation = effectNode.getComponent(cc.Animation);
            animation.schedule(function () {
                let originLocationOfTower = self.originLocationOfTower; // 使用砲塔原始位置作為基準點
                let rotation = self.towerNode.rotation; // 砲塔目前旋轉角度

                effectNode.rotation = rotation;

                const offsetOfStartPos = 70;

                let dx = Math.sin((rotation * Math.PI) / 180) * offsetOfStartPos;
                let dy = Math.cos((rotation * Math.PI) / 180) * offsetOfStartPos;

                let startX = originLocationOfTower.x + dx;
                let startY = originLocationOfTower.y + dy;

                effectNode.setPosition(startX, startY);

                let fire = effectNode.getChildByName("fire").opacity > 0;
                if (fire && !fireFlag) { // 發射技能
                    fireFlag = true;

                    SettingManager.lockFireSkill0402(true);

                    let bulletName = "bullet_skill_4_2";
                    let bulletPrefab = ResourcesManager.prefabMap.get(bulletName);
                    if (!bulletPrefab) {
                        cc.log("error: prefab not found name:" + bulletName);
                        return;
                    }

                    let bulletEffectNode = cc.instantiate(bulletPrefab);
                    bulletEffectNode.name = bulletName;
                    bulletEffectNode.rotation = rotation;
                    bulletEffectNode.setPosition(startX, startY);

                    let component = bulletEffectNode.addComponent(Bullet0402);
                    component.init(tower);

                    self.collisionNode.addChild(bulletEffectNode);

                    AudioManager.play(`UI_Skin_Max`, true, false);


                    cc.tween(bulletEffectNode)
                        .delay(1) // XXX 稍微延遲 1秒進行判斷level4大砲技能碰撞
                        .call(() => {
                            bulletEffectNode.destroy();
                        }).start();
                }
            }, 0.01);

            animation.scheduleOnce(function () {
                animation.stop();
                effectNode.destroy();
                SettingManager.lockFireSkill0402(false);
            }, durationTime);
        }
    }

    private activeSkill03And0401(
        skill: ESkill,
        fisrt: boolean,
        prevFishNode: cc.Node,
        nextFishNode: cc.Node,
        durationTime: number,
        prevFishNodeSize: number,
    ) {
        let lineName = 'skill_3_line';
        let pointName1 = "skill_3_src_point";
        let pointName2 = "skill_3_target_point";

        if (skill == ESkill.Level_4_1) {
            lineName = 'skill_4_line';
            pointName1 = "skill_4_src_point";
            pointName2 = "skill_4_target_point";
        }

        if (nextFishNode) {
            let name = lineName;
            let prefab = ResourcesManager.prefabMap.get(name);
            if (!prefab) {
                cc.log("error: prefab not found name:" + name);
                return;
            }

            let effectNode = cc.instantiate(prefab);
            effectNode.name = name;

            let self = this;
            let updateNode = function () {
                // 由於技能會先施放執行, 但是有可能施放過程中魚被擊殺消失了, 因此要額外判斷魚的 node
                if (!cc.isValid(prevFishNode) || !cc.isValid(nextFishNode)) {
                    effectNode.destroy();
                    return;
                }

                let prevFishNodePos = prevFishNode.getPosition();
                let nextFishNodePos = nextFishNode.getPosition();

                effectNode.setPosition(prevFishNodePos);
                effectNode.rotation = self.calculatorRotation(nextFishNodePos, prevFishNodePos).rotation;
                effectNode.width = 40;
                effectNode.height = self.getDistance(prevFishNodePos, nextFishNodePos);
            }

            updateNode();

            prevFishNode.parent.addChild(effectNode);

            let animation = effectNode.getComponent(cc.Animation);
            animation.schedule(function () {
                updateNode();
            }, 0.01);

            animation.scheduleOnce(function () {
                effectNode.destroy();
            }, durationTime);
        }

        {
            let name = (fisrt ? pointName1 : pointName2);
            let prefab = ResourcesManager.prefabMap.get(name);
            if (!prefab) {
                cc.log("error: prefab not found name:" + name);
                return;
            }

            let effectNode = cc.instantiate(prefab);
            effectNode.name = name;
            effectNode.setPosition(0, 0);

            let scale = 1;
            switch (prevFishNodeSize) {
                case 0:
                    scale = 0.4;
                    break;
                case 1:
                    scale = 0.6;
                    break;
                case 2:
                    scale = 0.8;
                    break;
                case 2:
                    scale = 1;
                    break;
            }

            if (skill == ESkill.Level_4_1 && fisrt) {
                scale -= 0.2;
            }

            effectNode.setScale(scale);

            prevFishNode.addChild(effectNode);

            let animation = effectNode.getComponent(cc.Animation);
            animation.scheduleOnce(function () {
                effectNode.destroy();
            }, durationTime);
        }
    }

    private activeSkill02(fishNode: cc.Node, durationTime: number) {
        let name = "skill_2_freeze";
        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found name:" + name);
            return;
        }

        { // 如果重複冰凍要先把舊的冰塊移除
            let effectNode = fishNode.getChildByName(name);
            if (effectNode) {
                effectNode.destroy();
            }
        }

        let effectNode = cc.instantiate(prefab);
        effectNode.name = name;
        effectNode.rotation = getRandomInt(0, 360);
        effectNode.setPosition(0, 0);

        effectNode.getChildByName("ice_s").active = false;
        effectNode.getChildByName("ice_m").active = false;
        effectNode.getChildByName("ice_l").active = false;
        switch (SettingManager.getFishInfo(fishNode.getComponent(Fish).getFishName()).size) {
            case 0:
                effectNode.getChildByName("ice_s").active = true;
                break;
            case 1:
                effectNode.getChildByName("ice_m").active = true;
                break;
            case 2:
            case 3:
                effectNode.getChildByName("ice_l").active = true;
                break;
        }

        fishNode.addChild(effectNode);

        cc.tween(effectNode)
            .delay(durationTime)
            .to(0.2, { opacity: 0 })
            .call(() => { effectNode.destroy(); })
            .start();
    }
}