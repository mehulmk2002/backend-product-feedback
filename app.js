const express=require('express')
const bodyParser=require('body-parser')
const dotenv=require('dotenv')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app=express()
const cors=require('cors');
const { Int32 } = require('mongodb');
app.use(express.json())
const jwt = require('jsonwebtoken');
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));

dotenv.config();
const port = process.env.PORT || 3001;

const isAuthenticated = (req, res, next) => {
    try {
      const user = jwt.verify(req.headers.token, process.env.JWT_SECRET) 
      req.user = user
      next();
    } catch (error) {
      res.send ({status: 'FAILED', message: 'Please login first' })
    }
  }

const User=mongoose.model('user',{
    name:String,
    email:String,
    mobile:String,
    password:String
})

const Products=mongoose.model('product',{
    companyName:String,
    category_list:Array,
    logoUrl:String,
    productLink:String,
    description:String,
    comments:Array,
    upvotes:Number
})

app.get('/',isAuthenticated,(req,res)=>{
    res.send({status:'SUCCESS', msg:'All Good'})
})

app.post('/signup',async(req,res)=>{
    try{
        const {name,email,mobile,password}=req.body;
      
        const isExit=await User.findOne({email})
        if(isExit)
        {
            console.log("already there")
            res.send({name:isExit.name,email:isExit.email})
        }
        else{
            const encryptedpswd=await bcrypt.hash(password,10)
            User.create({name,email,mobile,password:encryptedpswd})
            console.log("Insert SUCCESSFULLY")
        } }
    catch(error){
        console.log(error)
    }
 
})


app.post('/login',async(req,res)=>{
    try{
        const {email,password}=req.body;
        const isExit=await User.findOne({email})
        
        if(!isExit)
        {    
            console.log("Not there")
            return;
        }
        const didPasswordMatch=await bcrypt.compare(password, isExit.password); 
        if(didPasswordMatch){
            console.log("MatchS SUCCESSFULLY")
            console.log('name::'+isExit.name)
            const jwtToken = jwt.sign(isExit.toJSON(), process.env.JWT_SECRET, { expiresIn: 60 });
  
            res.send({ status: 'SUCCESS', message: 'User logged in successfully', jwtToken })
        }
        else{
            console.log("NOT MatchS SUCCESSFULLY")
        } }
    catch(error){
        res.send({ status: 'FAILED', message: 'Failed to sign in user' })
        console.log(error)
    }
 
})


app.get('/profile', isAuthenticated, async (req, res) => { 
    const fullName = req.user.firstName + ' ' + req.user.lastName
    res.send({ status: 'SUCCESS', message: 'Welcome user!', fullName});
  });

app.post('/product',async(req,res)=>{
    try{
        const { companyName,
            category_list,
            logoUrl,
            productLink,
            description}=req.body;

            
           let comments=[]
           let upvotes=0
            Products.create({companyName,
                category_list,
                logoUrl,
                productLink,
                description,comments,upvotes}).then(console.log('mm'))
            console.log("Insert SUCCESSFULLY PRODUCT")
         }
    catch(error){
        console.log(error)
    }
 
})

app.get('/product',(req,res)=>{
    Products.find().then((Products)=>{
        res.send({Products});
        console.log({Products})
    }).catch((error)=>{console.log(error)})
})

app.get('/product/:category/:sorting_type',(req,res)=>{
    let sel_category=req.params.category
    let sel_sorting_type=req.params.sorting_type
    
    let sort = { length: 1, author: 1 };
    if(sel_sorting_type==='comments'){sort = { comments: -1 };}
    if(sel_sorting_type==='upvotes'){sort = { upvotes: -1 };}
    Products.find().sort(sort).then((Products)=>{
        
        
        if( sel_category==='All'){
            res.send({Products});
        }else{

            Products = Products.filter(function (el) {
                return el.category_list.includes(sel_category)
            }
            );
            res.send({Products});
        }


    }).catch((error)=>{console.log(error)})
})



//Add comment

app.patch('/addComment',async(req,res)=>{
    try{
        const {commentValue,product_id}=req.body;
            comments=commentValue
            const updateD={ $push:{comments}}
            Products.findByIdAndUpdate(product_id,updateD ).then(res.send({msg:'Add Comment'}))

            console.log("Insert Comment SUCCESSFULLY ")
         }
    catch(error){
        console.log(error)
    }
 
})

app.patch('/upvotes',async(req,res)=>{
    try{
        const {votes_val,product_id}=req.body;    

        console.log(votes_val,product_id)
            // Products.comments
            upvotes=parseInt(votes_val)
            const updateD={upvotes}
            Products.findByIdAndUpdate(product_id,updateD ).then( res.send({msg:'Update'}) )

            console.log("INC upvotes")
         }
    catch(error){
        console.log(error)
    }
 
})

app.patch('/product',async(req,res)=>{
    try{
        const {_id,companyName,
            category_list,
            logoUrl,
            productLink,
            description}=req.body;    

            const updateD={companyName,
                category_list,
                logoUrl,
                productLink,
                description,}
            Products.findByIdAndUpdate(_id,updateD ).then( res.send({msg:'Update Product'}) )

            console.log("Update Product")
         }
    catch(error){
        console.log(error)
    }
 
})


app.listen(port,()=>{
    mongoose.connect(process.env.MongoDB_URL).then(()=>{
        console.log("Con SUCCESSFULLY")
    }).catch(error=>console.log(error))
    console.log('Runnning On'+port)
})
