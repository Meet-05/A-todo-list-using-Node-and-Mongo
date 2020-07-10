//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _=require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//connecting to db

mongoose.connect("mongodb+srv://admin-meet:Meet-123@cluster0.hyces.mongodb.net/todoListDB", {
  useUrlParser: true
});

//creating a  schema for collection
const itemSchema = {
  name: String
};
//creating new collection called "Item" using schema created above
const Item = mongoose.model("item", itemSchema);

//inserting records
const item1 = new Item({
  name: "Welcome todo list"
});

const item2 = new Item({
  name: "Hit + to add new task"
});

const item3 = new Item({
  name: "<--to cancel"
});

const listSchema={
  name:String,
  items:[itemSchema]
};

const List=mongoose.model("List",listSchema);
const defaultitems = [item1, item2, item3];

app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find(function(err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultitems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("loaded initial task");
        }
        res.redirect("/");
      })
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: results
      });
    }
  })
});

app.post("/", function(req, res) {
  const listName=req.body.list;
  const newitem=new Item({
    name:req.body.newItem
  })

  if(listName===date.getDate())
  {
    newitem.save();
    res.redirect("/");
  }
  else{
  List.findOne({name:listName},function(err,foundlist){
    foundlist.items.push(newitem);
    foundlist.save();
    res.redirect("/"+listName);
  });
  }
});

app.post("/delete",function(req,res){
  const itemToBeDeleted=req.body.checkbox;
  const listTitle=req.body.listTitle;
  if(listTitle===date.getDate())
  {
    Item.deleteOne({_id:itemToBeDeleted},function(err)
  {
    if(err){console.log(err);}
    else{console.log("deleted succesfully");}
  });
  res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listTitle},{$pull:{items:{_id:itemToBeDeleted}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listTitle);
      }
    });
  }

});

app.get("/:customList", function(req, res) {
customListName=_.capitalize(req.params.customList);
List.findOne({name:customListName},function(err,foundList){
  if(!err){
    if(!foundList){
      // console.log("no same list"); we  create new list
      const list=new List({
        name:customListName,
        items:defaultitems
      });
      list.save();
      res.redirect("/"+customListName);
    }
    else{
      // console.log("list exists"); show existing list
      res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
    }
  }
})

});

app.get("/about", function(req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
