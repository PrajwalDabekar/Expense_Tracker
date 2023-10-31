const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const port = 80;
const app = express();
let alert = require("alert");
const d = new Date();

mongoose.connect("mongodb://localhost:27017/expensetracker",{useNewUrlParser:true});

let uid = ""

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
//session middleware
const oneDay = 1000 * 60 * 60 * 24;

app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: true
}));

var session;

const expenseSchema = new mongoose.Schema({
    expense:{
        type:Number,
        require:true
    },
    description:{
        type:String,
        require:true
    }
})

const loginSchema = new mongoose.Schema({
    user:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    balance:Number,
    transaction:[expenseSchema]
})

const login = new mongoose.model('loginnew',loginSchema);


function login_check(req,res,id,pass){
    login.findOne({user:id}).then((data)=>{
        console.log(data);
        
        if(data!=null){
            if(data.password == pass){
                session = req.session;
                session.userid = id;
                session.save();
                console.log(req.session);
                console.log("okay");
                res.redirect('/');
                
            }
            else{
                res.send("password is wrong");
            }
        }
        else{
            res.send("username is wrong");
        }
        
    }).catch((err)=>{
        console.log(err);
    })
}

//GET & POST Methods

//Home
app.get('/',(req,res)=>{
    session = req.session;
    console.log(session.userid); 
    if(session.userid){
        res.render('home');
    }
    else{
        res.redirect('/login');
    }
    
})

app.post('/',async(req,res)=>{
    session = req.session;
    let exp = req.body.expense;
    let desc = req.body.description;
    let data = await login.find({user:uid});
    console.log(data[0].balance);
    console.log("new");
    let bal = data[0].balance;
    console.log(d);
    //console.log(data.balance);
    if(session.userid){
    if(exp<=bal){
    login.updateOne({user:uid},{$push:{transaction:{expense:exp,description:desc}}}).then((upd)=>{
        console.log(upd);
    })
    
    login.updateOne({user:uid},{$inc:{balance:-exp}}).then((result)=>{
        console.log(result);
    })
}
else{
    alert("balance is less");
}
    res.redirect('/');
}
else{
    res.redirect('/login');
}

})


//login
app.get('/login',(req,res)=>{
    res.render('login');
    
})

app.post('/login',(req,res)=>{
    let id = req.body.user;
    uid = id;
    let pass = req.body.password;
    login_check(req,res,id,pass);
    console.log(id,pass);
})

//Sign-in
app.get('/signin',(req,res)=>{
    res.render('signin');
})

app.post('/signin',(req,res)=>{
    let id = req.body.user;
    let pass = req.body.password;
    newUser = new login({
        user:id,
        password:pass,
        balance:0
    });
    newUser.save()
    res.redirect('/');
})


//AddFund
app.get('/addfund',(req,res)=>{
    session = req.session;
    if(session.userid){
        console.log(session);
        console.log(session.userid);
        res.render('addfund');
    }
    else{
        res.redirect('/login');
    }
    
})

app.post('/addfund',(req,res)=>{
    let amt = req.body.amount;
    login.updateOne({user:uid},{$inc:{balance:amt}}).then((result)=>{
        console.log(result);
    })
    res.redirect('/');
    
})

//Balance
app.get('/balance',(req,res)=>{
    session = req.session;
    if(session.userid){
        login.findOne({user:uid}).then((data)=>{
            res.render('balance',{item:data});
            console.log(data);
            console.log(data.balance);
        })
    }
    else{
        res.redirect('/login');
    }
    
})

//Expense
app.get('/expense',(req,res)=>{
    session = req.session;
    if(session.userid){
        login.findOne({user:uid},{_id:0,user:0,password:0,balance:0}).then((data)=>{
            let arr = data.transaction.reverse(); 
            res.render('expenselist',{expenseList:arr});
            console.log(data); //passes a data in document form
            console.log(data.transaction); //passes a data in array form
        })
    }
    else{
        res.redirect('/login');
    }
    
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/')
})

//Server listening
app.listen(port,()=>{
    console.log("server is listening on port 80");
})