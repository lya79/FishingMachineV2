import { EWallet, EWalletResultAction, User } from "../common/user";
import { SettingManager, FishPath, Collision } from "../common/setting";
import { Bullet } from "./bullet";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { ResourcesManager } from "../common/resource";

export class Fish extends cc.Component {
    private fishPath: FishPath;
    private fishName: string;
    private scale: number;

    private pointNodeArr: cc.Node[];

    private fpsOfXY: number; // 每幾偵偏移一次座標(影響移動速度)
    private fpsOfCanvas: number;// 每幾偵偏更新一次node
    private timerOfFps: number; // 計時器
    private timerOfSleep: number; // 計時器

    private currentPosIndex: number; // 目前的座標
    private x: number;// 座標
    private y: number;
    private dx: number; // 偏移座標
    private dy: number;
    private speedXY: number; // 每次移動多少距離
    private rotationFish: number; // 旋轉角度
    private speedFIsh: number; // 擺動尾巴速度

    private lockState: boolean; // 判斷是否可以再更改狀態
    private pause: boolean;

    private pauseMoveTime: number; // 需要暫停的時間-
    private pauseSelfActionTime: number;

    // 血條
    private showHP: boolean; // 血條ui是否開啟
    private defaultHP: number;
    private hp: number
    private hpNode: cc.Node;
    private hpProgresBar: cc.ProgressBar;
    private hpSprite: cc.Sprite;

    // XXX 魚的動畫缺少陰影

    public init(fishPath: FishPath, fishName: string, scale: number) {
        this.fishPath = fishPath;
        this.fishName = fishName;
        this.scale = scale;

        this.lockState = false;
        this.pause = false;
        this.currentPosIndex = 0;
        this.fpsOfXY = 1;
        this.fpsOfCanvas = 1;
        this.timerOfFps = 0;
        this.timerOfSleep = 0;
        this.speedXY = 1;
        this.pauseMoveTime = 0;
        this.pauseSelfActionTime = 0;
        this.defaultHP = SettingManager.getFishInfo(fishName).hp;
        this.hp = this.defaultHP;
        this.showHP = SettingManager.getFishInfo(fishName).showHp;
    }

    public getFishName(): string {
        return this.fishName;
    }

    public onLoad() {
        this.currentPosIndex = 0; // 前往第二個座標

        let self = this;

        let fishNode = this.node.getChildByName(this.fishName);
        fishNode.scale = this.scale;

        {
            class TmpCollision extends cc.Component {
                public onCollisionEnter(bulletCollider: cc.Collider, fishCollider: cc.Collider) {
                    if (self.lockState) {
                        return;
                    }

                    let obj = new Collision();
                    obj.bulletCollider = bulletCollider.node;
                    obj.fishCollider = fishCollider.node;

                    SettingManager.collisionArr.push(obj);
                }
            }

            fishNode.addComponent(TmpCollision);
        }

        // 確保起始和結束的位置要在畫面之外
        let getPos = function (x: number, y: number): { newX: number, newY: number } {
            let width = fishNode.width;
            let height = fishNode.height;

            // 考慮到 node可能旋轉, 因此要找出最大的邊
            let max = (height > width ? height : width);

            if (x < 0) {
                x -= max;
            } else {
                x += max;
            }
            if (y < 0) {
                y -= max;
            } else {
                y += max;
            }

            return { newX: x, newY: y };
        }

        let lastPos = this.fishPath.getPath()[this.fishPath.getPath().length - 1];
        let obj = getPos(lastPos.x, lastPos.y);
        lastPos.x = obj.newX;
        lastPos.y = obj.newY;

        let fistPos = this.fishPath.getPath()[0];
        obj = getPos(fistPos.x, fistPos.y);
        fistPos.x = obj.newX;
        fistPos.y = obj.newY;

        this.x = fistPos.x;
        this.y = fistPos.y;
        this.node.setPosition(fistPos.x, fistPos.y); // 起點位置

        this.drawPath();

        if (this.showHP) {
            let name = "hp";
            let prefab = ResourcesManager.prefabMap.get(name);
            if (!prefab) {
                cc.log("error: prefab not found name:" + name);
                return;
            }

            this.hpNode = cc.instantiate(prefab);
            this.hpNode.name = name;
            this.hpNode.setPosition(0, 0);

            let progressBarNode = this.hpNode.getChildByName("progressBar");
            this.hpSprite = progressBarNode.getChildByName("bar").getComponent(cc.Sprite);
            this.hpProgresBar = progressBarNode.getComponent(cc.ProgressBar);

            this.node.addChild(this.hpNode);

            let scale = 0;
            switch (SettingManager.getFishInfo(this.fishName).size) {
                case 0:
                    scale = 0.2;
                    break;
                case 1:
                    scale = 0.7;
                    break;
                case 2:
                    scale = 1;
                    break;
            }

            this.hpNode.scale = scale;
        }

        fishNode.on(cc.Node.EventType.TOUCH_START, this.touchHandler, this);

        let interval = 0.1; // 用來控制是否暫停移動魚
        this.schedule(function (dt) {
            self.pause = (self.pauseMoveTime > 0);

            if (self.pauseMoveTime > 0) {
                self.pauseMoveTime -= dt;
            } else {
                self.pauseMoveTime = 0;
            }

            let fishAnimation = fishNode.getComponent(cc.Animation);

            if (self.pauseSelfActionTime > 0) {
                self.pauseSelfActionTime -= dt;

                if (fishAnimation) {
                    let animationState = fishAnimation.getAnimationState(self.fishName);
                    if (!animationState.isPaused) {
                        animationState.pause();
                    }
                }

            } else if (self.pauseSelfActionTime < 0) {
                self.pauseSelfActionTime = 0;

                if (fishAnimation) {
                    let animationState = fishAnimation.getAnimationState(self.fishName);
                    if (animationState.isPaused) {
                        animationState.play();
                    }
                }
            }
        }, interval);
    }

