export const COMPUTER_PRICE = 100;
export const EMAIL_PRICE = 50;
export const COMPUTER_GAMES = Object.freeze([
  {id:'boggle',name:'Boggle',icon:'letters',cost:50,url:'https://lucaessey.github.io/Boggle/',description:'Shake up your next word hunt.'},
  {id:'wordventure',name:'Wordventure',icon:'map',cost:50,url:'https://lucaessey.github.io/wordventure/',description:'A little wordplay. A big adventure.'},
  {id:'snake',name:'Snake',icon:'snake',cost:50,url:'https://lucaessey.github.io/phaser-snake/',description:'One more bite. One longer snake.'},
]);
export const newComputer = () => ({owned:false,email:false,games:Object.fromEntries(COMPUTER_GAMES.map(g=>[g.id,false]))});
export function validateComputer(c,basementOwned){
  return !!c && typeof c.owned==='boolean' && typeof c.email==='boolean' && !!c.games && COMPUTER_GAMES.every(g=>typeof c.games[g.id]==='boolean') && (basementOwned||!c.owned) && (c.owned||(!c.email&&COMPUTER_GAMES.every(g=>!c.games[g.id])));
}

// Original, fictional customer notes. Reading never changes simulation state.
export const EMAIL_CATEGORIES = [
  {id:'good',name:'Good Comments',icon:'heart',subtitle:'A little appreciation, fresh from the inbox.',messages:[
    ['Maya','A warm welcome','Your team remembered my usual order and made my rainy afternoon feel sunny.'],
    ['Theo','Perfect crunch','The Crispy Controller had the exact crunch I hoped for. Five stars for the little dipping tray.'],
    ['June','Room for everyone','We could actually walk between the tables with our bags. Such a comfortable lunch spot!'],
    ['Arlo','Quick hands','I watched an employee carry a whole stack without dropping a single snack. Impressive work.'],
    ['Nia','A tiny treasure','The controller keychain is now guarding my house keys. It is doing an excellent job.'],
    ['Kit','New high score','Your arcade turned a quick visit into a brilliant afternoon with my cousins.'],
    ['Sam','Sparkling tables','Our table was cleaned just as we were ready to sit. Thank you to the busy cleanup crew.'],
    ['Ivy','Cheers upstairs','The drinks corner made it easy to grab something cold while our food was being prepared.'],
    ['Owen','Best lunch break','A console meal, a comfy chair and a friendly wave. That is a lunch break done right.'],
    ['Remy','Gift-shop joy','I brought home a souvenir for my little brother. He has been showing it to everyone.'],
    ['Lena','One great team','Even when the queue was long, the staff kept smiling and everything moved smoothly.'],
    ['Ezra','Lunch for the whole party','Our three-item orders all arrived together. Nobody had to watch the rest of the table eat first!'],
    ['Tess','A refreshing stop','The cold drink was exactly what I needed after chasing a new arcade record upstairs.'],
    ['Milo','Worth the elevator ride','We came for takeout and stayed for a console meal. Every floor gave us something new to enjoy.'],
    ['Rosa','Little details','The bright uniforms and tiny hats made my daughter smile before we even ordered.'],
    ['Jules','A proper catch-up','My friend and I had enough room at our table to relax and talk over lunch. We will be back.'],
    ['Ada','Gift mission complete','Found a souvenir and a matching keychain for my best friend. Birthday shopping finished in one visit!'],
    ['Noah','First VR adventure','I finally tried the VR station. I dodged, laughed, and immediately wanted another turn.'],
    ['Suki','A lovely evening','A meal and a glass of wine upstairs made our ordinary Tuesday feel like a special occasion.'],
    ['Leo','Back for another round','Friendly service, crispy food, and a few arcade games afterward. You have become our weekend tradition.'],
  ]},
  {id:'funny',name:'Bad Reviews',icon:'controller',subtitle:'Not every visit earns five stars.',messages:[
    ['Max','Missing instructions','My controller meal has no instruction booklet. How do I unlock the extra-crispy level?'],
    ['Pip','Suspiciously short straw','My drink ran out before my story did. Please investigate this terrible timing.'],
    ['Alex','Unfair competition','The arcade machine keeps beating me. I demand that it attend a sportsmanship workshop.'],
    ['Bo','Emergency keychain','My new keychain looks delicious. Please add a tiny sign reminding me it is not a snack.'],
    ['Cleo','Couch conspiracy','I sat down for one minute and my legs forgot their job. Your furniture may be too comfy.'],
    ['Drew','Extra buttons','I counted the buttons on my lunch three times. None of them pause my homework.'],
    ['Finn','Sneaky souvenir','I bought one gift and somehow left with three. I suspect the shelves are charming me.'],
    ['Zoe','Plant rivalry','One basement plant looks greener than the other. Please settle their competition peacefully.'],
    ['Ash','A heroic fry','A crumb landed on my shirt in the shape of a crown. Am I the ruler of lunch now?'],
    ['Lou','Elevator dilemma','I cannot decide which floor smells best. Please install a very scientific snack compass.'],
    ['Bea','Tiny cleaning crew','The table was cleaned before I could photograph my artistic crumb arrangement. My exhibition is ruined.'],
    ['Gus','A lukewarm lunch','My food had cooled down by the time I sat down. Next time I would love it fresh and hot.'],
    ['Wren','Still in line','The queue took longer than I expected, and my lunch break nearly ended before lunch began.'],
    ['Otis','No clean table','I had my meal ready but could not find a clean table. Please give the cleanup crew a hand.'],
    ['Elle','A thirsty wait','My food was ready ages before my drink. Eating a whole crispy controller without a sip was hard work.'],
    ['Rory','Empty shelf blues','I went upstairs for a souvenir, but the shelf I wanted was empty. Bad timing for my shopping trip.'],
    ['Dina','A bit too crispy','My lunch crunched so loudly that I missed half of my friend\'s story. A little less frying, please.'],
    ['Cole','One crowded corner','Everyone wanted the same arcade machine. I spent more time waiting for a turn than playing.'],
    ['Fern','A wobbly arrival','My drink arrived with a splash on the tray. Please take those corners a little more carefully.'],
    ['Hugo','Where is my last item?','Two snacks arrived, but I had to wait for the third. Our table would rather start eating together.'],
  ]},
].map(category=>({...category,messages:category.messages.map(([from,subject,body],id)=>({id,from,subject,body}))}));
