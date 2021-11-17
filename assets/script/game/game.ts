
import { EWallet, EWalletResultAction, User } from "../common/user";
import { EAction as EAudioAction, AudioManager } from "../common/audio";
import { SettingManager, FishPath } from "../common/setting";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { Tower } from "./tower";
import { Collision, ChangeStageHandler } from "./collision";
import { Background } from "./background";
import { ResourcesManager } from "../common/resource";

const { ccclass, property } = cc._decorator;

@ccclass
export class Game extends cc.Component {
    private lobbyHandler: Function;

    private lobbyNode: cc.Node;

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
    private crosshairFocusNode: cc.Node;

    private collisionNode: cc.Node;

    private effectNode: cc.Node;

    private bgNode: cc.Node;

    public init(lobbyHandler: Function): boolean {
        this.lobbyHandler = lobbyHandler;
        if (!this.lobbyHandler) {
            cc.log('error: handler is null');
            return false;
        }
        return true;
    }

    public onLoad() {
        { // 測試用途的按鈕, 不使用的按鈕要設定 active為 false
            let showFishBtn = true; // 測試各種魚
            let showNextStageBtn = true; // 測試關卡切換

            let testBtn = this.node.getChildByName("testBtn");

            if (showFishBtn) {
                let btnNode = testBtn.getChildByName("fishBtn");
                let inputNode = testBtn.getChildByName("fishInput");

                btnNode.active = true;
                inputNode.active = true;

                let self = this;
                btnNode.on(cc.Node.EventType.TOUCH_START, function () {
                    let name = inputNode.getComponent(cc.EditBox).string;
                    let obj = SettingManager.getRandomPath();
                    let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj);
                    self.collisionNode.getComponent(Collision).AddFish(fishPath);
                }, this);
            }

            if (showNextStageBtn) {
                let nextStageNode = testBtn.getChildByName("nextStage");

                nextStageNode.active = true;

                let self = this;
                nextStageNode.on(cc.Node.EventType.TOUCH_START, function () {
                    self.nextGameState();
                }, this);
            }
        }

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

        this.collisionNode = this.node.getChildByName("collision");
        if (!this.collisionNode) {
            cc.log('error: collisionNode is null');
            return;
        }