    public onDestroy() {
        if (this.pointNodeArr) {
            for (let i = 0; i < this.pointNodeArr.length; i++) {
                this.pointNodeArr[i].destroy();
            }
        }
    }

    private touchHandler(event) {
        User.setFocusUUID(this.node.uuid);
    }

    public update(dt) {
        this.updateHP(dt);

        if (this.lockState) {
            return;
        }

        if (this.pause) {
            return;
        }

        this.updateXY(dt);
        this.updateNodeXY(dt);
    }

    /**
     * @param attack 是否命中攻擊(需要返獎)
     * @param rotation 是否要旋轉, dead=true時候才有效
     * @param durationTime 技能動畫持續時間(技能攻擊的動畫結束才能讓魚被擊殺)
     * @param pauseMoveTime 花費多少時間停止位移
     * @param pauseSelfActionTime 花費多少時間停止擺動尾巴
     * @returns 
     */
    public attacked(
        attack: boolean,
        rotation: boolean,
        durationTime: number,
        pauseMoveTime: number,
        pauseSelfActionTime: number

    ) {
        if (this.lockState) {
            return;
        }

        if (attack && this.hp > 0) {
            this.hp -= 1;
        }

        let dead = this.hp == 0; // hp=-1則代表不會死掉, 例如:財神

        if (dead) {
            this.lockState = true;
            this.pause = true;
        }

        if (pauseMoveTime > this.pauseMoveTime) {
            this.pauseMoveTime = pauseMoveTime;
        }

        if (pauseSelfActionTime > this.pauseSelfActionTime) {
            this.pauseSelfActionTime = pauseSelfActionTime;
        }

        let fishNode = this.node.getChildByName(this.fishName);

        if (!dead) {
            let tween = cc.tween(fishNode);

            tween.then(cc.tween() // XXX 效果不太好看起來顏色太深, 考慮用遮罩方式處理
                .call(() => { fishNode.color = new cc.Color(255, 0, 0); })
                .delay(0.5)
                .call(() => { fishNode.color = new cc.Color(255, 255, 255); })
            )

            if (durationTime > 0) {
                tween.then(
                    cc.tween().delay(durationTime)
                );
            }

            tween.start();

            return;
        }

        if (durationTime > 0 && rotation) {
            let srcScale = fishNode.scale - 0.2;
            let targetScale = fishNode.scale + 0.2;

            cc.tween(fishNode)
                .by(0.5, { rotation: 360 })
                .repeatForever()
                .start();

            let time = durationTime * 0.8;
            let time2 = (durationTime - time) / 2;
            cc.tween(fishNode)
                .to(time, { scale: targetScale })
                .delay(time2)
                .to(time2, { scale: srcScale })
                .start();
        }

        { // 控制魚多久後被擊殺 
            let self = this;

            let tween = cc.tween(fishNode);

            tween.then(cc.tween() // XXX 效果不太好看起來顏色太深, 考慮用遮罩方式處理
                .call(() => { fishNode.color = new cc.Color(255, 0, 0); })
                .delay(0.5)
                .call(() => { fishNode.color = new cc.Color(255, 255, 255); })
            )

            if (durationTime > 0) {
                tween.then(
                    cc.tween().delay(durationTime)
                );
            }

            tween.then(
                cc.tween().call(() => {
                    self.node.destroy();
                })
            );

            tween.start();
        }
    }

