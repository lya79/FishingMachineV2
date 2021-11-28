
import { EWallet, EWalletResultAction, User } from "../common/user";
import { EAction as EAudioAction, AudioManager } from "../common/audio";
import { SettingManager, FishPath, Collision as CollisionObj, ESkill } from "../common/setting";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { Tower } from "./tower";
import { Collision, ChangeStageHandler } from "./collision";
import { Background } from "./background";
import { ResourcesManager } from "../common/resource";
import { Bullet } from "./bullet";
import { Fish } from "./fish";
import { Bullet0402 } from "./bullet0402";

const { ccclass, property } = cc._decorator;

@ccclass
export class Game extends cc.Component {
    private lobbyHandler: Function;

    private lobbyNode: cc.Node; // FIXME 切換關卡觸發後再按下回大廳會出錯

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
                    let fishPath = new FishPath(name, 1, 1, obj.pathArr, obj.speedOfPoint, obj.speedOfObj);
                    self.collisionNode.getComponent(Collision).AddFish(fishPath);
                }
                {
                    // let groupFish = SettingManager.getFishPathByGameStage1V2();
                    // for (let i = 0; i < groupFish.length; i++) {
                    //     self.collisionNode.getComponent(Collision).AddFish(groupFish[i]);
                    // }
                }
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


        this.schedule(this.collisionHandler, 0.05);

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
                { // 切換關卡
                    tmp += dt;
                    let delay = SettingManager.getGameDelayByGameStage(User.getGameState());
                    if (tmp >= delay) {
                        tmp = 0;
                        self.nextGameState();
                    }
                }

                { // 判斷 focus
                    let active = self.focusActive();

                    let focusNode = self.node.getChildByName("crosshair").getChildByName("focus");
                    focusNode.active = active;

                    if (!active) {
                        return;
                    }

                    let node = self.collisionNode.getChildByUuid(User.getFocusUUID());
                    let worldPosition = node.parent.convertToWorldSpaceAR(node.getPosition());

                    // 在魚的身上顯示 focus圖示
                    let nodePositon = focusNode.parent.convertToNodeSpaceAR(worldPosition);
                    focusNode.setPosition(nodePositon);

                    // 砲塔追著魚轉動
                    self.updateTower(worldPosition, cc.Node.EventType.TOUCH_MOVE, false);
                }
            }, 0.05); // XXX 效果看起來不太好, 準心位移會lag的感覺
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

    private focusActive = function (): boolean {
        if (!User.isFocus()) {
            return false;
        }

        if (!User.getFocusUUID()) {
            return false;
        }

        if (!this.collisionNode.getChildByUuid(User.getFocusUUID())) {
            return false;
        }

        return true;
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

        let length = this.collisionNode.children.length;
        for (let i = 0; i < length; i++) {
            let node: cc.Node = this.collisionNode.children[i];
            node.cleanup();
            node.destroy();
        }

        // FIXME 離開之前要先把已經被擊殺的魚金額寫入錢包
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

        User.setFocusUUID(null);
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
        this.updateTower(event.getLocation(), event.getType(), true);
    }

    public updateTower(location: cc.Vec2, eventType: string, showAutoNode: boolean) {
        let locationOfTouch = this.node.convertToNodeSpaceAR(location); // 將點擊的位置由世界座標轉換成 this.node裡面的相對座標

        // FIXME 瞄準功能需要重寫, 瞄準魚的時候子彈會略過其他魚不攻擊, 點擊畫面任一位置則可以取消瞄準, 被瞄準的魚如果被擊殺獲釋離開場面則取消瞄準
        if (!this.isCrosshairArea(locationOfTouch)) {
            if (!User.isAuto()) {
                this.stopAutoFire();
                this.crosshairDefNode.active = false;
            }
            return;
        }

        let updateCrosshair = false;

        switch (eventType) {
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
            this.crosshairDefNode.active = true && showAutoNode;
            let obj = this.calculatorRotation(locationOfTouch, this.originLocationOfTower);
            this.updateRotationOfTower(obj.rotation, obj.backLocation);
        } else {
            this.crosshairDefNode.active = false;
        }

        if (eventType == cc.Node.EventType.TOUCH_START && updateCrosshair) {
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

                if (!fish.isInCanvas()) {
                    continue;
                }
            }

            let bet: number; // 押注
            {
                let bulletNode = collision.bulletCollider;
                let bullet0402 = bulletNode.getComponent(Bullet0402);
                if (bullet0402) {
                    bet = bullet0402.getBet();
                } else {
                    let bulletNode = collision.bulletCollider.parent;
                    let bullet = bulletNode.getComponent(Bullet);

                    if (!cc.isValid((bulletNode) || bullet.isLock())) {
                        continue;// 子彈已經碰撞過避免多次碰撞
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
                    let skillInfo = SettingManager.getSkillAttackInfo(fish.getFishName(), skill);
                    if (!SettingManager.isActiveSkill(skillInfo.probability)) {// 是否發動技能
                        continue;
                    }

                    if (skill == ESkill.Level_4_2) {
                        let sleep = skillInfo.durationTime * 1000;
                        let success = SettingManager.lockSkill0402(sleep);
                        if (!success) {
                            continue;
                        }

                        this.activeSkill03And0402(bet, skillInfo.durationTime);
                        continue;
                    }


                    let count = 1;//getRandomInt(skillInfo.min, skillInfo.max); // 技能攻擊的數量(不包含被普通攻擊的魚)
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
                        for (let k = 0; k < attackedArr.length; k++) {
                            let attacked = attackedArr[k];
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

                let dead: boolean = false;
                let rotataion: boolean = false;

                for (let i = 0; i < skillArr.length; i++) {
                    let skill = skillArr[i];
                    let skillInfo = SettingManager.getSkillAttackInfo(fishNode.getComponent(Fish).getFishName(), skill);

                    dead = SettingManager.attack(skillInfo.probability2);// 技能擊殺是否成功

                    if (dead) {
                        rotataion = (skill == ESkill.Level_4_2); // 特殊規則: 最高級技能擊殺魚的情況下, 魚要旋轉離場.
                        break;
                    }
                }

                if (!dead && normal) {
                    let normalAttack = SettingManager.getNormalAttackInfo(fishNode.getComponent(Fish).getFishName());
                    dead = SettingManager.attack(normalAttack.probability); // 普通攻擊擊殺是否成功
                }

                if (dead) { // 攻擊成功獲得獎勵
                    // 錢包增加金額
                    let win = fishInfo.win * bet;
                    self.updateWalletValue(win);

                    let fishPosX = fishNode.getPosition().x;
                    let fishPosY = fishNode.getPosition().y;

                    { // 錢幣跑到砲塔動畫
                        let name = "coin";
                        let prefab = ResourcesManager.prefabMap.get(name);
                        if (!prefab) {
                            cc.log("error: prefab not found name:" + name);
                            return;
                        }

                        let fishWidth = fishNode.getChildByName(fishNode.name).width / 2;
                        let fishHeight = fishNode.getChildByName(fishNode.name).height / 2;
                        let rand = (fishHeight > fishWidth ? fishHeight : fishWidth);

                        let count = fishInfo.win;// 獲得幾倍就產生幾顆錢幣

                        for (let i = 0; i < count; i++) {
                            // 錢幣的顯示範圍會落在魚的身上
                            let coinPosX = getRandomInt(fishPosX - rand, fishPosX + rand);
                            let coinPosY = getRandomInt(fishPosY - rand, fishPosY + rand);

                            let effectNode = cc.instantiate(prefab);
                            effectNode.name = name;
                            effectNode.setPosition(coinPosX, coinPosY);
                            effectNode.scale = 2.2;
                            fishNode.parent.addChild(effectNode);

                            let jump = coinPosY + 60;
                            cc.tween(effectNode)
                                .to(0.1, { position: new cc.Vec2(coinPosX, jump) })
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
                        effectNode.scale = 1.6;
                        effectNode.getChildByName("score").getComponent(cc.Label).string = win.toString();
                        effectNode.setPosition(fishPosX, fishPosY);
                        fishNode.parent.addChild(effectNode);
                        cc.tween(effectNode).delay(2).call(() => { effectNode.destroy(); }).start();
                    }
                }

                fishNode.getComponent(Fish).attacked(dead, rotataion, durationTime, pauseMoveTime, pauseSelfActionTime);
            }
        }
    }

    private activeSkill03And0402(bet: number, durationTime: number) {
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
            // FIXME 鎖押注按鈕
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

                    // FIXME 鎖砲塔轉向

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
                    component.init(bet);

                    self.collisionNode.addChild(bulletEffectNode);

                    // XXX 砲擊持續時間大約 1秒, 判斷碰撞使用 0.8即可,  0.8s內砲塔轉向攻擊到的魚都算有碰撞到需要判斷是否有擊殺
                    cc.tween(bulletEffectNode)
                        .delay(0.8)
                        .call(() => {
                            // FIXME 解鎖押注按鈕
                            // FIXME 解鎖砲塔轉向
                            bulletEffectNode.destroy();
                        }).start();
                }
            }, 0.01);

            animation.scheduleOnce(function () {
                animation.stop();
                effectNode.destroy();
            }, durationTime);
        }
    }

    private activeSkill03And0401(skill: ESkill, fisrt: boolean, prevFishNode: cc.Node, nextFishNode: cc.Node, durationTime: number) {
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
                let prevFishNodePos = prevFishNode.getPosition();
                let nextFishNodePos = nextFishNode.getPosition();

                effectNode.setPosition(prevFishNodePos);
                effectNode.rotation = self.calculatorRotation(nextFishNodePos, prevFishNodePos).rotation;
                effectNode.width = 40;
                effectNode.height = self.getDistance(prevFishNodePos, nextFishNodePos);

                if ((prevFishNodePos.x == 0 && prevFishNodePos.y == 0) || (nextFishNodePos.x == 0 && nextFishNodePos.y == 0)) {
                    // FIXME 目前發現動畫多的時候會發生, 如果降低 durationTime時間也可以減少機會發生, 還不確認原因
                    cc.log("error 錯誤 不應該出現 " + fisrt + ", " + prevFishNodePos.toString() + " -> " + nextFishNodePos.toString());
                }
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

            let scale = (skill == ESkill.Level_4_1 ? 0.3 : 0.4);// XXX 不同的魚種要設定不同大小
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