import { Mul, getRandomFloat, getRandomInt } from "../common/common";
import { ResourcesManager } from "../common/resource";

export class Collision {
    bulletCollider: cc.Node;
    fishCollider: cc.Node;
}

/**
 * 魚的組合
 */
export class FishPath {
    private name: string;
    private delay: number;
    private scale: number;
    private path: cc.Vec2[];
    private speedOfPoint: number[];
    private speedOfObj: number[];
    private notice: string;

    /**
     * 
     * @param name 魚的種類
     * @param delay 關卡開始後幾秒開始
     * @param scale 魚的大小
     * @param path 魚位移的路徑
     * @param speedOfPoint 每一個點的速度
     * @param speedOfObj 元件自身的速度
     * @param notice 進場通知動畫的 prefab名稱
     */
    constructor(
        name: string,
        delay: number,
        scale: number,
        path: cc.Vec2[],
        speedOfPoint: number[],
        speedOfObj: number[],
        notice?: string,
    ) {
        this.name = name;
        this.delay = delay;
        this.scale = scale;
        this.path = path;
        this.speedOfPoint = speedOfPoint;
        this.speedOfObj = speedOfObj;
        this.notice = notice;
    }

    public getName(): string {
        return this.name;
    }

    public getDelay(): number {
        return this.delay;
    }

    public getScale(): number {
        return this.scale;
    }

    public getPath(): cc.Vec2[] {
        return Array.from(this.path);
    }

    public getSpeedOfPoint(): number[] {
        return Array.from(this.speedOfPoint);
    }

    public getSpeedOfObj(): number[] {
        return Array.from(this.speedOfObj);
    }

    public getNotice(): string {
        return this.notice;
    }
}

/**
 * 技能種類
 */
export enum ESkill {
    Level_2, // 冰凍技能
    Level_3, // 閃電連鎖
    Level_4_1, // 普通子彈的雷電連鎖
    Level_4_2, // 電光炮
}

/**
 * 砲塔資訊
 */
export class Tower {
    private level: number;
    private bet: number;
    private base: number;
    private skillArr: ESkill[];

    constructor(
        level: number,
        bet: number,
        base: number,
        skillArr: ESkill[],
    ) {
        this.level = level;
        this.bet = bet;
        this.base = base;
        this.skillArr = skillArr;
    }

    public getLevel(): number {
        return this.level;
    }

    public getBet(): number {
        return this.bet;
    }

    public getBase(): number {
        return this.base;
    }

    public getSkillArr(): ESkill[] {
        if (!this.skillArr) {
            return [];
        }

        return Array.from(this.skillArr);
    }
}

/**
 * 讀取設定檔案
 * 
 * 歡樂聽:
 * 押注倍率 砲塔等級 技能
 * 0.1-0.4 level_1
 * 0.5-0.7 level_2 機率發動`冰凍技能`
 * 0.8-0.9 level_3 機率發動`閃電技能`
 * 1       level_4 機率發動`電光炮技能`,並且每一發子彈都會有`雷電光束`
 *
 * 王者廳: 歡樂廳的押注倍率*10
 * 神龍廳: 歡樂廳的押注倍率*100
 */
export class SettingManager {
    private static towerMap: Map<number, Tower[]> = new Map<number, Tower[]>();
    private static roomLevelArr: number[] = [];

    public static collisionArr: Collision[] = [];

    private static readySkill0402: boolean = false; // level4大砲技能發動中
    private static fireSkill0402: boolean = false; // level4大砲技能發射中

    // XXX 控制測試功能開啟/關閉的參數
    public static readonly showPathOfFish = false; // 開啟魚的行徑路線顯示
    public static readonly addFish = false; // 手動產生各種魚
    public static readonly changeGameStage = false; // 手動關卡切換

