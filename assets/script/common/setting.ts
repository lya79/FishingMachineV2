import { Mul, getRandomFloat, getRandomInt } from "../common/common";

/**
 * 魚的組合
 */
export class FishPath {
    private name: string;
    private delay: number;
    private speed: number;
    private scale: number;
    private path: cc.Vec2[];
    private speedOfPoint: number[];

    /**
     * 
     * @param name 魚的種類
     * @param delay 關卡開始後幾秒開始
     * @param speed 魚自身動畫的速度(並不是魚的移動)
     * @param scale 魚的大小
     * @param path 魚位移的路徑
     * @param speedOfPoint 每一個點的速度
     */
    constructor(
        name: string,
        delay: number,
        speed: number,
        scale: number,
        path: cc.Vec2[],
        speedOfPoint: number[],
    ) {
        this.name = name;
        this.delay = delay;
        this.speed = speed;
        this.scale = scale;
        this.path = path;
        this.speedOfPoint = speedOfPoint;
    }

    public getName(): string {
        return this.name;
    }

    public getDelay(): number {
        return this.delay;
    }

    public getSpeed(): number {
        return this.speed;
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
 * 技能資訊
 */
export class Skill {
    private skill: ESkill; // 技能種類
    private probability: number; // 發動技能的機率, 最小值帶入1, 假設帶入1則代表機率為 萬分之1

    constructor(skill: ESkill, probability: number) {
        this.skill = skill;
        this.probability = probability;
    }

    public getSkill(): number {
        return this.skill;
    }

    public getProbability(): number {
        return this.probability;
    }
}

/**
 * 砲塔資訊
 */
export class Tower {
    private level: number;
    private bet: number;
    private base: number;
    private skillArr: Skill[];

    constructor(
        level: number,
        bet: number,
        base: number,
        skillArr: Skill[],
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

    public getSkillArr(): Skill[] {
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

                new Tower(2, 0.5, base, [new Skill(ESkill.Level_2, 6000)]),
                new Tower(2, 0.6, base, [new Skill(ESkill.Level_2, 6000)]),
                new Tower(2, 0.7, base, [new Skill(ESkill.Level_2, 6000)]),

                new Tower(3, 0.8, base, [new Skill(ESkill.Level_3, 6000)]),
                new Tower(3, 0.9, base, [new Skill(ESkill.Level_3, 6000)]),

                new Tower(4, 1, base, [new Skill(ESkill.Level_4_1, 10000), new Skill(ESkill.Level_4_2, 6000)]),
            ];

            this.towerMap.set(roomLevel, towerArr);
        }

        return true; // success
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

    public static getGameLevel(): number[] {
        return [1, 2, 3];
    }

    public static getFishPathArr(gameStage: number): FishPath[] {
        switch (gameStage) {
            case 1:
                return this.getFishPathByGameLevel1();
                break;
            case 2:
                return this.getFishPathByGameLevel2();
                break;
            case 3:
                return this.getFishPathByGameLevel3();
                break;
        }
        return [];
    }

    /**
     * 每一關卡停留多少秒
     */
    public static getGameDelayByGameLevel(gameStage: number): number {
        switch (gameStage) {
            case 1:
                return 3000;//30; // XXX 測試
            case 2:
                return 60;
            case 3:
                return 90;
        }
        return 30;
    }

    private static getFishPathByGameLevel1(): FishPath[] {// TODO 需要增加更多種類的魚 
        let arr: FishPath[] = [];

        // {
        //     let name = "fish_1";
        //     let max = getRandomInt(5, 10);
        //     for (let i = 0; i < max; i++) {
        //         arr.push(new FishPath(
        //             name,
        //             getRandomFloat(1, 30),
        //             getRandomFloat(1, 3),
        //             getRandomFloat(1, 1.5),
        //             this.getRandomPath(),
        //         ));
        //     }
        // }

        return arr;
    }

    private static getFishPathByGameLevel2(): FishPath[] {// TODO 需要增加更多種類的魚 
        let arr: FishPath[] = [];
        return arr;
    }

    private static getFishPathByGameLevel3(): FishPath[] {// TODO 需要增加更多種類的魚 
        let arr: FishPath[] = [];
        return arr;
    }

    public static getRandomPath(): { pathArr: cc.Vec2[], speedOfPoint: number[] } {// TODO
        // 畫面大小
        let width = 472;
        let height = 840;

        let pathArr: cc.Vec2[] = [];
        let speedOfPoint: number[] = [];

        {
            let x = -(width / 2);
            let y = 0;
            pathArr.push(new cc.Vec2(x, y));
            speedOfPoint.push(1); // 一開始先停留多久才開始
        }

        {
            let x = 0;
            let y = -50;
            pathArr.push(new cc.Vec2(x, y));
            speedOfPoint.push(5); // 上一個座標到這一個座標的花費時間
        }

        {
            let x = (width / 2);
            let y = 0;
            pathArr.push(new cc.Vec2(x, y));
            speedOfPoint.push(5);
        }

        return { pathArr: pathArr, speedOfPoint: speedOfPoint };
    }
}