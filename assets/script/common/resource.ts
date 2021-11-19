
export class ResourcesManager {
    public static spriteAtlasMap: Map<string, cc.SpriteAtlas> = new Map(); // 圖檔資源
    public static prefabMap: Map<string, cc.Prefab> = new Map(); // Prefab資源

    private static fishSizeMap: Map<string, cc.Size> = new Map();

    /**
     * 查詢魚元件的大小
     * 需要事先定義好魚的 prefab
     * 
     * @param name 魚的名稱
     * @returns 
     */
    public static getContentSizeeByFishName(name: string): cc.Size {
        let size = this.fishSizeMap.get(name);
        if (size) {
            return new cc.Size(size.width, size.height);
        }

        let prefab = ResourcesManager.prefabMap.get(name);
        if (!prefab) {
            cc.log("error: prefab not found, name:" + name);
            return;
        }

        size = cc.instantiate(prefab).getContentSize();

        let newSize = new cc.Size(size.width, size.height);
        this.fishSizeMap.set(name, newSize);

        return new cc.Size(size.width, size.height);
    }
}