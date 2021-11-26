import { EWallet, EWalletResultAction, User } from "../common/user";
import { SettingManager, FishPath, Collision } from "../common/setting";
import { Bullet } from "./bullet";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { ResourcesManager } from "../common/resource";

// XXX 魚的動畫缺少陰影
// FIXME 魚水平移動會造成轉向錯誤, 垂直移動也要確認看看

export class Fish extends cc.Component {
    private fishPath: FishPath;
    private fishName: string;

    private pointNodeArr: cc.Node[];

    private fpsOfXY: number; // 每幾偵偏移一次座標(影響移動速度)
    private fpsOfCanvas: number;// 每幾偵偏更新一次node
    private timerOfFps: number; // 計時器
    private timerOfSleep: number; // 計時器

    private targetPosIndex: number; // 目前要前往的座標
    private x: number;// 座標
    private y: number;
    private dx: number; // 偏移座標
    private dy: number;
    private speedXY: number; // 每次移動多少距離
    private rotationFish: number; // 旋轉角度
    private speedFIsh: number; // 擺動尾巴速度

    private lockState: boolean; // 判斷是否可以再更改狀態
    private pause: boolean;

    private pauseMoveTime: number; // 需要暫停的時間
    private pauseSelfActionTime: number;

    public init(fishPath: FishPath, fishName: string) {
        this.fishPath = fishPath;
        this.fishName = fishName;

        this.lockState = false;
        this.pause = false;
        this.targetPosIndex = 0;
        this.fpsOfXY = 1;
        this.fpsOfCanvas = 1;
        this.timerOfFps = 0;
        this.timerOfSleep = 0;
        this.speedXY = 1;
        this.pauseMoveTime = 0;
        this.pauseSelfActionTime = 0;
    }

    public getFishName(): string {
        return this.fishName;
    }

    public onCollisionEnter(bulletCollider: cc.Collider, fishCollider: cc.Collider) {
        if (this.lockState) {
            return;
        }

        let obj = new Collision();
        obj.bulletCollider = bulletCollider;
        obj.fishCollider = fishCollider;

        SettingManager.collisionArr.push(obj);
    }

    public onLoad() {
        this.drawPath();

        this.targetPosIndex = 1; // 前往第二個座標

        let self = this;

        // 確保起始和結束的位置要在畫面之外
        let getPos = function (x: number, y: number): { newX: number, newY: number } {
            let width = self.node.width;
            let height = self.node.height;

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

        this.node.on(cc.Node.EventType.TOUCH_START, this.touchHandler, this);

        let interval = 0.1; // 用來控制是否暫停移動魚
        this.schedule(function (dt) {
            self.pause = (self.pauseMoveTime > 0);

            if (self.pauseMoveTime > 0) {
                self.pauseMoveTime -= dt;
            } else {
                self.pauseMoveTime = 0;
            }

            if (self.pauseSelfActionTime > 0) {
                self.pauseSelfActionTime -= dt;

                let animationState = self.node.getComponent(cc.Animation).getAnimationState(self.fishName);
                if (!animationState.isPaused) {
                    animationState.pause();
                }
            } else if (self.pauseSelfActionTime < 0) {
                self.pauseSelfActionTime = 0;

                let animationState = self.node.getComponent(cc.Animation).getAnimationState(self.fishName);
                if (animationState.isPaused) {
                    animationState.play();
                }
            }
        }, interval);
    }

    public onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchHandler, this);

        this.lockState = true;

        this.node.cleanup();

        if (this.pointNodeArr) {
            for (let i = 0; i < this.pointNodeArr.length; i++) {
                this.pointNodeArr[i].destroy();
            }
        }

