var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
}); 

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.onDefault([
    function (session, args, next) {
        
        if (!session.userData.player1) {
            session.beginDialog('/player1name');
        } else {
            next();
        }
    },
    function (session, args, next) {
        if (!session.userData.player2) {
            session.beginDialog('/player2name');
        } else {
            next();
        }
    },
    function (session, args, next) {
        if (!session.userData.startingscore  || session.userData.player1requires === undefined) {
            session.beginDialog('/startingscore');
        } else {
            next();
        }
    },
    function (session, args, next) {
        if (!session.userData.goingFirst) {
            session.beginDialog('/throwfirst');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send("Hello %s and %s", session.userData.player1, session.userData.player2);
        session.send("We are playing a game of %s", session.userData.startingscore);
        session.send("Lets play Darts!");
        session.send("%s to throw first", session.userData.goingFirst);
        session.beginDialog('/throw');
    }
]);

bot.dialog('/player1name', [
    function (session) {
        builder.Prompts.text(session, 'What is player 1\'s name');
    },
    function (session, results) {
        session.userData.player1 = results.response;
        session.endDialog();
    }
]);

bot.dialog('/player2name', [
    function (session) {
        builder.Prompts.text(session, 'What is player 2\'s name');
    },
    function (session, results) {
        session.userData.player2 = results.response;
        session.endDialog();
    }
]);

bot.dialog('/startingscore', [
    function (session) {
        builder.Prompts.choice(session, "What score are you starting from?", "701|501|301");
    },
    function (session, results) {
        session.userData.startingscore = results.response.entity;
        session.userData.player1requires = session.userData.startingscore;
        session.userData.player2requires = session.userData.startingscore;
        session.endDialog();
    }
]);

bot.dialog('/throwfirst', [
    function (session) {
        builder.Prompts.choice(session, "Who is going to throw first?", session.userData.player1 + "|" + session.userData.player2);
    },
    function (session, results) {
        session.userData.goingFirst = results.response.entity;
        session.userData.inplay = 1;
        session.endDialog();
    }
]);

bot.dialog('/throw', [
    function (session) {
        if(session.userData.inplay === 1)
        {
            session.send('%s you require %s', session.userData.player1, session.userData.player1requires);    
        }
        else
        {
            session.send('%s you require %s', session.userData.player2, session.userData.player2requires);
        }
        builder.Prompts.number(session, "What did you score?");
    },
    function (session, results) {
        if(session.userData.inplay === 1)
        {
            session.userData.player1requires -= results.response;
            session.userData.inplay = 2;  
        }
        else
        {
            session.userData.player2requires -= results.response;;
            session.userData.inplay = 1;
        }
        session.beginDialog('/throw');        
    }
]);