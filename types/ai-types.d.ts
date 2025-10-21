enum StorageType {
    Fridge = "FRIDGE",
    Freezer = "FREEZER",
    Ambient = "AMBIENT"
}

interface FoodLifespan {
    type: StorageType,
    duration: number
}