        this.node.destroy();
    }

    public update(dt) {
        if (this.lockState) {
            return;
        }

        if (this.pause) {
            return;
        }

        this.updateXY(dt);
        this.updateNodeXY(dt);
    }

    private touchHandler(event) {
        User.setFocusUUID(this.node.uuid);
    }

    /**
     * @param dead 是否被擊殺
     * @param rotation 是否要旋轉, dead=true時候才有效
     * @param durationTime 技能動畫持續時間(技能攻擊的動畫結束才能讓魚被擊殺)
     * @param pauseMoveTime 花費多少時間停止位移
     * @param pauseSelfActionTime 花費多少時間停止擺動尾巴
     * @returns 
     */
    public attacked(
        dead: boolean,
        rotation: boolean,
        durationTime: number,
        pauseMoveTime: number,
        pauseSelfActionTime: number

    ) {
        if (this.lockState) {
            return;
        }

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

        // TODO 播放魚碰撞子彈的音效 
        { // 播放魚被攻擊的動畫 
            let tween = cc.tween(this.node);

            tween.then(cc.tween() // XXX 效果不太好看起來顏色太深, 考慮用遮罩方式處理
                .call(() => { this.node.color = new cc.Color(255, 0, 0); })
                .delay(0.5)
                .call(() => { this.node.color = new cc.Color(255, 255, 255); })
            )

            if (durationTime && durationTime > 0) {
                tween.then(
                    cc.tween().delay(durationTime)
                );
            }

            tween.start();
        }

        if (!dead) {
            return;
        }

        if (durationTime > 0 && rotation) {
            let srcScale = this.node.scale - 0.2;
            let targetScale = this.node.scale + 0.2;

            cc.tween(this.node)
                .by(0.5, { rotation: 360 })
                .repeatForever()
                .start();

            let time = durationTime * 0.8;
            let time2 = (durationTime - time) / 2;
            cc.tween(this.node)
                .to(time, { scale: targetScale })
                .delay(time2)
                .to(time2, { scale: srcScale })
                .start();
        }

        // TODO 播放子魚被打死的音效
        { // 控制魚多久後被擊殺 
            let self = this;

            let tween = cc.tween(this.node);

            if (durationTime > 0) {
                tween.then(
                    cc.tween().delay(durationTime)
                );
            }

            tween.then(
                cc.tween()
                    .call(() => {
                        self.lockState = true;
                        self.node.destroy();
                    })
            );

            tween.start();
        }

        {// TODO 錢幣動畫、音效、錢包餘額增加

        }
    }

    public isPause(): boolean {
        return this.pause;
    }

    public isLockState(): boolean {
        return this.lockState;
    }

    public isInCanvas(): boolean {
        let width = this.node.parent.width / 2;
        let height = this.node.parent.height / 2;

        if (this.node.x >= -width && this.node.y >= -height
            && this.node.x <= width && this.node.y <= height) {
            return true;
        }

        return false;
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
            // 調整魚的旋轉角度
            let obj = self.calculatorRotation(lastPosition, currentPosition);
            self.node.rotation = obj.rotation + 180;

            // 調整魚的擺動速度
            var anim = this.node.getComponent(cc.Animation);
            anim.getAnimationState(this.node.name).speed *= speed;
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
        var anim = this.node.getComponent(cc.Animation);
        anim.getAnimationState(this.node.name).speed = this.speedFIsh;

        // 旋轉角度
        this.node.rotation = this.rotationFish - 180;
    }

    private updateXY(dt) {// 更新魚的 x、y座標
        {// 計時
            this.timerOfSleep += 1;
            if (this.timerOfSleep < this.fpsOfXY) {
                return;
            }
            this.timerOfSleep = 0;
        }

        { // 判斷是否要更新 targetPosIndex
            if (this.targetPosIndex >= this.fishPath.getSpeedOfPoint().length) {
                this.lockState = true;
                this.node.destroy();
                return;
            }

            let targetPos = this.fishPath.getPath()[this.targetPosIndex];
            let currentPos = new cc.Vec2(this.x, this.y);
            let distance = this.getDistance(targetPos, currentPos);

            // 目前位置和目標位置的距離小於等於移動距離時候, 就代表要前往下一個位置
            if (distance <= (this.speedXY * 1.2)) { // XXX 在思考有沒有更好的方式做判斷
                this.targetPosIndex += 1;
            }

            // 判斷已經到達最後一個座標點
            if (this.targetPosIndex >= this.fishPath.getSpeedOfPoint().length) {
                this.lockState = true;
                this.node.destroy();
                return;
            }
        }

        { // 旋轉 目前位置和目標位置 targetPosIndex rotationFish
            let currentPos = new cc.Vec2(this.x, this.y);
            let targetPos = this.fishPath.getPath()[this.targetPosIndex];
            let obj = this.calculatorRotation(targetPos, currentPos);
            this.rotationFish = obj.rotation;
        }

        { // 更新偏移 dx dy, 先做旋轉才能計算 dx dy
            this.dx = Math.sin((this.rotationFish * Math.PI) / 180) * this.speedXY;
            this.dy = Math.cos((this.rotationFish * Math.PI) / 180) * this.speedXY;
        }

        { // 更新xy x y
            this.x += this.dx;
            this.y += this.dy;
        }

        { // 更新移動速度 fpsOfXY
            this.fpsOfXY = this.fishPath.getSpeedOfPoint()[this.targetPosIndex];
        }

        { // 更新擺動尾巴速度 speedFIsh
            this.speedFIsh = this.fishPath.getSpeedOfObj()[this.targetPosIndex];
        }
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