    public isPause(): boolean {
        return this.pause;
    }

    public isLockState(): boolean {
        return this.lockState;
    }

    /** 加速離開畫面 */
    public clearFish() {
        if (this.lockState) {
            return;
        }

        this.lockState = true;
        this.pause = true;

        /**
         * 假設需要移動的最長距離為 875.6(對角)
         * 並且需要再 2s完成
         * 因此可以換算出每一個位置偏移需要耗費 0.00228414801=2/875.6
         */
        let lastPos = this.fishPath.getPath()[this.fishPath.getPath().length - 1];
        let currentPosition = this.node.getPosition();
        let lastPosition = new cc.Vec2(lastPos.x, lastPos.y);
        let distance = this.getDistance(currentPosition, lastPosition); //目前差還多少距離到達邊界
        let delay = distance * 0.00228414801;
        let speed = 2;

        let self = this;
        let tween = cc.tween(this.node);
        tween.then(cc.tween().call(() => {
            let fishNode = this.node.getChildByName(this.fishName);

            // 調整魚的旋轉角度
            let obj = self.calculatorRotation(lastPosition, currentPosition);
            this.updateRotation(obj.rotation);

            // 調整魚的擺動速度
            var anim = fishNode.getComponent(cc.Animation);
            if (anim) {
                anim.getAnimationState(fishNode.name).speed *= speed;
            }
        }));
        tween.then(cc.tween().to(delay, { position: lastPosition })); // 1.5s離開畫面
        tween.then(cc.tween().delay(2)); // 稍微停止一下確保東西都處理完
        tween.then(cc.tween().call(() => { self.node.destroy(); }));
        tween.start();
    }

