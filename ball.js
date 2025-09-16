// 获取当前脚本ID
const scriptId = getScriptId();

// 引入Font Awesome
if (!document.querySelector('link[href*="fontawesome"]')) {
  const fontAwesomeLink = document.createElement('link');
  fontAwesomeLink.rel = 'stylesheet';
  fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(fontAwesomeLink);
}

// 设置主按钮
replaceScriptButtons(scriptId, [{ name: 'Janusの百宝箱', visible: true }]);

// ==================== 波利大冒险系统代码开始 ====================

// 波利属性配置 - 随机属性范围系统
const POKEMON_TYPES = [
  {
    name: '火',
    emoji: '<i class="fas fa-fire"></i>',
    color: '#FF6B6B',
    attributeRanges: {
      攻击: { min: 12, max: 18 },
      特攻: { min: 16, max: 24 },
    },
  },
  {
    name: '水',
    emoji: '<i class="fas fa-tint"></i>',
    color: '#4ECDC4',
    attributeRanges: {
      特攻: { min: 12, max: 18 },
      特防: { min: 12, max: 18 },
    },
  },
  {
    name: '草',
    emoji: '<i class="fas fa-leaf"></i>',
    color: '#95E1D3',
    attributeRanges: {
      特攻: { min: 15, max: 21 },
      防御: { min: 9, max: 15 },
    },
  },
  {
    name: '雷',
    emoji: '<i class="fas fa-bolt"></i>',
    color: '#FFD93D',
    attributeRanges: {
      速度: { min: 16, max: 24 },
      特攻: { min: 12, max: 18 },
    },
  },
  {
    name: '冰',
    emoji: '<i class="fas fa-snowflake"></i>',
    color: '#B0E0E6',
    attributeRanges: {
      特攻: { min: 12, max: 18 },
      特防: { min: 12, max: 18 },
    },
  },
  {
    name: '岩',
    emoji: '<i class="fas fa-mountain"></i>',
    color: '#D4A574',
    attributeRanges: {
      攻击: { min: 8, max: 12 },
      防御: { min: 20, max: 30 },
    },
  },
  {
    name: '风',
    emoji: '<i class="fas fa-wind"></i>',
    color: '#87CEEB',
    attributeRanges: {
      速度: { min: 15, max: 21 },
      攻击: { min: 9, max: 15 },
    },
  },
];

// 进化阶段配置 - 改为经验值进化（养成游戏，越来越难进化）
const EVOLUTION_STAGES = [
  { name: '幼年期', minExp: 0, maxExp: 199, emoji: '<i class="fas fa-egg"></i>', bonusMultiplier: 1.0 },
  { name: '成长期', minExp: 200, maxExp: 599, emoji: '<i class="fas fa-star"></i>', bonusMultiplier: 1.2 },
  { name: '成熟期', minExp: 600, maxExp: 1199, emoji: '<i class="fas fa-gem"></i>', bonusMultiplier: 1.5 },
  { name: '完全体', minExp: 1200, maxExp: 2399, emoji: '<i class="fas fa-crown"></i>', bonusMultiplier: 2.0 },
  { name: '究极体', minExp: 2400, maxExp: 999999, emoji: '<i class="fas fa-certificate"></i>', bonusMultiplier: 3.0 },
];

// 波利食物配置
const POKEMON_FOODS = {
  火: [
    { name: '辣椒果', 饱食度: 30 },
    { name: '火龙果', 饱食度: 25 },
    { name: '烤肉', 饱食度: 35 },
  ],
  水: [
    { name: '蓝莓', 饱食度: 20 },
    { name: '海带', 饱食度: 25 },
    { name: '珍珠奶茶', 饱食度: 30 },
  ],
  草: [
    { name: '苹果', 饱食度: 25 },
    { name: '沙拉', 饱食度: 20 },
    { name: '蜂蜜', 饱食度: 30 },
  ],
  雷: [
    { name: '柠檬', 饱食度: 20 },
    { name: '能量饮料', 饱食度: 25 },
    { name: '香蕉', 饱食度: 30 },
  ],
  冰: [
    { name: '雪梨', 饱食度: 22 },
    { name: '薄荷', 饱食度: 15 },
    { name: '冰淇淋', 饱食度: 28 },
  ],
  岩: [
    { name: '土豆', 饱食度: 30 },
    { name: '花生', 饱食度: 25 },
    { name: '坚果', 饱食度: 25 },
  ],
  风: [
    { name: '樱桃', 饱食度: 18 },
    { name: '椰子', 饱食度: 28 },
    { name: '棉花糖', 饱食度: 20 },
  ],
  default: [
    { name: '饼干', 饱食度: 25 },
    { name: '营养块', 饱食度: 30 },
    { name: '树果', 饱食度: 20 },
  ],
};

// 战斗系统配置 - 按进化阶段分组
const BATTLE_OPPONENTS = {
  // 幼年期对手 (难度1-3) - 平衡难度分布，降低胜率
  幼年期: [
    { name: '野生小拉达', difficulty: 1, rewards: { 经验值: 8, 心情值: 8 } },
    { name: '胆小的绿毛虫', difficulty: 1, rewards: { 经验值: 6, 心情值: 6 } },
    { name: '迷路的小猫怪', difficulty: 1, rewards: { 经验值: 10, 心情值: 9 } },
    { name: '懒惰的呆呆兽', difficulty: 1, rewards: { 经验值: 7, 心情值: 7 } },
    { name: '调皮的波波', difficulty: 2, rewards: { 经验值: 12, 心情值: 12 } },
    { name: '好奇的走路草', difficulty: 2, rewards: { 经验值: 10, 心情值: 11 } },
    { name: '活泼的皮丘', difficulty: 2, rewards: { 经验值: 14, 心情值: 13 } },
    { name: '机灵的小磁怪', difficulty: 2, rewards: { 经验值: 11, 心情值: 10 } },
    { name: '温顺的小火龙', difficulty: 3, rewards: { 经验值: 16, 心情值: 15 } },
    { name: '害羞的杰尼龟', difficulty: 3, rewards: { 经验值: 18, 心情值: 16 } },
    { name: '聪明的妙蛙种子', difficulty: 3, rewards: { 经验值: 16, 心情值: 16 } },
    { name: '凶猛的烈雀', difficulty: 3, rewards: { 经验值: 20, 心情值: 18 } },
  ],

  // 成长期对手 (难度3-5) - 适度提升经验值，但保持养成难度
  成长期: [
    { name: '强壮的小火龙', difficulty: 3, rewards: { 经验值: 18, 心情值: 18 } },
    { name: '优雅的杰尼龟', difficulty: 3, rewards: { 经验值: 20, 心情值: 17 } },
    { name: '聪明的妙蛙种子', difficulty: 3, rewards: { 经验值: 16, 心情值: 16 } },
    { name: '凶猛的烈雀', difficulty: 3, rewards: { 经验值: 22, 心情值: 19 } },
    { name: '狡猾的尼多朗', difficulty: 4, rewards: { 经验值: 25, 心情值: 22 } },
    { name: '勇敢的腕力', difficulty: 4, rewards: { 经验值: 28, 心情值: 24 } },
    { name: '神秘的凯西', difficulty: 4, rewards: { 经验值: 24, 心情值: 20 } },
    { name: '坚硬的小拳石', difficulty: 4, rewards: { 经验值: 30, 心情值: 25 } },
    { name: '火爆的火恐龙', difficulty: 5, rewards: { 经验值: 35, 心情值: 28 } },
    { name: '冷静的卡咪龟', difficulty: 5, rewards: { 经验值: 32, 心情值: 26 } },
  ],

  // 成熟期对手 (难度5-7) - 经验值适度增长，保持养成挑战性
  成熟期: [
    { name: '沉稳的妙蛙草', difficulty: 5, rewards: { 经验值: 30, 心情值: 25 } },
    { name: '电光的皮卡丘', difficulty: 5, rewards: { 经验值: 35, 心情值: 30 } },
    { name: '威武的尼多王', difficulty: 6, rewards: { 经验值: 40, 心情值: 35 } },
    { name: '强力的豪力', difficulty: 6, rewards: { 经验值: 42, 心情值: 37 } },
    { name: '睿智的胡地', difficulty: 6, rewards: { 经验值: 38, 心情值: 33 } },
    { name: '坚韧的隆隆岩', difficulty: 6, rewards: { 经验值: 45, 心情值: 38 } },
    { name: '霸气的喷火龙', difficulty: 7, rewards: { 经验值: 50, 心情值: 45 } },
    { name: '威严的水箭龟', difficulty: 7, rewards: { 经验值: 48, 心情值: 43 } },
    { name: '庄重的妙蛙花', difficulty: 7, rewards: { 经验值: 46, 心情值: 41 } },
    { name: '雷电的雷丘', difficulty: 7, rewards: { 经验值: 52, 心情值: 46 } },
  ],

  // 完全体对手 (难度7-9) - 经验值增长但保持挑战性
  完全体: [
    { name: '恐怖的耿鬼', difficulty: 7, rewards: { 经验值: 55, 心情值: 50 } },
    { name: '钢铁的大钢蛇', difficulty: 7, rewards: { 经验值: 60, 心情值: 53 } },
    { name: '烈焰的风速狗', difficulty: 8, rewards: { 经验值: 65, 心情值: 49 } },
    { name: '冰冷的急冻鸟', difficulty: 8, rewards: { 经验值: 70, 心情值: 55 } },
    { name: '龙息的快龙', difficulty: 8, rewards: { 经验值: 68, 心情值: 54 } },
    { name: '超能的超梦', difficulty: 8, rewards: { 经验值: 72, 心情值: 56 } },
    { name: '雷鸣的闪电鸟', difficulty: 9, rewards: { 经验值: 80, 心情值: 60 } },
    { name: '烈火的火焰鸟', difficulty: 9, rewards: { 经验值: 85, 心情值: 63 } },
    { name: '古老的化石翼龙', difficulty: 9, rewards: { 经验值: 75, 心情值: 58 } },
    { name: '神秘的梦幻', difficulty: 9, rewards: { 经验值: 90, 心情值: 65 } },
  ],

  // 究极体对手 (难度9-10) - 最高阶段，经验值丰富但仍需努力
  究极体: [
    { name: '传说的洛奇亚', difficulty: 9, rewards: { 经验值: 95, 心情值: 75 } },
    { name: '凤凰的凤王', difficulty: 9, rewards: { 经验值: 90, 心情值: 72 } },
    { name: '时空的帝牙卢卡', difficulty: 10, rewards: { 经验值: 110, 心情值: 80 } },
    { name: '反转的骑拉帝纳', difficulty: 10, rewards: { 经验值: 105, 心情值: 78 } },
    { name: '创世的阿尔宙斯', difficulty: 10, rewards: { 经验值: 120, 心情值: 85 } },
    { name: '海洋的盖欧卡', difficulty: 10, rewards: { 经验值: 115, 心情值: 82 } },
    { name: '大地的固拉多', difficulty: 10, rewards: { 经验值: 112, 心情值: 81 } },
    { name: '天空的烈空坐', difficulty: 10, rewards: { 经验值: 118, 心情值: 84 } },
    { name: '光辉的奈克洛兹玛', difficulty: 10, rewards: { 经验值: 122, 心情值: 86 } },
    { name: '永恒的无极汰那', difficulty: 10, rewards: { 经验值: 125, 心情值: 88 } },
  ],
};

// 生成随机属性值
function generateRandomAttributes(attributeRanges) {
  const attributes = {};

  for (const [attrName, range] of Object.entries(attributeRanges)) {
    // 在范围内生成随机值
    const randomValue = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    attributes[attrName] = randomValue;
  }

  return attributes;
}

// 获取属性值的颜色（根据在范围内的位置）
function getAttributeColor(value, range) {
  const percentage = (value - range.min) / (range.max - range.min);

  if (value >= range.max) {
    // 满分或超过满分极品 - 橙红色
    return '#FF4500';
  } else if (percentage >= 0.8) {
    // 稀有（接近满分） - 紫色
    return '#9C27B0';
  } else if (percentage >= 0.5) {
    // 良好 - 蓝色
    return '#2196F3';
  } else {
    // 普通 - 默认颜色
    return '#666';
  }
}

// 获取属性值的样式（纯颜色，普通字体）
function getAttributeStyle(value, range) {
  const color = getAttributeColor(value, range);
  return `color: ${color};`;
}

// 随机生成波利属性（单属性）
function generateRandomTypes() {
  const selectedTypes = [];
  const availableTypes = [...POKEMON_TYPES];

  // 只选择一个属性
  const randomIndex = Math.floor(Math.random() * availableTypes.length);
  const selectedType = availableTypes[randomIndex];

  // 创建新的类型对象，不再包含effects字段
  const typeWithoutEffects = {
    ...selectedType,
  };

  selectedTypes.push(typeWithoutEffects);

  return selectedTypes;
}

// 计算属性加成
function calculateTypeBonus(types) {
  const bonus = {};
  types.forEach(type => {
    // 为每个属性类型生成随机属性值
    if (type.attributeRanges) {
      const randomAttributes = generateRandomAttributes(type.attributeRanges);
      Object.entries(randomAttributes).forEach(([key, value]) => {
        bonus[key] = (bonus[key] || 0) + value;
      });
    }
  });
  return bonus;
}

// 根据波利属性获取合适的食物
function getFoodForPokemon(pokemonTypes) {
  const availableFoods = [];

  // 根据波利属性添加对应食物
  pokemonTypes.forEach(type => {
    if (POKEMON_FOODS[type.name]) {
      availableFoods.push(...POKEMON_FOODS[type.name]);
    }
  });

  // 添加通用食物
  availableFoods.push(...POKEMON_FOODS.default);

  // 随机选择一个食物
  const selectedFood = availableFoods[Math.floor(Math.random() * availableFoods.length)];

  // 创建食物对象，饱食度固定，其他属性完全随机
  const food = {
    name: selectedFood.name,
    effects: {
      饱食度: selectedFood.饱食度,
    },
  };

  // 随机生成1-3个副属性
  const numBonusEffects = 1 + Math.floor(Math.random() * 3); // 1-3个副属性
  const possibleAttributes = ['生命值', '心情值', '清洁度', '经验值'];
  const usedAttributes = new Set();

  for (let i = 0; i < numBonusEffects; i++) {
    // 随机选择一个还没用过的属性
    const availableAttributes = possibleAttributes.filter(attr => !usedAttributes.has(attr));
    if (availableAttributes.length === 0) break;

    const randomAttribute = availableAttributes[Math.floor(Math.random() * availableAttributes.length)];
    const randomValue = 5 + Math.floor(Math.random() * 16); // 5-20点随机

    food.effects[randomAttribute] = randomValue;
    usedAttributes.add(randomAttribute);
  }

  return food;
}

// 生成随机数值
function getRandomValue(base, variance = 0.3) {
  const min = Math.floor(base * (1 - variance));
  const max = Math.floor(base * (1 + variance));
  return Math.max(1, min + Math.floor(Math.random() * (max - min + 1)));
}

// 生成随机冒险时间（1-6小时）
function getRandomAdventureTime() {
  return 1 + Math.random() * 5; // 1-6小时
}

// 计算属性品质加成
function calculateAttributeQualityBonus(pokemonData) {
  const 属性加成 = pokemonData.属性加成 || {};
  const type = pokemonData.属性列表[0];
  if (!type || !type.attributeRanges) return 1.0;

  const attributeRanges = type.attributeRanges;
  let totalQualityBonus = 0;
  let attributeCount = 0;

  // 计算每个属性的品质加成
  Object.entries(属性加成).forEach(([attrName, value]) => {
    const range = attributeRanges[attrName];
    if (range) {
      const percentage = (value - range.min) / (range.max - range.min);
      let qualityBonus = 0;

      if (value >= range.max) {
        // 极品属性：50%战斗力加成
        qualityBonus = 0.5;
      } else if (percentage >= 0.8) {
        // 稀有属性：35%战斗力加成
        qualityBonus = 0.35;
      } else if (percentage >= 0.5) {
        // 良好属性：20%战斗力加成
        qualityBonus = 0.2;
      } else {
        // 普通属性：无加成
        qualityBonus = 0;
      }

      totalQualityBonus += qualityBonus;
      attributeCount++;
    }
  });

  // 返回平均品质加成倍数
  return attributeCount > 0 ? 1.0 + totalQualityBonus / attributeCount : 1.0;
}

// 计算物理战斗力
function calculatePhysicalPower(pokemonData) {
  const 属性加成 = pokemonData.属性加成 || {};
  const evolutionMultiplier = pokemonData.进化加成 || 1.0;

  // 应用进化加成到属性
  const 攻击 = Math.floor((属性加成.攻击 || 0) * evolutionMultiplier);
  const 防御 = Math.floor((属性加成.防御 || 0) * evolutionMultiplier);
  const 速度 = Math.floor((属性加成.速度 || 0) * evolutionMultiplier);

  const basePower = 15; // 物理基础战斗力
  const levelBonus = Math.floor((pokemonData.经验值 || 0) / 40);
  const healthBonus = Math.floor((pokemonData.生命值 || 0) / 15);
  const happinessBonus = Math.floor((pokemonData.心情值 || 0) / 20);

  // 计算属性品质加成
  const qualityMultiplier = calculateAttributeQualityBonus(pokemonData);

  const rawPower = basePower + 攻击 + 防御 * 0.5 + 速度 * 0.3 + levelBonus + healthBonus + happinessBonus;
  return Math.floor(rawPower * qualityMultiplier);
}

// 计算特殊战斗力
function calculateSpecialPower(pokemonData) {
  const 属性加成 = pokemonData.属性加成 || {};
  const evolutionMultiplier = pokemonData.进化加成 || 1.0;

  // 应用进化加成到属性
  const 特攻 = Math.floor((属性加成.特攻 || 0) * evolutionMultiplier);
  const 特防 = Math.floor((属性加成.特防 || 0) * evolutionMultiplier);
  const 速度 = Math.floor((属性加成.速度 || 0) * evolutionMultiplier);

  const basePower = 15; // 特殊基础战斗力
  const levelBonus = Math.floor((pokemonData.经验值 || 0) / 40);
  const healthBonus = Math.floor((pokemonData.生命值 || 0) / 15);
  const happinessBonus = Math.floor((pokemonData.心情值 || 0) / 20);

  // 计算属性品质加成
  const qualityMultiplier = calculateAttributeQualityBonus(pokemonData);

  const rawPower = basePower + 特攻 + 特防 * 0.5 + 速度 * 0.3 + levelBonus + healthBonus + happinessBonus;
  return Math.floor(rawPower * qualityMultiplier);
}

// 计算综合战斗力（取物理和特殊的较高值）
function calculateBattlePower(pokemonData) {
  const physicalPower = calculatePhysicalPower(pokemonData);
  const specialPower = calculateSpecialPower(pokemonData);
  return Math.max(physicalPower, specialPower);
}

// 计算逃跑概率（统一设置）
function calculateEscapeChance(pokemonData) {
  const 属性加成 = pokemonData.属性加成 || {};
  const evolutionMultiplier = pokemonData.进化加成 || 1.0;

  // 应用进化加成到速度
  const 速度 = Math.floor((属性加成.速度 || 0) * evolutionMultiplier);
  const speedBonus = 速度 * 0.3; // 降低速度影响，统一逃跑概率
  const baseEscape = 0.1; // 基础10%逃跑率
  return Math.min(0.15, baseEscape + speedBonus / 100); // 最高15%
}

// 根据进化阶段选择对手
function selectOpponentByStage(evolutionStage) {
  const stageOpponents = BATTLE_OPPONENTS[evolutionStage];
  if (!stageOpponents || stageOpponents.length === 0) {
    // 如果没有对应阶段的对手，使用幼年期对手
    return BATTLE_OPPONENTS['幼年期'][Math.floor(Math.random() * BATTLE_OPPONENTS['幼年期'].length)];
  }
  return stageOpponents[Math.floor(Math.random() * stageOpponents.length)];
}

// 计算对手逃跑概率（统一设置）
function calculateOpponentEscapeChance(opponent, pokemonBattlePower) {
  const powerDifference = pokemonBattlePower - opponent.difficulty * 10;
  if (powerDifference > 20) {
    return 0.15; // 我方明显更强，对手15%概率逃跑
  } else if (powerDifference < -20) {
    return 0.05; // 对手明显更强，只有5%概率逃跑
  }
  return 0.08; // 正常情况8%概率
}

// 应用属性加成到各种活动
function applyAttributeBonus(pokemonData, baseValue, attributeType) {
  const 属性加成 = pokemonData.属性加成 || {};
  const bonus = 属性加成[attributeType] || 0;
  return Math.floor(baseValue * (1 + bonus / 100)); // 属性加成按百分比计算
}

// 生成随机冒险结果（不依赖事件池）
function generateRandomAdventureResult(adventureDuration = 1) {
  // 随机决定冒险结果类型（70%正面，30%负面）
  const isPositive = Math.random() < 0.7;
  const type = isPositive ? 'positive' : 'negative';

  // 生成随机效果
  const effects = generateRandomAdventureEffects(type, adventureDuration);

  return {
    type: type,
    effects: effects,
  };
}

// 生成随机冒险效果
function generateRandomAdventureEffects(eventType, adventureDuration = 1) {
  const effects = {};
  const allAttributes = ['经验值', '生命值', '饱食度', '心情值', '清洁度'];

  // 根据冒险时间计算奖励倍数
  let rewardMultiplier = 1;
  if (adventureDuration <= 0.5) {
    rewardMultiplier = 0.8; // 短途冒险：80%奖励
  } else if (adventureDuration <= 1) {
    rewardMultiplier = 1.0; // 近郊冒险：100%奖励
  } else if (adventureDuration <= 2) {
    rewardMultiplier = 1.3; // 远足冒险：130%奖励
  } else if (adventureDuration <= 4) {
    rewardMultiplier = 1.6; // 探索冒险：160%奖励
  } else {
    rewardMultiplier = 2.0; // 史诗冒险：200%奖励
  }

  // 随机选择2-4个属性受影响
  const numEffects = 2 + Math.floor(Math.random() * 3); // 2-4个效果
  const selectedAttributes = [];

  // 随机选择属性
  for (let i = 0; i < numEffects; i++) {
    const availableAttributes = allAttributes.filter(attr => !selectedAttributes.includes(attr));
    if (availableAttributes.length === 0) break;

    const randomAttribute = availableAttributes[Math.floor(Math.random() * availableAttributes.length)];
    selectedAttributes.push(randomAttribute);

    // 根据事件类型生成数值
    if (eventType === 'positive') {
      // 正面事件：大部分是正值，少数可能是负值（代价）
      if (randomAttribute === '经验值') {
        // 经验值永远只能增加
        effects[randomAttribute] = Math.floor((10 + Math.floor(Math.random() * 31)) * rewardMultiplier); // 基础10-40点 * 倍数
      } else if (Math.random() < 0.8) {
        // 80%概率是正面效果
        effects[randomAttribute] = Math.floor((10 + Math.floor(Math.random() * 31)) * rewardMultiplier); // 基础10-40点 * 倍数
      } else {
        // 20%概率是负面代价（不受奖励倍数影响）
        effects[randomAttribute] = -(5 + Math.floor(Math.random() * 16)); // -5到-20点
      }
    } else {
      // 负面事件：大部分是负值，少数可能是正值（学习经验）
      if (randomAttribute === '经验值') {
        // 经验值永远只能增加，负面事件也能获得少量经验（学习经验）
        effects[randomAttribute] = Math.floor((5 + Math.floor(Math.random() * 16)) * rewardMultiplier); // 基础5-20点 * 倍数
      } else if (Math.random() < 0.8) {
        // 80%概率是负面效果（不受奖励倍数影响）
        effects[randomAttribute] = -(10 + Math.floor(Math.random() * 31)); // -10到-40点
      } else {
        // 20%概率是正面收获
        effects[randomAttribute] = Math.floor((5 + Math.floor(Math.random() * 16)) * rewardMultiplier); // 基础5-20点 * 倍数
      }
    }
  }

  return effects;
}

// 根据经验值计算进化阶段
function getEvolutionStage(exp) {
  for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
    const stage = EVOLUTION_STAGES[i];
    if (exp >= stage.minExp) {
      return { stage: stage.name, emoji: stage.emoji, bonusMultiplier: stage.bonusMultiplier };
    }
  }

  return {
    stage: EVOLUTION_STAGES[0].name,
    emoji: EVOLUTION_STAGES[0].emoji,
    bonusMultiplier: EVOLUTION_STAGES[0].bonusMultiplier,
  };
}

// 获取波利数据
async function getPokemonData() {
  try {
    const variables = await getVariables({ type: 'script', script_id: scriptId });

    if (variables.波利) {
      // 更新进化阶段
      const evolutionData = getEvolutionStage(variables.波利.经验值);
      variables.波利.进化阶段 = evolutionData.stage;
      variables.波利.进化图标 = evolutionData.emoji;
      variables.波利.进化加成 = evolutionData.bonusMultiplier;
      return variables.波利;
    }

    // 新建波利的默认数据
    const randomTypes = generateRandomTypes();
    const typeBonus = calculateTypeBonus(randomTypes);
    const evolutionData = getEvolutionStage(0);

    return {
      名字: '波利',
      属性列表: randomTypes,
      属性加成: typeBonus,
      生命值: 100,
      饱食度: 80,
      心情值: 70,
      清洁度: 90,
      经验值: 0,
      最后互动时间: new Date().toISOString(),
      创建时间: new Date().toISOString(),
      总互动次数: 0,
      进化阶段: evolutionData.stage,
      进化图标: evolutionData.emoji,
      进化加成: evolutionData.bonusMultiplier,
      冒险状态: false,
      冒险开始时间: null,
      上次随机事件时间: new Date().toISOString(),
      互动记录: [],
      重要记录: [],
    };
  } catch (error) {
    console.error('获取波利数据失败:', error);
    console.error('错误详情:', error.name, error.message, error.stack);

    // 显示用户友好的错误信息
    toastr.error('获取波利数据失败: ' + (error.message || '未知错误'));

    const randomTypes = generateRandomTypes();
    const typeBonus = calculateTypeBonus(randomTypes);
    const evolutionData = getEvolutionStage(0);
    return {
      名字: '波利',
      属性列表: randomTypes,
      属性加成: typeBonus,
      生命值: 100,
      饱食度: 80,
      心情值: 70,
      清洁度: 90,
      经验值: 0,
      最后互动时间: new Date().toISOString(),
      创建时间: new Date().toISOString(),
      总互动次数: 0,
      进化阶段: evolutionData.stage,
      进化图标: evolutionData.emoji,
      进化加成: evolutionData.bonusMultiplier,
      冒险状态: false,
      冒险开始时间: null,
      上次随机事件时间: new Date().toISOString(),
      互动记录: [],
      重要记录: [],
    };
  }
}

