var express = require('express');
var router = express.Router();
var dns = require('dns');
var moment = require('moment');
var sprintf = require('sprintf').sprintf;
var validator = require('validator');

var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME,
                                    process.env.SENDGRID_PASSWORD);

var MAIL_BODY_TEMPLATE = 'Access came from the following IP addresses\n'
                         + '\n'
                         + 'Access Time: %s\n'
                         + 'IP Address: %s (%s)\n'
                         + 'User-Agent: %s';

moment.locale('ja');

if (!validator.isEmail(process.env.NOTIFY_EMAIL_TO)
    || !validator.isEmail(process.env.NOTIFY_EMAIL_FROM)) {
  console.error('Setting error: Set the correct value of environment variables'
                + ' NOTIFY_EMAIL_TO and NOTIFY_EMAIL_FROM.');
}

var email_to = process.env.NOTIFY_EMAIL_TO;
var email_from = process.env.NOTIFY_EMAIL_FROM;
var email_subject = process.env.NOTIFY_EMAIL_SUBJECT;
var ga_tracking_id = process.env.GOOGLEANALYTICS_TRACKINGID;


//
// Routes
//

/* GET home page. */
router.get('/', function(req, res) {
  var access_time = moment();
  var ip = req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
  var ua = JSON.stringify(req.headers['user-agent']);

  dns.reverse(ip, function(err, domains) {
    var reverseip = 'Reverse lookup failed.';
    if (!err) {
      reverseip = JSON.stringify(domains);
    }

    var mail_body = sprintf(MAIL_BODY_TEMPLATE,
                            access_time.format('YYYY/MM/DD HH:mm:ss Z'),
                            ip,
                            reverseip,
                            ua);

    console.log(mail_body);

    if (email_to) {
      sendgrid.send({
        to:       email_to,
        from:     email_from,
        subject:  email_subject,
        text:     mail_body
      }, function(err, json) {
        if (err) { return console.error(err); }
        console.log(json);
      });
    }

    res.render('index', {
      title: 'IP Gather',
      ip: ip,
      ga_tracking_id: ga_tracking_id
    });
  });  
});

module.exports = router;
