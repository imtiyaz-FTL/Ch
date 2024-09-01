const { v4: uuidv4 } = require('uuid');

const createUniqueUrls = (noOfPlayers, gameTime) => {
    const protocol = "https";
    const host = "dynamo-chess.vercel.app";
    const urls = [];

    // Generate n/2 unique URLs
    const numberOfUrls = Math.floor(noOfPlayers / 2);

    for (let i = 0; i < numberOfUrls; i++) {
        const inputId = uuidv4();
        const url = `${protocol}://${host}/multiplayer/${inputId}/${gameTime}`;
        urls.push(url);
    }

    return urls;
};

// Example usage:
const noOfPlayers = 6;
const gameTime = 150;
const urls = createUniqueUrls(noOfPlayers, gameTime);

console.log(urls);