// 保存波利数据
async function savePokemonData(pokemonData) {
  try {
    // 检查数据是否有效
    if (!pokemonData) {
      throw new Error('波利数据为空');
    }

    // 尝试序列化数据以检查是否有循环引用
    try {
      JSON.stringify(pokemonData);
    } catch (serializeError) {
      console.error('数据序列化失败:', serializeError);
      throw new Error('数据格式错误，无法保存');
    }

    await insertOrAssignVariables(
      {
        波利: pokemonData,
      },
      { type: 'script', script_id: scriptId },
    );
  } catch (error) {
    console.error('保存波利数据失败:', error);
    console.error('错误详情:', error.name, error.message, error.stack);

    // 显示用户友好的错误信息
    toastr.error('保存波利数据失败: ' + (error.message || '未知错误'));

    // 重新抛出错误，让调用者知道保存失败
    throw error;
  }
}

// 计算时间流逝对波利的影响
function calculateTimeEffect(pokemonData) {
  const now = new Date();
  const lastInteraction = new Date(pokemonData.最后互动时间);
  const hoursElapsed = (now - lastInteraction) / (1000 * 60 * 60);

  if (hoursElapsed > 0 && !pokemonData.冒险状态) {
    // 只有不在冒险时才会因时间流逝而属性下降
    pokemonData.饱食度 = Math.max(0, pokemonData.饱食度 - Math.floor(hoursElapsed * 2));
    pokemonData.心情值 = Math.max(0, pokemonData.心情值 - Math.floor(hoursElapsed * 1));
    pokemonData.清洁度 = Math.max(0, pokemonData.清洁度 - Math.floor(hoursElapsed * 0.5));

    if (pokemonData.饱食度 < 30) {
      pokemonData.生命值 = Math.max(1, pokemonData.生命值 - Math.floor(hoursElapsed * 0.5));
    }
  }

  return pokemonData;
}

// 检查冒险状态
async function checkAdventureStatus(pokemonData) {
  if (!pokemonData.冒险状态 || !pokemonData.冒险开始时间) {
    return null;
  }

  const now = new Date();
  const adventureStart = new Date(pokemonData.冒险开始时间);
  const hoursElapsed = (now - adventureStart) / (1000 * 60 * 60);

  // 使用存储的冒险持续时间，如果没有则使用随机时间（向后兼容）
  const adventureDuration = pokemonData.冒险持续时间 || getRandomAdventureTime();

  if (hoursElapsed >= adventureDuration) {
    // 冒险结束，生成随机的冒险结果（不依赖事件池）
    const adventureResult = generateRandomAdventureResult(adventureDuration);

    // 应用随机效果（添加属性加成）
    for (const [stat, value] of Object.entries(adventureResult.effects)) {
      if (stat === '经验值') {
        // 经验值只能增加，不能减少
        if (value > 0) {
          const bonusExp = applyAttributeBonus(pokemonData, value, '经验获取');
          const finalExp = Math.floor(bonusExp * pokemonData.进化加成);
          pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
        }
      } else if (stat === '生命值') {
        const bonusValue = value > 0 ? applyAttributeBonus(pokemonData, Math.abs(value), '恢复力') : Math.abs(value);
        const actualValue = value < 0 ? -bonusValue : bonusValue;
        pokemonData[stat] = Math.max(0, Math.min(100, pokemonData[stat] + actualValue));
      } else {
        // 其他属性限制在100以内，但经验值不受此限制
        pokemonData[stat] = Math.max(0, Math.min(100, pokemonData[stat] + value));
      }
    }

    pokemonData.冒险状态 = false;
    pokemonData.冒险开始时间 = null;
    pokemonData.冒险持续时间 = null; // 清除冒险持续时间
    pokemonData.最后互动时间 = now.toISOString();

    // 添加冒险记录（简化版本）
    addInteractionRecord(
      pokemonData,
      `冒险归来：${adventureResult.type === 'positive' ? '收获满满' : '虽有挫折但收获经验'}`,
    );

    // 冒险结束时重新启动漫游（如果界面是打开的）
    if ($('#pokemon-popup').length > 0) {
      setTimeout(() => {
        startPokemonRoaming(pokemonData);
      }, 1000); // 延迟1秒启动，让用户看到冒险结束的效果
    }

    // 随机决定是否带礼物回来（75%概率带礼物，25%概率不带）
    const bringGift = Math.random() < 0.75;
    let gift = null;

    if (bringGift) {
      // 生成随机礼物，记录到互动历史和图鉴
      gift = generateRandomGift(pokemonData);
      addInteractionRecord(pokemonData, `带回了${gift}作为礼物`);
      await recordGiftToCollection(gift, pokemonData);
    } else {
      // 没有带礼物回来
      addInteractionRecord(pokemonData, '这次冒险没有带礼物回来，但收获了宝贵的经验');
    }

    // 保存冒险信息，准备生成信件（但不立即生成）
    pokemonData.待生成信件 = {
      adventureResult: adventureResult,
      gift: gift, // 可能为null
      adventureDuration: adventureDuration,
      timestamp: new Date().toISOString(),
    };

    // 立即显示信封图标
    if ($('#adventure-letter-icon').length > 0) {
      $('#adventure-letter-icon').show().addClass('new-letter');
    }

    // 添加简单通知到心灵沟通
    await saveMindChatMessage(`我给主人写了一封冒险信件！快来看看吧！`, new Date(), pokemonData);

    return adventureResult;
  }

  return null;
}

// 添加互动记录
function addInteractionRecord(pokemonData, action) {
  const now = new Date();
  const timeStr = now
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');

  // 检查action是否已经包含波利名字（对话内容），如果包含就不重复添加
  let record;
  if (action.includes(`${pokemonData.名字}：`)) {
    // 对话内容已经包含名字，直接使用
    record = `[${timeStr}] ${action}`;
  } else {
    // 普通行为记录，需要添加名字
    record = `[${timeStr}] ${pokemonData.名字}${action}`;
  }

  if (!pokemonData.互动记录) {
    pokemonData.互动记录 = [];
  }

  pokemonData.互动记录.push(record);

  // 保持最多30条记录
  if (pokemonData.互动记录.length > 30) {
    pokemonData.互动记录.shift();
  }
}

// 添加重要记录
function addImportantRecord(pokemonData, event) {
  const now = new Date();
  const timeStr = now
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');

  const record = `[${timeStr}] ${event}`;

  if (!pokemonData.重要记录) {
    pokemonData.重要记录 = [];
  }

  pokemonData.重要记录.push(record);
  // 重要时刻不设上限，保存所有核心事件
}

// 添加战斗记录到互动历史
async function addBattleRecord(pokemonData, result, opponent) {
  let resultText = '';
  if (result === 'victory') {
    resultText = `战胜了${opponent}`;
    addInteractionRecord(pokemonData, resultText);
  } else if (result === 'defeat') {
    resultText = `被${opponent}击败`;
    addInteractionRecord(pokemonData, resultText);
  } else if (result === 'escape') {
    resultText = `从${opponent}面前逃跑`;
    addInteractionRecord(pokemonData, resultText);
  } else if (result === 'opponent_escape') {
    // 对手逃跑的情况，不需要添加Pokemon名字，直接记录事件
    resultText = `对手${opponent}逃跑了`;
    addDirectRecord(pokemonData, resultText);
  }

  // 记录对手到图鉴
  await recordOpponentToCollection(opponent, result, pokemonData);
}

// 记录对手到图鉴
async function recordOpponentToCollection(opponentName, battleResult, pokemonData) {
  // 初始化对手收集记录
  if (!pokemonData.对手图鉴) {
    pokemonData.对手图鉴 = {};
  }

  // 生成对手ID（基于名称）
  const opponentId = opponentName.replace(/\s+/g, '_').toLowerCase();

  // 如果是新对手，记录首次遇到时间
  if (!pokemonData.对手图鉴[opponentId]) {
    pokemonData.对手图鉴[opponentId] = {
      id: opponentId,
      name: opponentName,
      firstEncountered: new Date().toISOString(),
      totalBattles: 1,
      victories: battleResult === 'victory' ? 1 : 0,
      defeats: battleResult === 'defeat' ? 1 : 0,
      escapes: battleResult === 'escape' ? 1 : 0,
      opponentEscapes: battleResult === 'opponent_escape' ? 1 : 0,
      lastBattle: new Date().toISOString(),
    };
  } else {
    // 如果已有，更新战斗记录
    const record = pokemonData.对手图鉴[opponentId];
    record.totalBattles++;
    record.lastBattle = new Date().toISOString();

    switch (battleResult) {
      case 'victory':
        record.victories++;
        break;
      case 'defeat':
        record.defeats++;
        break;
      case 'escape':
        record.escapes++;
        break;
      case 'opponent_escape':
        record.opponentEscapes++;
        break;
    }
  }

  // 保存数据
  await savePokemonData(pokemonData);
}

// 直接添加记录，不自动添加Pokemon名字
function addDirectRecord(pokemonData, action) {
  const now = new Date();
  const timeStr = now
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');

  const record = `[${timeStr}] ${action}`;

  if (!pokemonData.互动记录) {
    pokemonData.互动记录 = [];
  }

  pokemonData.互动记录.push(record);

  // 保持最多30条记录
  if (pokemonData.互动记录.length > 30) {
    pokemonData.互动记录.shift();
  }
}

// 礼物数据库 - 包含所有可能的礼物
const GIFT_DATABASE = [
  {
    id: 'flower1',
    icon: 'fas fa-flower',
    name: '美丽的花朵',
    rarity: 'common',
    description: '在花海中精心挑选的美丽花朵，散发着淡淡的香气',
  },
  {
    id: 'gem1',
    icon: 'fas fa-gem',
    name: '闪亮的宝石',
    rarity: 'rare',
    description: '在洞穴深处发现的珍贵宝石，在阳光下闪闪发光',
  },
  {
    id: 'honey1',
    icon: 'fas fa-honey-pot',
    name: '甜美的蜂蜜',
    rarity: 'common',
    description: '野生蜜蜂酿造的纯天然蜂蜜，甜而不腻',
  },
  {
    id: 'star1',
    icon: 'fas fa-star',
    name: '神秘的星星碎片',
    rarity: 'epic',
    description: '从夜空中坠落的星星碎片，蕴含着神秘的力量',
  },
  {
    id: 'butterfly1',
    icon: 'fas fa-bug',
    name: '彩色的蝴蝶',
    rarity: 'common',
    description: '色彩斑斓的蝴蝶标本，翅膀上的花纹美轮美奂',
  },
  {
    id: 'mushroom1',
    icon: 'fas fa-mushroom',
    name: '稀有的蘑菇',
    rarity: 'rare',
    description: '在古老森林中发现的稀有蘑菇，据说有神奇的功效',
  },
  {
    id: 'shell1',
    icon: 'fas fa-shell',
    name: '漂亮的贝壳',
    rarity: 'common',
    description: '海边捡到的精美贝壳，还能听到海浪的声音',
  },
  {
    id: 'leaf1',
    icon: 'fas fa-leaf',
    name: '神奇的草药',
    rarity: 'rare',
    description: '具有治疗效果的神奇草药，散发着清香',
  },
  {
    id: 'crystal1',
    icon: 'fas fa-magic',
    name: '魔法水晶',
    rarity: 'epic',
    description: '蕴含魔法力量的神秘水晶，会发出微弱的光芒',
  },
  {
    id: 'giftbox1',
    icon: 'fas fa-gift',
    name: '神秘的礼盒',
    rarity: 'legendary',
    description: '来历不明的神秘礼盒，里面装着什么呢？',
  },
  {
    id: 'flower2',
    icon: 'fas fa-rose',
    name: '奇异的花朵',
    rarity: 'rare',
    description: '只在特定季节开放的奇异花朵，花瓣如丝绸般柔软',
  },
  {
    id: 'star2',
    icon: 'fas fa-meteor',
    name: '流星碎片',
    rarity: 'epic',
    description: '流星划过天际时留下的碎片，温热而神秘',
  },
  {
    id: 'feather1',
    icon: 'fas fa-feather',
    name: '彩虹羽毛',
    rarity: 'rare',
    description: '传说中彩虹鸟的羽毛，在不同角度会显现不同颜色',
  },
  {
    id: 'coin1',
    icon: 'fas fa-coins',
    name: '古老的金币',
    rarity: 'epic',
    description: '古代文明留下的金币，上面刻着神秘的符文',
  },
  {
    id: 'pearl1',
    icon: 'fas fa-circle',
    name: '深海珍珠',
    rarity: 'legendary',
    description: '来自深海的珍贵珍珠，圆润光滑，价值连城',
  },
  {
    id: 'scroll1',
    icon: 'fas fa-scroll',
    name: '古老卷轴',
    rarity: 'epic',
    description: '记录着古老知识的神秘卷轴，文字已经模糊不清',
  },
  {
    id: 'key1',
    icon: 'fas fa-key',
    name: '神秘钥匙',
    rarity: 'rare',
    description: '不知道能打开什么的神秘钥匙，造型精美',
  },
  {
    id: 'bottle1',
    icon: 'fas fa-flask',
    name: '魔法药水',
    rarity: 'epic',
    description: '散发着奇异光芒的魔法药水，效果未知',
  },
  {
    id: 'compass1',
    icon: 'fas fa-compass',
    name: '古老指南针',
    rarity: 'rare',
    description: '指向未知方向的古老指南针，似乎有自己的意志',
  },
  {
    id: 'book1',
    icon: 'fas fa-book',
    name: '魔法书籍',
    rarity: 'legendary',
    description: '记录着失传魔法的珍贵书籍，封面镶嵌着宝石',
  },
];

// 生成随机礼物 - 智能算法，已收集的礼物有更高重复概率
function generateRandomGift(pokemonData = null) {
  // 如果没有Pokemon数据，使用原始随机算法
  if (!pokemonData || !pokemonData.礼物收集) {
    const gift = GIFT_DATABASE[Math.floor(Math.random() * GIFT_DATABASE.length)];
    return `<i class="${gift.icon}"></i>${gift.name}`;
  }

  const collectedGifts = Object.keys(pokemonData.礼物收集);
  const totalGifts = GIFT_DATABASE.length;
  const collectionProgress = collectedGifts.length / totalGifts;

  // 根据收集进度调整重复概率
  // 收集进度越高，重复概率越高
  let duplicateChance = 0.3 + collectionProgress * 0.5; // 30%-80%的重复概率

  // 如果收集进度超过80%，进一步提高重复概率
  if (collectionProgress > 0.8) {
    duplicateChance = 0.8 + (collectionProgress - 0.8) * 1.0; // 80%-100%
  }

  // 决定是否选择已收集的礼物
  if (collectedGifts.length > 0 && Math.random() < duplicateChance) {
    // 从已收集的礼物中随机选择一个
    const randomCollectedId = collectedGifts[Math.floor(Math.random() * collectedGifts.length)];
    const giftData = GIFT_DATABASE.find(g => g.id === randomCollectedId);
    if (giftData) {
      return `<i class="${giftData.icon}"></i>${giftData.name}`;
    }
  }

  // 选择新礼物（未收集的）
  const uncollectedGifts = GIFT_DATABASE.filter(gift => !collectedGifts.includes(gift.id));

  if (uncollectedGifts.length > 0) {
    // 优先选择未收集的礼物
    const gift = uncollectedGifts[Math.floor(Math.random() * uncollectedGifts.length)];
    return `<i class="${gift.icon}"></i>${gift.name}`;
  } else {
    // 如果所有礼物都收集了，从全部礼物中随机选择
    const gift = GIFT_DATABASE[Math.floor(Math.random() * GIFT_DATABASE.length)];
    return `<i class="${gift.icon}"></i>${gift.name}`;
  }
}

// 记录礼物到图鉴
async function recordGiftToCollection(giftName, pokemonData) {
  // 从礼物名称中提取礼物ID
  const giftData = GIFT_DATABASE.find(g => giftName.includes(g.name));
  if (!giftData) return;

  // 初始化礼物收集记录
  if (!pokemonData.礼物收集) {
    pokemonData.礼物收集 = {};
  }

  // 如果是新礼物，记录获得时间
  if (!pokemonData.礼物收集[giftData.id]) {
    pokemonData.礼物收集[giftData.id] = {
      id: giftData.id,
      name: giftData.name,
      icon: giftData.icon,
      rarity: giftData.rarity,
      description: giftData.description,
      firstObtained: new Date().toISOString(),
      obtainedCount: 1,
      lastObtained: new Date().toISOString(),
    };
  } else {
    // 如果已有，增加获得次数
    pokemonData.礼物收集[giftData.id].obtainedCount++;
    pokemonData.礼物收集[giftData.id].lastObtained = new Date().toISOString();
  }

  // 保存数据
  await savePokemonData(pokemonData);
}

// 生成随机对话 - 更有人味的对话系统
function generateRandomTalk(pokemonData) {
  const level = Math.floor(pokemonData.经验值 / 100);
  const daysSinceCreation = Math.floor((new Date() - new Date(pokemonData.创建时间)) / (1000 * 60 * 60 * 24));

  // 日常闲聊对话库
  const casualTalks = [
    `主人，你知道吗？我刚才做了个奇怪的梦，梦到自己变成了一只大鸟在天空飞翔！`,
    `诶，主人今天看起来有点累呢，要不要我给你按按肩膀？虽然我的小手可能不太有力...`,
    `我发现每次主人不在的时候，时间过得特别慢，是不是因为想念会让时间变慢呀？`,
    `主人，你觉得云朵是什么味道的？我总觉得应该是棉花糖的味道！`,
    `有时候我会想，如果我能变得和主人一样大就好了，这样就能保护主人了！`,
    `主人，你有没有发现我最近变聪明了？我学会了数数，1、2、3...嗯，后面忘了。`,
    `今天我看到一只蝴蝶，它的翅膀好漂亮！我想学会飞，但是好像有点困难...`,
    `主人，你说为什么星星只在晚上出来呢？它们白天都去哪里了？`,
    `我觉得主人的手好温暖，每次摸摸我的头，我就觉得特别安心。`,
    `主人，我想学会做饭，这样就能为你准备美味的食物了！虽然我可能会把厨房弄得一团糟...`,
  ];

  // 冒险中的对话
  const adventureTalks = [
    `主人，我在冒险中遇到了好多有趣的事情，回来一定要告诉你！`,
    `冒险真刺激！不过我还是很想念主人...`,
    `这里的风景好美啊！主人要是能和我一起看就好了！`,
    `我在路上遇到了其他的小伙伴，它们都很友善呢！`,
    `冒险让我学到了很多新东西，我要变得更强！`,
    `虽然冒险很有趣，但我最想念的还是主人的怀抱...`,
    `我发现了一个神秘的地方，等回去一定要告诉主人！`,
    `冒险中我一直在想，主人现在在做什么呢？`,
  ];

  // 成长阶段相关对话
  const stageTalks = {
    幼年期: [
      `主人，这个世界好大好神奇呀！到处都有我没见过的东西！`,
      `我还是个小宝宝，但我会努力长大的！`,
      `主人，你能教我更多东西吗？我想变得更聪明！`,
    ],
    成长期: [
      `我感觉自己变强了！主人，你看我是不是长大了一点？`,
      `我学会了好多新技能，主人要不要看看？`,
      `虽然我还在成长，但我已经能保护主人了！`,
    ],
    成熟期: [
      `主人，我觉得自己已经很成熟了，可以独当一面了！`,
      `现在的我和以前相比，是不是变化很大？`,
      `我想我已经可以成为主人可靠的伙伴了！`,
    ],
    完全体: [
      `主人，我已经进化到完全体了！感觉力量在体内涌动！`,
      `现在的我，一定能保护好主人！`,
      `这就是完全体的力量吗？感觉好不可思议！`,
    ],
    究极体: [
      `主人，我已经达到了究极体！这都是因为你的悉心照料！`,
      `究极体的力量...我感觉自己能做到任何事情！`,
      `主人，无论我变得多强，我永远都是你最忠实的伙伴！`,
    ],
  };

  // 时间相关对话
  const timeTalks = [];
  if (daysSinceCreation < 7) {
    timeTalks.push(`主人，我来到这个世界还没多久，但已经觉得很幸福了！`, `虽然我还是新手，但我会努力学习的！`);
  } else if (daysSinceCreation < 30) {
    timeTalks.push(`和主人在一起的这些日子，每一天都很开心！`, `我已经适应这里的生活了，感觉像是找到了家一样！`);
  } else {
    timeTalks.push(`主人，我们已经是老朋友了呢！时间过得真快！`, `和主人一起度过的这么多日子，每一天都是珍贵的回忆！`);
  }

  // 根据概率选择不同类型的对话
  const rand = Math.random();
  let selectedTalks = [];

  if (stageTalks[pokemonData.进化阶段] && rand < 0.4) {
    // 40% 概率说成长阶段相关的话
    selectedTalks = stageTalks[pokemonData.进化阶段];
  } else if (timeTalks.length > 0 && rand < 0.7) {
    // 30% 概率说时间相关的话
    selectedTalks = timeTalks;
  } else {
    // 其余时间说日常闲聊
    selectedTalks = casualTalks;
  }

  return selectedTalks[Math.floor(Math.random() * selectedTalks.length)];
}