    /** 載入設定檔案 */
    public static load(): boolean {
        for (let roomLevel = 1; roomLevel <= 3; roomLevel++) {
            this.roomLevelArr.push(roomLevel);

            let base = Math.pow(10, (roomLevel - 1));

            let towerArr = [
                new Tower(1, 0.1, base, null),
                new Tower(1, 0.2, base, null),
                new Tower(1, 0.3, base, null),
                new Tower(1, 0.4, base, null),

                new Tower(2, 0.5, base, [ESkill.Level_2]),
                new Tower(2, 0.6, base, [ESkill.Level_2]),
                new Tower(2, 0.7, base, [ESkill.Level_2]),

                new Tower(3, 0.8, base, [ESkill.Level_3]),
                new Tower(3, 0.9, base, [ESkill.Level_3]),

                new Tower(4, 1, base, [ESkill.Level_4_1, ESkill.Level_4_2]),
            ];

            this.towerMap.set(roomLevel, towerArr);
        }

        return true; // success
    }

    /**
     * 技能4大砲發動中
     */
    public static isReadySkill0402(): boolean {
        return SettingManager.readySkill0402;
    }



    public static lockReadySkill0402(ms: number): boolean {
        if (SettingManager.readySkill0402) {
            return false;
        }

        SettingManager.readySkill0402 = true;

        setTimeout(() => {
            SettingManager.readySkill0402 = false;
        }, ms);

        return true;
    }

    public static isFireSkill0402(): boolean {
        return SettingManager.fireSkill0402;
    }

    public static lockFireSkill0402(lock: boolean) {
        SettingManager.fireSkill0402 = lock;
    }

    public static getRoomLevel(): number[] {
        return Array.from(this.roomLevelArr);
    }

    public static isVaildRoomLevel(roomLevel: number): boolean {
        for (let i = 0; i < this.roomLevelArr.length; i++) {
            if (this.roomLevelArr[i] == roomLevel) {
                return true;
            }
        }
        return false;
    }

    public static getRoomNameByLevel(roomLevel: number): string {
        switch (roomLevel) {
            case 1:
                return "歡樂廳";
            case 2:
                return "王者廳";
            case 3:
                return "神龍廳";
        }
        return "undefined";
    }

    public static getTowerByRoomLevel(roomLevel: number): Tower[] {
        let towerArr = this.towerMap.get(roomLevel);
        if (towerArr) {
            return Array.from(towerArr);
        }
        return [];
    }

    public static getFishPathArr(gameStage: number): FishPath[] {
        switch (gameStage) {
            case 1:
                return this.getFishPathByGameStage1();
            case 2:
                return this.getFishPathByGameStage2();
            case 3:
                return this.getFishPathByGameStage3();
        }
        return [];
    }

    /**
     * 每一關卡停留多少秒
     */
    public static getGameDelayByGameStage(gameStage: number): number {
        switch (gameStage) {
            case 1:
                return 30;
            case 2:
                return 60 * 2;
            case 3:
                return 60 * 3;
        }
        return 60;
    }

    private static getFishPathByGameStage1(): FishPath[] {
        let arr: FishPath[] = [];

        let totalTime = SettingManager.getGameDelayByGameStage(1) - 5; // -5秒避免要畫關卡了還產生新的魚

        for (let i = 1; i <= 19; i++) {
            let name = `fish_${i}`;
            let max = getRandomInt(1, 3);
            for (let i = 0; i < max; i++) {
                let scale = getRandomFloat(1, 1.2); // 魚的大小
                let obj = SettingManager.getRandomPath();
                let fishPath = new FishPath(
                    name,
                    getRandomFloat(1, totalTime), // 關卡開始後幾秒開始
                    scale,
                    obj.pathArr, // 魚的路徑
                    obj.speedOfPoint, // 點與點之間的移動速度
                    obj.speedOfObj); // 魚擺動尾巴的速度
                arr.push(fishPath);
            }
        }

        return arr;
    }

