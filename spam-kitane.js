var apn = require("apn");
var options = { cert : 'cert_dev.pem', key: 'key_dev.pem' };
var apnConnection = new apn.Connection(options);
var myDevice = new apn.Device("5c5088ddd9db5eb02253a3b6fedee265c74d2e90a09907540fc6814fcc983752");

var note = new apn.Notification();

note.badge = 1;
note.sound = "ping.aiff";
note.alert = "Hello Bitch ! You have 1 notif!";
note.payload = {
  lat: 48.838187,
  lon: 2.345515
};


apnConnection.pushNotification(note, myDevice);

apnConnection.on('completed', function() {
	console.log("notif send");
	apnConnection.shutdown();

	setTimeout(function() {
		process.exit(0);
	}, 1000);
	return;
});