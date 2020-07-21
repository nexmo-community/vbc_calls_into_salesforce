require('dotenv').config()
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var salesforce = require('./Salesforce.js')

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

salesforce.login()
.then(function(res) {
  console.log(res)
}).catch((function(err) {
  console.log(err)
}))

app.post('/webhook', (req, res) => {
  var event = req.body.event
  var callerId = event.callerId;
  var first_name = null
  var last_name = null
  var phone_number = event.phoneNumber.replace(/\D/g,'')
  if (typeof(callerId) != "undefined") {
    [last_name, first_name] = callerId.split(" ")
  } else {
    last_name = phone_number
  }
  var direction = event.direction
  var duration = event.duration
  var state = event.state
  if (state == "ANSWERED")  {
    var name = `${first_name} ${last_name}`
    if (typeof(callerId) == "undefined") {
      name = phone_number
    }
    var subject = `${direction.toLowerCase()} call with ${name}`
    salesforce.getContact(phone_number)
    .then(function(contact) {
      console.log(contact)
      if (contact["totalSize"] == 0) {
        //Create new contact
        return salesforce.createContact(first_name, last_name, phone_number)
        .then(function(contact) {
          var contactId = contact["Id"]
          return salesforce.addTask(subject, duration, contactId)
        })
      } else {
        //Grab the first contact
        var contactId = contact["records"][0]["Id"]
        return salesforce.addTask(subject, duration, contactId)
      }
    }).catch(function(err) {
      console.log(err)
    })
  }
  res.sendStatus(200);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