    private static getFishPathByGameStage2(): FishPath[] {
        let arr: FishPath[] = [];

        let totalTime = SettingManager.getGameDelayByGameStage(2) - 5; // -5秒避免要畫關卡了還產生新的魚

        for (let i = 1; i <= 19; i++) {
            let name = `fish_${i}`;
            let max = getRandomInt(1, 3);
            for (let i = 0; i < max; i++) {
                let scale = getRandomFloat(1, 1.2); // 魚的大小
                let obj = SettingManager.getRandomPath();
                let fishPath = new FishPath(
                    name,
                    getRandomFloat(1, totalTime), // 關卡開始後幾秒開始
                    scale,
                    obj.pathArr, // 魚的路徑
                    obj.speedOfPoint, // 點與點之間的移動速度
                    obj.speedOfObj); // 魚擺動尾巴的速度
                arr.push(fishPath);
            }
        }

        {
            let name = "fish_22";
            let scale = 1;
            let obj = SettingManager.getRandomPath();
            let fishPath = new FishPath(
                name,
                6, // 6秒後出現財神
                scale,
                obj.pathArr, // 魚的路徑
                obj.speedOfPoint, // 點與點之間的移動速度
                obj.speedOfObj, // 魚擺動尾巴的速度
                "notice_in_fish_22");// 進場通知動畫的 prefab名稱
            arr.push(fishPath);
        }

        return arr;
    }

    private static getFishPathByGameStage3(): FishPath[] {
        let arr: FishPath[] = [];

        let totalTime = SettingManager.getGameDelayByGameStage(3) - 5;;

        for (let i = 1; i <= 19; i++) {
            let name = `fish_${i}`;
            let max = getRandomInt(1, 3);
            for (let i = 0; i < max; i++) {
                let scale = getRandomFloat(1, 1.2); // 魚的大小
                let obj = SettingManager.getRandomPath();
                let fishPath = new FishPath(
                    name, // 魚的 prefab名稱
                    getRandomFloat(1, totalTime), // 關卡開始後幾秒開始
                    scale, // 魚的大小
                    obj.pathArr, // 魚的路徑
                    obj.speedOfPoint, // 點與點之間的移動速度
                    obj.speedOfObj); // 魚擺動尾巴的速度
                arr.push(fishPath);
            }
        }

        {
            let name = "fish_23";
            let scale = 1;
            let obj = SettingManager.getRandomPathForFish23();
            let fishPath = new FishPath(
                name,
                6, // 6秒後出現神龍
                scale,
                obj.pathArr,
                obj.speedOfPoint,
                obj.speedOfObj,
                "notice_in_fish_23");
            arr.push(fishPath);
        }

        return arr;
    }

