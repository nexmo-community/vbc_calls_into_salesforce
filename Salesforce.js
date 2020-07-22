var jsforce = require('jsforce');
var conn = new jsforce.Connection();

function login() {
    return new Promise((resolve, reject) => {
        conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD + process.env.SF_TOKEN, function(err, res) {
            if (err) {reject(err); return}
            resolve(res)
        })
    })
}

function getContact(phone_number) {
    return new Promise((resolve, reject) => {
    var q = `SELECT Id FROM Contact WHERE Phone='${phone_number}'`
    console.log(q)
      conn.query(q, function(err, res) {
        if (err) {reject(err); console.log(err);}
        resolve(res)
      })
    })
}

function createContact(first_name, last_name, phone_number) {
    return new Promise((resolve, reject) => {
        //Create new contact, get the record ID
        console.log(`Create contact ${first_name} ${last_name} ${phone_number}`)
        var data = { FirstName : first_name, LastName : last_name, Phone:phone_number}
        if (first_name != null) {
            data['FirstName'] = first_name
        }
        if (last_name != null) {
            data['LastName'] = last_name
        }
        conn.sobject("Contact").create(data, function(err, ret) {
            if (err || !ret.success) { reject(err);  console.error(err, ret); return }
            console.log("Created new contact id : " + ret.id);
            resolve(ret)
        });
    })
}

function addTask(subject, call_dur, recordId) {
    return new Promise((resolve, reject) => {
        conn.sobject("Task").create({ TaskSubtype : 'Call', CallDurationInSeconds : call_dur, Subject:subject, WhoId:recordId}, function(err, ret) {
            if (err || !ret.success) { reject(err);  console.error(err, ret); return }
            console.log("Created new task id : " + ret.id);
            resolve(ret)
        });
    })
}

module.exports.login = login
module.exports.getContact = getContact
module.exports.createContact = createContact
module.exports.addTask = addTask