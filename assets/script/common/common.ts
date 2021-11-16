
export class Result {
    public ok: boolean = false;
    public err: string = null;
}

export type Callback = (err: string) => void;

export function generateUUID(): string {
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * example:
 * min=1, max=3
 * 輸出可能會是 1,2,3 
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
};


export function equal(v1: string, v2: string): boolean {
    return parseFloat(v1) == parseFloat(v2);
}

export function greaterThan(v1: string, v2: string): boolean {
    return parseFloat(v1) > parseFloat(v2);
}

export function lessEqualThan(v1: string, v2: string): boolean {
    return parseFloat(v1) <= parseFloat(v2);
}

export function lessThan(v1: string, v2: string): boolean {
    return parseFloat(v1) < parseFloat(v2);
}

//加法
export function add(v1: string, v2: string): string {
    return `${accAdd(parseFloat(v1), parseFloat(v2))}`;
}

//減法
export function sub(v1: string, v2: string): string {
    return `${accSub(parseFloat(v1), parseFloat(v2))}`;
}

//加法
export function Mul(v1: string, v2: string): string {
    return `${accMul(parseFloat(v1), parseFloat(v2))}`;
}

//加法
function accAdd(arg1, arg2) {
    var r1, r2, m;
    try { r1 = arg1.toString().split(".")[1].length } catch (e) { r1 = 0 }
    try { r2 = arg2.toString().split(".")[1].length } catch (e) { r2 = 0 }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
}

//減法
function accSub(arg1, arg2) {
    var r1, r2, m, n;
    try {
        r1 = arg1.toString().split(".")[1].length;
    } catch (e) { r1 = 0 }
    try {
        r2 = arg2.toString().split(".")[1].length;
    } catch (e) { r2 = 0 }
    m = Math.pow(10, Math.max(r1, r2));
    n = (r1 >= r2) ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m);
}

//乘法
function accMul(arg1, arg2) {
    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length;
    } catch (e) { }
    try {
        m += s2.split(".")[1].length;
    } catch (e) { }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}

// 將數值字串修改成錢幣顯示方式
export function stringToDollar(value: string): string {
    let stringArray = value.split(".");

    let num = stringArray[0].split("");

    let result = "";
    let count = 0;
    for (let i = num.length - 1; i >= 0; i--) {
        count += 1;
        if (count % 3 == 0 && i != 0) {
            result = "," + num[i] + result;
        } else {
            result = num[i] + result;
        }
    }

    if (stringArray.length > 1) {
        result = result + "." + stringArray[1];
    }

    return result;
}