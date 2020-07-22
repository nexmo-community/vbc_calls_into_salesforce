require('dotenv').config()
const express = require('express')
const app = express()
var salesforce = require('./Salesforce.js')

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

const port = 3000
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
