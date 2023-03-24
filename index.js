const express = require('express');
const cors=require('cors');
const mongoose = require('mongoose');
const User=require('./models/User');
const Post=require('./models/Post');
const bcrypt=require('bcryptjs');
const app = express();
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const multer=require('multer');
const uploadMiddleware=multer({dest:'uploads/'});
const fs=require('fs');

const salt= bcrypt.genSaltSync(10);
const secret='hfuhfuehfue';

app.use(cors({credentials:true,origin:['http://localhost:3000','https://blogwebsite-eight.vercel.app']}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname+'/uploads'));
app.use(function (req, res, next) {
   
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "1800");
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header(
      "Access-Control-Allow-Methods",
      "PUT, POST, GET, DELETE, PATCH, OPTIONS"
    );
    next();
  });

mongoose.connect('mongodb+srv://blog:taRJiV4dnr1dQBRq@cluster0.cupxg0j.mongodb.net/?retryWrites=true&w=majority');


app.post('/register',async (req,res)=>{
    const {username,password} = req.body;
    try{
    const userDoc=await User.create({
        username,
        password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
    } catch(err){
        res.status(400).json(err);
    }
});

app.post('/login',async (req,res)=>{
    const {username,password} = req.body;
    const userDoc=await User.findOne({username});
    const passOk=bcrypt.compareSync(password, userDoc.password);
    if(passOk){
        jwt.sign({username,id:userDoc._id},secret, {},(err,token)=>{
            if(err) throw err;
            // res.cookie('token',token).json({
            //     id:userDoc._id,
            //     username,
            // });
            res.cookie("token",token, {
                expires: new Date(Date.now() + 15* 60000),
                secure: true,
                signed: false,
                domain: "shy-pear-nematode-tie.cyclic.app",
                httpOnly: true,
                sameSite: "none"
              }).json({
                    id:userDoc._id,
                    username,
              });
        });
    } else{
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req, res) =>{
    const {token} = req.cookies;
    jwt.verify(token,secret,{},(err,info)=>{
        if(err) throw err;
        res.json(info);
    });
});

app.post('/logout',(req, res) =>{
    res.cookie('token','').json('ok');
});

// app.post('/post',uploadMiddleware.single('file'),async (req, res) =>{
//     const {originalname,path}=req.file;
//     const parts=originalname.split('.');
//     const ext=parts[parts.length-1];
//     const newPath=path+'.'+ext;
//     fs.renameSync(path,newPath);

//     const {token} = req.cookies;
//     jwt.verify(token,secret,{},async (err,info)=>{
//         if(err) throw err;
//         const {title,summary,content} = req.body;
//         const postDoc=await Post.create({
//         title,
//         summary,
//         content,
//         cover:newPath,
//         author: info.id,
//     });
//     res.json(postDoc);
//     });
 
// });

app.post('/post',async (req, res) =>{
    // const {originalname,path}=req.file;
    // const parts=originalname.split('.');
    // const ext=parts[parts.length-1];
    // const newPath=path+'.'+ext;
    // fs.renameSync(path,newPath);

    const {token} = req.cookies;
    jwt.verify(token,secret,{},async (err,info)=>{
        if(err) throw err;
        const {title,summary,content,cover} = req.body;
        const postDoc=await Post.create({
        title,
        summary,
        content,
        cover,
        author: info.id,
    });
    res.json(postDoc);
    });
 
});

// app.put('/post',uploadMiddleware.single('file'),async (req, res) => {
//     let newPath=null;
//     if(req.file){
//     const {originalname,path}=req.file;
//     const parts=originalname.split('.');
//     const ext=parts[parts.length-1];
//     newPath=path+'.'+ext;
//     fs.renameSync(path,newPath);
//     }

//     const {token}=req.cookies;
//     console.log(token);
//     jwt.verify(token,secret,{},async (err,info)=>{
//         if(err) throw err;
//         const {id,title,summary,content} = req.body;
//         const postDoc=await Post.findById(id);
//         const isAuthor= JSON.stringify(postDoc.author) === JSON.stringify(info.id);
//         // res.json({isAuthor,postDoc,info});
//         if(!isAuthor){
//             return res.status(400).json('you are not the author');
//         }

//         console.log(postDoc);

//         await postDoc.updateOne({
//             title,
//             summary,
//             content,
//             cover: newPath ? newPath : postDoc.cover,
//         });
//     res.json(postDoc);
//     });
// });

app.put('/post',async (req, res) => {
    // let newPath=null;
    // if(req.file){
    // const {originalname,path}=req.file;
    // const parts=originalname.split('.');
    // const ext=parts[parts.length-1];
    // newPath=path+'.'+ext;
    // fs.renameSync(path,newPath);
    // }

    const {token}=req.cookies;
    console.log(token);
    jwt.verify(token,secret,{},async (err,info)=>{
        if(err) throw err;
        const {id,title,summary,content,cover} = req.body;
        const postDoc=await Post.findById(id);
        const isAuthor= JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        // res.json({isAuthor,postDoc,info});
        if(!isAuthor){
            return res.status(400).json('you are not the author');
        }

        console.log(postDoc);

        await postDoc.updateOne({
            title,
            summary,
            content,
            cover,
        });
    res.json(postDoc);
    });
});

// title,
// summary,
// content,
// cover: newPath ? newPath : postDoc.cover,

app.get('/post',async (req, res) => {
    res.json(await Post.find().populate('author',['username']).sort({createdAt:-1}).limit(20));
});

app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc=await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
});

app.listen(process.env.PORT||4000);

// mongodb+srv://blog:taRJiV4dnr1dQBRq@cluster0.cupxg0j.mongodb.net/?retryWrites=true&w=majority

// taRJiV4dnr1dQBRq

