import { add, sub, equal, lessThan, lessEqualThan } from './common';

export enum EWallet {
    Query, // 查詢
    Deposit,// 存款
    Pay, // 扣款
}

/**
 * 錢包操作成功的訊息只會有一種
 * 錯誤的訊息會做分類
 */
export enum EWalletResultAction {
    Success,

    // 錯誤類
    FailDontHaveEnoughMoney, // 餘額不足
    FailInputMoney, // 數值小於等於0.0
}

export class User {
    private static wallet: string = "0"; // 錢包

    private static roomLevel: number = 1; // 玩家選擇的房間, 預設歡樂廳
    private static towerIndex: number = 0; // 玩家選擇的押注, 預設選擇最小等級的砲塔

    private static auto: boolean = false; // 自動射擊
    private static focus: boolean = false; // 鎖定射擊

    private static gameState: number = 0; // 遊戲目前關卡

    public static setRoomLevel(roomLevel: number) {
        this.roomLevel = roomLevel;
    }

    public static getRoomLevel(): number {
        return this.roomLevel;
    }

    public static setTowerIndex(towerIndex: number) {
        this.towerIndex = towerIndex;
    }

    public static getTowerIndex(): number {
        return this.towerIndex;
    }

    public static setAuto(auto: boolean) {
        this.auto = auto;
    }

    public static isAuto(): boolean {
        return this.auto;
    }

    public static setFocus(focus: boolean) {
        this.focus = focus;
    }

    public static isFocus(): boolean {
        return this.focus;
    }

    public static getGameState(): number {
        return this.gameState;
    }

    public static setGameState(gameState: number) {
        this.gameState = gameState;
    }

    /**
     * 錢包操作
     */
    public static operatorWallet(action: EWallet, value: string): { result: EWalletResultAction, oldValue: string, newValue: string } {
        if (action == EWallet.Query) {
            return { result: EWalletResultAction.Success, oldValue: this.wallet, newValue: this.wallet };
        }

        if (!value || lessEqualThan(value, "0.0")) {
            return { result: EWalletResultAction.FailInputMoney, oldValue: this.wallet, newValue: this.wallet };
        }

        let oldValue = this.wallet;
        let newValue;

        switch (action) {
            case EWallet.Deposit:
                newValue = add(oldValue, value);
                break;

            case EWallet.Pay:
                if (lessThan(oldValue, value)) {// 餘額不足
                    return { result: EWalletResultAction.FailDontHaveEnoughMoney, oldValue: oldValue, newValue: oldValue };
                }
                newValue = sub(oldValue, value);
                break;
        }

        this.wallet = newValue;

        return { result: EWalletResultAction.Success, oldValue: oldValue, newValue: this.wallet };
    }
}