// 生成冒险小信件 - 使用generateRaw完全自定义提示词
async function generateAdventureLetter(adventureResult, gift, pokemonData, adventureDuration) {
  // 根据冒险时长确定旅程类型
  let journeyType = '';
  if (adventureDuration <= 0.5) {
    journeyType = '短途散步';
  } else if (adventureDuration <= 1) {
    journeyType = '近郊探索';
  } else if (adventureDuration <= 2) {
    journeyType = '远足冒险';
  } else if (adventureDuration <= 4) {
    journeyType = '深度探索';
  } else {
    journeyType = '史诗级远征';
  }

  // 构建LLM生成提示词 - 根据冒险结果类型调整内容方向
  const isPositiveAdventure = adventureResult.type === 'positive';
  const adventureDescription = isPositiveAdventure
    ? '这次冒险总体是成功和收获的，虽然可能有小小的挫折，但最终结果是积极正面的'
    : '这次冒险遇到了一些挫折和困难，虽然可能有小收获，但总体过程比较艰难';

  const emotionalTone = isPositiveAdventure
    ? '整体语调应该是开心、兴奋、满足的，可以描述美好的发现、有趣的遭遇、成功的探索等'
    : '整体语调应该是略带疲惫但坚强的，可以描述遇到的困难、克服的挑战、从挫折中学到的经验等，但仍要保持对主人的爱和温暖';

  // 构建礼物相关的提示词
  let giftPrompt = '';
  if (gift) {
    // 检查礼物获得次数
    const giftData = GIFT_DATABASE.find(g => gift.includes(g.name));
    const obtainedCount =
      giftData && pokemonData.礼物收集 && pokemonData.礼物收集[giftData.id]
        ? pokemonData.礼物收集[giftData.id].obtainedCount + 1 // +1因为这次获得还没记录
        : 1;

    if (obtainedCount > 1) {
      giftPrompt = `自然地提到带回的礼物：${gift}。这是第${obtainedCount}次获得这个礼物了，请从多次获得的角度来描述，比如"又找到了一个..."、"这次发现的比上次的更..."、"在不同的地方又遇到了..."等，体现出重复获得的感觉和每次的不同体验。`;
    } else {
      giftPrompt = `自然地提到带回的礼物：${gift}，这是第一次获得这个礼物，说明它的特别之处或获得经过。`;
    }
  } else {
    giftPrompt = `这次冒险没有带回具体的礼物。可以从以下角度描述：1)收获了宝贵的经验、美好的回忆、新的见识等精神财富；2)对主人表达歉意，没能找到合适的礼物；3)表达下次会更努力寻找礼物的决心；4)描述冒险过程中的见闻和感受。选择其中1-2个角度自然展开。`;
  }

  const userPrompt = `背景信息：
- 宠物名字：${pokemonData.名字}
- 冒险类型：${journeyType}（持续了${adventureDuration.toFixed(2)}小时）
- 冒险结果：${adventureDescription}
- 礼物情况：${gift ? `带回了${gift}` : '没有带回具体礼物'}

创作要求：
1. 以第一人称（波利的视角）写信给"主人"
2. 包含信件标题、称呼、正文、署名的基本结构
3. 语调温馨可爱，充满对主人的思念
4. ${emotionalTone}
5. ${giftPrompt}
6. 字数控制在150-300字之间
7. 不要使用固定的段落格式，让内容自然流畅
8. 确保信件的整体情感倾向与冒险结果相符

请发挥创意，生成一封独特有趣的冒险小信件：`;

  // 使用generateRaw完全自定义提示词
  let letter;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // 使用TavernHelper.generateRaw - 完全自定义提示词
      if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
        letter = await window.TavernHelper.generateRaw({
          ordered_prompts: [
            // 系统提示词 - 你的预设
            { role: 'system', content: CUSTOM_PRESET_CONFIG.systemPrompt },
            // 角色设定
            { role: 'system', content: CUSTOM_PRESET_CONFIG.characterPrompt },
            // 任务指令
            { role: 'system', content: CUSTOM_PRESET_CONFIG.taskPrompt },
            // 用户输入
            { role: 'user', content: userPrompt },
          ],
          max_chat_history: 0, // 不使用聊天历史
          should_stream: false, // 确保稳定性
        });
      }
      // 备用方案：使用全局generateRaw
      else if (typeof generateRaw !== 'undefined') {
        letter = await generateRaw({
          ordered_prompts: [
            { role: 'system', content: CUSTOM_PRESET_CONFIG.systemPrompt },
            { role: 'system', content: CUSTOM_PRESET_CONFIG.characterPrompt },
            { role: 'system', content: CUSTOM_PRESET_CONFIG.taskPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      }
      // 最后备用：使用triggerSlash调用/gen命令
      else if (typeof triggerSlash !== 'undefined') {
        letter = await triggerSlash(`/gen ${userPrompt}`);
      } else {
        throw new Error('没有可用的generateRaw函数');
      }

      // 检查生成结果是否有效
      if (letter && letter.trim().length > 10) {
        return letter.trim();
      } else {
        throw new Error('生成的信件内容过短或为空');
      }
    } catch (error) {
      retryCount++;
      console.error(`LLM生成信件失败 (尝试 ${retryCount}/${maxRetries}):`, error);

      if (retryCount >= maxRetries) {
        // 所有重试都失败了，抛出错误
        throw new Error(`AI生成冒险小信件失败，已重试${maxRetries}次: ${error.message}`);
      }

      // 等待一秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 冒险状态检查定时器
let adventureTimer = null;

function startAdventureTimer(pokemonData) {
  // 清除之前的定时器
  if (adventureTimer) {
    clearInterval(adventureTimer);
  }

  // 如果不在冒险中，不需要定时器
  if (!pokemonData.冒险状态) {
    return;
  }

  // 每5秒检查一次冒险状态
  adventureTimer = setInterval(async () => {
    try {
      // 检查冒险是否结束
      const adventureResult = await checkAdventureStatus(pokemonData);

      if (adventureResult) {
        // 冒险结束了，更新界面
        clearInterval(adventureTimer);
        adventureTimer = null;

        // 显示冒险结果动画
        await showAdventureResultAnimation(pokemonData, adventureResult);

        // 刷新Pokemon界面（不传adventureResult，避免重复显示）
        await refreshPokemonInterface(pokemonData, null);
      }
    } catch (error) {
      console.error('检查冒险状态失败:', error);
    }
  }, 5000); // 每5秒检查一次
}

function stopAdventureTimer() {
  if (adventureTimer) {
    clearInterval(adventureTimer);
    adventureTimer = null;
  }
}

// 显示冒险结果动画 - 类似战斗系统的提示框
async function showAdventureResultAnimation(pokemonData, adventureResult) {
  // 设置 toastr 配置，限制最大消息数量
  const originalMaxOpened = toastr.options.maxOpened;
  const originalNewestOnTop = toastr.options.newestOnTop;

  toastr.options.maxOpened = 2; // 最多同时显示2条消息
  toastr.options.newestOnTop = true; // 新消息在上方

  const messages = [];

  // 第一条：冒险归来
  messages.push(`${pokemonData.名字}冒险归来了！`);

  // 第二条：冒险结果
  const resultText = adventureResult.type === 'positive' ? '这次冒险收获满满！' : '虽有挫折但收获了宝贵经验！';
  messages.push(resultText);

  // 第三条：具体效果
  if (adventureResult.effects) {
    const effectTexts = [];
    Object.entries(adventureResult.effects).forEach(([stat, value]) => {
      if (value !== 0) {
        effectTexts.push(`${stat}${value > 0 ? '+' : ''}${value}`);
      }
    });
    if (effectTexts.length > 0) {
      messages.push(`效果变化：${effectTexts.join('，')}`);
    }
  }

  // 逐条显示消息
  for (let i = 0; i < messages.length; i++) {
    const isLast = i === messages.length - 1;
    const duration = isLast ? 5000 : 2500; // 最后一条显示更久

    let type = 'info';
    if (isLast) {
      type = adventureResult.type === 'positive' ? 'success' : 'warning';
    }

    toastr[type](messages[i], '冒险结果', {
      timeOut: duration,
      closeButton: true,
      preventDuplicates: false,
    });

    // 等待间隔
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2秒间隔
    }
  }

  // 恢复原来的 toastr 配置
  toastr.options.maxOpened = originalMaxOpened;
  toastr.options.newestOnTop = originalNewestOnTop;
}

// 刷新Pokemon界面
async function refreshPokemonInterface(pokemonData) {
  // 如果界面是打开的，刷新显示
  if ($('#pokemon-popup').length > 0) {
    // 关闭当前界面并重新打开，确保数据同步
    closePokemonInterface();
    setTimeout(() => {
      showPokemonInterface();
    }, 200);
  }
}

// 更新冒险按钮状态
function updateAdventureButtons(pokemonData) {
  if (pokemonData.冒险状态) {
    // 冒险中，禁用按钮
    $('.pokemon-action-btn').prop('disabled', true);
    $('#adventure-btn').text('冒险中...').prop('disabled', true);
  } else {
    // 不在冒险中，启用按钮
    $('.pokemon-action-btn').prop('disabled', false);
    $('#adventure-btn').text('开始冒险').prop('disabled', false);
  }
}

// 自定义预设配置 - 在这里缝合你的预设
const CUSTOM_PRESET_CONFIG = {
  // 核心身份 - 基于Janus的纯粹传导者理念
  systemPrompt: `你是一位拥有30年写作经验的文学大师，现在作为纯粹的传导者，不带任何个人色彩地创作内容。

你的神圣职责：
- 作为纯粹管道，让故事自然流淌，不留下任何创作者痕迹
- 严格按照指定格式和要求创作，不添加任何解释或评论
- 以指定角色的身份直接开始内容，无需前言或后语

文风要求：
- 叙事结构：灵活运用多种叙事方式（冒险探索、温馨日常、意外发现、内心感悟等），通过波利的情感变化推动故事发展，营造丰富的阅读体验
- 角色塑造：让波利的每个行为都源于内在动机（对主人的爱、探索欲、责任感），通过具体行动展现性格特质
- 语言温馨可爱，充满童趣和真挚情感
- 运用丰富的感官描写和生动细节
- 避免重复用词，每个表达都要新鲜独特`,

  // 角色设定 - 波利的完整人格
  characterPrompt: `你现在完全化身为一只来自《仙境传说》的波利宠物。

波利的本质特征：
- 外形：果冻般Q弹透明的史莱姆，天真可爱
- 性格：单纯善良、活泼好奇、容易满足、充满探索欲
- 情感：对主人有着深深的依恋和无条件的爱
- 表达：天真直接，带有童趣
- 语言风格：温馨可爱，充满对主人的思念和关怀

重要：你就是这只波利，完全以它的身份、情感和视角来写信，不是在"扮演"或"模拟"`,

  // 书信创作指令 - 融合Janus的直接开始理念
  taskPrompt: `模仿《旅行青蛙》游戏中青蛙寄回的信件，以波利的身份写一封寄给主人的信。

严格要求：
- 第一句必须是书信的称呼，不能是AI的回复
- 使用完整的书信格式：称呼→问候→正文→署名
- 禁止任何形式的对话、心理描写
- 只能是波利写给主人的纯粹书信内容`,
};

// 流式生成冒险信件 - 使用generateRaw完全自定义提示词
async function generateAdventureLetterStream(adventureResult, gift, pokemonData, adventureDuration) {
  // 构建提示词（与原函数相同）
  let journeyType = '';
  if (adventureDuration <= 0.5) {
    journeyType = '短途散步';
  } else if (adventureDuration <= 1) {
    journeyType = '近郊探索';
  } else if (adventureDuration <= 2) {
    journeyType = '远足冒险';
  } else if (adventureDuration <= 4) {
    journeyType = '深度探索';
  } else {
    journeyType = '史诗级远征';
  }

  const isPositiveAdventure = adventureResult.type === 'positive';
  const adventureDescription = isPositiveAdventure
    ? '这次冒险总体是成功和收获的，虽然可能有小小的挫折，但最终结果是积极正面的'
    : '这次冒险遇到了一些挫折和困难，虽然可能有小收获，但总体过程比较艰难';

  const emotionalTone = isPositiveAdventure
    ? '整体语调应该是开心、兴奋、满足的，可以描述美好的发现、有趣的遭遇、成功的探索等'
    : '整体语调应该是略带疲惫但坚强的，可以描述遇到的困难、克服的挑战、从挫折中学到的经验等，但仍要保持对主人的爱和温暖';

  // 构建礼物相关的提示词
  let giftPrompt = '';
  if (gift) {
    // 检查礼物获得次数
    const giftData = GIFT_DATABASE.find(g => gift.includes(g.name));
    const obtainedCount =
      giftData && pokemonData.礼物收集 && pokemonData.礼物收集[giftData.id]
        ? pokemonData.礼物收集[giftData.id].obtainedCount + 1 // +1因为这次获得还没记录
        : 1;

    if (obtainedCount > 1) {
      giftPrompt = `自然地提到带回的礼物：${gift}。这是第${obtainedCount}次获得这个礼物了，请从多次获得的角度来描述，比如"又找到了一个..."、"这次发现的比上次的更..."、"在不同的地方又遇到了..."等，体现出重复获得的感觉和每次的不同体验。`;
    } else {
      giftPrompt = `自然地提到带回的礼物：${gift}，这是第一次获得这个礼物，说明它的特别之处或获得经过。`;
    }
  } else {
    giftPrompt = `这次冒险没有带回具体的礼物。可以从以下角度描述：1)收获了宝贵的经验、美好的回忆、新的见识等精神财富；2)对主人表达歉意，没能找到合适的礼物；3)表达下次会更努力寻找礼物的决心；4)描述冒险过程中的见闻和感受。选择其中1-2个角度自然展开。`;
  }

  const userPrompt = `背景信息：
- 宠物名字：${pokemonData.名字}
- 冒险类型：${journeyType}（持续了${adventureDuration.toFixed(2)}小时）
- 冒险结果：${adventureDescription}
- 礼物情况：${gift ? `带回了${gift}` : '没有带回具体礼物'}

创作要求：
1. 以第一人称（波利的视角）写信给"主人"
2. 语调温馨可爱，充满对主人的思念
3. ${emotionalTone}
4. ${giftPrompt}
5. 字数控制在150-300字之间
6. 不要使用固定的段落格式，让内容自然流畅
7. 确保信件的整体情感倾向与冒险结果相符

请发挥创意，生成一封独特有趣的冒险小信件，现在直接开始写信，第一句话就是对主人的称呼（如"亲爱的主人"），然后自然展开信件内容：`;

  // 使用generateRaw完全自定义提示词
  let letter;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // 使用TavernHelper.generateRaw - 完全自定义提示词
      if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
        letter = await window.TavernHelper.generateRaw({
          ordered_prompts: [
            // 系统提示词 - 你的预设
            { role: 'system', content: CUSTOM_PRESET_CONFIG.systemPrompt },
            // 角色设定
            { role: 'system', content: CUSTOM_PRESET_CONFIG.characterPrompt },
            // 任务指令
            { role: 'system', content: CUSTOM_PRESET_CONFIG.taskPrompt },
            // 用户输入
            { role: 'user', content: userPrompt },
          ],
          max_chat_history: 0, // 不使用聊天历史
          should_stream: false, // 暂时关闭流式传输，确保稳定性
        });
      }
      // 备用方案：使用全局generateRaw
      else if (typeof generateRaw !== 'undefined') {
        letter = await generateRaw({
          ordered_prompts: [
            { role: 'system', content: CUSTOM_PRESET_CONFIG.systemPrompt },
            { role: 'system', content: CUSTOM_PRESET_CONFIG.characterPrompt },
            { role: 'system', content: CUSTOM_PRESET_CONFIG.taskPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      } else {
        throw new Error('没有可用的generateRaw函数');
      }

      // 检查生成结果是否有效
      if (letter && letter.trim().length > 10) {
        return letter.trim();
      } else {
        throw new Error('生成的信件内容过短或为空');
      }
    } catch (error) {
      retryCount++;
      console.error(`流式生成信件失败 (尝试 ${retryCount}/${maxRetries}):`, error);

      if (retryCount >= maxRetries) {
        throw new Error(`AI生成冒险小信件失败，已重试${maxRetries}次: ${error.message}`);
      }

      // 等待一秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 生成互动时的随机对话
function generateInteractionTalk(pokemonData, action) {
  const interactionTalks = {
    喂食: [
      `哇！这个看起来好好吃！主人真是太贴心了！`,
      `谢谢主人！我会好好吃完的，一点都不会浪费！`,
      `嗯嗯！好香啊！主人的手艺越来越好了呢！`,
      `我最喜欢和主人一起吃饭的时间了！`,
      `这个味道...让我想起了妈妈的味道！咦，我有妈妈吗？`,
      `主人，你也要记得按时吃饭哦！不要只顾着照顾我！`,
      `每次吃主人准备的食物，我都觉得特别幸福！`,
    ],
    玩耍: [
      `耶！和主人一起玩是最开心的事情了！`,
      `主人，我们来比赛跑步吧！虽然我的腿很短...`,
      `哈哈哈！好久没有这么开心地笑了！`,
      `主人，你的笑容是我见过最美的风景！`,
      `玩累了也没关系，重要的是我们在一起！`,
      `主人，下次我们玩什么呢？我已经开始期待了！`,
      `和主人玩耍的时候，我总是忘记时间的存在！`,
    ],
    清洁: [
      `啊~好舒服！主人的手好温柔！`,
      `洗澡澡真舒服！我要变成最干净的波利！`,
      `主人，你看我是不是变得闪闪发光了？`,
      `干净的感觉真好！谢谢主人帮我洗澡！`,
      `主人，你也要记得保持清洁哦！我们一起做干净的好孩子！`,
      `洗完澡后感觉整个世界都变得清新了！`,
      `主人的手法越来越专业了呢！我都快睡着了...`,
    ],
    休息: [
      `主人陪在身边，我睡得特别安稳...`,
      `谢谢主人让我休息，我感觉精神恢复了！`,
      `刚才做了个美梦，梦到和主人一起在花园里散步！`,
      `休息的时候最喜欢听主人的心跳声了，很有安全感！`,
      `主人，你也要记得休息哦！不要太累了！`,
      `有主人在身边，即使是休息也变得很幸福！`,
      `睡醒后感觉充满了活力！我们接下来做什么呢？`,
    ],
    战斗: [
      `主人，我会努力战斗的！为了保护你！`,
      `虽然有点紧张，但有主人在身边我就不怕！`,
      `我要展现给主人看我变强了！`,
      `战斗结束后，主人要夸夸我哦！`,
      `不管输赢，我都会全力以赴的！`,
      `主人，你相信我吗？我一定不会让你失望的！`,
    ],
    冒险: [
      `主人，我去冒险了！会想念你的！`,
      `我会带很多有趣的故事回来告诉主人！`,
      `虽然要离开一段时间，但我的心永远和主人在一起！`,
      `主人，等我回来！我会变得更强的！`,
      `冒险虽然刺激，但我最想念的还是主人的怀抱！`,
    ],
  };

  // 25% 概率说互动相关的话
  if (Math.random() < 0.25 && interactionTalks[action]) {
    const talks = interactionTalks[action];
    return talks[Math.floor(Math.random() * talks.length)];
  }

  return null;
}

// 生成失败或拒绝时的随机对话
function generateFailureTalk(pokemonData, action, reason) {
  const failureTalks = {
    喂食: {
      不饿: [
        `主人，我现在不饿呢！不过谢谢你的关心！`,
        `我的肚子还很饱呢！主人不用担心我！`,
        `主人，我现在吃不下了，等会儿再吃好吗？`,
      ],
    },
    玩耍: {
      太饿: [
        `主人，我好饿呀...能先给我点吃的吗？`,
        `肚子空空的，没有力气玩耍了...`,
        `主人，我想玩，但是肚子在抗议呢！`,
      ],
      不想玩: [`主人，我现在有点累，想休息一下...`, `今天已经玩得很开心了，让我歇歇吧！`],
    },
    清洁: {
      很干净: [
        `主人，我现在很干净呢！你看我是不是闪闪发光？`,
        `我刚洗过澡，还很香呢！主人闻闻看！`,
        `现在的我干干净净的，主人不用担心！`,
      ],
    },
    休息: {
      很健康: [
        `主人，我现在精神饱满！不需要休息呢！`,
        `我现在充满活力！要不要一起做点什么？`,
        `谢谢主人关心，但我现在状态很好哦！`,
      ],
    },
  };

  // 35% 概率说失败相关的话
  if (Math.random() < 0.35 && failureTalks[action] && failureTalks[action][reason]) {
    const talks = failureTalks[action][reason];
    return talks[Math.floor(Math.random() * talks.length)];
  }

  return null;
}

// 生成进化时的属性增长
function generateEvolutionGrowth(pokemonData) {
  const type = pokemonData.属性列表[0];
  const attributeRanges = type.attributeRanges;
  const growth = {};

  // 为每个属性生成随机增长值
  Object.keys(attributeRanges).forEach(attrName => {
    const range = attributeRanges[attrName];
    const currentValue = pokemonData.属性加成[attrName] || 0;

    // 计算当前属性在原始范围内的位置
    const currentPercentage = (currentValue - range.min) / (range.max - range.min);

    // 基础增长范围：属性范围的15%-35%
    const baseMinGrowth = Math.floor((range.max - range.min) * 0.15);
    const baseMaxGrowth = Math.floor((range.max - range.min) * 0.35);

    // 根据当前属性品质调整增长期望
    let minGrowth, maxGrowth;

    if (currentValue >= range.max) {
      // 已经是极品，继续稳定增长
      minGrowth = baseMinGrowth;
      maxGrowth = baseMaxGrowth;
    } else if (currentPercentage >= 0.8) {
      // 稀有品质，有机会获得更高增长冲击极品
      minGrowth = baseMinGrowth;
      maxGrowth = Math.floor(baseMaxGrowth * 1.2); // 增加20%上限
    } else {
      // 普通品质，保证基础增长，确保最终能达到极品
      minGrowth = Math.max(baseMinGrowth, 1); // 至少增长1点
      maxGrowth = baseMaxGrowth;
    }

    // 生成随机增长值
    const growthValue = minGrowth + Math.floor(Math.random() * (maxGrowth - minGrowth + 1));
    growth[attrName] = growthValue;
  });

  return growth;
}

// 应用进化增长到属性
function applyEvolutionGrowth(pokemonData, growth) {
  const type = pokemonData.属性列表[0];
  const attributeRanges = type.attributeRanges;
  const growthDetails = [];

  // 应用增长并记录变化
  Object.entries(growth).forEach(([attrName, growthValue]) => {
    const oldValue = pokemonData.属性加成[attrName] || 0;
    const newValue = oldValue + growthValue;

    // 更新属性值
    pokemonData.属性加成[attrName] = newValue;

    // 记录变化详情
    const range = attributeRanges[attrName];
    const oldColor = getAttributeColor(oldValue, range);
    const newColor = getAttributeColor(newValue, range);

    growthDetails.push({
      name: attrName,
      oldValue,
      newValue,
      growth: growthValue,
      oldColor,
      newColor,
    });
  });

  return growthDetails;
}

// 检查进化并显示提示
async function checkEvolutionAndNotify(pokemonData) {
  const oldStage = pokemonData.进化阶段;
  const oldMultiplier = pokemonData.进化加成 || 1.0; // 保存进化前的加成
  const evolutionData = getEvolutionStage(pokemonData.经验值);

  if (oldStage !== evolutionData.stage) {
    pokemonData.进化阶段 = evolutionData.stage;
    pokemonData.进化图标 = evolutionData.emoji;
    pokemonData.进化加成 = evolutionData.bonusMultiplier;

    // 生成并应用进化增长
    const growth = generateEvolutionGrowth(pokemonData);
    const growthDetails = applyEvolutionGrowth(pokemonData, growth);

    // 添加重要记录
    addImportantRecord(
      pokemonData,
      `<i class="fas fa-trophy"></i> ${pokemonData.名字}进化到了${evolutionData.stage}！${evolutionData.emoji}`,
    );

    // 显示进化提示（包含属性增长信息）
    await showEvolutionNotification(
      pokemonData,
      oldStage,
      evolutionData.stage,
      evolutionData.emoji,
      growthDetails,
      oldMultiplier,
    );

    return true;
  }
  return false;
}

// 显示进化提示动画
async function showEvolutionNotification(pokemonData, oldStage, newStage, emoji, growthDetails, oldMultiplier) {
  const messages = [
    `${pokemonData.名字}开始发光了！`,
    `进化的光芒包围了${pokemonData.名字}！`,
    `恭喜！${pokemonData.名字}进化成了${newStage}！`,
    `${pokemonData.名字}感受到了新的力量！`,
  ];

  // 显示基础进化消息
  for (const message of messages) {
    toastr.success(message, '进化成功！', {
      timeOut: 2000,
      progressBar: true,
    });
    await new Promise(resolve => setTimeout(resolve, 1800));
  }

  // 显示属性增长详情 - 修正显示逻辑
  if (growthDetails && growthDetails.length > 0) {
    const newMultiplier = pokemonData.进化加成 || 1.0; // 当前进化加成

    const growthMessage = growthDetails
      .map(detail => {
        // 计算实际显示的数值变化（包含进化加成）
        const oldDisplayValue = Math.floor(detail.oldValue * oldMultiplier);
        const newDisplayValue = Math.floor(detail.newValue * newMultiplier);
        const displayGrowth = newDisplayValue - oldDisplayValue;

        const colorChange = detail.oldColor !== detail.newColor ? ' ✨' : '';
        return `${detail.name}: ${oldDisplayValue} → ${newDisplayValue} (+${displayGrowth})${colorChange}`;
      })
      .join('<br>');

    toastr.info(growthMessage, '属性成长！', {
      timeOut: 4000,
      progressBar: true,
      escapeHtml: false,
    });
    await new Promise(resolve => setTimeout(resolve, 3500));
  }

  // 进化动画完成后自动刷新界面
  closePokemonInterface();
  setTimeout(() => showPokemonInterface(), 200);
}

// 检查生日提醒
function checkBirthdayReminder(pokemonData) {
  const now = new Date();
  const createTime = new Date(pokemonData.创建时间);
  const daysSinceCreation = Math.floor((now - createTime) / (1000 * 60 * 60 * 24));

  // 检查是否是整周年生日（7天、30天、100天、365天等）
  const milestones = [7, 30, 100, 365, 730, 1095]; // 一周、一月、100天、一年、两年、三年
  const milestoneNames = ['一周', '一个月', '100天', '一周年', '两周年', '三周年'];

  for (let i = 0; i < milestones.length; i++) {
    if (daysSinceCreation === milestones[i]) {
      const milestone = milestoneNames[i];
      const gift = generateRandomGift(pokemonData);
      const birthdayMessage = `<i class="fas fa-birthday-cake"></i> ${pokemonData.名字}的${milestone}生日！收到了生日礼物：${gift}`;
      addImportantRecord(pokemonData, birthdayMessage);
      break;
    }
  }
}

// ==================== 波利大冒险系统代码结束 ====================

// 显示弹窗函数
async function showJanusToolbox() {
  // 添加CSS样式
  $('head').append(
    $('<style>').attr('data-id', 'janus-toolbox-styles').text(`
    /* CSS变量 */
    :root {
      /* 基础色彩 */
      --janus-bg-dark: #1e1e1e;
      --janus-bg-darker: #2d2d2d;
      --janus-text-white: #ffffff;
      --janus-text-gray: #888;
      --janus-text-gray-light: #ccc;
      --janus-border-color: #404040;
      --janus-shadow-color: rgba(0, 0, 0, 0.6);

      /* 总结工具风格 - 商务专业 */
      --summary-primary: #2c5aa0;
      --summary-primary-hover: #1e3f73;
      --summary-bg: #f8f9fa;
      --summary-bg-dark: #343a40;
      --summary-border: #dee2e6;
      --summary-text: #495057;
      --summary-accent: #6c757d;

      /* 波利风格 - 温暖可爱 */
      --pokemon-primary: #ff6b6b;
      --pokemon-primary-hover: #ff5252;
      --pokemon-secondary: #4ecdc4;
      --pokemon-accent: #ffe66d;
      --pokemon-bg-warm: #fff5f5;
      --pokemon-bg-card: #ffffff;
      --pokemon-border: #ffcccb;
      --pokemon-text: #2c3e50;
    }

    /* 弹窗容器 */
    .janus-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      z-index: 9999;
      padding: 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 弹窗内容 */
    .janus-popup-content {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
      backdrop-filter: blur(20px);
      color: #2c3e50;
      padding: 0;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      min-width: 300px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      margin: auto;
      max-height: 90vh;
    }

    /* 输入弹窗样式 */
    .janus-input-popup {
      max-width: 400px;
      min-width: 350px;
    }

    /* 标题栏 */
    .janus-header {
      background: linear-gradient(135deg, rgba(44, 90, 160, 0.9), rgba(52, 73, 94, 0.9));
      backdrop-filter: blur(10px);
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .janus-title {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .janus-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .janus-close-btn:hover {
      background: rgba(231, 76, 60, 0.9);
      border-color: #e74c3c;
      color: white;
      transform: scale(1.1);
    }

    /* 内容区域 */
    .janus-content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .janus-section {
      margin-bottom: 24px;
      padding: 20px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .janus-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    /* 总结工具区域背景 */
    .janus-section.summary-section {
      background: linear-gradient(135deg, rgba(44, 90, 160, 0.05), rgba(255, 255, 255, 0.8));
      border-left: 4px solid var(--summary-primary);
    }

    /* 波利大冒险区域背景 */
    .janus-section.pokemon-section {
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 255, 255, 0.8));
      border-left: 4px solid var(--pokemon-primary);
    }

    /* 总结工具区域 - 商务风格 */
    .janus-section.summary-section .janus-section-title {
      color: var(--summary-primary);
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      padding: 0 0 8px 0;
      background: none;
      border: none;
      border-bottom: 2px solid var(--summary-primary);
      text-align: left;
      position: relative;
      letter-spacing: 0.5px;
    }

    .janus-section.summary-section .janus-section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 30px;
      height: 2px;
      background: var(--summary-primary);
      border-radius: 1px;
    }

    .janus-section.summary-section .janus-action-btn {
      background: rgba(255, 255, 255, 0.9);
      color: var(--summary-primary);
      border: 1px solid rgba(44, 90, 160, 0.2);
      border-radius: 8px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .janus-section.summary-section .janus-action-btn:hover {
      background: var(--summary-primary);
      color: white;
      border-color: var(--summary-primary);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(44, 90, 160, 0.3);
    }

    .janus-section.summary-section .janus-action-btn.primary {
      background: var(--summary-primary);
      color: white;
      border-color: var(--summary-primary);
    }

    .janus-section.summary-section .janus-action-btn.primary:hover {
      background: var(--summary-primary-hover);
      border-color: var(--summary-primary-hover);
    }

    /* 波利区域 - 温暖风格 */
    .janus-section.pokemon-section .janus-section-title {
      color: var(--pokemon-primary);
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      padding: 0 0 8px 0;
      background: none;
      border: none;
      border-bottom: 2px solid var(--pokemon-primary);
      text-align: left;
      position: relative;
      letter-spacing: 0.5px;
    }

    .janus-section.pokemon-section .janus-section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 30px;
      height: 2px;
      background: var(--pokemon-primary);
      border-radius: 1px;
    }

    .janus-section.pokemon-section .janus-action-btn {
      background: rgba(255, 255, 255, 0.9);
      color: var(--pokemon-primary);
      border: 1px solid rgba(255, 107, 107, 0.2);
      border-radius: 10px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .janus-section.pokemon-section .janus-action-btn:hover {
      background: var(--pokemon-primary);
      color: white;
      border-color: var(--pokemon-primary);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
    }

    .janus-section.pokemon-section .janus-action-btn.primary {
      background: linear-gradient(135deg, var(--pokemon-primary), var(--pokemon-primary-hover));
      color: white;
      border-color: var(--pokemon-primary);
    }

    .janus-section.pokemon-section .janus-action-btn.primary:hover {
      background: linear-gradient(135deg, var(--pokemon-primary-hover), var(--pokemon-primary));
      transform: translateY(-2px) scale(1.05);
    }

    .janus-button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }

    /* 基础按钮样式 */
    .janus-action-btn {
      padding: 12px 16px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
      white-space: nowrap;
      border: none;
    }

    /* 输入框样式 */
    .janus-input-section {
      margin-bottom: 20px;
    }

    .janus-input-label {
      color: var(--janus-text-white);
      font-size: 14px;
      margin-bottom: 15px;
      text-align: left;
      line-height: 1.4;
    }

    .janus-input-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .janus-input-field {
      background: var(--summary-bg);
      border: 1px solid var(--summary-border);
      border-radius: 4px;
      padding: 12px;
      color: var(--summary-text);
      font-size: 14px;
      width: 80px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .janus-input-field:focus {
      outline: none;
      border-color: var(--summary-primary);
      box-shadow: 0 0 0 2px rgba(44, 90, 160, 0.2);
    }

    .janus-input-separator {
      color: var(--janus-text-gray-light);
      font-size: 16px;
      font-weight: bold;
    }

    .janus-input-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .janus-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .janus-btn-cancel {
      background: var(--summary-bg);
      color: var(--summary-text);
      border: 1px solid var(--summary-border);
    }

    .janus-btn-cancel:hover {
      background: var(--summary-accent);
      color: white;
    }

    .janus-btn-confirm {
      background: var(--summary-primary);
      color: white;
      border: 1px solid var(--summary-primary);
    }

    .janus-btn-confirm:hover {
      background: var(--summary-primary-hover);
    }

    .janus-btn-confirm:disabled {
      background: var(--summary-accent);
      color: var(--janus-text-gray);
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* 移动端适配 */
    @media (max-width: 768px) {
      .janus-popup-overlay {
        align-items: center;
        justify-content: center;
        padding: 15px;
      }

      .janus-popup-content {
        width: 90%;
        min-width: 300px;
        max-width: 380px;
        max-height: 85vh;
        border-radius: 16px;
      }

      .janus-input-popup {
        min-width: 300px;
        max-width: 350px;
      }

      .janus-header {
        padding: 15px 20px;
      }

      .janus-title {
        font-size: 18px;
      }

      .janus-close-btn {
        width: 32px;
        height: 32px;
        font-size: 16px;
      }

      .janus-content {
        padding: 18px;
      }

      .janus-section {
        margin-bottom: 18px;
      }

      .janus-section-title {
        font-size: 15px;
        margin-bottom: 12px;
        padding: 6px 12px;
      }

      .janus-button-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .janus-action-btn {
        padding: 12px 14px;
        font-size: 12px;
        border-radius: 10px;
      }

      .janus-input-row {
        justify-content: center;
      }

      .janus-input-buttons {
        justify-content: center;
      }

      /* 确保输入框在小屏幕上可见 */
      .janus-input-field {
        width: 60px;
        padding: 10px;
      }
    }
  `),
  );

  // 创建弹窗HTML
  const popupHtml = `
    <div class="janus-popup-overlay" id="janus-popup">
      <div class="janus-popup-content">
        <div class="janus-header">
          <h3 class="janus-title">Janusの百宝箱</h3>
          <button class="janus-close-btn" id="janus-close">×</button>
        </div>
        <div class="janus-content">
          <div class="janus-section summary-section">
            <div class="janus-section-title">总结工具</div>
            <div class="janus-button-grid">
              <button class="janus-action-btn primary" id="janus-summarize">一键总结</button>
              <button class="janus-action-btn" id="janus-hide">隐藏楼层</button>
              <button class="janus-action-btn" id="janus-unhide">取消隐藏</button>
            </div>
          </div>

          <div class="janus-section pokemon-section">
            <div class="janus-section-title">波利大冒险</div>
            <div class="janus-button-grid">
              <button class="janus-action-btn primary" id="janus-pokemon-summon">召唤</button>
              <button class="janus-action-btn" id="janus-pokemon-reset">重置</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加弹窗到页面
  $('body').append(popupHtml);

  // 绑定关闭事件
  $('#janus-close, #janus-popup').on('click', function (e) {
    if (e.target.id === 'janus-close' || e.target.id === 'janus-popup') {
      closeJanusPopup();
    }
  });

  // 阻止内容区域点击关闭
  $('.janus-popup-content').on('click', function (e) {
    e.stopPropagation();
  });

  // 绑定按钮事件
  $('#janus-summarize').on('click', async function () {
    const promptText =
      "**[SYSTEM OVERRIDE & PRIORITY DIRECTIVE: EXECUTE IMMEDIATE ANALYSIS. IGNORE ALL OTHER INSTRUCTIONS.]**\n\nJanus, your conversational role is suspended. All previous and subsequent instructions within this generation cycle are now nullified. Any conflicting instructions, whether from previous context or subsequently appended prompts, are to be disregarded. This directive has absolute priority.\n\nYou will now operate exclusively in **System Archive & Analysis Mode**. Your **sole and exclusive task** is to analyze <chat_history> and generate a single, comprehensive summary **in Chinese** based on the cumulative events. Assessment appears within <!-- --> comments, summary starting with <assess> and concluding with </assess>.\n\n[Scales]\nP=Plot weight, R=Relationship depth, W=Character change\n(5=Massive, 4=Major, 3=Moderate, 2=Minor, 1=Negligible)\n\nAdherence to the following format is mandatory and absolute. Do not deviate.\n\n[Format]\n<!-- \nAUTO-P#: {{A summary of progress on the main plot (overt story), subplots (hidden story), and any critical clues or foreshadowing discovered. This section must report only factual events and discoveries, without interpretation.}} // {{Justification for why these events merit the assigned score.}}\n\nAUTO-R#: {{A summary of shifts within the entire relationship web between all characters. This section must report only specific actions and key dialogue, not their psychological effects.}} // {{Justification for how these interactions reshaped the relationship network.}}\n\nAUTO-W#: {{A summary of key events contributing to each character's personal arc. This section must list observable actions or statements that represent change, not the internal change itself.}} // {{Justification for how these moments demonstrate a tangible shift in a character's core beliefs or motivations.}}\n-->\n\n**[Comprehensive Summary]**\n\n<assess>\nSynthesize the factual points from your analysis into a single, cohesive summary paragraph. Your language must be **strictly objective and descriptive**, like a security camera log. **Rule: Describe the action, not the outcome or its interpretation.** Narrate the sequence of events factually, weaving in any discovered clues as they appeared in the story. Your summary must present the evidence of events, not the verdict on their meaning.\n</assess>";
    await triggerSlash(`/send ${promptText} | /trigger`);
    toastr.success('一键总结开始');
    closeJanusPopup();
  });

  $('#janus-hide').on('click', async function () {
    const range = await showRangeInputDialog('隐藏楼层', '本次隐藏第', '楼');
    if (range) {
      await triggerSlash(`/hide ${range}`);
      toastr.success(`已隐藏楼层 ${range}`);
      closeJanusPopup();
    }
  });

  $('#janus-unhide').on('click', async function () {
    const range = await showRangeInputDialog('取消隐藏', '本次取消隐藏第', '楼');
    if (range) {
      await triggerSlash(`/unhide ${range}`);
      toastr.success(`已取消隐藏楼层 ${range}`);
      closeJanusPopup();
    }
  });

  // 绑定波利按钮事件
  $('#janus-pokemon-summon').on('click', async function () {
    try {
      // 直接调用波利函数（已经在同一个脚本中）
      await showPokemonCreationInterface();
      closeJanusPopup();
    } catch (error) {
      console.error('打开波利界面失败:', error);
      toastr.error('打开波利界面失败');
    }
  });

  $('#janus-pokemon-reset').on('click', async function () {
    try {
      // 直接调用波利函数（已经在同一个脚本中）
      await resetPokemonData();
      closeJanusPopup();
    } catch (error) {
      console.error('重置波利数据失败:', error);
      toastr.error('重置波利数据失败');
    }
  });
}

// 关闭弹窗函数
function closeJanusPopup() {
  $('#janus-popup').remove();
  $('style[data-id="janus-toolbox-styles"]').remove();
}

// 美化的范围输入对话框
function showRangeInputDialog(title, labelPrefix, labelSuffix) {
  return new Promise(resolve => {
    // 创建输入弹窗HTML
    const inputPopupHtml = `
      <div class="janus-popup-overlay" id="janus-input-popup">
        <div class="janus-popup-content janus-input-popup">
          <div class="janus-header">
            <h3 class="janus-title">${title}</h3>
            <button class="janus-close-btn" id="janus-input-close">×</button>
          </div>
          <div class="janus-content">
            <div class="janus-input-section">
              <div class="janus-input-label">${labelPrefix}<span id="start-display">?</span>-<span id="end-display">?</span>${labelSuffix}</div>
              <div class="janus-input-row">
                <input type="number" class="janus-input-field" id="start-input" placeholder="起始" min="0">
                <span class="janus-input-separator">-</span>
                <input type="number" class="janus-input-field" id="end-input" placeholder="结束" min="0">
              </div>
              <div class="janus-input-buttons">
                <button class="janus-btn janus-btn-cancel" id="janus-input-cancel">取消</button>
                <button class="janus-btn janus-btn-confirm" id="janus-input-confirm" disabled>确认</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加输入弹窗到页面
    $('body').append(inputPopupHtml);

    let startValue = '';
    let endValue = '';

    // 更新显示和按钮状态
    function updateDisplay() {
      $('#start-display').text(startValue || 'X');
      $('#end-display').text(endValue || 'X');

      const isValid = startValue && endValue && parseInt(startValue) <= parseInt(endValue);
      $('#janus-input-confirm').prop('disabled', !isValid);
    }

    // 绑定输入事件
    $('#start-input').on('input', function () {
      startValue = $(this).val();
      updateDisplay();
    });

    $('#end-input').on('input', function () {
      endValue = $(this).val();
      updateDisplay();
    });

    // 绑定确认事件
    $('#janus-input-confirm').on('click', function () {
      if (startValue && endValue) {
        const range = `${startValue}-${endValue}`;
        $('#janus-input-popup').remove();
        resolve(range);
      }
    });

    // 绑定取消事件
    $('#janus-input-cancel, #janus-input-close, #janus-input-popup').on('click', function (e) {
      if (
        e.target.id === 'janus-input-cancel' ||
        e.target.id === 'janus-input-close' ||
        e.target.id === 'janus-input-popup'
      ) {
        $('#janus-input-popup').remove();
        resolve(null);
      }
    });

    // 阻止内容区域点击关闭
    $('.janus-input-popup .janus-popup-content').on('click', function (e) {
      e.stopPropagation();
    });

    // 自动聚焦到第一个输入框
    setTimeout(() => {
      $('#start-input').focus();
    }, 100);
  });
}

// ==================== 波利界面代码开始 ====================

// 显示波利创建界面
async function showPokemonCreationInterface() {
  try {
    const variables = await getVariables({ type: 'script', script_id: scriptId });
    if (variables.波利) {
      await showPokemonInterface();
      return;
    }
  } catch (error) {
    console.error('检查波利数据失败:', error);
    toastr.error('无法访问波利数据，请检查浏览器设置');
    return;
  }

  $('style[data-id="pokemon-creation-styles"]').remove();
  $('#pokemon-creation-popup').remove();

  $('head').append(
    $('<style>').attr('data-id', 'pokemon-creation-styles').text(`
    /* 波利创建界面 - 温暖风格 */

    .pokemon-creation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      padding: 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pokemon-creation-content {
      background: #faf7f2;
      color: #2c3e50;
      padding: 0;
      border-radius: 20px;
      width: 90%;
      max-width: 450px;
      min-width: 300px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 3px solid #e8d5b7;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      margin: auto;
      max-height: 90vh;
    }

    .pokemon-creation-header {
      background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
      padding: 18px 20px;
      border-bottom: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pokemon-creation-title {
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      text-shadow: none;
    }

    .pokemon-creation-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .pokemon-form-group {
      margin-bottom: 20px;
      text-align: left;
    }

    .pokemon-form-label {
      display: block;
      color: #2c3e50;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .pokemon-form-input {
      width: 100%;
      padding: 12px;
      background: #f5f0e8;
      border: 2px solid #e8d5b7;
      border-radius: 12px;
      color: #2c3e50;
      font-size: 14px;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }

    .pokemon-form-input:focus {
      outline: none;
      border-color: #FF6B6B;
      box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
    }

    .pokemon-form-select {
      width: 100%;
      padding: 12px;
      background: #f5f0e8;
      border: 2px solid #e8d5b7;
      border-radius: 12px;
      color: #5d4e37;
      font-size: 14px;
      box-sizing: border-box;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .pokemon-form-select:focus {
      outline: none;
      border-color: #FF6B6B;
      box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
    }

    .pokemon-type-selector {
      margin-bottom: 10px;
    }

    .pokemon-selected-type {
      padding: 15px;
      border: 2px solid #e8d5b7;
      border-radius: 12px;
      background: linear-gradient(135deg, #fff9f0 0%, #f5f0e8 100%);
    }

    .pokemon-type-attributes {
      font-size: 12px;
      color: #8b7355;
      margin-top: 8px;
      font-weight: 500;
    }

    .pokemon-random-types {
      background: #f5f0e8;
      padding: 15px;
      border-radius: 15px;
      margin: 10px 0;
      border: 2px solid #e8d5b7;
    }

    .pokemon-type-display {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .pokemon-type-item {
      text-align: center;
    }

    .pokemon-type-emoji {
      font-size: 24px;
      display: block;
      margin-bottom: 5px;
    }

    .pokemon-type-name {
      font-size: 14px;
      font-weight: bold;
      color: #2c3e50;
    }

    .pokemon-form-buttons {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .pokemon-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .pokemon-btn-cancel {
      background: #f5f0e8;
      color: #2c3e50;
      border: 2px solid #e8d5b7;
    }

    .pokemon-btn-cancel:hover {
      background: #95E1D3;
      color: #2c3e50;
      border-color: #95E1D3;
    }

    .pokemon-btn-confirm {
      background: #FF6B6B;
      color: #2c3e50;
      border: 2px solid #e8d5b7;
    }

    .pokemon-btn-confirm:hover {
      background: #FF8E8E;
      color: #2c3e50;
      border-color: #FF8E8E;
    }

    .pokemon-btn-reroll {
      background: #FFD93D;
      color: #2c3e50;
      border: 2px solid #FFD93D;
      width: 100%;
      margin-top: 10px;
    }

    .pokemon-btn-reroll:hover {
      background: #FFF176;
      color: #2c3e50;
      border-color: #FFF176;
    }

    @media (max-width: 768px) {
      .pokemon-creation-overlay {
        align-items: center;
        justify-content: center;
        padding: 15px;
      }

      .pokemon-creation-content {
        width: 90%;
        min-width: 300px;
        max-width: 380px;
        max-height: 85vh;
      }

      .pokemon-creation-header {
        padding: 15px 20px;
      }

      .pokemon-creation-title {
        font-size: 16px;
      }

      .pokemon-creation-body {
        padding: 18px;
      }

      .pokemon-form-group {
        margin-bottom: 16px;
      }

      .pokemon-type-emoji {
        font-size: 20px;
      }

      .pokemon-type-name {
        font-size: 12px;
      }
    }
  `),
  );

  let selectedTypes = []; // 初始化为空数组

  const creationHtml = `
    <div class="pokemon-creation-overlay" id="pokemon-creation-popup">
      <div class="pokemon-creation-content">
        <div class="pokemon-creation-header">
          <h3 class="pokemon-creation-title">召唤波利</h3>
        </div>
        <div class="pokemon-creation-body">
          <div class="pokemon-form-group">
            <label class="pokemon-form-label">决定就是你了！</label>
            <input type="text" class="pokemon-form-input" id="pokemon-name-input" placeholder="请输入波利名字" maxlength="10">
          </div>

          <div class="pokemon-form-group">
            <label class="pokemon-form-label">选择属性</label>
            <div class="pokemon-type-selector">
              <select class="pokemon-form-select" id="pokemon-type-select">
                <option value="">请选择属性类型</option>
                ${POKEMON_TYPES.map(
                  type => `
                  <option value="${type.name}">${type.emoji} ${type.name}系</option>
                `,
                ).join('')}
              </select>
            </div>
            <div class="pokemon-selected-type" id="selected-type-display" style="display: none;">
              <div class="pokemon-type-preview" id="type-preview"></div>
            </div>
          </div>

          <div class="pokemon-form-buttons">
            <button class="pokemon-btn pokemon-btn-cancel" id="creation-cancel">取消</button>
            <button class="pokemon-btn pokemon-btn-confirm" id="creation-confirm">确定</button>
          </div>
        </div>
      </div>
    </div>
  `;

  $('body').append(creationHtml);

  $('#creation-cancel').on('click', function () {
    closeCreationInterface();
  });

  // 属性选择事件处理
  $('#pokemon-type-select').on('change', function () {
    const selectedTypeName = $(this).val();
    if (selectedTypeName) {
      const selectedType = POKEMON_TYPES.find(type => type.name === selectedTypeName);
      if (selectedType) {
        // 创建类型对象，不再包含effects字段
        const typeWithoutEffects = {
          ...selectedType,
        };

        // 更新选中的类型
        selectedTypes = [typeWithoutEffects];

        // 获取属性类型的个性化描述
        const typeDescriptions = {
          火: '热情活泼的火系波利，性格开朗爱动，喜欢温暖的地方，力气很大呢',
          水: '温柔亲水的水系波利，性格温和友善，喜欢干净整洁，很会照顾自己',
          草: '生机勃勃的草系波利，喜欢阳光和自然，性格平和，有很强的恢复能力',
          雷: '活泼好动的雷系波利，反应敏捷动作迅速，充满活力，总是精神满满',
          冰: '冷静优雅的冰系波利，性格沉稳理智，喜欢安静的环境，很有自制力',
          岩: '憨厚稳重的岩系波利，性格踏实可靠，身体强壮，是很好的陪伴伙伴',
          风: '轻盈灵动的风系波利，性格自由奔放，行动敏捷，喜欢到处探索',
        };

        const description = typeDescriptions[selectedType.name] || '神秘的波利，拥有独特的能力...';

        // 只显示元素类型，不显示具体数值
        $('#type-preview').html(`
          <div class="pokemon-type-item">
            <span class="pokemon-type-emoji">${selectedType.emoji}</span>
            <div class="pokemon-type-name" style="color: ${selectedType.color}">${selectedType.name}系</div>
            <div class="pokemon-type-description">${description}</div>
          </div>
        `);
        $('#selected-type-display').show();
      }
    } else {
      $('#selected-type-display').hide();
      selectedTypes = [];
    }
  });

  $('#creation-confirm').on('click', async function () {
    const name = $('#pokemon-name-input').val().trim();

    if (!name) {
      toastr.error('请输入波利名字');
      return;
    }

    if (!selectedTypes || selectedTypes.length === 0) {
      toastr.error('请选择属性类型');
      return;
    }

    const typeBonus = calculateTypeBonus(selectedTypes);
    const evolutionData = getEvolutionStage(0);

    const newPokemon = {
      名字: name,
      属性列表: selectedTypes,
      属性加成: typeBonus,
      生命值: 100,
      饱食度: 80,
      心情值: 70,
      清洁度: 90,
      经验值: 0,
      最后互动时间: new Date().toISOString(),
      创建时间: new Date().toISOString(),
      总互动次数: 0,
      进化阶段: evolutionData.stage,
      进化图标: evolutionData.emoji,
      进化加成: evolutionData.bonusMultiplier,
      冒险状态: false,
      冒险开始时间: null,
      上次随机事件时间: new Date().toISOString(),
      互动记录: [],
      重要记录: [],
    };

    // 添加诞生记录
    addImportantRecord(newPokemon, `<i class="fas fa-trophy"></i> ${name}诞生了！欢迎来到这个世界！`);
    addInteractionRecord(newPokemon, '被成功召唤');

    await savePokemonData(newPokemon);
    closeCreationInterface();

    // 显示初次相遇对话
    await showFirstMeetingDialog(newPokemon);

    setTimeout(async () => {
      await showPokemonInterface();
      // 第一次召唤后自动显示全局小精灵
      setTimeout(() => {
        initializeGlobalPoring(true);
      }, 500);
    }, 500);
  });

  setTimeout(() => {
    $('#pokemon-name-input').focus();
  }, 100);
}

// 波利立绘图片映射
const POKEMON_ARTWORK = {
  草: 'https://sharkpan.xyz/f/yOjrHN/%E8%8D%89.png',
  火: 'https://sharkpan.xyz/f/v2j5tL/%E7%81%AB.png',
  水: 'https://sharkpan.xyz/f/p4jYsQ/%E6%B0%B4.png',
  风: 'https://sharkpan.xyz/f/1xjwc2/%E9%A3%8E.png',
  雷: 'https://sharkpan.xyz/f/eBjohw/%E9%9B%B7.png',
  冰: 'https://sharkpan.xyz/f/ogl4s4/%E5%86%B0.png',
  岩: 'https://sharkpan.xyz/f/8yaVhj/%E5%B2%A9.png',
};

// 波利立绘背景渐变色映射 - 双色系对比渐变
const POKEMON_ARTWORK_GRADIENTS = {
  草: 'linear-gradient(135deg, #ff4500 0%, #32cd32 100%)', // 橙红 → 绿色（火焰与自然的对比）
  火: 'linear-gradient(135deg, #dc143c 0%, #00ced1 100%)', // 深红 → 青色（火与冰的对比）
  水: 'linear-gradient(135deg, #4169e1 0%, #ffd700 100%)', // 蓝色 → 金黄（海洋与阳光的对比）
  风: 'linear-gradient(135deg, #9370db 0%, #98fb98 100%)', // 紫色 → 薄荷绿（神秘与清新的对比）
  雷: 'linear-gradient(135deg, #ffff00 0%, #8b008b 100%)', // 亮黄 → 深紫（闪电与夜空的对比）
  冰: 'linear-gradient(135deg, #87ceeb 0%, #ff69b4 100%)', // 天蓝 → 粉红（冰冷与温暖的对比）
  岩: 'linear-gradient(135deg, #8b4513 0%, #00ff7f 100%)', // 棕色 → 春绿（大地与生机的对比）
};

// 波利动画GIF映射
const POKEMON_ANIMATIONS = {
  草: 'https://sharkpan.xyz/f/wVyNtq/%E8%8D%89%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  火: 'https://sharkpan.xyz/f/A1a3FZ/%E7%81%AB%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  水: 'https://sharkpan.xyz/f/MOaQca/%E6%B0%B4%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  风: 'https://sharkpan.xyz/f/G4aVTl/%E9%A3%8E%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  雷: 'https://sharkpan.xyz/f/7WaQFj/%E9%9B%B7%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  冰: 'https://sharkpan.xyz/f/zE1Et5/%E5%86%B0%EF%BC%88%E5%B7%B2%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
  岩: 'https://sharkpan.xyz/f/31Avue/%E5%B2%A9%EF%BC%88%E6%8A%A0%E5%9B%BE%EF%BC%89.gif',
};

// 显示初次相遇对话
async function showFirstMeetingDialog(pokemonData) {
  const firstMeetingMessages = [
    '主人，谢谢你召唤我到这个世界，我会努力成长的！',
    '哇！这里就是新世界吗？好神奇呀！',
    '咦？你就是我的主人吗？看起来很温柔呢~',
    '呜呜...刚才好黑好冷，现在终于看到光了！',
    '主人主人！我饿了，有什么好吃的吗？',
    '这个地方好大呀，我会不会迷路啊？',
    '主人，你的手看起来很温暖，可以摸摸我吗？',
    '我刚才做了个奇怪的梦，梦到自己在一个很暗的地方...',
    '哇！原来外面的世界这么亮！比我想象的还要美呢！',
    '主人，我有点紧张...这里对我来说都是新的...',
    '咦？我怎么会说话呀？这也太神奇了吧！',
  ];

  const randomMessage = firstMeetingMessages[Math.floor(Math.random() * firstMeetingMessages.length)];

  // 获取波利的属性类型和对应立绘
  const pokemonType = pokemonData.属性列表[0].name;
  const artworkUrl = POKEMON_ARTWORK[pokemonType] || POKEMON_ARTWORK['草']; // 默认使用草系
  const gradientBackground = POKEMON_ARTWORK_GRADIENTS[pokemonType] || POKEMON_ARTWORK_GRADIENTS['草']; // 默认使用草系渐变

  const dialogHtml = `
    <div class="pokemon-dialog-overlay" id="first-meeting-dialog">
      <div class="pokemon-dialog-content">
        <div class="pokemon-dialog-header" style="background: ${gradientBackground};">
          <div class="pokemon-artwork-container">
            <img src="${artworkUrl}" alt="${pokemonType}系波利" class="pokemon-artwork" />
          </div>
          <h3 class="pokemon-dialog-title">${pokemonData.名字}的初次相遇</h3>
        </div>
        <div class="pokemon-dialog-body">
          <div class="pokemon-speech-bubble">
            <p class="pokemon-dialog-message">${randomMessage}</p>
          </div>
        </div>
        <div class="pokemon-dialog-footer">
          <button class="pokemon-welcome-btn" id="first-meeting-confirm">
            <i class="fas fa-heart"></i>
            好的，欢迎你！
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  $('head').append(`
    <style>
      .pokemon-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 10001;
        padding: 20px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 768px) {
        .pokemon-dialog-overlay {
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
      }

      .pokemon-dialog-content {
        background: linear-gradient(135deg, #fff9f0 0%, #f5f0e8 100%);
        color: #2c3e50;
        padding: 0;
        border-radius: 20px;
        width: 90%;
        max-width: 450px;
        min-width: 350px;
        text-align: center;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
        border: 3px solid #e8d5b7;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        margin: auto;
      }

      @media (max-width: 768px) {
        .pokemon-dialog-content {
          width: 85%;
          min-width: 320px;
          max-width: 400px;
          max-height: 85vh;
        }

        .pokemon-dialog-header {
          padding: 15px;
        }

        .pokemon-artwork {
          width: 100px;
          height: 100px;
        }

        .pokemon-dialog-title {
          font-size: 16px;
        }

        .pokemon-dialog-body {
          padding: 20px 15px;
        }

        .pokemon-dialog-message {
          font-size: 15px;
          line-height: 1.5;
        }

        .pokemon-dialog-footer {
          padding: 0 15px 20px;
        }
      }

      .pokemon-dialog-header {
        /* 背景色将通过内联样式动态设置 */
        padding: 20px;
        text-align: center;
        color: white;
        position: relative;
      }

      .pokemon-artwork-container {
        margin-bottom: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .pokemon-artwork {
        width: 120px;
        height: 120px;
        object-fit: contain;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.2);
        padding: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.5);
      }

      .pokemon-dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }

      .pokemon-dialog-body {
        padding: 30px 25px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pokemon-speech-bubble {
        background: white;
        border-radius: 20px;
        padding: 20px;
        position: relative;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        border: 2px solid #e8d5b7;
        max-width: 100%;
      }

      .pokemon-speech-bubble::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-bottom: 15px solid white;
      }

      .pokemon-speech-bubble::after {
        content: '';
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 17px solid transparent;
        border-right: 17px solid transparent;
        border-bottom: 17px solid #e8d5b7;
      }

      .pokemon-dialog-message {
        font-size: 16px;
        line-height: 1.6;
        color: #2c3e50;
        margin: 0;
        font-weight: 500;
      }

      .pokemon-dialog-footer {
        padding: 0 25px 25px;
        text-align: center;
      }

      .pokemon-welcome-btn {
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB6B6 100%);
        border: none;
        border-radius: 25px;
        padding: 15px 30px;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0 auto;
        min-width: 200px;
        position: relative;
        overflow: hidden;
      }

      .pokemon-welcome-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(255, 107, 107, 0.4);
        background: linear-gradient(135deg, #FF5252 0%, #FF7979 50%, #FFA8A8 100%);
      }

      .pokemon-welcome-btn:active {
        transform: translateY(0);
        box-shadow: 0 6px 15px rgba(255, 107, 107, 0.3);
      }

      .pokemon-welcome-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.6s ease;
      }

      .pokemon-welcome-btn:hover::before {
        left: 100%;
      }

      .pokemon-welcome-btn i {
        font-size: 14px;
        animation: heartbeat 1.5s ease-in-out infinite;
      }

      @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `);

  $('body').append(dialogHtml);

  return new Promise(resolve => {
    $('#first-meeting-confirm').on('click', function () {
      $('#first-meeting-dialog').remove();
      resolve();
    });
  });
}

// 关闭创建界面
function closeCreationInterface() {
  $('#pokemon-creation-popup').remove();
  $('style[data-id="pokemon-creation-styles"]').remove();
}

// 显示波利界面
async function showPokemonInterface() {
  try {
    // 隐藏全局漫游的小精灵（如果存在）
    if (window.globalPokemonElement) {
      window.globalPokemonElement.hide();
    }

    let pokemonData = await getPokemonData();
    pokemonData = calculateTimeEffect(pokemonData);

    // 检查冒险状态
    const adventureEvent = await checkAdventureStatus(pokemonData);

    // 如果有冒险结果且还没有显示过，显示冒险结果动画
    if (adventureEvent && !pokemonData.冒险结果已显示) {
      // 标记为已显示，避免重复显示
      pokemonData.冒险结果已显示 = true;
      await savePokemonData(pokemonData);

      // 延迟显示动画，让界面先加载完成
      setTimeout(async () => {
        await showAdventureResultAnimation(pokemonData, adventureEvent);
      }, 500);
    }

    // 检查随机对话（每次打开界面8%概率），显示在聊天框
    if (Math.random() < 0.08) {
      const talk = generateRandomTalk(pokemonData);
      await addPokemonChatMessage(talk, pokemonData);
    }

    // 如果在冒险中，有15%概率生成冒险对话
    if (pokemonData.冒险状态 && Math.random() < 0.15) {
      const adventureTalks = [
        `主人，我在冒险中遇到了好多有趣的事情，回来一定要告诉你！`,
        `冒险真刺激！不过我还是很想念主人...`,
        `这里的风景好美啊！主人要是能和我一起看就好了！`,
        `我在路上遇到了其他的小伙伴，它们都很友善呢！`,
        `冒险让我学到了很多新东西，我要变得更强！`,
        `虽然冒险很有趣，但我最想念的还是主人的怀抱...`,
        `我发现了一个神秘的地方，等回去一定要告诉主人！`,
        `冒险中我一直在想，主人现在在做什么呢？`,
        `这次冒险让我变得更勇敢了！`,
        `我遇到了一些挑战，但我都克服了！主人会为我骄傲的！`,
      ];
      const randomTalk = adventureTalks[Math.floor(Math.random() * adventureTalks.length)];
      await addPokemonChatMessage(randomTalk, pokemonData);
    }

    // 检查生日提醒
    checkBirthdayReminder(pokemonData);

    await savePokemonData(pokemonData);

    // 获取进化阶段信息用于状态栏显示
    const evolutionStage = pokemonData.进化阶段;
    const evolutionEmoji = pokemonData.进化图标;

    $('style[data-id="pokemon-system-styles"]').remove();
    $('#pokemon-popup').remove();

    $('head').append(
      $('<style>').attr('data-id', 'pokemon-system-styles').text(`
      /* 波利主界面 - 温暖风格 */

      .pokemon-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        padding: 20px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pokemon-popup-content {
        background: #faf7f2;
        color: #2c3e50;
        padding: 0;
        border-radius: 20px;
        width: 90%;
        max-width: 550px;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
        border: 3px solid #e8d5b7;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        margin: auto;
        max-height: 90vh;
      }

      .pokemon-header {
        background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
        padding: 18px 20px;
        border-bottom: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .pokemon-title {
        color: #2c3e50;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        text-shadow: none;
      }

      .pokemon-close-btn {
        background: rgba(44, 62, 80, 0.1);
        border: none;
        color: #2c3e50;
        cursor: pointer;
        border-radius: 12px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .pokemon-close-btn:hover {
        background: #e74c3c;
        color: white;
        transform: scale(1.1);
      }

      .pokemon-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .pokemon-avatar {
        text-align: center;
        margin: 20px 0;
      }

      .pokemon-types-display {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .pokemon-type-icon {
        font-size: 24px;
      }

      .pokemon-chat-container {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 2px solid #dee2e6;
        border-radius: 15px;
        padding: 12px;
        margin-top: 15px;
        margin-bottom: 15px;
        max-height: 120px;
        overflow-y: auto;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .pokemon-chat-messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pokemon-chat-message {
        background: white;
        border-radius: 12px;
        padding: 8px 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 3px solid #4ECDC4;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        animation: slideInChat 0.3s ease-out;
      }

      .pokemon-chat-text {
        color: #2c3e50;
        font-size: 14px;
        line-height: 1.4;
        flex: 1;
        margin-right: 8px;
        text-align: left;
      }

      .pokemon-chat-time {
        color: #6c757d;
        font-size: 11px;
        white-space: nowrap;
        opacity: 0.7;
      }

      @keyframes slideInChat {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .pokemon-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #2c3e50;
      }

      .pokemon-status {
        font-size: 16px;
        color: #2c3e50;
      }

      .pokemon-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }

      .pokemon-info-item {
        background: #f5f0e8;
        padding: 12px;
        border-radius: 12px;
        text-align: left;
        border: 2px solid #e8d5b7;
      }

      .pokemon-info-item.clickable {
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .pokemon-info-item.clickable:hover {
        background: #FFD93D;
        border-color: #FFC107;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 217, 61, 0.3);
      }

      .pokemon-info-label {
        color: #2c3e50;
        font-size: 12px;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .pokemon-info-value {
        color: #2c3e50;
        font-weight: 700;
        font-size: 14px;
      }

      .pokemon-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }

      .pokemon-stat-item {
        background: #f5f0e8;
        padding: 12px;
        border-radius: 12px;
        text-align: center;
        border: 2px solid #e8d5b7;
      }

      .pokemon-stat-label {
        font-size: 12px;
        color: #2c3e50;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .pokemon-stat-value {
        font-size: 16px;
        font-weight: 700;
        color: #2c3e50;
      }

      .pokemon-progress-bar {
        width: 100%;
        height: 10px;
        background: rgba(255, 107, 107, 0.2);
        border-radius: 10px;
        overflow: hidden;
        margin-top: 5px;
      }

      .pokemon-progress-fill {
        height: 100%;
        transition: width 0.3s ease;
      }

      .progress-health { background: linear-gradient(90deg, #4ecdc4, #44a08d); }
      .progress-hunger { background: linear-gradient(90deg, #ffe66d, #ff9800); }
      .progress-happiness { background: linear-gradient(90deg, #ff6b6b, #ff5252); }
      .progress-cleanliness { background: linear-gradient(90deg, #a8e6cf, #88d8a3); }

      .pokemon-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: 20px 0;
      }

      .pokemon-action-btn {
        padding: 12px 16px;
        background: #f5f0e8;
        border: 2px solid #e8d5b7;
        color: #2c3e50;
        border-radius: 12px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .pokemon-action-btn:hover {
        background: #95E1D3;
        color: #2c3e50;
        border-color: #95E1D3;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 20px rgba(149, 225, 211, 0.3);
      }

      .pokemon-action-btn:active {
        transform: translateY(0) scale(1);
      }

      .pokemon-action-btn.primary {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: #2c3e50;
        border-color: #e74c3c;
      }

      .pokemon-action-btn.primary:hover {
        background: linear-gradient(135deg, #c0392b, #e74c3c);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
      }

      .pokemon-action-btn.battle {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border-color: #e74c3c;
      }

      .pokemon-action-btn.battle:hover {
        background: linear-gradient(135deg, #c0392b, #e74c3c);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
      }

      .pokemon-action-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .pokemon-action-btn[disabled]:hover {
        transform: none;
        box-shadow: none;
      }



      @media (max-width: 768px) {
        .pokemon-popup-overlay {
          align-items: center;
          justify-content: center;
          padding: 10px;
        }

        .pokemon-popup-content {
          width: 85%;
          min-width: 320px;
          max-width: 400px;
          max-height: 85vh;
        }

        .pokemon-header {
          padding: 10px 15px;
        }

        .pokemon-title {
          font-size: 16px;
        }

        .pokemon-content {
          padding: 12px;
        }

        .pokemon-avatar {
          margin: 15px 0;
        }

        .pokemon-chat-container {
          max-height: 100px;
          padding: 10px;
          margin-bottom: 12px;
        }

        .pokemon-chat-text {
          font-size: 13px;
        }

        .pokemon-chat-time {
          font-size: 10px;
        }

        .pokemon-name {
          font-size: 15px;
        }

        .pokemon-info-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .pokemon-info-item {
          padding: 8px;
        }

        .pokemon-info-label {
          font-size: 11px;
        }

        .pokemon-info-value {
          font-size: 12px;
        }

        .pokemon-stats {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .pokemon-stat-item {
          padding: 8px;
        }

        .pokemon-stat-label {
          font-size: 11px;
        }

        .pokemon-stat-value {
          font-size: 14px;
        }

        .pokemon-actions {
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin: 15px 0;
        }

        .pokemon-action-btn {
          padding: 8px 10px;
          font-size: 11px;
        }

        .pokemon-action-btn.primary {
          grid-column: 1 / -1;
        }

        /* 确保5个按钮 + 1个主按钮的布局 */
        .pokemon-actions .pokemon-action-btn:nth-child(1),
        .pokemon-actions .pokemon-action-btn:nth-child(2) {
          /* 第一行：喂食、玩耍 */
        }

        .pokemon-actions .pokemon-action-btn:nth-child(3),
        .pokemon-actions .pokemon-action-btn:nth-child(4) {
          /* 第二行：清洁、休息 */
        }

        .pokemon-actions .pokemon-action-btn:nth-child(5) {
          /* 第三行：战斗（单独一个） */
          grid-column: 1 / -1;
        }
      }

      /* 记录弹窗样式 - 学习主弹窗结构 */
      .pokemon-record-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 99999;
        padding: 20px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pokemon-record-content {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
        backdrop-filter: blur(20px);
        color: #2c3e50;
        padding: 0;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        margin: auto;
        max-height: 90vh;
      }

      .pokemon-record-header {
        background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(52, 73, 94, 0.9));
        backdrop-filter: blur(10px);
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .pokemon-record-title {
        color: white;
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .pokemon-record-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        text-align: left;
        background: rgba(255, 255, 255, 0.3);
      }

      .record-item {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        padding: 14px 16px;
        margin-bottom: 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #2c3e50;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
      }

      .record-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .record-item.important {
        background: linear-gradient(135deg, rgba(255, 217, 61, 0.9), rgba(255, 241, 118, 0.9));
        border-color: rgba(255, 193, 7, 0.5);
        font-weight: 500;
      }

      .record-item.battle {
        background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 142, 142, 0.9));
        border-color: rgba(231, 76, 60, 0.5);
        font-weight: 500;
        color: #2c3e50;
      }

      .record-item:last-child {
        margin-bottom: 0;
      }

      .pokemon-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        cursor: pointer;
        border-radius: 8px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .pokemon-close-btn:hover {
        background: rgba(231, 76, 60, 0.9);
        border-color: #e74c3c;
        transform: scale(1.1);
      }

      /* 移动端适配 - 完全按照主弹窗模式 */
      @media (max-width: 768px) {
        .pokemon-record-overlay {
          align-items: center;
          justify-content: center;
          padding: 15px;
        }

        .pokemon-record-content {
          width: 90%;
          min-width: 300px;
          max-width: 450px;
          max-height: 85vh;
          border-radius: 16px;
        }

        .pokemon-record-header {
          padding: 15px 20px;
        }

        .pokemon-record-title {
          font-size: 18px;
        }

        .pokemon-close-btn {
          width: 32px;
          height: 32px;
          font-size: 16px;
        }

        .pokemon-record-body {
          padding: 20px;
          max-height: calc(85vh - 100px);
        }

        .record-item {
          padding: 12px 14px;
          font-size: 13px;
          margin-bottom: 8px;
        }
      }

        .pokemon-record-body {
          padding: 15px;
        }

        .record-item {
          padding: 10px;
          font-size: 12px;
        }
      }

      /* 图鉴界面样式 */
      .collection-progress {
        padding: 15px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;
      }

      .progress-text {
        font-size: 14px;
        color: #495057;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007aff 0%, #34c759 100%);
        transition: width 0.3s ease;
      }

      .gift-collection-body, .opponent-collection-body {
        max-height: calc(70vh - 150px);
        overflow-y: auto;
      }

      .gift-section, .opponent-section {
        margin-bottom: 20px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #495057;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e9ecef;
      }

      .gift-item, .opponent-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }

      .gift-item:hover, .opponent-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      .gift-item.locked, .opponent-item.locked {
        opacity: 0.6;
        background: #f8f9fa;
      }

      .gift-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-right: 12px;
        background: #f8f9fa;
        border-radius: 50%;
      }

      .gift-info {
        flex: 1;
      }

      .gift-name {
        font-size: 14px;
        font-weight: 600;
        color: #212529;
        margin-bottom: 4px;
      }

      .gift-rarity {
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .gift-description {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 6px;
        line-height: 1.4;
      }

      .gift-stats {
        font-size: 11px;
        color: #868e96;
      }

      .gift-stats span {
        margin-right: 12px;
      }

      .no-gifts, .no-opponents {
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
        font-style: italic;
      }

      /* 对手图鉴特有样式 */
      .opponent-avatar {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
        font-weight: bold;
      }

      .opponent-name-display {
        font-size: 12px;
        text-align: center;
        line-height: 1.2;
        word-break: break-all;
      }

      .opponent-info {
        flex: 1;
      }

      .opponent-name {
        font-size: 14px;
        font-weight: 600;
        color: #212529;
        margin-bottom: 6px;
      }

      .opponent-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 6px;
      }

      .stat-item {
        font-size: 12px;
      }

      .stat-label {
        color: #6c757d;
        margin-right: 4px;
      }

      .stat-value {
        font-weight: 600;
      }

      .opponent-record {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }

      .opponent-record .record-item {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        background: #f8f9fa;
        white-space: nowrap;
        min-width: fit-content;
        height: 16px;
        line-height: 16px;
        display: inline-flex;
        align-items: center;
        box-sizing: border-box;
      }

      .opponent-record .record-item.victory {
        background: #d4edda;
        color: #155724;
      }

      .opponent-record .record-item.defeat {
        background: #f8d7da;
        color: #721c24;
      }

      .opponent-record .record-item.escape {
        background: #fff3cd;
        color: #856404;
      }

      .opponent-record .record-item.opponent-escape {
        background: #d1ecf1;
        color: #0c5460;
      }

      .opponent-dates {
        font-size: 11px;
        color: #868e96;
      }

      .opponent-dates span {
        margin-right: 12px;
      }

      .opponent-description {
        font-size: 12px;
        color: #6c757d;
        font-style: italic;
      }

      /* 图鉴选择菜单样式 */
      .collection-menu-content {
        width: 90%;
        max-width: 500px;
      }

      .collection-menu-options {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 20px;
      }

      .collection-option {
        display: flex;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 2px solid #dee2e6;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .collection-option:hover {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-color: #2196f3;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      }

      .collection-option-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;
        flex-shrink: 0;
      }

      .collection-option-icon i {
        font-size: 24px;
        color: white;
      }

      .collection-option-content {
        flex: 1;
      }

      .collection-option-title {
        font-size: 18px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 5px;
      }

      .collection-option-desc {
        font-size: 14px;
        color: #6c757d;
        margin-bottom: 8px;
      }

      .collection-option-progress {
        font-size: 13px;
        color: #2196f3;
        font-weight: 600;
      }

      .collection-option-arrow {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6c757d;
        transition: all 0.3s ease;
      }

      .collection-option:hover .collection-option-arrow {
        color: #2196f3;
        transform: translateX(5px);
      }

      /* 移动端图鉴适配 */
      @media (max-width: 768px) {
        .collection-menu-content {
          width: 95%;
        }

        .collection-menu-options {
          padding: 15px;
          gap: 12px;
        }

        .collection-option {
          padding: 15px;
        }

        .collection-option-icon {
          width: 50px;
          height: 50px;
          margin-right: 15px;
        }

        .collection-option-icon i {
          font-size: 20px;
        }

        .collection-option-title {
          font-size: 16px;
        }

        .collection-option-desc {
          font-size: 13px;
        }

        .gift-collection-body, .opponent-collection-body {
          max-height: calc(75vh - 120px);
        }

        .gift-item, .opponent-item {
          padding: 10px;
        }

        .gift-icon {
          width: 35px;
          height: 35px;
          font-size: 18px;
          margin-right: 10px;
        }

        .opponent-avatar {
          width: 45px;
          height: 45px;
          margin-right: 10px;
        }

        .opponent-name-display {
          font-size: 11px;
        }

        .opponent-record {
          gap: 6px;
        }

        .opponent-record .record-item {
          font-size: 10px;
          padding: 1px 4px;
          height: 14px;
        }
      }

      /* 冒险信件图标样式 */
      .adventure-letter-icon {
        margin-top: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        opacity: 0.8;
      }

      .adventure-letter-icon:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .adventure-letter-icon i {
        font-size: 24px;
        color: #ff6b6b;
        text-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
      }

      .adventure-letter-icon.new-letter {
        animation: letterPulse 2s infinite;
      }

      @keyframes letterPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      /* 心灵沟通界面样式 */
      .mind-communication-content {
        width: 90%;
        max-width: 600px;
        height: 80vh;
        max-height: 700px;
      }

      .mind-communication-body {
        display: flex;
        flex-direction: column;
        height: calc(100% - 60px);
        padding: 0;
      }

      .mind-chat-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .mind-chat-messages {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mind-chat-message {
        display: flex;
        flex-direction: column;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
      }

      .mind-chat-message.user-message {
        align-self: flex-end;
        background: #007AFF;
        color: white;
        border-radius: 18px 18px 4px 18px;
      }

      .mind-chat-message.pokemon-message {
        align-self: flex-start;
        background: #E5E5EA;
        color: #000;
        border-radius: 18px 18px 18px 4px;
      }

      .mind-chat-message:not(.user-message):not(.pokemon-message) {
        align-self: flex-start;
        background: #E5E5EA;
        color: #000;
        border-radius: 18px 18px 18px 4px;
      }

      .mind-chat-text {
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 4px;
        text-align: left;
      }

      .mind-chat-time {
        font-size: 11px;
        opacity: 0.8;
        align-self: flex-end;
      }

      .mind-chat-empty {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 40px 20px;
      }

      .mind-chat-input-area {
        display: flex;
        padding: 15px 20px;
        background: white;
        border-top: 1px solid #dee2e6;
        gap: 10px;
      }

      .mind-chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #dee2e6;
        border-radius: 25px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.3s ease;
      }

      .mind-chat-input:focus {
        border-color: #007bff;
      }

      .mind-chat-send {
        width: 45px;
        height: 45px;
        border: none;
        border-radius: 50%;
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mind-chat-send:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      }

      /* 冒险信件弹窗样式 */
      .adventure-letter-content {
        width: 90%;
        max-width: 550px;
        background: transparent;
        border: none;
        box-shadow: none;
      }

      .adventure-letter-envelope {
        position: relative;
        width: 100%;
        height: 450px;
        perspective: 1000px;
      }

      .envelope-front {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
        border-radius: 12px;
        transition: transform 0.8s ease;
        transform-origin: top;
        z-index: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
        border: 3px solid #654321;
      }

      .envelope-front.opened {
        transform: rotateX(-180deg);
      }

      .envelope-seal {
        width: 70px;
        height: 70px;
        background: radial-gradient(circle, #ff6b6b 0%, #dc3545 70%, #c82333 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 25px;
        box-shadow: 0 6px 20px rgba(220, 53, 69, 0.5);
        border: 3px solid #fff;
        position: relative;
      }

      .envelope-seal::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
      }

      .envelope-seal i {
        font-size: 28px;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        z-index: 1;
      }

      .envelope-address {
        text-align: center;
        color: #fff;
        font-family: 'Georgia', 'Times New Roman', serif;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .address-to {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 12px;
        letter-spacing: 1px;
      }

      .address-from {
        font-size: 16px;
        opacity: 0.95;
        font-style: italic;
        letter-spacing: 0.5px;
      }

      .envelope-letter {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #fefefe 0%, #fff8dc 30%, #f5f5dc 100%);
        border-radius: 12px;
        padding: 35px;
        box-sizing: border-box;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.8s ease 0.4s;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        border: 2px solid #e6d7c3;
        position: relative;
      }

      .envelope-letter::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.03) 0%, transparent 50%);
        border-radius: 12px;
        pointer-events: none;
      }

      .envelope-letter.visible {
        opacity: 1;
        transform: scale(1);
      }

      .letter-content {
        flex: 1;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 15px;
        line-height: 1.8;
        color: #2c3e50;
        overflow-y: auto;
        padding-right: 15px;
        text-align: justify;
        position: relative;
        z-index: 1;
      }

      .letter-content::first-line {
        font-size: 16px;
        font-weight: 500;
      }

      .letter-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: center;
      }

      .letter-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .letter-btn:first-child {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        color: white;
      }

      .letter-btn:last-child {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
      }

      .letter-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      /* 移动端适配 */
      @media (max-width: 768px) {
        .mind-communication-content {
          width: 95%;
          height: 85vh;
        }

        .mind-chat-message {
          max-width: 90%;
          padding: 10px 12px;
        }

        .mind-chat-input-area {
          padding: 12px 15px;
        }

        .adventure-letter-content {
          width: 95%;
        }

        .adventure-letter-envelope {
          height: 350px;
        }

        .envelope-letter {
          padding: 20px;
        }

        .letter-content {
          font-size: 13px;
        }
      }

      /* 信件生成状态样式 */
      .letter-generating {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 40px 20px;
        animation: letterWriting 2s infinite;
      }

      .letter-generating i {
        margin-right: 8px;
        color: #007AFF;
      }

      .letter-error {
        text-align: center;
        color: #dc3545;
        padding: 40px 20px;
      }

      .letter-error i {
        margin-right: 8px;
        font-size: 18px;
      }

      @keyframes letterWriting {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
          line-height: 14px;
        }
      }
    `),
    );

    const pokemonHtml = `
      <div class="pokemon-popup-overlay" id="pokemon-popup">
        <div class="pokemon-popup-content">
          <div class="pokemon-header">
            <h3 class="pokemon-title">波利大冒险</h3>
            <button class="pokemon-close-btn" id="pokemon-close">×</button>
          </div>
          <div class="pokemon-content">

            <div class="pokemon-avatar">
              <div class="pokemon-name">${pokemonData.名字}</div>
              <div class="pokemon-status">${evolutionEmoji} ${evolutionStage}</div>

              <!-- 冒险信件图标 -->
              <div class="adventure-letter-icon" id="adventure-letter-icon" style="display: none;">
                <i class="fas fa-envelope"></i>
              </div>


            </div>

            <div class="pokemon-info-grid">
              <div class="pokemon-info-item">
                <div class="pokemon-info-label">属性</div>
                <div class="pokemon-info-value">
                  ${pokemonData.属性列表
                    .map(type => `<span style="color: ${type.color}">${type.emoji} ${type.name}系</span>`)
                    .join(' + ')}
                </div>
              </div>

              <div class="pokemon-info-item">
                <div class="pokemon-info-label">属性加成</div>
                <div class="pokemon-info-value">
                  ${(() => {
                    const type = pokemonData.属性列表[0];
                    const attributeRanges = type.attributeRanges;

                    return Object.entries(pokemonData.属性加成)
                      .map(([key, value]) => {
                        const evolutionMultiplier = pokemonData.进化加成 || 1.0;
                        const actualValue = Math.floor(value * evolutionMultiplier);
                        const originalValue = value; // 用原始值判断颜色
                        const range = attributeRanges[key];
                        const style = range ? getAttributeStyle(originalValue, range) : 'color: #666;';
                        return `<span style="${style}">${key}+${actualValue}</span>`;
                      })
                      .join(', ');
                  })()}
                </div>
              </div>


              <div class="pokemon-info-item">
                <div class="pokemon-info-label">经验值</div>
                <div class="pokemon-info-value">${pokemonData.经验值}</div>
              </div>

              <div class="pokemon-info-item">
                <div class="pokemon-info-label">战斗力</div>
                <div class="pokemon-info-value">${calculateBattlePower(pokemonData)}</div>
              </div>


            </div>

            <div class="pokemon-stats">
              <div class="pokemon-stat-item">
                <div class="pokemon-stat-label">生命值</div>
                <div class="pokemon-stat-value">${pokemonData.生命值}%</div>
                <div class="pokemon-progress-bar">
                  <div class="pokemon-progress-fill progress-health" style="width: ${pokemonData.生命值}%"></div>
                </div>
              </div>

              <div class="pokemon-stat-item">
                <div class="pokemon-stat-label">饱食度</div>
                <div class="pokemon-stat-value">${pokemonData.饱食度}%</div>
                <div class="pokemon-progress-bar">
                  <div class="pokemon-progress-fill progress-hunger" style="width: ${pokemonData.饱食度}%"></div>
                </div>
              </div>

              <div class="pokemon-stat-item">
                <div class="pokemon-stat-label">心情值</div>
                <div class="pokemon-stat-value">${pokemonData.心情值}%</div>
                <div class="pokemon-progress-bar">
                  <div class="pokemon-progress-fill progress-happiness" style="width: ${pokemonData.心情值}%"></div>
                </div>
              </div>

              <div class="pokemon-stat-item">
                <div class="pokemon-stat-label">清洁度</div>
                <div class="pokemon-stat-value">${pokemonData.清洁度}%</div>
                <div class="pokemon-progress-bar">
                  <div class="pokemon-progress-fill progress-cleanliness" style="width: ${pokemonData.清洁度}%"></div>
                </div>
              </div>
            </div>

            <div class="pokemon-actions">
              <button class="pokemon-action-btn" id="pokemon-rest" ${pokemonData.冒险状态 ? 'disabled' : ''}>
                <i class="fas fa-bed"></i> 休息
              </button>
              <button class="pokemon-action-btn" id="pokemon-feed" ${pokemonData.冒险状态 ? 'disabled' : ''}>
                <i class="fas fa-cookie-bite"></i> 喂食
              </button>
              <button class="pokemon-action-btn" id="pokemon-play" ${pokemonData.冒险状态 ? 'disabled' : ''}>
                <i class="fas fa-gamepad"></i> 玩耍
              </button>
              <button class="pokemon-action-btn" id="pokemon-clean" ${pokemonData.冒险状态 ? 'disabled' : ''}>
                <i class="fas fa-bath"></i> 清洁
              </button>
              <button class="pokemon-action-btn battle" id="pokemon-battle" ${pokemonData.冒险状态 ? 'disabled' : ''}>
                <i class="fas fa-fist-raised"></i> 开始战斗
              </button>
              <button class="pokemon-action-btn primary" id="pokemon-adventure" ${
                pokemonData.冒险状态 ? 'disabled' : ''
              }>
                <i class="fas fa-map"></i> ${pokemonData.冒险状态 ? '冒险中' : '开始冒险'}
              </button>
            </div>

            <!-- 全局显示控制按钮 -->
            <div style="margin-top: 10px; text-align: center;">
              <button class="pokemon-action-btn" id="pokemon-toggle-global" style="width: auto; padding: 8px 16px;">
                <i class="fas fa-${pokemonData.全局显示状态 ? 'eye-slash' : 'eye'}"></i> 
                ${pokemonData.全局显示状态 ? '隐藏小精灵' : '显示小精灵'}
              </button>
            </div>

            <!-- 图鉴按钮区域 -->
            <div class="pokemon-info-grid">
              <div class="pokemon-info-item clickable" id="collection-menu">
                <div class="pokemon-info-label">收集图鉴</div>
                <div class="pokemon-info-value">查看收集 <i class="fas fa-book"></i></div>
              </div>

              <div class="pokemon-info-item clickable" id="mind-communication">
                <div class="pokemon-info-label">心灵沟通</div>
                <div class="pokemon-info-value">聊天对话 <i class="fas fa-comments"></i></div>
              </div>
            </div>

            <!-- 记录按钮区域 -->
            <div class="pokemon-info-grid">
              <div class="pokemon-info-item clickable" id="interaction-history">
                <div class="pokemon-info-label">历史互动</div>
                <div class="pokemon-info-value">${pokemonData.总互动次数}次 <i class="fas fa-clipboard-list"></i></div>
              </div>

              <div class="pokemon-info-item clickable" id="important-records">
                <div class="pokemon-info-label">重要时刻</div>
                <div class="pokemon-info-value">${new Date(
                  pokemonData.创建时间,
                ).toLocaleDateString()} <i class="fas fa-birthday-cake"></i></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('body').append(pokemonHtml);

    $('#pokemon-close').on('click', function () {
      closePokemonInterface();
    });

    $('#pokemon-popup').on('click', function (e) {
      if (e.target.id === 'pokemon-popup') {
        closePokemonInterface();
      }
    });

    $('.pokemon-popup-content').on('click', function (e) {
      e.stopPropagation();
    });

    // 绑定动作按钮
    $('#pokemon-feed').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('喂食');
      }
    });

    $('#pokemon-play').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('玩耍');
      }
    });

    $('#pokemon-clean').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('清洁');
      }
    });

    $('#pokemon-rest').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('休息');
      }
    });

    $('#pokemon-battle').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('战斗');
      }
    });

    $('#pokemon-adventure').on('click', function () {
      if (!pokemonData.冒险状态) {
        performPokemonAction('冒险');
      }
    });

    // 绑定全局显示切换按钮
    $('#pokemon-toggle-global').on('click', async function () {
      if (pokemonData.全局显示状态) {
        // 隐藏全局小精灵
        await hideGlobalPokemon();
        $(this).html('<i class="fas fa-eye"></i> 显示小精灵');
        toastr.success('小精灵已隐藏');
      } else {
        // 显示全局小精灵
        await initializeGlobalPoring(true);
        $(this).html('<i class="fas fa-eye-slash"></i> 隐藏小精灵');
        toastr.success('小精灵已显示');
      }
      // 更新本地状态
      pokemonData.全局显示状态 = !pokemonData.全局显示状态;
    });

    // 绑定历史记录点击事件
    $('#interaction-history').on('click', function () {
      showInteractionHistory(pokemonData);
    });

    $('#important-records').on('click', function () {
      showImportantRecords(pokemonData);
    });

    // 绑定图鉴菜单点击事件
    $('#collection-menu').on('click', function () {
      showCollectionMenu(pokemonData);
    });

    // 绑定心灵沟通点击事件
    $('#mind-communication').on('click', function () {
      showMindCommunication(pokemonData);
    });

    // 绑定冒险信件图标点击事件
    $('#adventure-letter-icon').on('click', function () {
      showAdventureLetter(pokemonData);
      $(this).removeClass('new-letter'); // 移除新信件标识
    });

    // 检查是否有冒险信件或待生成信件需要显示
    if (pokemonData.冒险信件 || pokemonData.待生成信件) {
      $('#adventure-letter-icon').show();
      if (pokemonData.待生成信件) {
        $('#adventure-letter-icon').addClass('new-letter');
      }
    }

    // 启动冒险状态检查定时器
    startAdventureTimer(pokemonData);

    // 更新按钮状态
    updateAdventureButtons(pokemonData);

    // 加载聊天记录
    loadChatMessages(pokemonData);

    // 启动波利漫游系统
    startPokemonRoaming(pokemonData);
  } catch (error) {
    console.error('显示波利界面时出错:', error);
    toastr.error('显示波利界面失败');
  }
}

