interface StoryCondition {
  day?: number;
  answer?: string[];
  money?: number;
  valuation?: number;
}

interface Story {
  text: string;
  conditions: StoryCondition;
  options: {text: string, money: number, valuation: number, reputation: number}[];
}

export const stories: Story[] = [
  { // 0
    text: 'You hit your desk in anger and found the previous owner\'s cache.',
    conditions: {},
    options: [{
      text: 'Yay!',
      money: 10000, valuation: 0, reputation: 0,
    }]
  },
  { // 1
    text: 'You received a check from the Startup Support Fund with the note: "Thank you for supporting the game!"',
    conditions: {},
    options: [{
      text: 'Nice!',
      money: 5000, valuation: 50000, reputation: 1,
    }]
  },
  { // 2
    text: 'You found a weird folder in your stuff from the previous job. It seems like it is business analytics.',
    conditions: {day: 2},
    options: [{
      text: 'Research',
      money: 0, valuation: 0, reputation: 0,
    }, {
      text: 'Ignore',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
  { // 3
    text: 'In papers, you found the record with today\'s date and hint to buy stocks.',
    conditions: {day: 3, answer: ['2.0']},
    options: [{
      text: 'Why not',
      money: 0, valuation: 0, reputation: 0,
    }, {
      text: 'Boring',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
  { // 4
    text: 'In the news, you saw that the share price went up a lot.',
    conditions: {day: 3, answer: ['3.0']},
    options: [{
      text: 'Wow!',
      money: 1000, valuation: 0, reputation: 0,
    }]
  },
  { // 5
    text: 'In the news, you saw that the share price went up a lot.',
    conditions: {day: 3, answer: ['3.1']},
    options: [{
      text: 'Hm....',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
  { // 6
    text: 'The folder contains information about a major merger.',
    conditions: {day: 4, answer: ['4.0', '5.0', 'or']},
    options: [{
      text: 'Sell it!',
      money: 2500, valuation: 0, reputation: 0,
    }, {
      text: 'Ok...',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
  { // 7
    text: 'You started to notice that someone is watching you.',
    conditions: {day: 5, answer: ['6.0']},
    options: [{
      text: 'Creepy',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
  { // 8
    text: 'The folder with the documents was stolen.',
    conditions: {day: 5, answer: ['6.1', '2.1', 'or', '3.1', 'or']},
    options: [{
      text: 'Police!',
      money: 0, valuation: 0, reputation: 0,
    }]
  },
];
