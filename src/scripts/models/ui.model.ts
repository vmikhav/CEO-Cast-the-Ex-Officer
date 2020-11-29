
export type UiColor = 'white'|'yellow'|'green'|'red'|'blue';

export const uiTileSize = 16;

export const colorOffset: Record<UiColor, number> = {
  white: 0,
  yellow: 3,
  green: 6,
  red: 9,
  blue: 12,
};

export const buttonType = {
  'volumed': {normal: 0, pressed: 3, colored: true},
  'flat': {normal: 30, pressed: 33, colored: true},
  'flat_wide': {normal: 63, pressed: 93, colored: true},
  'outline': {normal: 243, pressed: 273, colored: true},
  'stone_light': {normal: 480, pressed: 510, colored: false},
  'stone_dark': {normal: 483, pressed: 513, colored: false},
  'wood': {normal: 486, pressed: 516, colored: false},
  'paper': {normal: 489, pressed: 519, colored: false},
  'transparent': {normal: 360, pressed: 360, colored: false},
}

export const panelType = {
  'flat': {normal: [60, 90, 123], shadowed: [60, 90, 120], colored: true},
  'flat_wide': {normal: [150, 180, 210], shadowed: [0, 0, 0], colored: true},
  'outline': {normal: [240, 270, 303], shadowed: [240, 270, 300], colored: true},
  'dotted': {normal: [403, 433, 463], shadowed: [0, 0, 0], colored: 'header', colorOffset: 1},
  'paper_light': {normal: [390, 420, 450], shadowed: [0, 0, 0], colored: false},
  'stone_light': {normal: [540, 570, 630], shadowed: [540, 570, 600], colored: false},
  'stone_dark': {normal: [543, 573, 633], shadowed: [543, 573, 603], colored: false},
  'wood': {normal: [546, 576, 636], shadowed: [546, 576, 606], colored: false},
  'paper': {normal: [549, 579, 639], shadowed: [549, 579, 609], colored: false},
  'paper_light_inset': {normal: [870, 900, 930], shadowed: [0, 0, 0], colored: false},
  'stone_dark_inset': {normal: [873, 903, 933], shadowed: [0, 0, 0], colored: false},
  'wood_inset': {normal: [876, 906, 936], shadowed: [0, 0, 0], colored: false},
  'paper_inset': {normal: [879, 909, 939], shadowed: [0, 0, 0], colored: false},
}
