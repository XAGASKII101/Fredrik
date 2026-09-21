import { Command } from '../../lib/commandRegistry.js';

const TRUTHS = [
  'What is the biggest lie you have ever told without getting caught?',
  'What is your most embarrassing childhood memory?',
  'Have you ever pretended to be sick to avoid hanging out with someone?',
  'What is one secret you have never told your closest friend?',
  'What is the weirdest habit you have when you are completely alone?',
];

const DARES = [
  'Send a voice note singing the chorus of your favorite song right now.',
  'Change your WhatsApp status to "I love potatoes" for the next 2 hours.',
  'Send a random emoji to the 3rd person in your recent chats.',
  'Type a sentence with your eyes closed and send it here without editing.',
  'Tell a terrible dad joke in your next voice note.',
];

const JOKES = [
  'Why do programmers prefer dark mode? Because light attracts bugs!',
  'There are 10 types of people in the world: those who understand binary, and those who do not.',
  'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"',
  'Why do Java developers wear glasses? Because they do not C#!',
  'Software developer: An organism that turns coffee into code.',
];

const QUOTES = [
  '“The best way to predict the future is to invent it.” – Alan Kay',
  '“Simplicity is prerequisite for reliability.” – Edsger W. Dijkstra',
  '“First, solve the problem. Then, write the code.” – John Johnson',
  '“Make it work, make it right, make it fast.” – Kent Beck',
];

const EIGHT_BALL_ANSWERS = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes – definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don’t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.',
];

export const gamesCommands: Command[] = [
  {
    name: 'truth',
    description: 'Get a truth question',
    category: 'games',
    execute: async (ctx) => {
      const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
      await ctx.reply(`🎯 *TRUTH:*\n\n_${q}_`);
    },
  },
  {
    name: 'dare',
    description: 'Get a dare challenge',
    category: 'games',
    execute: async (ctx) => {
      const d = DARES[Math.floor(Math.random() * DARES.length)];
      await ctx.reply(`🔥 *DARE:*\n\n_${d}_`);
    },
  },
  {
    name: '8ball',
    description: 'Ask the magic 8-ball a yes/no question',
    category: 'games',
    usage: '8ball Will it rain today?',
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(`🎱 Please ask a question: \`${ctx.prefix}8ball Will I achieve my goals?\``);
        return;
      }
      const ans = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
      await ctx.reply(`🎱 *Magic 8-Ball*\n\n❓ *Question:* ${ctx.text}\n🔮 *Answer:* *${ans}*`);
    },
  },
  {
    name: 'joke',
    description: 'Get a funny joke',
    category: 'games',
    execute: async (ctx) => {
      const j = JOKES[Math.floor(Math.random() * JOKES.length)];
      await ctx.reply(`😄 *Joke:*\n\n${j}`);
    },
  },
  {
    name: 'quote',
    description: 'Get an inspiring quote',
    category: 'games',
    execute: async (ctx) => {
      const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      await ctx.reply(`📜 *Quote of the Moment:*\n\n${q}`);
    },
  },
];
