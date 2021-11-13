
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
    public static Load(): boolean {
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

        // let arr = this.GetRoomLevel();
        // cc.log("GetRoomLevel:" + arr);
        // for (let i = 0; i < arr.length; i++) {
        //     let roomLevel = arr[i];
        //     let towerArr = this.GetTowerByRoomLevel(roomLevel);
        //     cc.log(`roomLevel:${roomLevel}, tower:` + JSON.stringify(towerArr));
        // }

        return true; // success
    }

    public static GetRoomLevel(): number[] {
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

    public static GetRoomNameByLevel(roomLevel: number): string {
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

    public static GetTowerByRoomLevel(roomLevel: number): Tower[] {
        let towerArr = this.towerMap.get(roomLevel);
        if (towerArr) {
            return Array.from(towerArr);
        }
        return [];
    }
}