// Game constants and configuration
const BUILDING_TYPES = {
    house: { name: 'House', cost: { wood: 10 }, emoji: '🏠', produces: 'population', productionRate: 0.1 },
    farm: { name: 'Farm', cost: { wood: 5, stone: 3 }, emoji: '🌾', produces: 'food', productionRate: 0.5 },
    lumberyard: { name: 'Lumberyard', cost: { wood: 8, stone: 5 }, emoji: '🪓', produces: 'wood', productionRate: 0.3 },
    quarry: { name: 'Quarry', cost: { wood: 10, stone: 8 }, emoji: '⛏️', produces: 'stone', productionRate: 0.2 },
    tower: { name: 'Tower', cost: { wood: 15, stone: 10 }, emoji: '🗼', produces: 'defense', productionRate: 1 }
};