    public static getRandomPathForFish23(): {
        pathArr: cc.Vec2[], // 位移的點
        speedOfPoint: number[], // 點與點之間的位移速度
        speedOfObj: number[], // 魚擺動尾巴的速度
    } {
        const countOfPath = 5; // 路線總共有幾個點, 點的間距要大於魚每一禎的位移距離, 不然會造成轉向問題

        // 畫面大小
        const width = 472;
        const height = 840;

        const defaultSpeed = 0.02118644067;
        const speedOfObj = getRandomFloat(0.7, 1.3);// 花費幾成的時間, 數字越小魚的移動速度和擺動尾巴速度就越快

        let pathArr: cc.Vec2[] = [];
        let speedOfPointArr: number[] = [];
        let speedOfObjArr: number[] = [];

        let obj = this.getStartAndEndPosition();
        let startPosition = new cc.Vec2(0, 0);// 神龍出現位置要在畫面中央  //obj.startPosition;
        let endPostion = obj.endPosititon;

        let positionArr: cc.Vec2[] = [];
        { // 起始點和結束點是對角位置, 路徑上有點單調, 因此隨機加入一些其他位置的點讓路線更豐富
            let centerPositionArr: cc.Vec2[] = [];
            {
                let count = 20;// 預計產生幾個目標點(影響龍的停留時間)
                for (let i = 0; i < count; i++) {
                    let nextPosX = getRandomInt(startPosition.x - (width / 2), startPosition.x + (width / 2));
                    let nextPosY = getRandomInt(startPosition.y - (height / 2), startPosition.y + (height / 2));
                    let nextPos = new cc.Vec2(nextPosX, nextPosY);
                    centerPositionArr.push(nextPos);
                }
            }

            let arr = [];
            arr.push(startPosition);

            for (let i = 0; i < centerPositionArr.length; i++) {
                let centerPosition = centerPositionArr[i];
                arr.push(centerPosition);
            }

            arr.push(endPostion);
            positionArr = arr;
        }

        let lastSpeed = speedOfObj;
        for (let i = 0; i < positionArr.length; i++) {
            let position = positionArr[i];
            if (i == 0) {
                pathArr.push(position);
                speedOfPointArr.push(2); // 一開始先停留多久才開始
                speedOfObjArr.push(1); // 沒任何影響, 但是要保留
                continue;
            }

            pathArr.push(position);

            let distance = this.getDistance(pathArr[pathArr.length - 1], pathArr[pathArr.length - 2]);
            let speed = lastSpeed + getRandomFloat(-0.1, 0.1); // 亂數增減魚的速度(擺尾巴和位移)
            if (speed < 0.2) {
                speed = 0.2;
            } else if (speed > 1.7) {
                speed = 1.7;
            }

            let speedOfPoint = distance * defaultSpeed * speed;

            speedOfPointArr.push(speedOfPoint); // 上一個座標到這一個座標的花費時間
            speedOfObjArr.push(1 + (1 - speed));

            lastSpeed = speed;
        }

        return { pathArr: pathArr, speedOfPoint: speedOfPointArr, speedOfObj: speedOfObjArr };
    }

    public static getRandomPath(): {
        pathArr: cc.Vec2[], // 位移的點
        speedOfPoint: number[], // 點與點之間的位移速度
        speedOfObj: number[], // 魚擺動尾巴的速度
    } {
        const countOfPath = 5; // 路線總共有幾個點, 點的間距要大於魚每一禎的位移距離, 不然會造成轉向問題

        // 畫面大小
        const width = 472;
        const height = 840;

        const defaultSpeed = 0.02118644067;
        const speedOfObj = getRandomFloat(0.7, 1.3);// 花費幾成的時間, 數字越小魚的移動速度和擺動尾巴速度就越快

        let pathArr: cc.Vec2[] = [];
        let speedOfPointArr: number[] = [];
        let speedOfObjArr: number[] = [];

        let obj = this.getStartAndEndPosition();
        let startPosition = obj.startPosition;
        let endPostion = obj.endPosititon;

        let positionArr: cc.Vec2[] = [];
        { // 起始點和結束點是對角位置, 路徑上有點單調, 因此隨機加入一些其他位置的點讓路線更豐富
            let centerPositionArr: cc.Vec2[] = [];
            {
                let count = 1; // 取出幾個中心點
                let arr: cc.Vec2[] = [];
                arr.push(startPosition);
                arr.push(endPostion);
                let arr2 = this.bezierCalculate(arr, arr.length + count); // 先取得兩點之間的中心點
                for (let i = 0; i < arr2.length; i++) {
                    if (i == 0 || i == (arr2.length - 1)) {
                        continue;
                    }
                    let centerPosition = new cc.Vec2( // 將中心點稍微偏離
                        getRandomInt(arr2[1].x - 400, arr2[1].x + 400),
                        getRandomInt(arr2[1].y - 400, arr2[1].y + 400),
                    );
                    centerPositionArr.push(centerPosition);
                }
            }

            let arr = [];
            arr.push(startPosition);

            for (let i = 0; i < centerPositionArr.length; i++) {
                let centerPosition = centerPositionArr[i];
                arr.push(centerPosition);
            }

            arr.push(endPostion);
            positionArr = this.bezierCalculate(arr, countOfPath);
        }

        let lastSpeed = speedOfObj;
        for (let i = 0; i < positionArr.length; i++) {
            let position = positionArr[i];
            if (i == 0) {
                pathArr.push(position);
                speedOfPointArr.push(2); // 一開始先停留多久才開始
                speedOfObjArr.push(1); // 沒任何影響, 但是要保留
                continue;
            }

            pathArr.push(position);

            let distance = this.getDistance(pathArr[pathArr.length - 1], pathArr[pathArr.length - 2]);
            let speed = lastSpeed + getRandomFloat(-0.1, 0.1); // 亂數增減魚的速度(擺尾巴和位移)
            if (speed < 0.2) {
                speed = 0.2;
            } else if (speed > 1.7) {
                speed = 1.7;
            }

            let speedOfPoint = distance * defaultSpeed * speed;

            speedOfPointArr.push(speedOfPoint); // 上一個座標到這一個座標的花費時間
            speedOfObjArr.push(1 + (1 - speed));

            lastSpeed = speed;
        }

        return { pathArr: pathArr, speedOfPoint: speedOfPointArr, speedOfObj: speedOfObjArr };
    }