    /**
     * 更新砲塔旋轉角度
     * 依據玩家點擊的位置
     */
    private calculatorRotation(locationOfTouch: cc.Vec2, locationOfTower: cc.Vec2): { rotation: number } {
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

        return { rotation: newRotation };
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

    private updateHP(dt) {
        if (!this.showHP) {
            return;
        }

        { // 用來控制血條顯示的位置
            let fishHeight = this.node.getChildByName(this.fishName).height / 2;

            let top = true;
            if (this.node.y + fishHeight + 10 >= (this.node.parent.height / 2)) {
                top = false;
            }

            let y = fishHeight + 10;
            y = (top ? y : -y);

            this.hpNode.setPosition(0, y);
        }


        let value = this.hp / this.defaultHP;

        if (value > 1) {
            value = 1;
        } else if (value < 0) {
            value = 0;
        }

        this.hpProgresBar.progress = value;

        let changeSpriteNanme: string;
        let spriteFrameName = this.hpSprite.spriteFrame.name;

        let notice = this.hpNode.getChildByName("notice");

        if (value > 0.6) {
            let targetName = "img_bosslifebar_green";
            if (spriteFrameName != targetName) {
                changeSpriteNanme = targetName;

                notice.active = false;
            }
        } else if (value > 0.3) {
            let targetName = "img_bosslifebar_orange";
            if (spriteFrameName != targetName) {
                changeSpriteNanme = targetName;

                notice.active = false;
            }
        } else {
            let targetName = "img_bosslifebar_red";
            if (spriteFrameName != targetName) {
                changeSpriteNanme = targetName;

                notice.active = true;
            }
        }

        if (changeSpriteNanme) {
            this.hpSprite.spriteFrame = (ResourcesManager.spriteAtlasMap.get('SS_Symbol_Atlas_03')).getSpriteFrame(changeSpriteNanme);
        }
    }

    private updateXY(dt) {// 更新魚的 x、y座標
        {// 計時
            this.timerOfSleep += 1;
            if (this.timerOfSleep < this.fpsOfXY) {
                return;
            }
            this.timerOfSleep = 0;
        }

        { // 判斷是否該停止
            if (this.currentPosIndex >= this.fishPath.getSpeedOfPoint().length) {
                this.lockState = true;
                this.node.destroy();
                return;
            }
        }

        // XXX 先設定成一邊位移一邊計算角度(changeRotataion=true), 之後要改成替換目標位置時計算一次角度, 然後使用 tween去執行轉向(轉向的時間要考慮到兩點距離預計的位移時間)
        let changeRotataion = true; // 判斷是否要更新目標位置 
        {
            let targetPos = this.fishPath.getPath()[this.currentPosIndex + 1];
            let currentPos = new cc.Vec2(this.x, this.y);
            let distance = this.getDistance(targetPos, currentPos);

            // 目前位置和目標位置的距離小於等於移動距離時候, 就代表要前往下一個位置
            if (distance <= (this.speedXY * 1.2)) {
                this.currentPosIndex += 1;
                changeRotataion = true;

                { // 判斷是否該停止
                    if (this.currentPosIndex + 1 >= this.fishPath.getSpeedOfPoint().length) {
                        this.lockState = true;
                        this.node.destroy();
                        return;
                    }
                }
            }

            if (this.currentPosIndex == 0) {
                changeRotataion = true;
            }
        }

        if (changeRotataion) {
            let currentPos = new cc.Vec2(this.x, this.y);
            let targetPos = this.fishPath.getPath()[this.currentPosIndex + 1];
            let obj = this.calculatorRotation(targetPos, currentPos);

            let skip = false; // 減少計算誤差導致不斷轉向(會讓魚一直震動)
            skip = skip || this.rotationFish - 1 == obj.rotation;
            skip = skip || this.rotationFish + 1 == obj.rotation;
            if (!skip) {
                this.rotationFish = obj.rotation; // 朝目標旋轉
            }

            { // 更新偏移 dx dy, 先做旋轉才能計算 dx dy
                this.dx = Math.sin((this.rotationFish * Math.PI) / 180) * this.speedXY;
                this.dy = Math.cos((this.rotationFish * Math.PI) / 180) * this.speedXY;
            }

            { // 更新移動速度 fpsOfXY
                this.fpsOfXY = this.fishPath.getSpeedOfPoint()[this.currentPosIndex + 1];
            }

            { // 更新擺動尾巴速度 speedFIsh
                this.speedFIsh = this.fishPath.getSpeedOfObj()[this.currentPosIndex + 1];
            }
        }

        { // 更新xy
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    private updateNodeXY(dt) {// 更新魚顯示位置
        {// 計時
            this.timerOfFps += 1;
            if (this.timerOfFps < this.fpsOfCanvas) {
                return;
            }
            this.timerOfFps = 0;
        }

        // 位置
        this.node.setPosition(this.x, this.y);

        // 擺動尾巴速度
        let fishNode = this.node.getChildByName(this.fishName);
        var anim = fishNode.getComponent(cc.Animation);
        if (anim) {
            anim.getAnimationState(fishNode.name).speed = this.speedFIsh;
        }

        // 旋轉角度
        let targetRoatation = this.rotationFish;
        this.updateRotation(targetRoatation);
    }

    private updateRotation(newRotation: number) {
        if (!SettingManager.getFishInfo(this.fishName).rotation) {
            return;
        }

        let fishNode = this.node.getChildByName(this.fishName);
        fishNode.rotation = newRotation + 180; // 魚頭朝下, 但是計算過程是以魚頭朝上計算, 因此需要轉向 180
    }

    private getDistance(a: cc.Vec2, b: cc.Vec2): number {
        let x = a.x - b.x;
        let y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 繪製魚的路徑
     */
    private drawPath() {
        if (!SettingManager.showPathOfFish) {
            return;
        }

        this.pointNodeArr = [];

        let drawPoint = function (x, y, color, delay): cc.Node {
            let node = new cc.Node("point_of_fish");

            let graph = node.addComponent(cc.Graphics);
            graph.fillColor = color;
            graph.circle(x, y, 3);
            // graph.fill();
            graph.stroke();
            return node;
        }

        let fishPath = this.fishPath;
        for (let i = 0; i < fishPath.getPath().length; i++) {
            let pathArr = fishPath.getPath()[i];
            let x = pathArr.x;
            let y = pathArr.y;
            let delay = 0;
            for (let i = 0; i < fishPath.getSpeedOfPoint().length; i++) {
                delay += fishPath.getSpeedOfPoint()[i];
            }

            let node = drawPoint(x, y, new cc.Color(255, 0, 0, 255), delay);
            this.pointNodeArr.push(node);

            this.node.parent.addChild(node);
        }
    }
}