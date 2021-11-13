export enum EAction {
    loadRes, // 加載 resource目錄底下單個資源
    loadResDir, // 加載 resource目錄底下多個資源
}

export abstract class Args {

}

export class ResourcesArgs extends Args {
    path: string;
    type: typeof cc.Asset;

    constructor(
        path: string,
        type: typeof cc.Asset,
    ) {
        super();

        this.path = path;
        this.type = type;
    }
}

export class Loader {

    static async Resources(
        action: EAction,
        args: Args,
    ) {
        return new Promise((resolve) => {
            let path;
            let type;

            switch (action) {
                case EAction.loadRes:
                case EAction.loadResDir:
                    if (args instanceof ResourcesArgs) {
                        path = (<ResourcesArgs>args).path;
                        type = (<ResourcesArgs>args).type;
                    }
                    break;
                default:
                    resolve(new Error('enum not found, action:' + action))
                    break;
            }


            switch (action) {
                case EAction.loadRes:
                    cc.loader.loadRes(path, type, (err, resource) => {
                        if (err) {
                            resolve(err)
                        } else {
                            resolve(resource)
                        }
                    })
                    break;
                case EAction.loadResDir:
                    cc.loader.loadResDir(path, type, (err, resource) => {
                        if (err) {
                            resolve(err)
                        } else {
                            resolve(resource)
                        }
                    })
                    break;
            }
        });
    }
}