    private static getStartAndEndPosition(): { startPosition: cc.Vec2, endPosititon: cc.Vec2 } {
        let positionArr = this.getTotalPosition();

        let length = positionArr.length;
        let startIndex = getRandomInt(0, length - 1); // 起始點
        let endIndex = startIndex + Math.floor(length / 2); // 取得起始點的對角位置做為結束點
        if (endIndex >= length) {
            endIndex = endIndex - length;
        }

        // 起始位置的+n個點則是結束位置
        return { startPosition: positionArr[startIndex], endPosititon: positionArr[endIndex] };
    }

    /** 取得事先分割好的起始點和結束點作為魚的路徑 */
    public static getTotalPosition(): cc.Vec2[] {
        // 畫面大小
        const width = 472;
        const height = 840;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const distance = width / 5; // 每一個點的間隔

        // 將整個畫面的周圍依據固定的間隔分割多個點
        let pointArr: cc.Vec2[] = [];

        let lastPoint = new cc.Vec2(-halfWidth, halfHeight);
        for (let i = 0; ; i++) { // 上
            let x = lastPoint.x + (i * distance);
            let y = lastPoint.y;
            let point = new cc.Vec2(x, y);
            pointArr.push(point);
            if (x >= halfWidth) {
                break;
            }
        }

        lastPoint = pointArr[pointArr.length - 1];
        for (let i = 1; ; i++) { // 右
            let x = lastPoint.x;
            let y = lastPoint.y - (i * distance);
            let point = new cc.Vec2(x, y);
            pointArr.push(point);
            if (y <= -halfHeight) {
                break;
            }
        }

        lastPoint = pointArr[pointArr.length - 1];
        for (let i = 1; ; i++) { // 下
            let x = lastPoint.x - (i * distance);
            let y = lastPoint.y;
            let point = new cc.Vec2(x, y);
            pointArr.push(point);
            if (x <= -halfWidth) {
                break;
            }
        }

        lastPoint = pointArr[pointArr.length - 1];
        for (let i = 1; ; i++) { // 左
            let x = lastPoint.x;
            let y = lastPoint.y + (i * distance);
            let point = new cc.Vec2(x, y);
            pointArr.push(point);
            if (y >= halfHeight) {
                break;
            }
        }

        return pointArr;
    }