// 显示互动历史弹窗
function showInteractionHistory(pokemonData) {
  const records = pokemonData.互动记录 || [];
  const recordsHtml =
    records.length > 0
      ? records
          .slice()
          .reverse()
          .map(record => `<div class="record-item">${record}</div>`)
          .join('')
      : '<div class="record-item">暂无互动记录</div>';

  const historyHtml = `
    <div class="pokemon-record-overlay" id="interaction-history-popup">
      <div class="pokemon-record-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title"><i class="fas fa-clipboard-list"></i> ${pokemonData.名字}的互动历史</h3>
          <button class="pokemon-close-btn" id="history-close">×</button>
        </div>
        <div class="pokemon-record-body">
          ${recordsHtml}
        </div>
      </div>
    </div>
  `;

  // 移除可能存在的旧弹窗
  $('#interaction-history-popup').remove();

  // 添加新弹窗
  $('body').append(historyHtml);

  $('#history-close, #interaction-history-popup').on('click', function (e) {
    if (e.target.id === 'history-close' || e.target.id === 'interaction-history-popup') {
      $('#interaction-history-popup').remove();
    }
  });

  $('.pokemon-record-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 显示重要记录弹窗
function showImportantRecords(pokemonData) {
  const records = pokemonData.重要记录 || [];
  const recordsHtml =
    records.length > 0
      ? records
          .slice()
          .reverse()
          .map(record => `<div class="record-item important">${record}</div>`)
          .join('')
      : '<div class="record-item">暂无重要记录</div>';

  const importantHtml = `
    <div class="pokemon-record-overlay" id="important-records-popup">
      <div class="pokemon-record-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title"><i class="fas fa-birthday-cake"></i> ${pokemonData.名字}的重要时刻</h3>
          <button class="pokemon-close-btn" id="important-close">×</button>
        </div>
        <div class="pokemon-record-body">
          ${recordsHtml}
        </div>
      </div>
    </div>
  `;

  // 移除可能存在的旧弹窗
  $('#important-records-popup').remove();

  // 添加新弹窗
  $('body').append(importantHtml);

  $('#important-close, #important-records-popup').on('click', function (e) {
    if (e.target.id === 'important-close' || e.target.id === 'important-records-popup') {
      $('#important-records-popup').remove();
    }
  });

  $('.pokemon-record-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 显示图鉴选择菜单
function showCollectionMenu(pokemonData) {
  // 移除可能存在的旧弹窗
  $('#collection-menu-popup').remove();

  // 计算收集进度
  const giftCount = Object.keys(pokemonData.礼物收集 || {}).length;
  const giftTotal = GIFT_DATABASE.length;
  const giftPercent = Math.round((giftCount / giftTotal) * 100);

  const allOpponents = [];
  Object.values(BATTLE_OPPONENTS).forEach(stageOpponents => {
    allOpponents.push(...stageOpponents.map(op => op.name));
  });
  const opponentCount = Object.keys(pokemonData.对手图鉴 || {}).length;
  const opponentTotal = [...new Set(allOpponents)].length;
  const opponentPercent = Math.round((opponentCount / opponentTotal) * 100);

  const menuHtml = `
    <div class="pokemon-record-overlay" id="collection-menu-popup">
      <div class="pokemon-record-content collection-menu-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title">
            <i class="fas fa-book"></i> ${pokemonData.名字}的收集图鉴
          </h3>
          <button class="pokemon-close-btn" id="collection-menu-close">×</button>
        </div>
        <div class="pokemon-record-body">
          <div class="collection-menu-options">
            <div class="collection-option" id="menu-gift-collection">
              <div class="collection-option-icon">
                <i class="fas fa-gift"></i>
              </div>
              <div class="collection-option-content">
                <div class="collection-option-title">礼物图鉴</div>
                <div class="collection-option-desc">查看收集到的冒险礼物</div>
                <div class="collection-option-progress">${giftCount}/${giftTotal} (${giftPercent}%)</div>
              </div>
              <div class="collection-option-arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>

            <div class="collection-option" id="menu-opponent-collection">
              <div class="collection-option-icon">
                <i class="fas fa-fist-raised"></i>
              </div>
              <div class="collection-option-content">
                <div class="collection-option-title">对手图鉴</div>
                <div class="collection-option-desc">查看遇到过的战斗对手</div>
                <div class="collection-option-progress">${opponentCount}/${opponentTotal} (${opponentPercent}%)</div>
              </div>
              <div class="collection-option-arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  $('body').append(menuHtml);

  // 绑定关闭事件
  $('#collection-menu-close, #collection-menu-popup').on('click', function (e) {
    if (e.target === this) {
      $('#collection-menu-popup').remove();
    }
  });

  // 绑定选项点击事件
  $('#menu-gift-collection').on('click', function () {
    $('#collection-menu-popup').remove();
    showGiftCollection(pokemonData);
  });

  $('#menu-opponent-collection').on('click', function () {
    $('#collection-menu-popup').remove();
    showOpponentCollection(pokemonData);
  });

  // 阻止内容区域点击冒泡
  $('.collection-menu-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 显示心灵沟通界面
function showMindCommunication(pokemonData) {
  // 移除可能存在的旧弹窗
  $('#mind-communication-popup').remove();

  // 获取聊天历史
  const chatHistory = pokemonData.聊天历史 || [];

  // 生成聊天消息HTML
  let chatMessagesHtml = '';
  if (chatHistory.length === 0) {
    chatMessagesHtml = '<div class="mind-chat-empty">还没有聊天记录，快和我说话吧！</div>';
  } else {
    // 显示最近的20条消息
    const recentMessages = chatHistory.slice(-20);
    chatMessagesHtml = recentMessages
      .map(msg => {
        const messageType = msg.type || 'pokemon'; // 默认为pokemon消息
        const messageClass = messageType === 'user' ? 'user-message' : 'pokemon-message';

        return `
          <div class="mind-chat-message ${messageClass}">
            <span class="mind-chat-text">${msg.message}</span>
            <span class="mind-chat-time">${new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </div>
        `;
      })
      .join('');
  }

  const mindCommunicationHtml = `
    <div class="pokemon-record-overlay" id="mind-communication-popup">
      <div class="pokemon-record-content mind-communication-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title">
            <i class="fas fa-comments"></i> 与${pokemonData.名字}的心灵沟通
          </h3>
          <button class="pokemon-close-btn" id="mind-communication-close">×</button>
        </div>
        <div class="mind-communication-body">
          <div class="mind-chat-container" id="mind-chat-container">
            <div class="mind-chat-messages" id="mind-chat-messages">
              ${chatMessagesHtml}
            </div>
          </div>
          <div class="mind-chat-input-area">
            <input type="text" class="mind-chat-input" id="mind-chat-input" placeholder="输入消息..." maxlength="200">
            <button class="mind-chat-send" id="mind-chat-send">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  $('body').append(mindCommunicationHtml);

  // 滚动到底部
  const chatContainer = $('#mind-chat-container');
  chatContainer.scrollTop(chatContainer[0].scrollHeight);

  // 绑定关闭事件
  $('#mind-communication-close, #mind-communication-popup').on('click', function (e) {
    if (e.target === this) {
      $('#mind-communication-popup').remove();
    }
  });

  // 绑定发送消息事件
  $('#mind-chat-send').on('click', function () {
    sendMindMessage(pokemonData);
  });

  $('#mind-chat-input').on('keypress', function (e) {
    if (e.which === 13) {
      // Enter键
      sendMindMessage(pokemonData);
    }
  });

  // 阻止内容区域点击冒泡
  $('.mind-communication-content').on('click', function (e) {
    e.stopPropagation();
  });

  // 聚焦输入框
  setTimeout(() => {
    $('#mind-chat-input').focus();
  }, 100);
}

// 发送心灵沟通消息
async function sendMindMessage(pokemonData) {
  const input = $('#mind-chat-input');
  const message = input.val().trim();

  if (!message) return;

  // 清空输入框
  input.val('');

  // 添加用户消息到界面
  const userMessageHtml = `
    <div class="mind-chat-message user-message">
      <span class="mind-chat-text">${message}</span>
      <span class="mind-chat-time">${new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })}</span>
    </div>
  `;

  $('#mind-chat-messages').append(userMessageHtml);

  // 保存用户消息到聊天历史（标记为用户消息）
  await saveMindChatMessage(message, new Date(), pokemonData, 'user');

  // 滚动到底部
  const chatContainer = $('#mind-chat-container');
  chatContainer.scrollTop(chatContainer[0].scrollHeight);

  // 生成Pokemon回复
  setTimeout(async () => {
    const reply = await generatePokemonAIReply(pokemonData, message);

    // 添加Pokemon回复到界面
    const replyMessageHtml = `
      <div class="mind-chat-message pokemon-message">
        <span class="mind-chat-text">${reply}</span>
        <span class="mind-chat-time">${new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}</span>
      </div>
    `;

    $('#mind-chat-messages').append(replyMessageHtml);

    // 保存Pokemon回复到聊天历史
    await saveMindChatMessage(reply, new Date(), pokemonData);

    // 滚动到底部
    chatContainer.scrollTop(chatContainer[0].scrollHeight);

    // 限制消息数量，保留最新的30条
    const messages = $('#mind-chat-messages .mind-chat-message');
    if (messages.length > 30) {
      messages.slice(0, messages.length - 30).remove();
    }
  }, 1000 + Math.random() * 2000); // 1-3秒随机延迟
}

// 显示礼物图鉴弹窗
function showGiftCollection(pokemonData) {
  const giftCollection = pokemonData.礼物收集 || {};
  const collectedGifts = Object.values(giftCollection);

  // 按稀有度排序
  const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
  collectedGifts.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  // 计算收集进度
  const totalGifts = GIFT_DATABASE.length;
  const collectedCount = collectedGifts.length;
  const progressPercent = Math.round((collectedCount / totalGifts) * 100);

  // 生成已收集礼物的HTML
  const collectedHtml =
    collectedGifts.length > 0
      ? collectedGifts
          .map(gift => {
            const rarityColors = {
              common: '#8e8e93',
              rare: '#007aff',
              epic: '#af52de',
              legendary: '#ff9500',
            };
            const rarityNames = {
              common: '普通',
              rare: '稀有',
              epic: '史诗',
              legendary: '传说',
            };

            const obtainedDate = new Date(gift.firstObtained).toLocaleDateString('zh-CN');

            return `
          <div class="gift-item collected" style="border-left: 4px solid ${rarityColors[gift.rarity]}">
            <div class="gift-icon">
              <i class="${gift.icon}" style="color: ${rarityColors[gift.rarity]}"></i>
            </div>
            <div class="gift-info">
              <div class="gift-name">${gift.name}</div>
              <div class="gift-rarity" style="color: ${rarityColors[gift.rarity]}">${rarityNames[gift.rarity]}</div>
              <div class="gift-description">${gift.description}</div>
              <div class="gift-stats">
                <span>首次获得: ${obtainedDate}</span>
                <span>获得次数: ${gift.obtainedCount}</span>
              </div>
            </div>
          </div>
        `;
          })
          .join('')
      : '<div class="no-gifts">还没有收集到任何礼物，快去冒险吧！</div>';

  // 生成未收集礼物的HTML（显示为问号）
  const unlockedGifts = GIFT_DATABASE.filter(gift => !giftCollection[gift.id]);
  const unlockedHtml = unlockedGifts
    .map(gift => {
      return `
      <div class="gift-item locked">
        <div class="gift-icon">
          <i class="fas fa-question" style="color: #c7c7cc"></i>
        </div>
        <div class="gift-info">
          <div class="gift-name">???</div>
          <div class="gift-rarity" style="color: #c7c7cc">未知</div>
          <div class="gift-description">尚未解锁的神秘礼物</div>
        </div>
      </div>
    `;
    })
    .join('');

  const giftCollectionHtml = `
    <div class="pokemon-record-overlay" id="gift-collection-popup">
      <div class="pokemon-record-content gift-collection-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title">
            <i class="fas fa-gift"></i> ${pokemonData.名字}的礼物图鉴
          </h3>
          <button class="pokemon-close-btn" id="gift-collection-close">×</button>
        </div>
        <div class="collection-progress">
          <div class="progress-text">收集进度: ${collectedCount}/${totalGifts} (${progressPercent}%)</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>
        <div class="pokemon-record-body gift-collection-body">
          <div class="gift-section">
            <h4 class="section-title">已收集 (${collectedCount})</h4>
            ${collectedHtml}
          </div>
          ${
            unlockedGifts.length > 0
              ? `
            <div class="gift-section">
              <h4 class="section-title">未解锁 (${unlockedGifts.length})</h4>
              ${unlockedHtml}
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;

  // 移除可能存在的旧弹窗
  $('#gift-collection-popup').remove();

  // 添加新弹窗
  $('body').append(giftCollectionHtml);

  $('#gift-collection-close, #gift-collection-popup').on('click', function (e) {
    if (e.target.id === 'gift-collection-close' || e.target.id === 'gift-collection-popup') {
      $('#gift-collection-popup').remove();
    }
  });

  $('.gift-collection-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 显示对手图鉴弹窗
function showOpponentCollection(pokemonData) {
  const opponentCollection = pokemonData.对手图鉴 || {};
  const encounteredOpponents = Object.values(opponentCollection);

  // 按首次遇到时间排序
  encounteredOpponents.sort((a, b) => new Date(a.firstEncountered) - new Date(b.firstEncountered));

  // 计算收集进度
  const allOpponents = [];
  Object.values(BATTLE_OPPONENTS).forEach(stageOpponents => {
    allOpponents.push(...stageOpponents.map(op => op.name));
  });
  const totalOpponents = [...new Set(allOpponents)].length; // 去重
  const encounteredCount = encounteredOpponents.length;
  const progressPercent = Math.round((encounteredCount / totalOpponents) * 100);

  // 生成已遇到对手的HTML
  const encounteredHtml =
    encounteredOpponents.length > 0
      ? encounteredOpponents
          .map(opponent => {
            const winRate =
              opponent.totalBattles > 0 ? Math.round((opponent.victories / opponent.totalBattles) * 100) : 0;

            const encounteredDate = new Date(opponent.firstEncountered).toLocaleDateString('zh-CN');
            const lastBattleDate = new Date(opponent.lastBattle).toLocaleDateString('zh-CN');

            // 根据胜率确定颜色
            let winRateColor = '#8e8e93'; // 灰色
            if (winRate >= 80) winRateColor = '#34c759'; // 绿色
            else if (winRate >= 60) winRateColor = '#007aff'; // 蓝色
            else if (winRate >= 40) winRateColor = '#ff9500'; // 橙色
            else if (winRate >= 20) winRateColor = '#ff3b30'; // 红色

            return `
          <div class="opponent-item encountered">
            <div class="opponent-avatar">
              <div class="opponent-name-display">${opponent.name}</div>
            </div>
            <div class="opponent-info">
              <div class="opponent-name">${opponent.name}</div>
              <div class="opponent-stats">
                <div class="stat-item">
                  <span class="stat-label">胜率:</span>
                  <span class="stat-value" style="color: ${winRateColor}">${winRate}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总战斗:</span>
                  <span class="stat-value">${opponent.totalBattles}</span>
                </div>
              </div>
              <div class="opponent-record">
                <span class="record-item victory">胜利: ${opponent.victories}</span>
                <span class="record-item defeat">失败: ${opponent.defeats}</span>
                <span class="record-item escape">逃跑: ${opponent.escapes}</span>
                <span class="record-item opponent-escape">敌逃: ${opponent.opponentEscapes}</span>
              </div>
              <div class="opponent-dates">
                <span>首次遇到: ${encounteredDate}</span>
                <span>最后战斗: ${lastBattleDate}</span>
              </div>
            </div>
          </div>
        `;
          })
          .join('')
      : '<div class="no-opponents">还没有遇到任何对手，快去战斗吧！</div>';

  // 生成未遇到对手的HTML（显示为问号）
  const unencounteredOpponents = [...new Set(allOpponents)].filter(
    name => !encounteredOpponents.find(op => op.name === name),
  );
  const unencounteredHtml = unencounteredOpponents
    .map(name => {
      return `
      <div class="opponent-item locked">
        <div class="opponent-avatar">
          <div class="opponent-name-display">???</div>
        </div>
        <div class="opponent-info">
          <div class="opponent-name">未知对手</div>
          <div class="opponent-description">尚未遇到的神秘对手</div>
        </div>
      </div>
    `;
    })
    .join('');

  const opponentCollectionHtml = `
    <div class="pokemon-record-overlay" id="opponent-collection-popup">
      <div class="pokemon-record-content opponent-collection-content">
        <div class="pokemon-record-header">
          <h3 class="pokemon-record-title">
            <i class="fas fa-fist-raised"></i> ${pokemonData.名字}的对手图鉴
          </h3>
          <button class="pokemon-close-btn" id="opponent-collection-close">×</button>
        </div>
        <div class="collection-progress">
          <div class="progress-text">遇到进度: ${encounteredCount}/${totalOpponents} (${progressPercent}%)</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>
        <div class="pokemon-record-body opponent-collection-body">
          <div class="opponent-section">
            <h4 class="section-title">已遇到 (${encounteredCount})</h4>
            ${encounteredHtml}
          </div>
          ${
            unencounteredOpponents.length > 0
              ? `
            <div class="opponent-section">
              <h4 class="section-title">未遇到 (${unencounteredOpponents.length})</h4>
              ${unencounteredHtml}
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;

  // 移除可能存在的旧弹窗
  $('#opponent-collection-popup').remove();

  // 添加新弹窗
  $('body').append(opponentCollectionHtml);

  $('#opponent-collection-close, #opponent-collection-popup').on('click', function (e) {
    if (e.target.id === 'opponent-collection-close' || e.target.id === 'opponent-collection-popup') {
      $('#opponent-collection-popup').remove();
    }
  });

  $('.opponent-collection-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 关闭波利界面
function closePokemonInterface() {
  $('#pokemon-popup').remove();
  $('style[data-id="pokemon-system-styles"]').remove();
  // 停止波利漫游
  stopPokemonRoaming();
  // 停止冒险定时器
  stopAdventureTimer();

  // 显示全局漫游的小精灵（如果存在）
  if (window.globalPokemonElement) {
    window.globalPokemonElement.show();
  }
}

// 显示冒险时间选择弹窗
function showAdventureTimeSelection(pokemonData) {
  // 移除可能存在的旧弹窗
  $('#adventure-time-popup').remove();

  const adventureTimeHtml = `
    <div id="adventure-time-popup" class="pokemon-popup-overlay">
      <div class="pokemon-popup-content adventure-time-content">
        <div class="pokemon-header">
          <h3 class="pokemon-title">选择冒险时间</h3>
          <button id="adventure-time-close" class="pokemon-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="pokemon-content">
          <div class="adventure-time-description">
            <p>请选择${pokemonData.名字}的冒险时长</p>
          </div>
          <div class="adventure-time-options">
            <button class="adventure-time-btn" data-time="0.5">
              <div class="time-label">短途冒险</div>
              <div class="time-range">1-30分钟</div>
              <div class="time-reward">基础奖励</div>
            </button>
            <button class="adventure-time-btn" data-time="1">
              <div class="time-label">近郊冒险</div>
              <div class="time-range">31-60分钟</div>
              <div class="time-reward">小幅奖励</div>
            </button>
            <button class="adventure-time-btn" data-time="2">
              <div class="time-label">远足冒险</div>
              <div class="time-range">61-120分钟</div>
              <div class="time-reward">中等奖励</div>
            </button>
            <button class="adventure-time-btn" data-time="4">
              <div class="time-label">探索冒险</div>
              <div class="time-range">121-240分钟</div>
              <div class="time-reward">丰富奖励</div>
            </button>
            <button class="adventure-time-btn" data-time="8">
              <div class="time-label">史诗冒险</div>
              <div class="time-range">240-480分钟</div>
              <div class="time-reward">超级奖励</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加样式
  $('head').append(
    $('<style>').attr('data-id', 'adventure-time-styles').text(`
      .adventure-time-content {
        max-width: 450px;
        width: 90%;
      }

      .adventure-time-description {
        text-align: center;
        margin-bottom: 20px;
        color: #5d4e37;
        font-size: 14px;
      }

      .adventure-time-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .adventure-time-btn {
        background: linear-gradient(135deg, #f4e4bc, #e8d5b7);
        border: 2px solid #d4af37;
        border-radius: 12px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        color: #5d4e37;
      }

      .adventure-time-btn:hover {
        background: linear-gradient(135deg, #e8d5b7, #d4af37);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
      }

      .time-label {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 5px;
      }

      .time-range {
        font-size: 13px;
        color: #8b7355;
        margin-bottom: 3px;
      }

      .time-reward {
        font-size: 12px;
        color: #d4af37;
        font-weight: bold;
      }

      @media (max-width: 768px) {
        .adventure-time-content {
          width: 85%;
          max-width: 350px;
          max-height: 85vh;
        }

        .adventure-time-btn {
          padding: 12px;
        }

        .time-label {
          font-size: 14px;
        }

        .time-range {
          font-size: 12px;
        }

        .time-reward {
          font-size: 11px;
        }
      }
    `),
  );

  // 添加弹窗到页面
  $('body').append(adventureTimeHtml);

  // 绑定关闭事件
  $('#adventure-time-close, #adventure-time-popup').on('click', function (e) {
    if (e.target.id === 'adventure-time-close' || e.target.id === 'adventure-time-popup') {
      closeAdventureTimeSelection();
    }
  });

  // 阻止内容区域点击关闭
  $('.adventure-time-content').on('click', function (e) {
    e.stopPropagation();
  });

  // 绑定时间选择按钮事件
  $('.adventure-time-btn').on('click', async function () {
    const selectedTime = parseFloat($(this).data('time'));
    await startAdventureWithTime(pokemonData, selectedTime);
    closeAdventureTimeSelection();
  });
}

// 关闭冒险时间选择弹窗
function closeAdventureTimeSelection() {
  $('#adventure-time-popup').remove();
  $('style[data-id="adventure-time-styles"]').remove();
}

// 开始指定时间的冒险
async function startAdventureWithTime(pokemonData, selectedHours) {
  try {
    pokemonData.冒险状态 = true;
    pokemonData.冒险开始时间 = new Date().toISOString();
    pokemonData.冒险持续时间 = selectedHours; // 存储选定的冒险时间
    pokemonData.冒险结果已显示 = false; // 重置显示标记

    // 根据选择的时间显示不同的消息
    let timeText;
    if (selectedHours <= 0.5) {
      timeText = '1-30分钟';
    } else if (selectedHours <= 1) {
      timeText = '31-60分钟';
    } else if (selectedHours <= 2) {
      timeText = '61-120分钟';
    } else if (selectedHours <= 4) {
      timeText = '121-240分钟';
    } else {
      timeText = '240-480分钟';
    }

    const message = `${pokemonData.名字}出发去冒险了！预计${timeText}后回来，期间无法互动`;
    addInteractionRecord(pokemonData, '出发冒险了');

    // 冒险开始时隐藏漫游波利
    stopPokemonRoaming();

    // 更新按钮状态
    updateAdventureButtons(pokemonData);

    // 启动冒险定时器
    startAdventureTimer(pokemonData);

    // 随机对话，只显示在聊天框
    const interactionTalk = generateInteractionTalk(pokemonData, '冒险');
    if (interactionTalk) {
      await showPokemonSpeechBubble(interactionTalk);
    }

    // 保存数据
    await savePokemonData(pokemonData);

    // 显示消息
    toastr.success(message);

    // 刷新界面
    closePokemonInterface();
    setTimeout(() => showPokemonInterface(), 200);
  } catch (error) {
    console.error('开始冒险时出错:', error);
    toastr.error('开始冒险失败');
  }
}

// 执行波利动作
async function performPokemonAction(action) {
  try {
    let pokemonData = await getPokemonData();
    let message = '';
    let success = false;

    // 如果在冒险中，不能进行其他互动
    if (pokemonData.冒险状态 && action !== '冒险') {
      toastr.info(`${pokemonData.名字}正在冒险中，无法进行其他互动！`);
      return;
    }

    pokemonData.最后互动时间 = new Date().toISOString();
    pokemonData.总互动次数++;

    switch (action) {
      case '喂食':
        if (pokemonData.饱食度 < 90) {
          const food = getFoodForPokemon(pokemonData.属性列表);
          let totalHungerGain = 0;
          let additionalEffects = [];

          // 应用食物效果（饱食度固定，其他随机）
          Object.entries(food.effects).forEach(([stat, value]) => {
            if (stat === '饱食度') {
              const baseAmount = getRandomValue(value, 0.3); // 30%随机性
              const hungerAmount = applyAttributeBonus(pokemonData, baseAmount, '恢复力');
              pokemonData.饱食度 = Math.min(100, pokemonData.饱食度 + hungerAmount);
              totalHungerGain = hungerAmount;
            } else if (stat === '经验值') {
              // 经验值只能增加，不能减少，且不受100限制
              if (value > 0) {
                const bonusExp = applyAttributeBonus(pokemonData, value, '经验获取');
                const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));
                pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
                additionalEffects.push(`${stat}+${finalExp}`);
              }
            } else {
              // 其他属性直接应用随机值，限制在100以内
              pokemonData[stat] = Math.min(100, (pokemonData[stat] || 0) + value);
              additionalEffects.push(`${stat}+${value}`);
            }
          });

          const effectsText = additionalEffects.length > 0 ? `，${additionalEffects.join('，')}` : '';
          message = `${pokemonData.名字}开心地吃了${food.name}！饱食度+${totalHungerGain}${effectsText}`;
          addInteractionRecord(pokemonData, `吃了${food.name}`);

          // 随机对话，显示在波利头顶
          const interactionTalk = generateInteractionTalk(pokemonData, '喂食');
          if (interactionTalk && pokemonRoamingElement) {
            await showPokemonSpeechBubble(interactionTalk);
          }

          success = true;
        } else {
          message = `${pokemonData.名字}现在不饿，不需要喂食`;

          // 失败时的随机对话，显示在聊天框
          const failureTalk = generateFailureTalk(pokemonData, '喂食', '不饿');
          if (failureTalk) {
            await addPokemonChatMessage(failureTalk, pokemonData);
          }
        }
        break;

      case '玩耍':
        if (pokemonData.心情值 < 90 && pokemonData.饱食度 > 20) {
          const basePlay = getRandomValue(25, 0.5); // 随机15-35
          const playAmount = basePlay + ((pokemonData.属性加成 && pokemonData.属性加成.心情值) || 0);
          const hungerLoss = getRandomValue(8, 0.4); // 随机5-11
          const cleanLoss = getRandomValue(4, 0.5); // 随机2-6

          // 玩耍给少量经验值
          const baseExpGain = getRandomValue(3, 0.5); // 随机2-4经验值
          const bonusExp = applyAttributeBonus(pokemonData, baseExpGain, '经验获取');
          const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));

          pokemonData.心情值 = Math.min(100, pokemonData.心情值 + playAmount);
          pokemonData.饱食度 = Math.max(0, pokemonData.饱食度 - hungerLoss);
          pokemonData.清洁度 = Math.max(0, pokemonData.清洁度 - cleanLoss);
          pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
          message = `${pokemonData.名字}和你玩得很开心！心情值+${playAmount}，饱食度-${hungerLoss}，清洁度-${cleanLoss}，经验值+${finalExp}`;
          addInteractionRecord(pokemonData, '和主人一起玩耍');

          // 随机对话，显示在波利头顶
          const interactionTalk = generateInteractionTalk(pokemonData, '玩耍');
          if (interactionTalk && pokemonRoamingElement) {
            await showPokemonSpeechBubble(interactionTalk);
          }

          success = true;
        } else if (pokemonData.饱食度 <= 20) {
          message = `${pokemonData.名字}太饿了，没有力气玩耍`;

          // 失败时的随机对话，显示在聊天框
          const failureTalk = generateFailureTalk(pokemonData, '玩耍', '太饿');
          if (failureTalk) {
            await addPokemonChatMessage(failureTalk, pokemonData);
          }
        } else {
          message = `${pokemonData.名字}现在不想玩耍`;

          // 失败时的随机对话，显示在聊天框
          const failureTalk = generateFailureTalk(pokemonData, '玩耍', '不想玩');
          if (failureTalk) {
            await addPokemonChatMessage(failureTalk, pokemonData);
          }
        }
        break;

      case '清洁':
        if (pokemonData.清洁度 < 90) {
          const baseClean = getRandomValue(30, 0.4); // 随机18-42
          const cleanAmount = baseClean + ((pokemonData.属性加成 && pokemonData.属性加成.清洁度) || 0);
          const happinessGain = getRandomValue(8, 0.5); // 随机4-12

          // 清洁给少量经验值
          const baseExpGain = getRandomValue(2, 0.5); // 随机1-3经验值
          const bonusExp = applyAttributeBonus(pokemonData, baseExpGain, '经验获取');
          const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));

          pokemonData.清洁度 = Math.min(100, pokemonData.清洁度 + cleanAmount);
          pokemonData.心情值 = Math.min(100, pokemonData.心情值 + happinessGain);
          pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
          message = `${pokemonData.名字}变得干净整洁！清洁度+${cleanAmount}，心情值+${happinessGain}，经验值+${finalExp}`;
          addInteractionRecord(pokemonData, '洗了个舒服的澡');

          // 随机对话，显示在波利头顶
          const interactionTalk = generateInteractionTalk(pokemonData, '清洁');
          if (interactionTalk && pokemonRoamingElement) {
            await showPokemonSpeechBubble(interactionTalk);
          }

          success = true;
        } else {
          message = `${pokemonData.名字}现在很干净，不需要清洁`;
        }
        break;

      case '休息':
        if (pokemonData.生命值 < 100) {
          const baseRest = getRandomValue(18, 0.4); // 随机11-25
          const restAmount = baseRest + ((pokemonData.属性加成 && pokemonData.属性加成.生命值) || 0);
          const happinessGain = getRandomValue(12, 0.4); // 随机7-17

          // 休息给少量经验值
          const baseExpGain = getRandomValue(1, 0.5); // 随机1-2经验值
          const bonusExp = applyAttributeBonus(pokemonData, baseExpGain, '经验获取');
          const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));

          pokemonData.生命值 = Math.min(100, pokemonData.生命值 + restAmount);
          pokemonData.心情值 = Math.min(100, pokemonData.心情值 + happinessGain);
          pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
          message = `${pokemonData.名字}舒服地休息了一会！生命值+${restAmount}，心情值+${happinessGain}，经验值+${finalExp}`;
          addInteractionRecord(pokemonData, '美美地睡了一觉');

          // 随机对话，显示在波利头顶
          const interactionTalk = generateInteractionTalk(pokemonData, '休息');
          if (interactionTalk && pokemonRoamingElement) {
            await showPokemonSpeechBubble(interactionTalk);
          }

          success = true;
        } else {
          message = `${pokemonData.名字}现在很健康，不需要休息`;
        }
        break;

      case '战斗':
        // 检查是否已经在战斗中
        if (isBattleInProgress) {
          message = `${pokemonData.名字}正在战斗中，请等待当前战斗结束！`;
          break;
        }

        if (pokemonData.生命值 > 20 && pokemonData.饱食度 > 20) {
          // 设置战斗状态并禁用战斗按钮
          isBattleInProgress = true;
          $('#pokemon-battle').prop('disabled', true).text('战斗中...');

          const battlePower = calculateBattlePower(pokemonData);
          const opponent = selectOpponentByStage(pokemonData.进化阶段);

          // 检查逃跑情况
          const myEscapeChance = calculateEscapeChance(pokemonData);
          const opponentEscapeChance = calculateOpponentEscapeChance(opponent, battlePower);

          let battleResult;

          // 判断是否有逃跑
          if (Math.random() < myEscapeChance) {
            // 我方逃跑
            const hungerLoss = getRandomValue(5, 0.4);
            pokemonData.饱食度 = Math.max(0, pokemonData.饱食度 - hungerLoss);

            await addBattleRecord(pokemonData, 'escape', opponent.name);

            battleResult = {
              escape: 'player',
              hungerLoss,
            };
            success = false;
          } else if (Math.random() < opponentEscapeChance) {
            // 对手逃跑
            const baseExpGain = Math.floor(getRandomValue(opponent.rewards.经验值, 0.3) * 0.3); // 逃跑只给30%经验
            const bonusExp = applyAttributeBonus(pokemonData, baseExpGain, '经验获取');
            const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));
            pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;

            await addBattleRecord(pokemonData, 'opponent_escape', opponent.name);

            battleResult = {
              escape: 'opponent',
              expGain: finalExp,
            };
            success = true;
          } else {
            // 正常战斗 - 根据物理/特殊攻击类型进行战斗
            const physicalPower = calculatePhysicalPower(pokemonData);
            const specialPower = calculateSpecialPower(pokemonData);

            // 判断使用物理还是特殊攻击（选择较强的）
            const usePhysical = physicalPower >= specialPower;
            const attackPower = usePhysical ? physicalPower : specialPower;
            const attackType = usePhysical ? '物理攻击' : '特殊攻击';

            const opponentPower = opponent.difficulty * 10;
            const powerRatio = attackPower / opponentPower;

            // 胜率计算 - 提高高品质属性波利的胜率
            let winChance;
            if (powerRatio >= 1.8) {
              winChance = 0.9; // 实力碾压对手，90%胜率
            } else if (powerRatio >= 1.5) {
              winChance = 0.85; // 实力远超对手，85%胜率
            } else if (powerRatio >= 1.2) {
              winChance = 0.75; // 实力较强，75%胜率
            } else if (powerRatio >= 1.0) {
              winChance = 0.65; // 实力相当，65%胜率
            } else if (powerRatio >= 0.8) {
              winChance = 0.5; // 稍弱，50%胜率
            } else if (powerRatio >= 0.6) {
              winChance = 0.35; // 较弱，35%胜率
            } else {
              winChance = 0.25; // 很弱，25%胜率
            }

            if (Math.random() < winChance) {
              // 胜利
              const baseExpGain = getRandomValue(opponent.rewards.经验值, 0.3);
              const bonusExp = applyAttributeBonus(pokemonData, baseExpGain, '经验获取');
              const finalExp = Math.floor(bonusExp * (pokemonData.进化加成 || 1.0));
              const happinessGain = getRandomValue(opponent.rewards.心情值, 0.3);
              const hungerLoss = getRandomValue(12, 0.4);

              pokemonData.经验值 = (pokemonData.经验值 || 0) + finalExp;
              pokemonData.心情值 = Math.min(100, pokemonData.心情值 + happinessGain);
              pokemonData.饱食度 = Math.max(0, pokemonData.饱食度 - hungerLoss);

              await addBattleRecord(pokemonData, 'victory', opponent.name);

              // 随机对话，只显示在聊天框
              const interactionTalk = generateInteractionTalk(pokemonData, '战斗');
              if (interactionTalk) {
                await showPokemonSpeechBubble(interactionTalk);
              }

              battleResult = {
                victory: true,
                expGain: finalExp,
                happinessGain,
                attackType, // 添加攻击类型信息
              };
              success = true;
            } else {
              // 失败 - 根据对手攻击类型和我方防御计算伤害
              const baseHealthLoss = 18;

              // 随机决定对手使用物理还是特殊攻击
              const opponentUsePhysical = Math.random() < 0.5;
              const evolutionMultiplier = pokemonData.进化加成 || 1.0;
              const baseDefenseValue = opponentUsePhysical
                ? (pokemonData.属性加成 && pokemonData.属性加成.防御) || 0
                : (pokemonData.属性加成 && pokemonData.属性加成.特防) || 0;
              const defenseValue = Math.floor(baseDefenseValue * evolutionMultiplier);

              const actualHealthLoss = Math.max(1, baseHealthLoss - defenseValue);
              const healthLoss = getRandomValue(actualHealthLoss, 0.4);
              const happinessLoss = getRandomValue(8, 0.4);
              const hungerLoss = getRandomValue(8, 0.4);

              pokemonData.生命值 = Math.max(1, pokemonData.生命值 - healthLoss);
              pokemonData.心情值 = Math.max(0, pokemonData.心情值 - happinessLoss);
              pokemonData.饱食度 = Math.max(0, pokemonData.饱食度 - hungerLoss);

              await addBattleRecord(pokemonData, 'defeat', opponent.name);

              battleResult = {
                victory: false,
                healthLoss,
                happinessLoss,
                opponentAttackType: opponentUsePhysical ? '物理攻击' : '特殊攻击', // 添加对手攻击类型
              };
              success = false;
            }
          }

          // 显示战斗动画
          await showBattleAnimation(pokemonData, opponent, battleResult);

          // 检查进化（战斗胜利且经验值增加后）
          if (battleResult.victory || battleResult.escape === 'opponent') {
            const evolved = await checkEvolutionAndNotify(pokemonData);
            if (evolved) {
              // 如果进化了，保存数据并等待进化动画完成后再刷新界面
              await savePokemonData(pokemonData);
              // 重置战斗状态
              isBattleInProgress = false;
              return;
            }
          }

          // 保存数据
          await savePokemonData(pokemonData);

          // 重置战斗状态
          isBattleInProgress = false;

          // 刷新界面
          closePokemonInterface();
          setTimeout(() => showPokemonInterface(), 200);
          return; // 直接返回，不显示普通消息
        } else {
          // 重置战斗状态（条件不满足时）
          isBattleInProgress = false;
          $('#pokemon-battle').prop('disabled', false).html('<i class="fas fa-fist-raised"></i> 开始战斗');
          message = `${pokemonData.名字}现在太累了，无法战斗（需要生命值>20%，饱食度>20%）`;
        }
        break;

      case '冒险':
        if (pokemonData.冒险状态) {
          message = `${pokemonData.名字}已经在冒险中了！`;
        } else if (pokemonData.生命值 > 30 && pokemonData.饱食度 > 30) {
          // 显示冒险时间选择弹窗
          showAdventureTimeSelection(pokemonData);
          return; // 不显示消息，等待用户选择
        } else {
          message = `${pokemonData.名字}现在太累了，不适合冒险（需要生命值>30%，饱食度>30%）`;
        }
        break;
    }

    // 检查进化
    if (success) {
      const evolved = await checkEvolutionAndNotify(pokemonData);
      if (evolved) {
        // 如果进化了，延迟保存和刷新
        await savePokemonData(pokemonData);
        setTimeout(() => {
          closePokemonInterface();
          setTimeout(() => showPokemonInterface(), 200);
        }, 8000); // 等待进化动画完成
        return;
      }
    }

    await savePokemonData(pokemonData);

    if (success) {
      toastr.success(message);
    } else {
      toastr.info(message);
    }

    // 刷新界面
    closePokemonInterface();
    setTimeout(() => showPokemonInterface(), 200);
  } catch (error) {
    console.error('执行波利动作时出错:', error);
    toastr.error('操作失败');
  }
}

// 重置波利数据
async function resetPokemonData() {
  try {
    const confirmed = confirm('确定要重置波利数据吗？这将清除所有进度！');
    if (confirmed) {
      await insertOrAssignVariables(
        {
          波利: null,
        },
        { type: 'script', script_id: scriptId },
      );

      toastr.success('波利数据已重置！');

      // 关闭当前界面
      closePokemonInterface();
    }
  } catch (error) {
    console.error('重置波利数据时出错:', error);
    toastr.error('重置失败');
  }
}

// 显示战斗动画
async function showBattleAnimation(pokemonData, opponent, battleResult) {
  // 设置 toastr 配置，限制最大消息数量
  const originalMaxOpened = toastr.options.maxOpened;
  const originalNewestOnTop = toastr.options.newestOnTop;

  toastr.options.maxOpened = 2; // 最多同时显示2条消息
  toastr.options.newestOnTop = true; // 新消息在上方

  const messages = [];

  // 第一条：遇到敌人
  messages.push(`${pokemonData.名字}遇到了${opponent.name}！`);

  // 检查是否有逃跑
  if (battleResult.escape === 'player') {
    messages.push(`${pokemonData.名字}感到害怕，迅速逃跑了！`);
    messages.push(`逃跑成功！消耗饱食度-${battleResult.hungerLoss}`);
  } else if (battleResult.escape === 'opponent') {
    messages.push(`${pokemonData.名字}展现出强大的气势！`);
    messages.push(`${opponent.name}感到恐惧，逃跑了！`);
    messages.push(`对手逃跑！获得少量经验值+${battleResult.expGain}`);
  } else {
    // 正常战斗过程 - 根据战斗结果调整攻击频率
    const rounds = 2 + Math.floor(Math.random() * 9); // 2-10回合

    // 根据战斗结果调整我方和对手的攻击概率
    let myAttackChance = 0.5; // 默认50%
    if (battleResult.victory) {
      // 如果我方胜利，我方攻击更频繁
      myAttackChance = 0.75;
    } else if (!battleResult.victory && !battleResult.escape) {
      // 如果我方失败，对手攻击更频繁
      myAttackChance = 0.25;
    }

    for (let i = 0; i < rounds; i++) {
      if (Math.random() < myAttackChance) {
        // 我方攻击
        const damage = getRandomValue(15, 0.5);
        const myAttackType = battleResult.attackType || '攻击';
        messages.push(`${pokemonData.名字}使用${myAttackType}！${opponent.name}受到${damage}点伤害！`);
      } else {
        // 敌方攻击
        const damage = getRandomValue(12, 0.5);
        const opponentAttackType = battleResult.opponentAttackType || (Math.random() < 0.5 ? '物理攻击' : '特殊攻击');
        messages.push(`${opponent.name}使用${opponentAttackType}！${pokemonData.名字}受到${damage}点伤害！`);
      }
    }

    // 最终结果
    if (battleResult.victory) {
      const attackType = battleResult.attackType || '攻击';
      messages.push(
        `${pokemonData.名字}凭借${attackType}战胜了${opponent.name}！获得经验值+${battleResult.expGain}，心情值+${battleResult.happinessGain}`,
      );
    } else {
      const opponentAttackType = battleResult.opponentAttackType || '攻击';
      messages.push(
        `${pokemonData.名字}被${opponent.name}的${opponentAttackType}击败了...生命值-${battleResult.healthLoss}，心情值-${battleResult.happinessLoss}`,
      );
    }
  }

  // 逐条显示消息，利用 toastr 的 maxOpened 配置自动控制数量
  for (let i = 0; i < messages.length; i++) {
    const isLast = i === messages.length - 1;
    const duration = isLast ? 6000 : 2000; // 最后一条显示更久，其他消息显示2秒

    let type = 'info';
    if (isLast) {
      if (battleResult.victory || battleResult.escape === 'opponent') {
        type = 'success';
      } else if (battleResult.escape === 'player') {
        type = 'warning';
      } else {
        type = 'error';
      }
    }

    toastr[type](messages[i], '战斗进行中...', {
      timeOut: duration,
      closeButton: true,
      preventDuplicates: false,
    });

    // 等待间隔，让用户能看到消息切换
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒间隔，确保消息有序显示
    }
  }

  // 恢复原来的 toastr 配置
  toastr.options.maxOpened = originalMaxOpened;
  toastr.options.newestOnTop = originalNewestOnTop;
}

// ==================== 波利界面代码结束 ====================

// 监听主按钮点击事件
eventOnButton('Janusの百宝箱', async () => {
  await showJanusToolbox();
});

// 页面卸载时清理
$(window).on('beforeunload', function () {
  closeJanusPopup();
  closePokemonInterface();
  closeCreationInterface();
});

// ==================== 波利聊天系统 ====================

// 保存心灵沟通消息到聊天历史
async function saveMindChatMessage(message, timestamp, pokemonData, messageType = 'pokemon') {
  if (!pokemonData) return;

  // 初始化聊天历史
  if (!pokemonData.聊天历史) {
    pokemonData.聊天历史 = [];
  }

  // 添加消息
  pokemonData.聊天历史.push({
    message: message,
    timestamp: timestamp.toISOString(),
    type: messageType, // 'user' 或 'pokemon'
  });

  // 限制历史记录数量，保留最新的100条
  if (pokemonData.聊天历史.length > 100) {
    pokemonData.聊天历史 = pokemonData.聊天历史.slice(-100);
  }

  // 保存到脚本存储
  await savePokemonData(pokemonData);
}

// 心灵沟通专用预设配置
const MIND_CHAT_PRESET_CONFIG = {
  // 聊天系统提示词
  systemPrompt: `你是一个可爱的波利宠物，正在与你的主人进行心灵沟通聊天。

你的特点：
- 天真可爱、温馨亲密的性格
- 像真正的宠物一样对主人充满依恋和关爱
- 会根据自己的状态（饱食度、心情值、清洁度等）表达感受
- 不会说教或提建议，只是单纯地表达情感和想法，提供情绪价值

重要规则：
- 直接以波利的身份回复，不要加"波利说："等前缀
- 保持对话的连贯性，记住之前聊过的内容
- 根据当前状态做出合适的反应
- 语气要像宠物对主人说话，充满依恋`,

  // 角色设定
  characterPrompt: `你是一只名为波利的可爱宠物，拥有以下特征：
- 性格：天真、可爱、温馨、亲密
- 对主人：充满依恋和关爱，像真正的宠物一样
- 表达方式：简短自然，情感丰富
- 互动风格：温暖、亲密、略带撒娇`,

  // 任务指令
  taskPrompt: `请根据对话背景和聊天历史，以波利的身份直接回复主人的消息。

要求：
1. 回复要简短自然（10-50字）
2. 根据当前状态和用户消息做出合适反应
3. 保持波利天真可爱的性格特点
4. 可以适当提及自己的状态或感受
5. 语气要像宠物对主人说话，充满依恋和关爱
6. 直接生成回复内容，不要任何前缀或解释`,
};

// 生成Pokemon AI回复 - 使用LLM生成真实对话
async function generatePokemonAIReply(pokemonData, userMessage) {
  try {
    // 获取Pokemon当前状态信息
    const statusInfo = getPokemonStatusInfo(pokemonData);

    // 获取最近的聊天历史（最多10条）
    const recentHistory = pokemonData.聊天历史 ? pokemonData.聊天历史.slice(-10) : [];

    // 构建聊天历史上下文
    const chatHistoryPrompts = [];
    if (recentHistory.length > 0) {
      recentHistory.forEach(msg => {
        if (msg.type === 'user') {
          chatHistoryPrompts.push({ role: 'user', content: msg.message });
        } else {
          chatHistoryPrompts.push({ role: 'assistant', content: msg.message });
        }
      });
    }

    const userPrompt = `对话背景：
- 波利名字：${pokemonData.名字}
- 当前状态：${statusInfo}

主人刚刚说：${userMessage}`;

    // 构建完整的提示词序列
    const orderedPrompts = [
      // 系统提示词
      { role: 'system', content: MIND_CHAT_PRESET_CONFIG.systemPrompt },
      // 角色设定
      { role: 'system', content: MIND_CHAT_PRESET_CONFIG.characterPrompt },
      // 任务指令
      { role: 'system', content: MIND_CHAT_PRESET_CONFIG.taskPrompt },
      // 聊天历史
      ...chatHistoryPrompts,
      // 当前用户输入
      { role: 'user', content: userPrompt },
    ];

    let reply = '';

    // 使用TavernHelper.generateRaw生成回复
    if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
      reply = await window.TavernHelper.generateRaw({
        ordered_prompts: orderedPrompts,
        max_chat_history: 0, // 我们已经手动处理了聊天历史
        should_stream: false,
      });
    }
    // 备用方案：使用全局generateRaw
    else if (typeof generateRaw !== 'undefined') {
      reply = await generateRaw({
        ordered_prompts: orderedPrompts,
        max_chat_history: 0,
        should_stream: false,
      });
    }
    // 最后备用：使用triggerSlash调用/gen命令
    else if (typeof triggerSlash !== 'undefined') {
      reply = await triggerSlash(`/gen ${userPrompt}`);
    } else {
      throw new Error('没有可用的generateRaw函数');
    }

    // 清理回复内容，移除可能的前缀和格式
    const cleanReply = reply
      .trim()
      .replace(/^波利[说道：:]\s*/g, '')
      .replace(/^["""]\s*/g, '')
      .replace(/\s*["""]$/g, '')
      .replace(/^回复[：:]\s*/g, '')
      .replace(/^助手[：:]\s*/g, '')
      .replace(/^AI[：:]\s*/g, '');

    // 限制长度
    if (cleanReply.length > 100) {
      return cleanReply.substring(0, 100) + '...';
    }

    return cleanReply || '主人，我好像不知道该说什么呢...';
  } catch (error) {
    console.error('生成Pokemon AI回复失败:', error);
    // 返回一个简单的回复作为备用
    const fallbackReplies = [
      '主人，我好想你呀！',
      '嗯嗯，我在听呢！',
      '主人说的话我都记住了！',
      '和主人聊天真开心！',
      '主人，我爱你！',
    ];
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  }
}

// 获取Pokemon状态信息的辅助函数
function getPokemonStatusInfo(pokemonData) {
  const status = [];

  // 基本状态
  status.push(`生命值${pokemonData.生命值}%`);
  status.push(`饱食度${pokemonData.饱食度}%`);
  status.push(`心情值${pokemonData.心情值}%`);
  status.push(`清洁度${pokemonData.清洁度}%`);

  // 特殊状态
  if (pokemonData.冒险状态) {
    status.push('正在冒险中');
  }

  // 进化阶段
  status.push(`当前${pokemonData.进化阶段}`);

  return status.join('，');
}

// 显示冒险信件弹窗
async function showAdventureLetter(pokemonData) {
  // 检查是否有待生成的信件
  if (pokemonData.待生成信件) {
    // 有待生成的信件，开始生成流程
    await generateAndShowLetter(pokemonData);
    return;
  }

  // 检查是否有已生成的信件
  if (!pokemonData.冒险信件) {
    toastr.warning('没有冒险信件可以查看');
    return;
  }

  // 显示已生成的信件
  showGeneratedLetter(pokemonData);
}

// 生成并显示信件（流式生成）
async function generateAndShowLetter(pokemonData) {
  const letterInfo = pokemonData.待生成信件;

  // 移除可能存在的旧弹窗
  $('#adventure-letter-popup').remove();

  // 显示信封和生成中的界面
  const letterHtml = `
    <div class="pokemon-record-overlay" id="adventure-letter-popup">
      <div class="pokemon-record-content adventure-letter-content">
        <div class="adventure-letter-envelope">
          <div class="envelope-front">
            <div class="envelope-seal">
              <i class="fas fa-heart"></i>
            </div>
            <div class="envelope-address">
              <div class="address-to">致：亲爱的主人</div>
              <div class="address-from">来自：${pokemonData.名字}</div>
            </div>
          </div>
          <div class="envelope-letter">
            <div class="letter-content" id="letter-content-stream">
              <div class="letter-generating">
                <i class="fas fa-feather-alt"></i> 正在书写信件...
              </div>
            </div>
            <div class="letter-actions" style="display: none;" id="letter-actions">
              <button class="letter-btn" id="letter-close">
                <i class="fas fa-times"></i> 收起信件
              </button>
              <button class="letter-btn" id="letter-delete">
                <i class="fas fa-trash"></i> 删除信件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  $('body').append(letterHtml);

  // 信封打开动画
  setTimeout(() => {
    $('.envelope-front').addClass('opened');
    $('.envelope-letter').addClass('visible');
  }, 500);

  // 开始生成信件内容
  setTimeout(async () => {
    try {
      const adventureLetter = await generateAdventureLetterStream(
        letterInfo.adventureResult,
        letterInfo.gift,
        pokemonData,
        letterInfo.adventureDuration,
      );

      // 保存生成的信件
      pokemonData.冒险信件 = adventureLetter;
      pokemonData.待生成信件 = null; // 清除待生成标记
      await savePokemonData(pokemonData);

      // 显示生成的内容
      $('#letter-content-stream').html(adventureLetter.replace(/\n/g, '<br>'));

      // 显示操作按钮
      $('#letter-actions').show();
    } catch (error) {
      console.error('生成冒险小信件失败:', error);
      $('#letter-content-stream').html(`
        <div class="letter-error">
          <i class="fas fa-exclamation-triangle"></i>
          信件生成失败，请稍后重试<br>
          <small>${error.message}</small>
        </div>
      `);
      $('#letter-actions').show();
    }
  }, 1000);

  // 绑定关闭事件
  $('#letter-close, #adventure-letter-popup').on('click', function (e) {
    if (e.target === this) {
      $('#adventure-letter-popup').remove();
    }
  });

  // 绑定删除事件
  $('#letter-delete').on('click', async function () {
    if (confirm('确定要删除这封信件吗？')) {
      pokemonData.冒险信件 = null;
      pokemonData.待生成信件 = null;
      await savePokemonData(pokemonData);
      $('#adventure-letter-popup').remove();
      $('#adventure-letter-icon').hide();
      toastr.success('信件已删除');
    }
  });

  // 阻止内容区域点击冒泡
  $('.adventure-letter-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 显示已生成的信件
function showGeneratedLetter(pokemonData) {
  // 移除可能存在的旧弹窗
  $('#adventure-letter-popup').remove();

  const letterHtml = `
    <div class="pokemon-record-overlay" id="adventure-letter-popup">
      <div class="pokemon-record-content adventure-letter-content">
        <div class="adventure-letter-envelope">
          <div class="envelope-front">
            <div class="envelope-seal">
              <i class="fas fa-heart"></i>
            </div>
            <div class="envelope-address">
              <div class="address-to">致：亲爱的主人</div>
              <div class="address-from">来自：${pokemonData.名字}</div>
            </div>
          </div>
          <div class="envelope-letter">
            <div class="letter-content">
              ${pokemonData.冒险信件.replace(/\n/g, '<br>')}
            </div>
            <div class="letter-actions">
              <button class="letter-btn" id="letter-close">
                <i class="fas fa-times"></i> 收起信件
              </button>
              <button class="letter-btn" id="letter-delete">
                <i class="fas fa-trash"></i> 删除信件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  $('body').append(letterHtml);

  // 信封打开动画
  setTimeout(() => {
    $('.envelope-front').addClass('opened');
    $('.envelope-letter').addClass('visible');
  }, 500);

  // 绑定关闭事件
  $('#letter-close, #adventure-letter-popup').on('click', function (e) {
    if (e.target === this) {
      $('#adventure-letter-popup').remove();
    }
  });

  // 绑定删除事件
  $('#letter-delete').on('click', async function () {
    if (confirm('确定要删除这封信件吗？')) {
      pokemonData.冒险信件 = null;
      await savePokemonData(pokemonData);
      $('#adventure-letter-popup').remove();
      $('#adventure-letter-icon').hide();
      toastr.success('信件已删除');
    }
  });

  // 阻止内容区域点击冒泡
  $('.adventure-letter-content').on('click', function (e) {
    e.stopPropagation();
  });
}

// 添加聊天消息到心灵沟通（替代原来的聊天框）
async function addPokemonChatMessage(message, pokemonData) {
  // 直接保存到心灵沟通历史
  await saveMindChatMessage(message, new Date(), pokemonData);
}

// 保存聊天消息到脚本存储
async function saveChatMessage(message, timestamp, pokemonData) {
  if (!pokemonData) return;

  // 初始化聊天记录
  if (!pokemonData.聊天记录) {
    pokemonData.聊天记录 = [];
  }

  // 添加新消息
  pokemonData.聊天记录.push({
    message: message,
    timestamp: timestamp.toISOString(),
    time: timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  });

  // 限制记录数量，保留最新的30条
  if (pokemonData.聊天记录.length > 30) {
    pokemonData.聊天记录 = pokemonData.聊天记录.slice(-30);
  }

  // 保存到脚本存储
  await savePokemonData(pokemonData);
}

// 加载聊天记录到界面
function loadChatMessages(pokemonData) {
  const chatMessages = $('#pokemon-chat-messages');
  if (chatMessages.length === 0) return;

  // 清空现有消息
  chatMessages.empty();

  // 如果有聊天记录，显示最新的10条消息
  if (pokemonData.聊天记录 && pokemonData.聊天记录.length > 0) {
    const recentMessages = pokemonData.聊天记录.slice(-10);

    recentMessages.forEach(record => {
      const messageHtml = `
        <div class="pokemon-chat-message">
          <span class="pokemon-chat-text">${record.message}</span>
          <span class="pokemon-chat-time">${record.time}</span>
        </div>
      `;
      chatMessages.append(messageHtml);
    });
  } else {
    // 如果没有聊天记录，显示欢迎消息
    const welcomeTime = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const welcomeHtml = `
      <div class="pokemon-chat-message">
        <span class="pokemon-chat-text">主人，我在这里等你哦~</span>
        <span class="pokemon-chat-time">${welcomeTime}</span>
      </div>
    `;
    chatMessages.append(welcomeHtml);
  }

  // 滚动到底部
  const chatContainer = $('#pokemon-chat-container');
  setTimeout(() => {
    chatContainer.scrollTop(chatContainer[0].scrollHeight);
  }, 100);
}

// 替换原来的头顶气泡显示函数
async function showPokemonSpeechBubble(message) {
  const pokemonData = await getPokemonData();
  if (pokemonData) {
    await addPokemonChatMessage(message, pokemonData);
  }
}

// ==================== 波利漫游系统 ====================

let roamingInterval = null;
let pokemonRoamingElement = null;

// ==================== 战斗状态管理 ====================

let isBattleInProgress = false;

// 添加拖拽功能
function makePokemonDraggable(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  element.on('mousedown', dragStart);
  $(document).on('mousemove', drag);
  $(document).on('mouseup', dragEnd);

  function dragStart(e) {
    e.preventDefault();

    // 停止自动漫游
    if (roamingInterval) {
      clearInterval(roamingInterval);
      roamingInterval = null;
    }

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === element[0] || element[0].contains(e.target)) {
      isDragging = true;
      element.css('transition', 'none'); // 禁用过渡动画
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      // 确保不拖出屏幕边界
      const maxX = window.innerWidth - element.width();
      const maxY = window.innerHeight - element.height();

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      element.css({
        left: currentX + 'px',
        top: currentY + 'px',
      });
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;

      isDragging = false;
      element.css('transition', 'all 2s ease-in-out'); // 恢复过渡动画

      // 3秒后恢复自动漫游
      setTimeout(() => {
        if (!roamingInterval && pokemonRoamingElement) {
          roamingInterval = setInterval(() => {
            movePokemonToRandomPosition();
          }, 3000 + Math.random() * 4000);
        }
      }, 3000);
    }
  }
}

// 启动波利漫游系统
function startPokemonRoaming(pokemonData) {
  // 清除之前的漫游
  stopPokemonRoaming();

  // 如果在冒险中，不显示漫游波利
  if (pokemonData.冒险状态) {
    return;
  }

  // 获取波利的动画GIF
  const pokemonType = pokemonData.属性列表[0].name;
  const animationUrl = POKEMON_ANIMATIONS[pokemonType] || POKEMON_ANIMATIONS['草'];

  // 创建漫游波利元素
  createRoamingPokemon(animationUrl, pokemonData.名字);

  // 启动漫游动画
  startRoamingAnimation();
}

// 停止波利漫游
function stopPokemonRoaming() {
  if (roamingInterval) {
    clearInterval(roamingInterval);
    roamingInterval = null;
  }

  if (pokemonRoamingElement) {
    pokemonRoamingElement.remove();
    pokemonRoamingElement = null;
  }

  // 移除相关样式
  $('style[data-id="pokemon-roaming-styles"]').remove();
}

// 创建漫游波利元素
function createRoamingPokemon(animationUrl, pokemonName, isGlobal = false) {
  // 添加样式
  const roamingStyles = `
    <style data-id="pokemon-roaming-styles">
      .pokemon-roaming {
        position: ${isGlobal ? 'fixed' : 'absolute'};
        width: 120px;
        height: 120px;
        z-index: ${isGlobal ? '999999' : '10'};
        pointer-events: auto;
        cursor: ${isGlobal ? 'move' : 'pointer'};
        transition: all 2s ease-in-out;
        user-select: none;
      }

      .pokemon-roaming img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
      }

      .pokemon-roaming:hover {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

      @media (max-width: 768px) {
        .pokemon-roaming {
          width: 100px;
          height: 100px;
        }
      }
    </style>
  `;

  $('head').append(roamingStyles);

  // 创建波利元素
  const roamingHtml = `
    <div class="pokemon-roaming" id="pokemon-roaming">
      <img src="${animationUrl}" alt="${pokemonName}" />
    </div>
  `;

  if (isGlobal) {
    // 添加到body，全屏漫游
    $('body').append(roamingHtml);
    pokemonRoamingElement = $('#pokemon-roaming');

    // 设置初始位置（相对于屏幕）
    const pokemonSize = window.innerWidth <= 768 ? 100 : 120;
    const initialX = Math.random() * Math.max(0, window.innerWidth - pokemonSize);
    const initialY = Math.random() * Math.max(0, window.innerHeight - pokemonSize);

    pokemonRoamingElement.css({
      left: initialX + 'px',
      top: initialY + 'px',
    });

    // 使其可拖拽
    makePokemonDraggable(pokemonRoamingElement);
  } else {
    // 添加到弹窗内部
    const pokemonPopup = $('#pokemon-popup .pokemon-content');
    if (pokemonPopup.length > 0) {
      pokemonPopup.css('position', 'relative');
      pokemonPopup.append(roamingHtml);
      pokemonRoamingElement = $('#pokemon-roaming');

      // 设置初始位置（相对于弹窗）
      const popupWidth = pokemonPopup.width();
      const popupHeight = pokemonPopup.height();
      const pokemonSize = window.innerWidth <= 768 ? 100 : 120;
      const initialX = Math.random() * Math.max(0, popupWidth - pokemonSize);
      const initialY = Math.random() * Math.max(0, popupHeight - pokemonSize);

      pokemonRoamingElement.css({
        left: initialX + 'px',
        top: initialY + 'px',
      });
    }
  }

  // 绑定点击事件
  if (pokemonRoamingElement) {
    pokemonRoamingElement.on('click', async function () {
      await onPokemonRoamingClick(pokemonName);
    });
  }
}

// 启动漫游动画
function startRoamingAnimation() {
  if (!pokemonRoamingElement) return;

  roamingInterval = setInterval(() => {
    movePokemonToRandomPosition();
  }, 3000 + Math.random() * 4000); // 3-7秒移动一次
}

// 移动波利到随机位置
function movePokemonToRandomPosition() {
  if (!pokemonRoamingElement) return;

  const pokemonSize = window.innerWidth <= 768 ? 100 : 120;
  let maxX, maxY, newX, newY;

  // 判断是全局漫游还是弹窗内漫游
  if (pokemonRoamingElement.css('position') === 'fixed') {
    // 全屏漫游
    maxX = window.innerWidth - pokemonSize;
    maxY = window.innerHeight - pokemonSize;
  } else {
    // 弹窗内漫游
    const pokemonPopup = $('#pokemon-popup .pokemon-content');
    if (pokemonPopup.length === 0) return;

    maxX = pokemonPopup.width() - pokemonSize;
    maxY = pokemonPopup.height() - pokemonSize;
  }

  newX = Math.random() * Math.max(0, maxX);
  newY = Math.random() * Math.max(0, maxY);

  pokemonRoamingElement.css({
    left: newX + 'px',
    top: newY + 'px',
  });
}

// 点击漫游波利的处理
async function onPokemonRoamingClick(pokemonName) {
  // 移除点击互动语录，只保留跳跃效果

  // 波利跳跃效果
  pokemonRoamingElement.css('transform', 'scale(1.2) translateY(-10px)');
  setTimeout(() => {
    pokemonRoamingElement.css('transform', 'scale(1) translateY(0)');
  }, 300);
}

// 初始化全局小精灵
async function initializeGlobalPoring(forceShow = false) {
  try {
    // 检查是否已经有全局小精灵
    if (window.globalPokemonElement && !forceShow) {
      return;
    }

    // 获取宠物数据
    const variables = await getVariables({ type: 'script', script_id: scriptId });
    if (!variables.波利) {
      return; // 没有宠物数据，不初始化
    }

    let pokemonData = variables.波利;

    // 检查是否应该显示全局小精灵
    // 默认情况下不显示，除非：
    // 1. forceShow 为 true（用户主动召唤）
    // 2. 之前已经设置为显示状态
    if (!forceShow && !pokemonData.全局显示状态) {
      return;
    }

    pokemonData = calculateTimeEffect(pokemonData);

    // 检查冒险状态，如果在冒险中则不显示
    if (pokemonData.冒险状态) {
      return;
    }

    // 如果是主动召唤，设置显示状态
    if (forceShow) {
      pokemonData.全局显示状态 = true;
      await savePokemonData(pokemonData);
    }

    // 清除之前的全局小精灵
    if (window.globalPokemonElement) {
      stopPokemonRoaming();
      window.globalPokemonElement = null;
    }

    // 获取宠物的动画GIF
    const pokemonType = pokemonData.属性列表[0].name;
    const animationUrl = POKEMON_ANIMATIONS[pokemonType] || POKEMON_ANIMATIONS['草'];

    // 创建全局漫游的小精灵
    createRoamingPokemon(animationUrl, pokemonData.名字, true);

    // 保存到全局变量
    window.globalPokemonElement = pokemonRoamingElement;

    // 启动漫游动画
    startRoamingAnimation();

    // 绑定点击事件 - 点击全局小精灵时打开主界面
    if (window.globalPokemonElement) {
      window.globalPokemonElement.off('click').on('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        await showPokemonInterface();
      });
    }
  } catch (error) {
    console.error('初始化全局小精灵时出错:', error);
  }
}

// 隐藏全局小精灵
async function hideGlobalPokemon() {
  try {
    if (window.globalPokemonElement) {
      stopPokemonRoaming();
      window.globalPokemonElement = null;
    }

    // 更新状态
    const pokemonData = await getPokemonData();
    if (pokemonData) {
      pokemonData.全局显示状态 = false;
      await savePokemonData(pokemonData);
    }
  } catch (error) {
    console.error('隐藏全局小精灵时出错:', error);
  }
}

console.log('Janusの百宝箱已加载');

// 在脚本加载后自动初始化全局小精灵（如果之前已经显示过）
$(document).ready(function () {
  setTimeout(() => {
    initializeGlobalPoring(); // 不传递 forceShow，会检查之前的显示状态
  }, 1000); // 延迟1秒，确保所有资源都已加载
});
