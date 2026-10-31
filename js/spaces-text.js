// The words of the three anime spaces (js/spaces.js), Oct 31 2026.
// The story chapters are written for the archive from the shows themselves (checked against Wikipedia's
// episode and arc lists). Anything in `his` is his own, copied word for word from his notes (Anime Journey.md,
// MY ANIME WATCH LIST.md, Manga Tracker.md); his full reviews come from the shelf at runtime.
// Spoilers stop where he stops: Violet = the 13 episodes (no film), Re:Zero = Season 4 (arc 6),
// Omniscient Reader = only the opening of the story; everything past his chapter stays behind the Fourth Wall.
// Pictures are indexes into data/spaces.json pins (his Pinterest boards, in board order).

export const SPACES={

/* ================================================================ Violet Evergarden */
violet:{
 board:'violet-evergarden',title:'Violet Evergarden',shelf:['anime','Violet Evergarden'],
 kicker:'A story told in letters',hook:'A girl who was raised as a weapon learns what three words mean, one letter at a time.',
 cover:1,
 open:{to:'To whoever opens this',from:'CH Postal Company · Leiden'},
 chapters:[
  {n:'I',t:'A weapon, given a name',pic:20,
   p:['Before she had a name, she was a child with no words, found in the war and handed to a young officer like a tool. The officer was Major Gilbert Bougainvillea, and he refused to treat her like one.',
      'He named her after a flower. He taught her to read and write. In a shop window she stared at an emerald brooch the colour of his eyes, and he bought it for her.',
      'She followed his orders, and only his. In the last battle of the war she lost both arms trying to reach him. The last thing he said to her was <em>I love you</em>, and she did not know what it meant.']},
  {n:'II',t:'The CH Postal Company',pic:1,
   p:['When the war ends, his friend Claudia Hodgins brings her to Leiden, to a small postal company, and to new silver arms.',
      'There she meets the Auto Memory Dolls: women who write letters for people who cannot find the words, or cannot write at all. They listen, and they turn feelings into paper.',
      'Violet asks to become one. Not for the work. For those three words. If she writes enough letters for other people, maybe one day she will understand what he meant.']},
  {n:'III',t:'Letters that are too honest',pic:9,
   p:['Her first letters are reports. She writes exactly what she is told, never what is meant. Clients leave angry; Erica and Iris don\'t know what to make of her.',
      'At the Dolls\' school she cannot pass, until she writes a short letter for her friend Luculia, to a brother who came home from the war and never really came back: <em>I\'m glad you are alive.</em> It is a few lines long. It is the first letter she writes that is true.',
      'Then Iris\'s family. Then a princess and a prince who were engaged for peace, who end up writing their own love letters once Violet shows them how.']},
  {n:'IV',t:'Comets and parasols',pic:12,
   p:['At an observatory she copies old books beside Leon, a boy who believes love only leaves you behind. Together they watch a comet that comes once every two hundred years, and he decides to go and look for the people he lost.',
      'A playwright drinks in an empty house and cannot finish the play he started for his daughter, Olivia. She wanted to walk across the lake with her parasol. Violet takes the parasol and runs across the leaves on the water for him, so he can see it once.',
      'Every letter she writes leaves something with her. She is starting to feel things, and she does not like what she is finding.']},
  {n:'V',t:'Burning',pic:2,
   p:['She learns the Major is not coming back.',
      'And as she finally understands the people in her letters, she understands the people she took from them: every soldier she killed had someone waiting for a letter that will never come. Feeling arrives all at once, and it burns.',
      'She stops. Then letters arrive for her, from Erica and Iris, people she once wrote for. She reads them, and picks the work back up. She cannot undo what she did. She can still carry words to someone.']},
  {n:'VI',t:'Fifty birthdays',pic:0,
   p:['A mother who is dying hires Violet for seven days. Her little girl, Anne, thinks the Doll is taking her mother\'s last days away and hates every hour of it.',
      'They are writing letters: one for each of Anne\'s birthdays, for the next fifty years.',
      'After the mother is gone, the first one is delivered. Then another, year after year, until Anne is grown and has her own children, still receiving her mother\'s voice on every birthday. It is the episode everyone remembers.']},
  {n:'VII',t:'I don\'t want anybody else to die',pic:14,
   p:['In a country still at war, a young soldier, Aidan, is dying in a forest. Violet parachutes in to reach him and takes his last letters: to his parents, and to Maria, the girl he never told.',
      'She cannot save him. She can make sure his words get home. When she delivers them, she cries for the first time where anyone can see it.']},
  {n:'VIII',t:'The bridge',pic:10,
   p:['A train carries the peace treaty across the border, and rebels try to stop it. Violet fights again, but this time she will not kill. She takes the blows instead. Her arms break apart, one, then the other, while she pulls the bombs off a bridge.',
      'The treaty is signed. The war is finally over, for everybody, including her.']},
  {n:'IX',t:'Auto Memory Doll and “I love you”',pic:15,
   p:['Leiden brings back an old festival: letters thrown from planes, falling over the city, for anyone who has someone they could never write to.',
      'Violet writes one too. It is the letter she could not have written at the start: to the Major. She finally knows what he meant, and she finally knows she feels it too.',
      'The girl who was raised as a weapon became the person who carries other people\'s words. That is the whole story, and it is enough.']}
 ],
 his:{title:'My letter',lines:[
  'I did not expect a 13-episode anime to end up this high on my list, but here we are.',
  'She impressed me as a character from the very first episode, and I learned a lot from her and felt motivated to be a better person.'
 ]},
 cards:[
  {id:'VE-01',name:'Violet Evergarden',kind:'Leader',pic:1,cost:5,power:5000,rare:'L',type:'Auto Memory Doll / CH Postal',fx:'[Your Turn] When you write a letter, draw 1 card. [Once Per Turn] Name a feeling: this Leader understands it until the end of the game.',ch:1},
  {id:'VE-02',name:'The Major\'s Brooch',kind:'Item',pic:19,cost:1,power:null,rare:'R',type:'Gift / Emerald',fx:'[Trigger] Give your Leader +1000 power. It reminds her of his eyes.',ch:0},
  {id:'VE-03',name:'Gilbert\'s Last Words',kind:'Event',pic:20,cost:2,power:null,rare:'SR',type:'War / Memory',fx:'[Main] Look at your whole deck. Choose one card. You won\'t understand it yet. Keep it anyway.',ch:0},
  {id:'VE-04',name:'Too Honest',kind:'Event',pic:9,cost:1,power:null,rare:'C',type:'Letter',fx:'[Main] Your opponent reveals their hand. Then you both feel a little awkward.',ch:2},
  {id:'VE-05',name:'Across the Lake',kind:'Event',pic:12,cost:3,power:null,rare:'SR',type:'Letter / Parasol',fx:'[Main] One Character with a wish that never came true may finally act. Return it to the bottom of the deck, smiling.',ch:3},
  {id:'VE-06',name:'Alley\'s Comet',kind:'Stage',pic:8,cost:2,power:null,rare:'R',type:'Observatory',fx:'Once every two hundred turns: untap everything you love.',ch:3},
  {id:'VE-07',name:'Burning',kind:'Event',pic:2,cost:4,power:null,rare:'R',type:'War / Memory',fx:'[Counter] Take the damage instead of your Character. Then draw a letter from someone you once wrote for.',ch:4},
  {id:'VE-08',name:'Fifty Letters',kind:'Event',pic:0,cost:5,power:null,rare:'SEC',type:'Letter / Mother',fx:'[Main] Put 50 cards face down under this card. At the start of each of your birthdays, reveal one.',ch:5},
  {id:'VE-09',name:'The Silver Arms',kind:'Character',pic:10,cost:4,power:6000,rare:'SR',type:'Auto Memory Doll',fx:'[Blocker] [Once Per Turn] When she blocks, she takes the hit and nobody dies.',ch:7},
  {id:'VE-10',name:'Auto Memory Doll and “I love you”',kind:'Event',pic:15,cost:7,power:null,rare:'SEC',type:'Letter / Air Show',fx:'[Main] Every player reads the letter they never sent. Then the war is over.',ch:8}
 ]
},

/* ================================================================ Re:Zero */
rezero:{
 board:'re-zero',title:'Re:Zero',full:'Re:Zero − Starting Life in Another World',shelf:['anime','Re:Zero'],
 kicker:'Return by Death',hook:'A boy with no power at all, and a curse that brings him back every time he dies. Nobody else remembers.',
 cover:8,
 chapters:[
  {n:'0',t:'Walking out of a convenience store',pic:46,arc:'Prologue',
   p:['Natsuki Subaru is seventeen, a shut-in in a tracksuit with a bag of snacks. He walks out of a convenience store at night and steps into a busy street in another world.',
      'No summoning circle. No goddess. No power. Three thugs corner him in an alley in the first hour, and a silver-haired girl saves him while she is chasing something stolen from her. She gives him a fake name.',
      'He dies before the day is out. Then he opens his eyes in the street, holding the same bag of snacks, at the moment he arrived.']},
  {n:'1',t:'The loot house',pic:3,arc:'Arc 1 · The capital',
   p:['A slum, a stolen badge, a thief named Felt, an old giant named Rom, and a woman in black who opens people up with a curved knife. Elsa kills him. He comes back. She kills him again.',
      'He learns the rule the hard way: when he dies, time goes back to a fixed point, and only he remembers. And he can never tell anyone. When he tries, the world stops, and a black hand closes around his heart.',
      'On the third try he gets it right, with the help of Reinhard, the Sword Saint. He saves the girl, and finally hears her real name: Emilia.'],death:'Elsa was waiting in the dark.'},
  {n:'2',t:'The mansion',pic:20,arc:'Arc 2 · Roswaal\'s mansion',
   p:['He wakes up as a servant in the mansion of a clown-faced margrave, working beside twin maids, Ram and Rem. Behind any door in the house, a little girl in a library of forbidden books calls him rude and drains his mana.',
      'Then he dies in his sleep. Then he is killed with a morning star, by Rem, who smells the witch on him. To the twins, he is the danger.',
      'He loops until he breaks through: a curse, a forest of mabeasts, a village of children. When Rem goes berserk to protect him, he tells her that he wants her alive. She falls for him there, in the forest, and he does not notice.'],death:'Rem could smell the Witch on him.',door:true},
  {n:'3',t:'From zero',pic:7,arc:'Arc 3 · The royal selection',
   p:['Emilia is one of five candidates to become the next ruler of the kingdom. Subaru bursts into the selection uninvited and embarrasses her. Julius, a knight, beats him in front of everyone. Emilia leaves him behind.',
      'Then the Witch Cult comes. Petelgeuse, the Archbishop of Sloth, takes everything. Rem dies for him. He loops again and again, and each time it gets worse.',
      'At his lowest, he begs Rem to run away with him. She refuses, and tells him who he is to her, until he can stand again. He chooses to start over from zero. With Crusch, Wilhelm and Julius, he fights the White Whale and the Cult, and wins.',
      'Then Gluttony eats Rem\'s name. Everyone forgets she ever lived, except him.'],death:'He tried to run.'},
  {n:'4',t:'The Sanctuary',pic:41,arc:'Arc 4 · The Sanctuary',
   p:['A barrier-locked refuge for half-bloods, a guardian named Garfiel, and a tomb with three trials: face your past, face your present, face the futures you are afraid of.',
      'In a dream of a meadow, the Witch of Greed, Echidna, pours him tea and offers him everything: someone to share his deaths with. He almost takes it.',
      'In the mansion, Beatrice has waited four hundred years in her library for “that person”, the one her book promised. He tells her to stop waiting for someone else and to choose him. She does. And Emilia, at last, faces her past and passes the trial.'],death:'He looked into the future.'},
  {n:'5',t:'The water city',pic:43,arc:'Arc 5 · Priestella',
   p:['A city of canals and music, and four Archbishops of the Witch Cult at once: Greed, Wrath, Lust and Gluttony. They take the city\'s floodgates and its people.',
      'Subaru cannot win with strength, so he wins with words, with friends, with a microphone on the city\'s broadcast. Reinhard ends Greed.',
      'And Julius, the knight who once beat him in front of everyone, loses his name to Gluttony. The whole world forgets him. Subaru remembers him, and stands next to him.']},
  {n:'6',t:'The watchtower',pic:17,arc:'Arc 6 · The Pleiades Watchtower',
   p:['Across the sand of the Auguria Dunes stands a tower where a girl named Shaula has waited four hundred years for her master. She decides the master is Subaru.',
      'Inside, the tower tests everyone, and Subaru loses his memories. He wakes up as the boy from the convenience store, surrounded by people who love someone called Natsuki Subaru, and he has to find out who that is.',
      'He finds it. Shaula keeps her promise to the tower, and Subaru keeps his to her, all the way to the end.',
      'And at the end, Rem opens her eyes. She doesn\'t know who he is. He tells her: her hero.']}
 ],
 his:{title:'Fine. One more try.',lines:[
  'Re:Zero reminded me that courage is not always looking fearless.',
  'Sometimes courage is being completely destroyed and still saying:',
  'Fine. One more try.'
 ]},
 cards:[
  {id:'RZ-01',name:'Natsuki Subaru',kind:'Leader',pic:8,cost:5,power:5000,rare:'L',type:'Emilia Camp / Knight',fx:'[Return by Death] When this Leader would be K.O.\'d, return to the start of the turn. Only you remember what happened.',ch:0},
  {id:'RZ-02',name:'Emilia',kind:'Character',pic:47,cost:5,power:6000,rare:'SR',type:'Emilia Camp / Half-elf',fx:'[On Play] Freeze up to 1 of your opponent\'s Characters. [Your Turn] She faces her past: draw 1 card.',ch:1},
  {id:'RZ-03',name:'Rem',kind:'Character',pic:27,cost:4,power:6000,rare:'SR',type:'Emilia Camp / Oni',fx:'[Blocker] When Subaru is attacked, she goes first. If no one remembers her, she still counts.',ch:2},
  {id:'RZ-04',name:'Beatrice',kind:'Character',pic:6,cost:3,power:3000,rare:'SR',type:'Emilia Camp / Great Spirit',fx:'[Door Crossing] Play from any door. [Contract] If you chose her, she will never be alone again, I suppose.',ch:'door'},
  {id:'RZ-05',name:'From Zero',kind:'Event',pic:7,cost:3,power:null,rare:'SEC',type:'Promise',fx:'[Main] Return every card in your trash to your deck. Start over. This time it\'s different.',ch:3},
  {id:'RZ-06',name:'Garfiel Tinsel',kind:'Character',pic:38,cost:4,power:7000,rare:'R',type:'Emilia Camp / Sanctuary',fx:'[Rush] The strongest shield of the Sanctuary. +1000 when he says so himself.',ch:4},
  {id:'RZ-07',name:'Julius Juukulius',kind:'Character',pic:13,cost:5,power:6000,rare:'R',type:'Knight / Forgotten',fx:'[Once Per Turn] Even if nobody remembers his name, this card stays on the field.',ch:5},
  {id:'RZ-08',name:'The Witch\'s Hands',kind:'Event',pic:25,cost:6,power:null,rare:'SR',type:'Curse',fx:'[Main] If you speak of Return by Death, take 1 damage and nobody hears you.',ch:1},
  {id:'RZ-09',name:'The Emilia Camp',kind:'Stage',pic:15,cost:2,power:null,rare:'C',type:'Camp',fx:'Every Character with “Emilia Camp” gets +1000. They feel real, and easy to love.',ch:4},
  {id:'RZ-10',name:'Her Hero',kind:'Event',pic:16,cost:7,power:null,rare:'SEC',type:'Watchtower',fx:'[Main] A Character who forgot everything wakes up. Introduce yourself again.',ch:6}
 ]
},

/* ================================================================ Omniscient Reader's Viewpoint */
orv:{
 board:'omniscient-readers-viewpoint',title:'Omniscient Reader\'s Viewpoint',shelf:['manga','Omniscient Reader'],
 kicker:'The Fourth Wall',hook:'The only reader of a novel nobody else read, the day it starts coming true.',
 cover:11,
 chapters:[
  {n:'1',t:'The only reader',pic:11,
   p:['For more than ten years, an office worker named Kim Dokja read a web novel nobody else read: <em>Three Ways to Survive in a Ruined World</em>, 3,149 chapters long.',
      'On the night it ends, the author sends him a message. A thank-you. And, apparently, the story itself.'],sys:'[You have read the final chapter.]'},
  {n:'2',t:'The first scenario',pic:29,
   p:['He is on the subway when the train stops. A small creature appears in the carriage, a dokkaebi, and announces a game.'],
   window:{h:'Main Scenario #1 · Proof of Value',rows:[['Category','Main'],['Difficulty','F'],['Clear condition','Kill one or more living organisms.'],['Time limit','30 minutes'],['Reward','300 coins'],['Failure','Death']]},
   p2:['Everyone in the carriage panics. Kim Dokja does not. He has read this scene before.']},
  {n:'3',t:'The protagonist',pic:6,
   p:['Every novel has a protagonist. This one is Yoo Joonghyuk: the regressor, the strongest, the one the whole story follows, living his life again from the beginning.',
      'Kim Dokja knows him better than anyone alive, his past, his habits, his next move. Yoo Joonghyuk does not know Kim Dokja exists. That is about to change.']},
  {n:'4',t:'Companions',pic:4,
   p:['He was never supposed to be in the story. So he survives by reading it: who will be useful, who will betray whom, who dies where, and how to stop it.',
      'Around him gathers a party that the novel never planned: Yoo Sangah, his colleague from the office; Lee Hyunsung, a soldier as solid as steel; Lee Gilyoung, a boy who talks to insects; Jung Heewon, who will judge the wicked.']},
  {n:'5',t:'The constellations are watching',pic:21,
   p:['Above the scenarios, beings called constellations watch like an audience, with titles instead of names. They send coins to the ones they like. They comment.'],
   msgs:['[The constellation \'Demon-like Judge of Fire\' is watching you.]','[The constellation \'Secretive Plotter\' is curious about you.]','[The constellation \'Abyssal Black Flame Dragon\' is interested in your words.]','[100 coins have been sponsored.]']},
  {n:'6',t:'Omniscient Reader\'s Viewpoint',pic:0,
   p:['His skill is reading itself. He can look into the characters he read about and see what they think. And somewhere in his mind there is a wall, between him and the story, that keeps him himself.',
      'He calls it the Fourth Wall. It decides what he is allowed to know.']}
 ],
 // after these, the Fourth Wall: nothing past his chapter is written here
 his:{title:'My notes',lines:[
  'I have been bingeing this one, and it is one of the peakest manga I have ever read in my life. The story depth, the story connections, and the story system are all really good, and the theme is very refreshing. It is not like any recycled material.',
  'Kim Dokja is really one of the best characters I have seen. I will personally write a character introduction for him once I reach chapter 100.',
  'The main character is not similar to Luffy, but he has a really good personality mix between Luffy and Zoro. I really like how adaptable he is.'
 ]},
 cards:[
  {id:'ORV-01',name:'Kim Dokja',kind:'Leader',pic:11,cost:5,power:5000,rare:'L',type:'Reader / Incarnation',fx:'[Omniscient Reader\'s Viewpoint] Look at your opponent\'s hand. You have read this before.',ch:0},
  {id:'ORV-02',name:'Proof of Value',kind:'Event',pic:29,cost:1,power:null,rare:'C',type:'Main Scenario #1',fx:'[Main] K.O. one or more living organisms. Time limit: 30 minutes. Reward: 300 coins.',ch:1},
  {id:'ORV-03',name:'Yoo Joonghyuk',kind:'Character',pic:6,cost:7,power:9000,rare:'SR',type:'Regressor / Protagonist',fx:'[Rush] If this card is K.O.\'d, it comes back at the beginning of the story, stronger.',ch:2},
  {id:'ORV-04',name:'Kim Dokja\'s Company',kind:'Stage',pic:4,cost:3,power:null,rare:'R',type:'Party',fx:'Characters the story never planned get +1000.',ch:3},
  {id:'ORV-05',name:'Constellations Are Watching',kind:'Event',pic:21,cost:2,power:null,rare:'R',type:'Star Stream',fx:'[Main] Gain 100 coins for every constellation that found you interesting this turn.',ch:4},
  {id:'ORV-06',name:'The Fourth Wall',kind:'Stage',pic:15,cost:0,power:null,rare:'SR',type:'Exclusive Skill',fx:'Some cards cannot be read yet. They are still yours.',ch:5},
  {id:'ORV-07',name:'Han Sooyoung',kind:'Character',pic:2,cost:5,power:6000,rare:'SR',type:'Incarnation',fx:'Sealed behind the Fourth Wall until he reads further.',ch:null,sealed:true},
  {id:'ORV-08',name:'The Star Stream',kind:'Event',pic:24,cost:6,power:null,rare:'SEC',type:'Scenario',fx:'[Main] Every story becomes a scenario. Read on to unlock.',ch:null,sealed:true}
 ]
}
};
