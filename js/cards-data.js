// cards-data.js - 무력 포커 클래시 로얄 정통 원본 카드 덱 정의 (전체 119종, 타워 유닛 제외)
// 슈퍼셀 팬 콘텐츠 정책(Fan Content Policy)에 따라 비상업적 방송 미니게임에 공식 원본 에셋 이미지를 사용합니다.

export const CARDS_DATA = [
  {
    id: "knight",
    name: "기사",
    power: 4,
    cost: 3,
    type: "melee",
    rarity: "common",
    description: "터프한 근접 전사입니다. 바바리안의 사촌으로 얼굴도 잘생겼고 좀 더 교양이 있죠. 오로지 멋진 콧수염 하나 덕에 기사 작위를 받았다는 소문이 있습니다.",
    image: "assets/cards/knight.png"
  },
  {
    id: "archers",
    name: "아처",
    power: 3,
    cost: 3,
    type: "ranged",
    rarity: "common",
    description: "경갑옷을 입은 한 쌍의 원거리 공격수입니다. 지상과 공중 유닛을 공격할 수 있지만 이 친구들에게 머리 색을 골라달라고 하진 마세요.",
    image: "assets/cards/archers.png"
  },
  {
    id: "goblins",
    name: "고블린",
    power: 2,
    cost: 2,
    type: "swarm",
    rarity: "common",
    description: "갑옷을 입지 않은 네 마리의 근접 공격수입니다. 작고 빠르고 시퍼런 데다 성깔도 사납기 그지없습니다!",
    image: "assets/cards/goblins.png"
  },
  {
    id: "giant",
    name: "자이언트",
    power: 5,
    cost: 5,
    type: "tank",
    rarity: "rare",
    description: "느리지만 맷집이 좋으며 건물만 공격합니다. 1인 철거반이 따로 없죠!",
    image: "assets/cards/giant.png"
  },
  {
    id: "pekka",
    name: "P.E.K.K.A",
    power: 7,
    cost: 7,
    type: "tank",
    rarity: "epic",
    description: "두꺼운 갑옷의 움직임이 느린 근접 전사입니다. 휘두르는 건 느리지만 파괴력은 엄청납니다.",
    image: "assets/cards/pekka.png"
  },
  {
    id: "minions",
    name: "미니언",
    power: 3,
    cost: 3,
    type: "flying",
    rarity: "common",
    description: "갑옷을 입지 않은 세 마리의 공중 공격수입니다. 장미는 붉고, 미니언은 푸르며 나비처럼 날아 벌처럼 쏩니다!",
    image: "assets/cards/minions.png"
  },
  {
    id: "balloon",
    name: "해골 비행선",
    power: 5,
    cost: 5,
    type: "flying",
    rarity: "epic",
    description: "생김새는 예쁘지만, 이 풍선들이 하늘에서 나타나는 모습을 보고 싶진 않을 겁니다. 강력한 폭탄을 투하하며, 파괴 시 떨어지면서 광역 피해를 입힙니다.",
    image: "assets/cards/balloon.png"
  },
  {
    id: "witch",
    name: "마녀",
    power: 5,
    cost: 5,
    type: "ranged",
    rarity: "epic",
    description: "해골을 소환하고 파괴 광선을 쏩니다. 눈은 분홍색이고 번쩍번쩍 빛도 나지만, 아쉽게도 레이저 같은 게 나가진 않습니다.",
    image: "assets/cards/witch.png"
  },
  {
    id: "barbarians",
    name: "바바리안",
    power: 5,
    cost: 5,
    type: "swarm",
    rarity: "common",
    description: "고약하게 생긴 수염을 달고 있으며 성격은 더 고약한 근접 공격 부대입니다.",
    image: "assets/cards/barbarians.png"
  },
  {
    id: "golem",
    name: "골렘",
    power: 8,
    cost: 8,
    type: "tank",
    rarity: "epic",
    description: "느리지만 맷집이 좋으며 건물만 공격합니다. 부서지면 폭발하면서 주위에 광역 피해를 주며, 두 마리의 베이비 골렘으로 나뉩니다!",
    image: "assets/cards/golem.png"
  },
  {
    id: "skeletons",
    name: "해골 병사",
    power: 1,
    cost: 1,
    type: "swarm",
    rarity: "common",
    description: "빠르지만 비실비실한 세 마리의 근접 전사입니다. 무수한 뼈다귀로 적을 둘러싸세요!",
    image: "assets/cards/skeletons.png"
  },
  {
    id: "valkyrie",
    name: "발키리",
    power: 5,
    cost: 4,
    type: "melee",
    rarity: "rare",
    description: "터프한 근접 전사로 주변에 광역 피해를 줍니다. 무리든 패거리든 몇 번 휘둘러주면 죄다 쓸어버릴 수 있습니다!",
    image: "assets/cards/valkyrie.png"
  },
  {
    id: "skeleton_army",
    name: "해골 군대",
    power: 3,
    cost: 3,
    type: "swarm",
    rarity: "epic",
    description: "해골 병사들을 생성합니다. 소개해 드리죠! 래리와 그의 친구 해리, 제리, 테리, 매리...",
    image: "assets/cards/skeleton_army.png"
  },
  {
    id: "bomber",
    name: "폭탄병",
    power: 2,
    cost: 2,
    type: "melee",
    rarity: "common",
    description: "맨몸으로 폭탄을 던지는 작은 해골 병사입니다. 광역 피해를 주어 적들을 쓸어버릴 수 있습니다.",
    image: "assets/cards/bomber.png"
  },
  {
    id: "musketeer",
    name: "머스킷병",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "rare",
    description: "멋진 머리 모양에 속지 마세요. 머스킷병의 총은 목표를 놓치는 법이 없습니다.",
    image: "assets/cards/musketeer.png"
  },
  {
    id: "baby_dragon",
    name: "베이비 드래곤",
    power: 4,
    cost: 4,
    type: "flying",
    rarity: "epic",
    description: "공중에서 광역 피해를 주는 파이어 볼을 토해냅니다. 보기엔 귀엽지만, 항상 배가 고파 적들을 바비큐로 만들고 싶어 안달이 나 있습니다.",
    image: "assets/cards/baby_dragon.png"
  },
  {
    id: "prince",
    name: "프린스",
    power: 5,
    cost: 5,
    type: "melee",
    rarity: "epic",
    description: "말이 작다고 방심하지 마세요. 달리기 시작하면 장난이 아니니까요. 돌격하면 2배의 피해를 줍니다.",
    image: "assets/cards/prince.png"
  },
  {
    id: "wizard",
    name: "마법사",
    power: 5,
    cost: 5,
    type: "ranged",
    rarity: "rare",
    description: "아레나에서 가장 \"핫\"한 남자인 마법사는 잘생긴 얼굴로 여러분의 마음에 불을 지를 겁니다. 아, 파이어 볼도 쓸 줄 알고요.",
    image: "assets/cards/wizard.png"
  },
  {
    id: "mini_pekka",
    name: "미니 P.E.K.K.A",
    power: 5,
    cost: 4,
    type: "melee",
    rarity: "rare",
    description: "아레나는 나비 출입 금지 구역입니다. P.E.K.K.A가 나비에 정신이 안 팔려야 때려 부수는 데만 집중하니까요.",
    image: "assets/cards/mini_pekka.png"
  },
  {
    id: "spear_goblins",
    name: "창 고블린",
    power: 2,
    cost: 2,
    type: "swarm",
    rarity: "common",
    description: "갑옷을 입지 않은 세 마리의 원거리 공격수입니다. 도대체 누가 창을 던지라고 가르친 걸까요? 대체 누가 이걸 좋은 생각이라고 내놓은 걸까요?",
    image: "assets/cards/spear_goblins.png"
  },
  {
    id: "giant_skeleton",
    name: "자이언트 해골",
    power: 6,
    cost: 6,
    type: "tank",
    rarity: "epic",
    description: "해골이 커지면 폭탄도 커집니다. 자이언트 해골은 본인이 처치되면 터지는 폭탄을 들고 다닙니다.",
    image: "assets/cards/giant_skeleton.png"
  },
  {
    id: "hog_rider",
    name: "호그 라이더",
    power: 5,
    cost: 4,
    type: "fast",
    rarity: "rare",
    description: "건물을 노려 공격하는 빠른 근접 유닛으로, 강을 뛰어넘을 수 있습니다. \"호그 라이더어어어\"라고 부르는 소리를 듣고 아레나까지 부리나케 뛰어왔다는군요.",
    image: "assets/cards/hog_rider.png"
  },
  {
    id: "minion_horde",
    name: "미니언 패거리",
    power: 5,
    cost: 5,
    type: "flying",
    rarity: "common",
    description: "갑옷을 입지 않은 여섯 마리의 공중 공격수입니다. 셋은 무리지만 여섯은 패거리라고요!",
    image: "assets/cards/minion_horde.png"
  },
  {
    id: "ice_wizard",
    name: "얼음 마법사",
    power: 3,
    cost: 3,
    type: "ranged",
    rarity: "legendary",
    description: "얼음 조각을 던져 적의 이동 속도 및 공격 속도를 느리게 만드는 쌀쌀맞은 마법사입니다. 얼음처럼 냉정하지만, TV에 나오기엔 너무 섹시한 콧수염의 반전 매력이 있습니다.",
    image: "assets/cards/ice_wizard.png"
  },
  {
    id: "royal_giant",
    name: "로얄 자이언트",
    power: 6,
    cost: 6,
    type: "tank",
    rarity: "common",
    description: "커다란 대포로 상대방 건물을 파괴하는 게 이 친구의 일입니다. 북실북실한 금발 수염이 매력 포인트입니다.",
    image: "assets/cards/royal_giant.png"
  },
  {
    id: "guards",
    name: "가드",
    power: 3,
    cost: 3,
    type: "melee",
    rarity: "epic",
    description: "방패를 든 세 명의 무자비한 해골 형제들입니다. 방패를 떨어뜨리면 세 명의 무자비한 해골 형제들이 남습니다.",
    image: "assets/cards/guards.png"
  },
  {
    id: "princess",
    name: "프린세스",
    power: 3,
    cost: 3,
    type: "ranged",
    rarity: "legendary",
    description: "원거리에서 불화살을 쏘는 매력적인 프린세스입니다. 그녀를 보고 뜨거워진다면 불화살을 맞은 게 분명합니다.",
    image: "assets/cards/princess.png"
  },
  {
    id: "dark_prince",
    name: "다크 프린스",
    power: 5,
    cost: 4,
    type: "melee",
    rarity: "epic",
    description: "범위 공격을 하는 다크 프린스는 말 대신 가시 달린 몽둥이로 의사를 표현합니다. 다크 프린스가 입을 열면 양동이를 쓰고 말하는 것 같기 때문이죠.",
    image: "assets/cards/dark_prince.png"
  },
  {
    id: "three_musketeers",
    name: "삼총사",
    power: 9,
    cost: 9,
    type: "ranged",
    rarity: "rare",
    description: "정의와 명예를 위해 싸우는 강력하고 자긍심 강한 세 명의 저격수들입니다. 실수로라도 무례하게 굴지 마세요. 큰코다치니까요!",
    image: "assets/cards/three_musketeers.png"
  },
  {
    id: "lava_hound",
    name: "라바 하운드",
    power: 7,
    cost: 7,
    type: "flying",
    rarity: "legendary",
    description: "라바 하운드는 우아하게 날아서 건물을 공격하는 야수입니다. 라바 펍은 조금 덜 우아하게 날아서 뭐든 공격하는 까칠한 아가들입니다.",
    image: "assets/cards/lava_hound.png"
  },
  {
    id: "ice_spirit",
    name: "아이스 스피릿",
    power: 1,
    cost: 1,
    type: "swarm",
    rarity: "common",
    description: "작은 아이스 스피릿 하나를 내보내 적 무리를 얼려버립니다. 꽁꽁.",
    image: "assets/cards/ice_spirit.png"
  },
  {
    id: "fire_spirit",
    name: "파이어 스피릿",
    power: 1,
    cost: 1,
    type: "swarm",
    rarity: "common",
    description: "파이어 스피릿은 따뜻하게 안아주는 척하면서 폭발합니다! 아레나에 불을 지르지 않는 게 다행이네요.",
    image: "assets/cards/fire_spirit.png"
  },
  {
    id: "miner",
    name: "광부",
    power: 3,
    cost: 3,
    type: "melee",
    rarity: "legendary",
    description: "광부는 땅을 파고 이동해 아레나 어디에나 나타날 수 있습니다. 마법이 아니라 삽질의 힘이죠. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/miner.png"
  },
  {
    id: "sparky",
    name: "스파키",
    power: 6,
    cost: 6,
    type: "melee",
    rarity: "legendary",
    description: "스파키는 천천히 에너지를 모은 다음 발사해 막대한 광역 피해를 줍니다. 지나치다는 말은 스파키 사전에 없죠.",
    image: "assets/cards/sparky.png"
  },
  {
    id: "bowler",
    name: "볼러",
    power: 5,
    cost: 5,
    type: "ranged",
    rarity: "epic",
    description: "이 덩치 크고 시퍼런 친구는 단순하게 사는 걸 좋아합니다. 바로 다크 엘릭서를 마시고 바위를 던지는 것이죠. 볼러의 거대한 바위는 목표물에 명중해도 그대로 굴러가 뒤에 있는 모든 것을 공격합니다!",
    image: "assets/cards/bowler.png"
  },
  {
    id: "lumberjack",
    name: "나무꾼",
    power: 5,
    cost: 4,
    type: "melee",
    rarity: "legendary",
    description: "낮에는 나무를 베고 밤에는 통나무를 사냥합니다. 나무꾼이 처치되면 들고 있던 분노 마법이 쏟아집니다.",
    image: "assets/cards/lumberjack.png"
  },
  {
    id: "battle_ram",
    name: "배틀 램",
    power: 4,
    cost: 4,
    type: "fast",
    rarity: "rare",
    description: "바바리안 두 명이 큰 통나무를 들고 가장 가까운 건물로 돌진하여 큰 피해를 줍니다. 그런 다음 칼을 들고 적진을 공격합니다!",
    image: "assets/cards/battle_ram.png"
  },
  {
    id: "inferno_dragon",
    name: "인페르노 드래곤",
    power: 4,
    cost: 4,
    type: "flying",
    rarity: "legendary",
    description: "오래 공격할수록 더 큰 피해를 주는 광선을 발사합니다. 하늘을 나는 건 위험할 수 있으니 헬멧을 썼습니다.",
    image: "assets/cards/inferno_dragon.png"
  },
  {
    id: "ice_golem",
    name: "얼음 골렘",
    power: 2,
    cost: 2,
    type: "melee",
    rarity: "rare",
    description: "터프한 이 친구는 건물을 주로 공격하고, 파괴되면 폭발해 주변의 적을 느리게 만듭니다. 얼음으로 만들어졌다는데... 맞나?! 맞군요.",
    image: "assets/cards/ice_golem.png"
  },
  {
    id: "mega_minion",
    name: "메가 미니언",
    power: 3,
    cost: 3,
    type: "flying",
    rarity: "rare",
    description: "갑옷을 입고 강력한 데다 날아다니기까지 합니다. 약점이 뭐냐고요? 컵케이크랍니다.",
    image: "assets/cards/mega_minion.png"
  },
  {
    id: "dart_goblin",
    name: "다트 고블린",
    power: 3,
    cost: 3,
    type: "ranged",
    rarity: "rare",
    description: "껌을 씹으며 빠르게 달려 먼 거리까지 다트를 쏩니다. 껌이 입안 가득한데 어떻게 입으로 다트를 부냐고요? 오랫동안 힘들게 수련했거든요.",
    image: "assets/cards/dart_goblin.png"
  },
  {
    id: "goblin_gang",
    name: "고블린 갱",
    power: 3,
    cost: 3,
    type: "swarm",
    rarity: "common",
    description: "칼을 든 고블린 셋, 창을 든 고블린 셋, 총 고블린 여섯 마리를 적은 엘릭서로 불러옵니다. 가성비 좋은 고블린 팩인 셈이죠!",
    image: "assets/cards/goblin_gang.png"
  },
  {
    id: "electro_wizard",
    name: "일렉트로 마법사",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "legendary",
    description: "\"쾅!\" 하고 나타나 주변 적들을 마비시키고 양손에서 번개를 발사합니다! 등장 한번 요란스럽네요.",
    image: "assets/cards/electro_wizard.png"
  },
  {
    id: "elite_barbarians",
    name: "엘리트 바바리안",
    power: 6,
    cost: 6,
    type: "fast",
    rarity: "common",
    description: "업그레이드된 바바리안 한 쌍입니다. 일반 바바리안과 같지만 더 튼튼하고 좋으며 빠르고 강력합니다.",
    image: "assets/cards/elite_barbarians.png"
  },
  {
    id: "hunter",
    name: "사냥꾼",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "epic",
    description: "사냥꾼은 가까이 있는 유닛에는 아주 큰 피해를 주지만, 멀리 있는 유닛에는 피해를 적게 줍니다. 정확도는 조금 부족하지만, 사냥꾼에겐 멋진 털보 눈썹이 있답니다!",
    image: "assets/cards/hunter.png"
  },
  {
    id: "executioner",
    name: "도끼맨",
    power: 5,
    cost: 5,
    type: "ranged",
    rarity: "epic",
    description: "부메랑처럼 도끼를 던져, 날아갔다가 돌아오는 경로의 모든 적에게 피해를 줍니다. 팔이 멀쩡한 게 신기할 따름이네요.",
    image: "assets/cards/executioner.png"
  },
  {
    id: "bandit",
    name: "도둑",
    power: 3,
    cost: 3,
    type: "fast",
    rarity: "legendary",
    description: "도둑은 목표물을 향해 질주하고 강력한 한 방을 날립니다! 질주하는 동안에는 아무도 도둑을 건드릴 수 없습니다. 정체를 숨기기 위해 쓴 마스크는 멋진 패션 아이템이기도 하죠!",
    image: "assets/cards/bandit.png"
  },
  {
    id: "royal_recruits",
    name: "로얄 훈련병",
    power: 7,
    cost: 7,
    type: "swarm",
    rarity: "common",
    description: "좌우로 나란히 늘어선 훈련병들이 창과 방패, 그리고 통나무 투구를 끼고 있습니다. 언젠가 조랑말을 타고 멋진 강철 투구를 쓰는 꿈을 꾸며 말이죠.",
    image: "assets/cards/royal_recruits.png"
  },
  {
    id: "night_witch",
    name: "암흑 마녀",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "legendary",
    description: "박쥐들을 소환해 적을 공격하게 합니다. 적이 가까이 다가오면 무섭게 생긴 지팡이를 휘둘러 직접 공격합니다.",
    image: "assets/cards/night_witch.png"
  },
  {
    id: "bats",
    name: "박쥐",
    power: 2,
    cost: 2,
    type: "flying",
    rarity: "common",
    description: "작은 박쥐 몇 마리를 불러옵니다. 작다고 무시하면 아플 걸요?",
    image: "assets/cards/bats.png"
  },
  {
    id: "royal_ghost",
    name: "로얄 고스트",
    power: 3,
    cost: 3,
    type: "melee",
    rarity: "legendary",
    description: "눈에 보이지 않게 아레나를 돌아다니다가 적과 마주치면 공격! 한 다음 다시 모습을 감춥니다.",
    image: "assets/cards/royal_ghost.png"
  },
  {
    id: "ram_rider",
    name: "램 라이더",
    power: 5,
    cost: 5,
    type: "fast",
    rarity: "legendary",
    description: "이 둘은 모든 걸 함께합니다. 함께 아레나를 돌진하며 사냥돌로 적을 움직이지 못하게 하고, 타워를 부수고, 풀도 뜯어 먹고...?",
    image: "assets/cards/ram_rider.png"
  },
  {
    id: "zappies",
    name: "감전돌이",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "rare",
    description: "소형 감전 기계들을 내보냅니다. 누가 조종하는 걸까요? 그건 마스터 장인만이 알고 있답니다!",
    image: "assets/cards/zappies.png"
  },
  {
    id: "rascals",
    name: "악동",
    power: 5,
    cost: 5,
    type: "melee",
    rarity: "common",
    description: "장난꾸러기 악동 세 명을 불러옵니다. 악동 소년이 앞장을 서고, 악동 소녀들은 뒤에서 공격합니다! 뭘 쏘는 거죠? 씹던 껌이네요!",
    image: "assets/cards/rascals.png"
  },
  {
    id: "cannon_cart",
    name: "대포 카트",
    power: 5,
    cost: 5,
    type: "melee",
    rarity: "epic",
    description: "바퀴 달린 대포?! 이건 상상도 못 했죠? 실드를 부수면 바퀴가 없는 대포가 됩니다.",
    image: "assets/cards/cannon_cart.png"
  },
  {
    id: "mega_knight",
    name: "메가 나이트",
    power: 7,
    cost: 7,
    type: "tank",
    rarity: "legendary",
    description: "콧수염 1,000개의 위력으로 착지합니다. 엄청난 광역 피해를 주며 다른 상대에게 점프합니다. 비켜서세요!",
    image: "assets/cards/mega_knight.png"
  },
  {
    id: "skeleton_barrel",
    name: "해골 통",
    power: 3,
    cost: 3,
    type: "fast",
    rarity: "common",
    description: "하늘에서 해골 파티가 열립니다! 풍선이 모두 터지면 이제 땅 위에서 해골 파티를 열 차례죠!",
    image: "assets/cards/skeleton_barrel.png"
  },
  {
    id: "flying_machine",
    name: "플라잉 머신",
    power: 4,
    cost: 4,
    type: "flying",
    rarity: "rare",
    description: "마스터 장인이 아레나에서 처음으로 선보인 기계입니다! 빠르고 재미있는 비행선이지만, 쉽게 파괴됩니다!",
    image: "assets/cards/flying_machine.png"
  },
  {
    id: "wall_breakers",
    name: "해골 돌격병",
    power: 2,
    cost: 2,
    type: "fast",
    rarity: "epic",
    description: "폭탄을 들고 타워로 돌진하는 용감한 폭탄병 듀오입니다. 타워를 폭파할 때는 머리는 차갑게, 폭탄은 뜨겁게!",
    image: "assets/cards/wall_breakers.png"
  },
  {
    id: "royal_hogs",
    name: "로얄 호그",
    power: 5,
    cost: 5,
    type: "melee",
    rarity: "rare",
    description: "킹의 소중한 애완동물들이 뛰쳐나왔습니다! 호그들은 맛있는 사과만큼 타워도 좋아합니다. 거기 꿀꿀대는 거 누구야?!",
    image: "assets/cards/royal_hogs.png"
  },
  {
    id: "goblin_giant",
    name: "자이언트 고블린",
    power: 6,
    cost: 6,
    type: "tank",
    rarity: "epic",
    description: "유쾌한 자이언트 고블린은 적 건물을 향해 땅을 울리며 진격합니다. 어디를 가든 등에 창 고블린 두 마리를 업고 다니죠. 이상해 보이지만, 사실 꽤 효과적입니다!",
    image: "assets/cards/goblin_giant.png"
  },
  {
    id: "fisherman",
    name: "낚시꾼",
    power: 3,
    cost: 3,
    type: "melee",
    rarity: "legendary",
    description: "원거리 공격으로 적을 끌어오며, 적 건물에 갈고리를 걸어 가까이 이동합니다. 고대의 기술인 '물고기 따귀'의 대가이기도 합니다!",
    image: "assets/cards/fisherman.png"
  },
  {
    id: "magic_archer",
    name: "마법 아처",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "legendary",
    description: "마법사라 하기도 뭐하고, 그렇다고 아처도 아닙니다. 그가 쏘는 마법 화살은 경로 상의 모든 유닛을 관통해 피해를 줍니다. 속임수가 아니라 마법이랍니다!",
    image: "assets/cards/magic_archer.png"
  },
  {
    id: "electro_dragon",
    name: "일렉트로 드래곤",
    power: 5,
    cost: 5,
    type: "flying",
    rarity: "epic",
    description: "번개를 내뿜어 최대 세 개의 목표를 공격합니다. 드래곤 삼 형제 중 둘째라서 그런지 공격에 집중하지 못할 때가 있습니다.",
    image: "assets/cards/electro_dragon.png"
  },
  {
    id: "firecracker",
    name: "로켓병",
    power: 3,
    cost: 3,
    type: "ranged",
    rarity: "common",
    description: "충돌하면 폭발하는 발사체로 피해를 주며 대상 바로 뒤에는 불꽃을 퍼붓습니다. 활쏘기가 지루해진 아처는 이렇게 되는 거죠!",
    image: "assets/cards/firecracker.png"
  },
  {
    id: "mighty_miner",
    name: "능력자 광부",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "champion",
    description: "부드러운 발걸음으로 큰 드릴을 들고 다닙니다!  공격 대상에게 점점 더 큰 피해를 입히며, 전투를 피하거나 작전을 변경하기 위해 다른 쪽으로 이동할 수 있습니다.  아레나에서 가장 강력하면서도 영리한 \"능력자\" 광부입니다.",
    image: "assets/cards/mighty_miner.png"
  },
  {
    id: "elixir_golem",
    name: "엘릭서 골렘",
    power: 3,
    cost: 3,
    type: "tank",
    rarity: "rare",
    description: "파괴되면 두 개의 베이비 엘릭서 골렘으로 나뉘며, 베이비 엘릭서 골렘이 파괴되면 두 개의 살아있는 엘릭서 덩어리로 갈라집니다. 엘릭서 골렘의 파편이 파괴될 때마다 적이 엘릭서를 획득합니다!",
    image: "assets/cards/elixir_golem.png"
  },
  {
    id: "battle_healer",
    name: "전투 치유사",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "rare",
    description: "공격 시 강력한 치유 오라로 자신과 아군의 HP를 회복합니다. 공격하고 있지 않을 때도 자기 자신을 치유합니다!",
    image: "assets/cards/battle_healer.png"
  },
  {
    id: "skeleton_king",
    name: "해골 킹",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "champion",
    description: "언데드의 왕입니다. 아첨을 싫어하는 성격 탓에 간혹 외로움을 느끼기도 하지만, 전투 중에 함께할 영혼의 친구를 소환합니다. 터프가이도 감정은 있답니다!",
    image: "assets/cards/skeleton_king.png"
  },
  {
    id: "archer_queen",
    name: "아처 퀸",
    power: 4,
    cost: 5,
    type: "ranged",
    rarity: "champion",
    description: "빠르고 치명적이어서 잡기 어렵습니다. 아처 퀸의 석궁에 조심하고, 쉽게 놓쳐버릴 수 있으니 눈 하나 깜박이지 말고 크게 뜨고 계세요!",
    image: "assets/cards/archer_queen.png"
  },
  {
    id: "golden_knight",
    name: "골드 나이트",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "champion",
    description: "아름다운 머릿결과 뛰어난 유연성을 지녔습니다. 필요에 따라 에어로빅 기술을 구사합니다.",
    image: "assets/cards/golden_knight.png"
  },
  {
    id: "monk",
    name: "수도자",
    power: 4,
    cost: 5,
    type: "melee",
    rarity: "champion",
    description: "오랜 시간 동안 홀로 수련한 끝에 새로운 스타일의 전투를 완성했습니다.  적에게 3연타 공격을 퍼붓고 마지막 일격으로는 추가 피해를 주며 뒤로 밀쳐냅니다!",
    image: "assets/cards/monk.png"
  },
  {
    id: "skeleton_dragons",
    name: "해골 드래곤",
    power: 4,
    cost: 4,
    type: "flying",
    rarity: "common",
    description: "뼈만 남은 드래곤 한 쌍이 아레나 위를 날아다니며 광역 피해를 줍니다. 둘은 갈비뼈 실로폰으로 듀엣 연주를 할 수도 있습니다.",
    image: "assets/cards/skeleton_dragons.png"
  },
  {
    id: "mother_witch",
    name: "엄마 마녀",
    power: 4,
    cost: 4,
    type: "ranged",
    rarity: "legendary",
    description: "공격할 때마다 적 유닛에 저주를 내립니다. 저주 효과를 받은 유닛이 쓰러지면 적 건물에 돌진하는 호그로 변신합니다!  가장 잘하는 요리는 엄마의 손맛이 가득한 쿠키입니다.",
    image: "assets/cards/mother_witch.png"
  },
  {
    id: "electro_spirit",
    name: "일렉트로 스피릿",
    power: 1,
    cost: 1,
    type: "swarm",
    rarity: "common",
    description: "적에게 뛰어들어 광역 피해를 주고 최대 9명의 유닛을 마비시킵니다. 누가 더 멋진 콧수염을 가졌는지 기사와 끝없이 싸우고 있습니다.",
    image: "assets/cards/electro_spirit.png"
  },
  {
    id: "electro_giant",
    name: "일렉트로 자이언트",
    power: 7,
    cost: 7,
    type: "tank",
    rarity: "epic",
    description: "등에 멘 감전 팩으로 일정 범위 내에서 자신을 공격하는 적들을 감전시키고 피해를 줍니다.  쉿! 손가락 총이 가짜라는 것은 말하지 마세요. 실망해서 쇼크받을 테니까요!",
    image: "assets/cards/electro_giant.png"
  },
  {
    id: "phoenix",
    name: "피닉스",
    power: 4,
    cost: 4,
    type: "flying",
    rarity: "legendary",
    description: "처치되면 알로 돌아가는 신비로운 영물입니다. 알이 부화하면 피닉스가 다시 전투에 참여합니다! 정말 '알'찬 능력이죠.  다시 부화한 피닉스는 원래 HP 및 피해량의 80%만을 갖게 됩니다.",
    image: "assets/cards/phoenix.png"
  },
  {
    id: "cannon",
    name: "대포",
    power: 3,
    cost: 3,
    type: "building",
    rarity: "common",
    description: "방어 시설입니다. 강력한 포탄을 발사하지만 공중의 적은 공격할 수 없습니다.",
    image: "assets/cards/cannon.png"
  },
  {
    id: "goblin_hut",
    name: "고블린 오두막",
    power: 5,
    cost: 5,
    type: "building",
    rarity: "rare",
    description: "창 고블린을 생성하는 건물입니다. 생성 과정이 별로 아름답진 않으니, 들여다보지는 마세요!",
    image: "assets/cards/goblin_hut.png"
  },
  {
    id: "mortar",
    name: "박격포",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "common",
    description: "장거리 방어 시설입니다. 커다란 바위 포탄을 발사해 넓은 영역에 피해를 줄 수 있지만, 너무 가까이 있는 적은 공격할 수 없습니다!",
    image: "assets/cards/mortar.png"
  },
  {
    id: "inferno_tower",
    name: "인페르노 타워",
    power: 5,
    cost: 5,
    type: "building",
    rarity: "rare",
    description: "오래 공격할수록 더 큰 피해를 주는 광선으로 적을 불태워버리는 방어 시설입니다. 크고 튼튼한 적도 태워버릴 수 있죠!",
    image: "assets/cards/inferno_tower.png"
  },
  {
    id: "bomb_tower",
    name: "폭탄 타워",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "rare",
    description: "폭탄병이 대기하는 방어 시설입니다. 조심하지 않고 가까이 다가오는 적들에게 광역 공격을 먹입니다.",
    image: "assets/cards/bomb_tower.png"
  },
  {
    id: "barbarian_hut",
    name: "바바리안 오두막",
    power: 6,
    cost: 6,
    type: "building",
    rarity: "rare",
    description: "주기적으로 바바리안을 내보내 적과 싸우게 하는 건물입니다. 바바리안을 내보낼 때로군요!",
    image: "assets/cards/barbarian_hut.png"
  },
  {
    id: "tesla",
    name: "뇌전탑",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "common",
    description: "방어 시설입니다. 적들을 구워버릴 때를 제외하면 이런 전기 시설은 땅속에 있는 게 안전하겠죠.",
    image: "assets/cards/tesla.png"
  },
  {
    id: "elixir_collector",
    name: "엘릭서 정제소",
    power: 1,
    cost: 6,
    type: "building",
    rarity: "rare",
    description: "엘릭서를 얻으려면 엘릭서를 투자해야 하는 법이죠! 수명 시간 동안 8 엘릭서를 생성하며, 시작 카드로 등장하지 않습니다.",
    image: "assets/cards/elixir_collector.png"
  },
  {
    id: "x_bow",
    name: "대형 석궁",
    power: 6,
    cost: 6,
    type: "building",
    rarity: "epic",
    description: "거기 참 멋진 타워네요. 아레나 반대편에서 이 대형 석궁으로 부숴버린다면 기분이 어떨까요?",
    image: "assets/cards/x_bow.png"
  },
  {
    id: "tombstone",
    name: "해골 무덤",
    power: 3,
    cost: 3,
    type: "building",
    rarity: "rare",
    description: "주기적으로 해골 병사를 내보내 적과 싸우게 합니다. 파괴되면 해골 병사 4마리가 나옵니다. 징그럽게시리!",
    image: "assets/cards/tombstone.png"
  },
  {
    id: "furnace",
    name: "용광로",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "rare",
    description: "용광로는 파이어 스피릿을 한 번에 한 마리씩 생성합니다. 팬케이크를 굽기에도 딱이죠.",
    image: "assets/cards/furnace.png"
  },
  {
    id: "goblin_cage",
    name: "고블린 우리",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "rare",
    description: "고블린 우리가 파괴되면 고블린 싸움꾼이 아레나로 풀려납니다! 우락부락 근육질의 고블린 싸움꾼은 하체 운동은 하지 않습니다.",
    image: "assets/cards/goblin_cage.png"
  },
  {
    id: "goblin_drill",
    name: "고블린 드릴",
    power: 4,
    cost: 4,
    type: "building",
    rarity: "epic",
    description: "지하로 이동해 아레나 어디서든 나타날 수 있는 건물입니다. 파괴될 때까지 한 번에 하나씩 고블린을 내보냅니다. 파괴 시 고블린 몇 마리가 나와 주변을 확실하게 찔러봅니다.",
    image: "assets/cards/goblin_drill.png"
  },
  {
    id: "fireball",
    name: "파이어 볼",
    power: 4,
    cost: 4,
    type: "spell",
    rarity: "rare",
    description: "그리고~~~ 파이어 볼! 작은 범위를 불태워 큰 피해를 줍니다. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/fireball.png"
  },
  {
    id: "arrows",
    name: "화살",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "common",
    description: "넓은 지역에 화살을 뿌려, 명중한 모든 적에게 피해를 줍니다. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/arrows.png"
  },
  {
    id: "rage",
    name: "분노 마법",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "epic",
    description: "유닛의 이동 속도 및 공격 속도가 빨라집니다. 건물의 공격 속도 및 유닛 생성 속도도 빨라집니다. 돌겨어어어억!",
    image: "assets/cards/rage.png"
  },
  {
    id: "rocket",
    name: "로켓",
    power: 6,
    cost: 6,
    type: "spell",
    rarity: "rare",
    description: "좁은 지역에 큰 피해를 줍니다. 터지는 모습이 아주 볼만하지요. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/rocket.png"
  },
  {
    id: "goblin_barrel",
    name: "고블린 통",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "epic",
    description: "아레나 어디에든 고블린 세 마리를 배치할 수 있습니다. 아주 짜릿한 여행이 될 거야, 친구들!",
    image: "assets/cards/goblin_barrel.png"
  },
  {
    id: "freeze",
    name: "얼음 마법",
    power: 4,
    cost: 4,
    type: "spell",
    rarity: "epic",
    description: "유닛과 건물에 피해를 주고 꽁꽁 얼려서 움직이거나 공격하지 못하게 합니다. 그대로 멈췃! 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/freeze.png"
  },
  {
    id: "mirror",
    name: "반사경",
    power: 1,
    cost: 1,
    type: "spell",
    rarity: "epic",
    description: "추가로 +1 엘릭서를 더해 마지막으로 사용한 카드를 복제합니다. 시작 카드로 등장하지 않습니다.",
    image: "assets/cards/mirror.png"
  },
  {
    id: "lightning",
    name: "번개 마법",
    power: 6,
    cost: 6,
    type: "spell",
    rarity: "epic",
    description: "목표 지역에서 HP가 가장 높은 적이나 건물을 최대 셋까지 번개로 공격하고 마비시킵니다. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/lightning.png"
  },
  {
    id: "zap",
    name: "감전 마법",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "common",
    description: "좁은 반경 안의 적들을 감전시켜 피해를 주고 잠시 마비시킵니다. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/zap.png"
  },
  {
    id: "poison",
    name: "독 마법",
    power: 4,
    cost: 4,
    type: "spell",
    rarity: "epic",
    description: "효과 범위를 치명적인 독으로 덮어 유닛과 건물에 지속 피해를 줍니다. 잔디에는 해가 없다고 하네요. 확인해보시죠! 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/poison.png"
  },
  {
    id: "graveyard",
    name: "무덤",
    power: 5,
    cost: 5,
    type: "spell",
    rarity: "legendary",
    description: "서프라이즈! 아레나 어디서든지 해골 파티를 여세요!",
    image: "assets/cards/graveyard.png"
  },
  {
    id: "the_log",
    name: "통나무",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "legendary",
    description: "실수로 쏟은 분노 마법이 나무토막을 \"통나무\"로 바꿔버렸습니다. 통나무는 앞을 가로막는 모든 걸 뭉개버리며 굴러갑니다! 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/the_log.png"
  },
  {
    id: "tornado",
    name: "토네이도",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "epic",
    description: "마치 거대한 소용돌이 자석처럼 적들을 가운데로 끌어당기며 피해를 줍니다.",
    image: "assets/cards/tornado.png"
  },
  {
    id: "clone",
    name: "복제 마법",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "epic",
    description: "대상 지역의 모든 아군 유닛을 복제합니다. 복제된 유닛은 HP가 더 적지만, 공격력은 그대로입니다! 건물에는 영향을 주지 않습니다.",
    image: "assets/cards/clone.png"
  },
  {
    id: "earthquake",
    name: "지진 마법",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "rare",
    description: "유닛 및 크라운 타워에 초당 피해를 주며, 특히 건물에 엄청나게 큰 피해를 줍니다! 공중 유닛에는 영향을 미치지 않습니다.",
    image: "assets/cards/earthquake.png"
  },
  {
    id: "barbarian_barrel",
    name: "바바리안 통",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "epic",
    description: "구르며 경로 상의 모든 것에 피해를 주다가, 통이 쪼개지면서 바바리안이 튀어나옵니다! 통에는 대체 어떻게 들어간 걸까요?!",
    image: "assets/cards/barbarian_barrel.png"
  },
  {
    id: "heal_spirit",
    name: "힐링 스피릿",
    power: 1,
    cost: 1,
    type: "swarm",
    rarity: "rare",
    description: "이 말썽꾸러기 스피릿은 적에게 달려들어 피해를 주고, 자신을 희생해 아군의 HP를 회복하는 강력한 치유 마법을 남깁니다!  치유 마법, 여기 잠들다 2017~2020 아아, 거의 보이지 않았던 그대여.",
    image: "assets/cards/heal_spirit.png"
  },
  {
    id: "giant_snowball",
    name: "거대 눈덩이",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "common",
    description: "얼음 골짜기에서 굴러떨어지기 시작한 거대 눈덩이는 아무도 멈출 수 없습니다! 맞은 적들은 뒤로 밀려나며 느려집니다. 크라운 타워에는 비교적 적은 피해를 줍니다.",
    image: "assets/cards/giant_snowball.png"
  },
  {
    id: "royal_delivery",
    name: "로얄 택배",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "common",
    description: "수령 확인 서명은 필요 없습니다!  하늘에서 떨어진 택배 상자가 적 유닛에 광역 피해를 주며, 상자 안에서 로얄 훈련병이 뛰쳐나옵니다!  빈 상자는 정찰용으로도 유용합니다.",
    image: "assets/cards/royal_delivery.png"
  },
  {
    id: "little_prince",
    name: "리틀 프린스",
    power: 4,
    cost: 3,
    type: "ranged",
    rarity: "champion",
    description: "가디언을 호출하여 적을 밀쳐내고 원거리 연사 공격을 가하는 챔피언 유닛.",
    image: "assets/cards/little_prince.png"
  },
  {
    id: "goblinstein",
    name: "고블린슈타인",
    power: 6,
    cost: 5,
    type: "melee",
    rarity: "champion",
    description: "박사와 몬스터가 함께 소환되어 번개 링크로 주변 적들을 감전시키는 챔피언 유닛.",
    image: "assets/cards/goblinstein.png"
  },
  {
    id: "boss_bandit",
    name: "보스 도둑",
    power: 5,
    cost: 4,
    type: "melee",
    rarity: "champion",
    description: "폭탄과 돌진으로 적진을 종횡무진 휘젓는 강력한 보스 도둑.",
    image: "assets/cards/boss_bandit.png"
  },
  {
    id: "void",
    name: "공허",
    power: 3,
    cost: 3,
    type: "spell",
    rarity: "epic",
    description: "대상 수가 적을수록 더욱 치명적인 광선 피해를 쏟아붓는 암흑 마법.",
    image: "assets/cards/void.png"
  },
  {
    id: "goblin_curse",
    name: "고블린 저주",
    power: 2,
    cost: 2,
    type: "spell",
    rarity: "epic",
    description: "범위 내 적들이 쓰러지면 아군 고블린으로 변이시키는 기괴한 저주 마법.",
    image: "assets/cards/goblin_curse.png"
  },
  {
    id: "goblin_demolisher",
    name: "고블린 데몰리셔",
    power: 4,
    cost: 4,
    type: "melee",
    rarity: "rare",
    description: "다이너마이트를 던지다 체력이 낮아지면 적 타워로 자폭 돌진하는 폭파광.",
    image: "assets/cards/goblin_demolisher.png"
  },
  {
    id: "suspicious_bush",
    name: "수상한 덤불",
    power: 3,
    cost: 2,
    type: "fast",
    rarity: "rare",
    description: "덤불 속에 숨어 은밀하게 이동하다가 타워 앞에서 기습 폭발하는 덤불 고블린.",
    image: "assets/cards/suspicious_bush.png"
  },
  {
    id: "goblin_machine",
    name: "고블린 머신",
    power: 6,
    cost: 5,
    type: "tank",
    rarity: "legendary",
    description: "등 뒤의 로켓 발사대로 원거리 폭격을 퍼붓는 거대한 고블린 메카 로봇.",
    image: "assets/cards/goblin_machine.png"
  },
  {
    id: "berserker",
    name: "버서커",
    power: 2,
    cost: 2,
    type: "melee",
    rarity: "common",
    description: "분노에 휩싸여 거침없이 쌍도끼를 휘두르는 광포한 전사.",
    image: "assets/cards/berserker.png"
  },
  {
    id: "spirit_empress",
    name: "스피릿 엠프레스",
    power: 5,
    cost: 4,
    type: "ranged",
    rarity: "legendary",
    description: "원소 정령들의 힘을 지휘하여 전장을 지배하는 신비로운 여제.",
    image: "assets/cards/spirit_empress.png"
  },
];

// 빠른 ID 조회를 위한 카드 맵 (언더스코어 및 하이픈 키 모두 지원)
export const CARD_MAP = {};
CARDS_DATA.forEach(c => {
  if (c.image && !c.image.includes('?')) {
    c.image = `${c.image}?v=20261017_2`;
  }
  CARD_MAP[c.id] = c;
  const hyphenKey = c.id.replace(/_/g, '-');
  CARD_MAP[hyphenKey] = c;
});

/**
 * 무작위 5장 카드 덱 추첨 (중복 방지)
 */
export function getRandomCards(count = 5, excludeIds = []) {
  const available = CARDS_DATA.filter(c => !excludeIds.includes(c.id));
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