        this.effectNode = this.node.getChildByName("effect");
        if (!this.effectNode) {
            cc.log('error: effectNode is null');
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

            this.crosshairFocusNode = crosshairNode.getChildByName("focus");
            if (!this.crosshairFocusNode) {
                cc.log('error: crosshairFocusNode is null');
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
        User.setAuto(false); // 初始化關閉自動射擊
        User.setFocus(false); // 初始化關閉鎖定射擊

        this.updateWalletValue();
        this.updateBetValue();
        this.updateMuteBtn();
        this.updateAutoBtn();
        this.initCrosshairNode();
        this.updateFocusBtn();
        this.setTowerLevel(SettingManager.getTowerByRoomLevel(User.getRoomLevel())[User.getTowerIndex()].getLevel());
        this.updateRotationOfTower(0, new cc.Vec2(this.originLocationOfTower.x, this.originLocationOfTower.y - this.distance));


        {
            let self = this;
            let startFishHandler = function () {
                self.collisionNode.getComponent(Collision).startFish();
            };
            let clearFishHandler = function () {
                self.collisionNode.getComponent(Collision).clearFish();
            };

            this.bgNode.getComponent(Background).init(startFishHandler, clearFishHandler);
            this.towerNode.getComponent(Tower).init();
            this.collisionNode.getComponent(Collision).init();
        }

        {// 初始化關卡切換排程
            User.setGameState(0);
            this.nextGameState();

            let tmp = 0; // 計時
            let self = this;
            this.schedule(function (dt) {
                tmp += dt;
                let delay = SettingManager.getGameDelayByGameStage(User.getGameState());
                if (tmp >= delay) {
                    tmp = 0;
                    self.nextGameState();
                }
            }, 1);
        }

        this.lobbyNode.on(cc.Node.EventType.TOUCH_START, this.backLobby, this);

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
        this.crosshairFocusNode.active = false;
    }

    private plusBet(event) {
        AudioManager.play(`UI_Bet_Add`, true, false);
        this.changeBet(true);
    }

    private minusBet(event) {
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
    private updateWalletValue() {
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

        this.unscheduleAllCallbacks();
    }

    private backLobby(event) {
        AudioManager.play(`UI_Menu_Click`, true, false);
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

    private changeAuto() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        User.setAuto(!User.isAuto());

        this.updateAutoBtn();

        this.stopAutoFire();
        if (User.isAuto()) {
            this.startAutoFire();
        }
    }

    private startAutoFire() {
        this.schedule(this.fire, 0.2, cc.macro.REPEAT_FOREVER, 0.3); // 設定的時間要大於 fire func執行的時間
    }

    private stopAutoFire() {
        this.unschedule(this.fire);
    }

    private changeFocus() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        User.setFocus(!User.isFocus());

        this.updateFocusBtn();
    }

    private updateAutoBtn() {
        cc.log("自動射擊: " + User.isAuto());

        this.autoOffNode.active = !User.isAuto();
        this.autoOnNode.active = User.isAuto();
    }

    private updateFocusBtn() {
        cc.log("鎖定射擊: " + User.isFocus());

        this.focusOffNode.active = !User.isFocus();
        this.focusOnNode.active = User.isFocus();
    }

    public updateMouseMove(event: cc.Event.EventTouch) {
        let location = event.getLocation();
        let locationOfTouch = this.node.convertToNodeSpaceAR(location); // 將點擊的位置由世界座標轉換成 this.node裡面的相對座標

        if (!this.isCrosshairArea(locationOfTouch)) {
            if (!User.isAuto()) {
                this.stopAutoFire();
                this.crosshairDefNode.active = false;
            }
            return;
        }

        let updateCrosshair = false;

        switch (event.getType()) {
            case cc.Node.EventType.TOUCH_MOVE:
            case cc.Node.EventType.TOUCH_START:
                updateCrosshair = true;
                break;
            case cc.Node.EventType.TOUCH_END:// node內放開
            case cc.Node.EventType.TOUCH_CANCEL:// node外放開
                break;
            default:
                break;
        }

        if (updateCrosshair) {
            this.crosshairDefNode.setPosition(locationOfTouch);
            this.crosshairDefNode.active = true;
            let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
            this.updateRotationOfTower(obj.rotation, obj.backLocation);
        } else {
            this.crosshairDefNode.active = false;
        }

        if (event.getType() == cc.Node.EventType.TOUCH_START && updateCrosshair) {
            this.stopAutoFire();
            this.fire();
            this.startAutoFire();
        } else if (!updateCrosshair) {
            if (!User.isAuto()) {
                this.stopAutoFire();
            }
        }
    }

    private updateRotationOfTower(rotation: number, locationOfFire: cc.Vec2) {
        this.towerNode.rotation = rotation;
        this.locationOfFire = locationOfFire;
    }

    private fire() {
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
        var AB = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
        var AC = Math.sqrt(Math.pow(A.x - C.x, 2) + Math.pow(A.y - C.y, 2));
        var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        var cosA = (
            Math.pow(AB, 2) + Math.pow(AC, 2) - Math.pow(BC, 2)
        ) / (
                2 * AB * AC
            );
        var angleA = Math.round(Math.acos(cosA) * 180 / Math.PI);
        return angleA;
    }

    private isCrosshairArea(location: cc.Vec2): boolean {
        let x = location.x;
        let y = location.y;

        if (x < -73 && y > 330) { // 左上角按鈕區塊
            return false;
        }

        if (x > 170 && y > 297) { // 右上角按鈕區塊
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
}