    public static bezierCalculate(poss, precision) { // 包含頭尾
        precision -= 1;

        //维度，坐标轴数（二维坐标，三维坐标...）
        let dimersion = 2;

        //贝塞尔曲线控制点数（阶数）
        let number = poss.length;

        //控制点数不小于 2 ，至少为二维坐标系
        if (number < 2 || dimersion < 2)
            return null;

        let result = new Array();

        //计算杨辉三角
        let mi = new Array();
        mi[0] = mi[1] = 1;
        for (let i = 3; i <= number; i++) {

            let t = new Array();
            for (let j = 0; j < i - 1; j++) {
                t[j] = mi[j];
            }

            mi[0] = mi[i - 1] = 1;
            for (let j = 0; j < i - 2; j++) {
                mi[j + 1] = t[j] + t[j + 1];
            }
        }

        //计算坐标点
        for (let i = 0; i <= precision; i++) {
            let t = i / precision;
            // let p = new Point(0, 0);
            let p = {
                x: 0,
                y: 0,
            };
            result.push(p);
            for (let j = 0; j < dimersion; j++) {
                let temp = 0.0;
                for (let k = 0; k < number; k++) {
                    temp += Math.pow(1 - t, number - k - 1) * (j == 0 ? poss[k].x : poss[k].y) * Math.pow(t, k) * mi[k];
                }
                j == 0 ? p.x = temp : p.y = temp;
            }
            // p.x = this.toDecimal(p.x);
            // p.y = this.toDecimal(p.y);
        }

        // result.push(poss[poss.length-1])

        return result;
    }

    private static getDistance(a: cc.Vec2, b: cc.Vec2): number {
        let x = a.x - b.x;
        let y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    }

