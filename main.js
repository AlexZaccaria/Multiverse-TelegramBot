'use strict'

// Admin Commands:
// + FR (fast reply)
//      > Usage: fr hello, fr (#user) hello
// + LIST
//      > Usage: list
// + QUIT
//      > Usage: quit

// please, modify those two pars
const ADMIN_NICKNAME = "";
const APP_TOKEN = "";
// please, modify those two pars

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
const tg = new Telegram.Telegram(APP_TOKEN);

let IDClients = {};
let Clients = new Array();
let AdminID = -1;
let LastIDToAdmin = -1;

class AdminQuit extends TelegramBaseController 
{
    quitHandler($) 
    {
        for (let id of Clients) 
            tg.api.sendMessage(id, "Sto terminando l'esecuzione...");
        
        setTimeout(function(){ process.exit(0); }, 3000);
    }
    
    get routes() 
    {
        return {
            'quit': 'quitHandler'
        }
    }
}

class AdminReply extends TelegramBaseController 
{
    replyHandler($) 
    {
        let query = $.query;
        while (query[0] === " ")
            query = query.slice(1);
        
        let queryparts = query.split(" ");
        let id = queryparts.shift();
        let txt = queryparts.join(" ");
        
        if (isNaN(id) || Clients[id] === undefined)
        {
            id = LastIDToAdmin;
            txt = query;
        }
        else
            id = Clients[id];
        
        tg.api.sendMessage(id, txt);
    }
    
    get routes() 
    {
        return {
            'fr': 'replyHandler'
        }
    }
}

class AdminList extends TelegramBaseController 
{
    listHandler($) 
    {
        for (let id of Clients) 
            tg.api.sendMessage(AdminID, "[" + IDClients[id].Index + "] " + "[" + IDClients[id].LastTime + "] <" + IDClients[id].FullFrom + ">: " + IDClients[id].LastText);
    }
    
    get routes() 
    {
        return {
            'list': 'listHandler'
        }
    }
}

class GenericHandler extends TelegramBaseController 
{
    handle($) 
    {
        let msg = $._update._message;
        let txt = msg._text;
        let from = msg._from._firstName + " " + msg._from._lastName + " (" + msg._from._username + ")";
        let id = msg._from._id; id = id.toString();
        
        if (msg._from._username === ADMIN_NICKNAME && AdminID === -1)
        {
            AdminID = id;
            $.sendMessage("Sei stato autorizzato come Admin! 🙂");
        }
        
        if (IDClients[id] === undefined)
        {
            IDClients[id] = { Index: Clients.length, FullFrom: from, HasFeedback: false };
            Clients.push(id);
        }
        
        let MyDate = Date().toString().split(" ");
        IDClients[id].LastText = txt;
        IDClients[id].LastTime = MyDate[4] + " " + MyDate[2] + "/" + MyDate[1] + "/" + MyDate[3];
        
        LastIDToAdmin = id;
        $.sendMessage("Hai scritto all'admin: "+IDClients[id].LastText);
        
        if (!IDClients[id].HasFeedback)
        {
            IDClients[id].HasFeedback = true;
            $.sendMessage("I messaggi verranno inviati all'admin, per cui l'insulto è gratuito!");
            $.runInlineMenu(
            {
                layout: 2, //some layouting here
                method: 'sendMessage', //here you must pass the method name
                params: ['Ti piace la demo?'], //here you must pass the parameters for that method
                menu: 
                [
                    {
                        text: 'Si', //text of the button
                        callback: (callbackQuery) => 
                        {
                            $.sendMessage("Si? Bravo, ora fuori dai coglioni!");
                        }
                    },
                    {
                        text: 'No',
                        callback: (callbackQuery) => 
                        {
                            $.sendMessage("NO?!?!? E allora muori!");
                        }
                    }
                ]
            })
        }
        
        tg.api.sendMessage(AdminID, "[" + IDClients[id].Index + "] " + "[" + IDClients[id].LastTime + "] <" + IDClients[id].FullFrom + ">: " + IDClients[id].LastText);
    }
}

tg.router
    .when('fr', new AdminReply())
    .when('list', new AdminList())
    .when('quit', new AdminQuit())
    .otherwise(new GenericHandler());