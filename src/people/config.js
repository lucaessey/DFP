// Public Firebase web-app identifiers, read from DFP game's existing app configuration.
// Access is enforced by Firebase rules; the game contains no administrative credential.
export const firebaseConfig={
  apiKey:'AIzaSyBotqLSdu7cxTiXjRp5XUIKEjaQITwP78o',
  authDomain:'dfp-game-e2926.firebaseapp.com',
  databaseURL:'https://dfp-game-e2926-default-rtdb.firebaseio.com',
  projectId:'dfp-game-e2926',
  appId:'1:531541340277:web:86f49995e07b03db47c83c',
  messagingSenderId:'531541340277'
};
export const useEmulators=import.meta.env.MODE==='test-comments'&&['localhost','127.0.0.1'].includes(location.hostname);
export const databaseURL=useEmulators?'http://127.0.0.1:9000':firebaseConfig.databaseURL;
// The game lives below /DFP/; the domain root is the separate game collection.
// Use the canonical www host so the session returns to the same site as the game.
// Keep authDomain on Firebase: GitHub Pages does not serve Firebase's /__/auth helpers.
export const returnURL=useEmulators?location.origin+'/':'https://www.deepfriedpixels.com/DFP/';