    public static getFishInfo(name: string, roomLevel?: number, towerLevel?: number, bet?: number): {
        winMin: number, // 反獎倍率最小值
        winMax: number, // 反獎倍率最大值(要大於最小值)
        showHp: boolean,// 顯示血條
        hp: number, // 血條, 攻擊成功時 hp會減 1, 並且獲得返獎, 如果 hp=0則魚會死亡, -1則不死
        size: number, // 0:小, 1:中 2:大 3:特大
        bonusKind: number, // 獎勵類型, 0:低, 1:高, 
        probability: number, // 播放音效機率
        rotation: boolean, // 魚是否要往目標位置旋轉
    } {
        switch (name) {
            case "fish_1":
                return { winMin: 2, winMax: 2, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_2":
                return { winMin: 2, winMax: 2, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_3":
                return { winMin: 3, winMax: 3, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_4":
                return { winMin: 4, winMax: 4, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_5":
                return { winMin: 5, winMax: 5, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_6":
                return { winMin: 6, winMax: 6, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_7":
                return { winMin: 7, winMax: 7, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_8":
                return { winMin: 8, winMax: 8, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_9":
                return { winMin: 9, winMax: 9, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.2, rotation: true };
            case "fish_10":
                return { winMin: 10, winMax: 10, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.3, rotation: true };
            case "fish_11":
                return { winMin: 12, winMax: 12, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.3, rotation: true };
            case "fish_12":
                return { winMin: 15, winMax: 15, showHp: false, hp: 1, size: 0, bonusKind: 0, probability: 0.3, rotation: true };
            case "fish_13":
                return { winMin: 18, winMax: 18, showHp: false, hp: 1, size: 1, bonusKind: 0, probability: 0.3, rotation: true };
            case "fish_14":
                return { winMin: 20, winMax: 20, showHp: false, hp: 1, size: 1, bonusKind: 0, probability: 0.3, rotation: true };
            case "fish_15":
                return { winMin: 25, winMax: 25, showHp: false, hp: 1, size: 1, bonusKind: 1, probability: 0.3, rotation: true };
            case "fish_16":
                return { winMin: 30, winMax: 30, showHp: false, hp: 1, size: 1, bonusKind: 1, probability: 0.3, rotation: true };
            case "fish_17":
                return { winMin: 40, winMax: 40, showHp: false, hp: 1, size: 1, bonusKind: 1, probability: 0.3, rotation: true };
            case "fish_18":
                return { winMin: 50, winMax: 50, showHp: false, hp: 1, size: 2, bonusKind: 1, probability: 0.3, rotation: true };
            case "fish_19":
                return { winMin: 80, winMax: 80, showHp: false, hp: 1, size: 2, bonusKind: 1, probability: 0.4, rotation: true };
            case "fish_22":
                return { winMin: 100, winMax: 300, showHp: false, hp: -1, size: 2, bonusKind: 1, probability: 1, rotation: false };
            case "fish_23":
                return { winMin: 50, winMax: 500, showHp: true, hp: 20, size: 2, bonusKind: 1, probability: 1, rotation: false };

        }

        cc.log("error undefined, name:" + name);
        return { winMin: 0, winMax: 0, showHp: false, hp: 0, size: 0, bonusKind: 0, probability: 0.0, rotation: true };
    }

    public static getNormalAttackInfo(
        fishName: string,
        towerLevel: number, // 砲塔等級 1-4
        roomLevel: number, // 房間等級(押注倍率)
        bet: number): { // 押注
            probability: number, // 擊殺機率
        } {
        switch (fishName) {
            case "fish_1":
                return { probability: 0.4 };
            case "fish_2":
                return { probability: 0.4 };
            case "fish_3":
                return { probability: 0.4 };
            case "fish_4":
                return { probability: 0.4 };
            case "fish_5":
                return { probability: 0.4 };
            case "fish_6":
                return { probability: 0.4 };
            case "fish_7":
                return { probability: 0.4 };
            case "fish_8":
                return { probability: 0.4 };
            case "fish_9":
                return { probability: 0.4 };
            case "fish_10":
                return { probability: 0.4 };
            case "fish_11":
                return { probability: 0.3 };
            case "fish_12":
                return { probability: 0.3 };
            case "fish_13":
                return { probability: 0.3 };
            case "fish_14":
                return { probability: 0.3 };
            case "fish_15":
                return { probability: 0.3 };
            case "fish_16":
                return { probability: 0.3 };
            case "fish_17":
                return { probability: 0.3 };
            case "fish_18":
                return { probability: 0.3 };
            case "fish_19":
                return { probability: 0.3 };
            case "fish_22":
                return { probability: 0.02 };
            case "fish_23":
                return { probability: 0.01 };
        }

        cc.log("error undefined, name:" + fishName);
        return { probability: 0.0 };
    }

    public static getSkillInfo(
        fishName: string,
        skill: ESkill,
        towerLevel: number,
        roomLevel: number,
        bet: number
    ): {
        probability: number, // 發動機率
        probability2: number, // 技能擊殺機率
        min: number, // 技能發動時至少攻擊幾隻
        max: number,  // 技能發動時最多攻擊幾隻, 至少設定1, 因為包含被普通攻擊的魚
        pauseMoveTime: number, // 被打到要暫停幾秒
        pauseSelfActionTime: number, //  花費多少時間停止擺動尾巴
        durationTime: number, // 技能動畫持續時間
    } {
        switch (skill) {
            case ESkill.Level_2:// 冰凍技能
                return { probability: 0.1, probability2: -1, min: 2, max: 4, pauseMoveTime: 6, pauseSelfActionTime: 6, durationTime: 6 };
            case ESkill.Level_3:// 閃電連鎖
                return { probability: 0.1, probability2: 0.3, min: 2, max: 4, pauseMoveTime: 2, pauseSelfActionTime: 0, durationTime: 2 };
            case ESkill.Level_4_1:// 普通子彈的雷電連鎖
                return { probability: 1, probability2: 0.1, min: 2, max: 4, pauseMoveTime: 0, pauseSelfActionTime: 0, durationTime: 2 };
            case ESkill.Level_4_2:// 電光炮
                return { probability: 0.1, probability2: 0.5, min: 0, max: 0, pauseMoveTime: 0, pauseSelfActionTime: 0, durationTime: 6 }; // 動畫時間 4.53s, 保留一點時間所以設定 6s
        }

        cc.log("error undefined, ESkill:" + skill);
        return { probability: 0, probability2: 0.5, min: 0, max: 0, pauseMoveTime: 0, pauseSelfActionTime: 0, durationTime: 0 };
    }

    public static isActive(probability: number): boolean {
        return getRandomFloat(0, 1) <= probability;
    }
}