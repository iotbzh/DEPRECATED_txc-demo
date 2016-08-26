
var afb = new AFB("api"/*root*/, "hello"/*token*/);
var ws;
var curLat = undefined, prvLat = undefined;
var curLon = undefined, prvLon = undefined;
var vspeed = 0, espeed = 0;
var heading = 0;
var R2D = 180.0 / Math.PI;
var D2R = Math.PI / 180.0;
var gapikey = "AIzaSyBG_RlEJr2i7zqJVQijKh4jQrE-DkeHau0";
var mapikey = "AIzaSyD4Sbh8-imto8EO7HP3uteQl6WRJaHwVOU";
var src1 = "http://maps.googleapis.com/maps/api/streetview?key="+gapikey+"&size=480x320";
var src2 = "http://maps.googleapis.com/maps/api/staticmap?key="+mapikey+"&maptype=hybrid&zoom=18&size=480x320";
var fuel;
var odoini = undefined, odo = undefined, odoprv = undefined;
var fsrini = undefined, fsr = undefined, fsrprv = undefined;
var con, cons = undefined, consa = [ ];
var minspeed = 5;
var wdgLat, wdgLon, wdgVsp, wdgVspeed, wdgEsp, wdgEspeed, wdgView1, wdgView2, wdgHea, wdgCar;
var wdgFue, wdgGpred, wdgGpblack;
var wdgOdo, wdgFsr, wdgCon, wdgConX;
var conscale = 15;
var condt = 60000;

function updatePosition() {
	if (curLat !== undefined && curLon !== undefined) {
		if (prvLat !== undefined && prvLon !== undefined && vspeed >= minspeed) {
			heading = Math.round(R2D * Math.atan2((curLon - prvLon)*Math.cos(D2R*curLat), curLat - prvLat));
			wdgHea.innerHTML = String(heading);
			wdgCar.style = "transform: rotate("+heading+"deg);";
		}

		wdgView1.src = src1+"&location="+curLat+","+curLon+"&heading="+heading;
		wdgView2.src = src2+"&center="+curLat+","+curLon;
	}
}

function gotLatitude(obj) {
	prvLat = curLat;
	curLat = obj.data.value;
	wdgLat.innerHTML = String(curLat);
	updatePosition();
}

function gotLongitude(obj) {
	prvLon = curLon;
	curLon = obj.data.value;
	wdgLon.innerHTML = String(curLon);
	updatePosition();
}
function gotVehicleSpeed(obj) {
	vspeed = Math.round(obj.data.value);
	wdgVsp.innerHTML = wdgVspeed.innerHTML = String(vspeed);
}

function gotEngineSpeed(obj) {
	espeed = Math.round(obj.data.value);
	wdgEsp.innerHTML = wdgEspeed.innerHTML = String(espeed);
}

function gotFuelLevel(obj) {
	fuel = Math.round(obj.data.value * 10) / 10;
	if (fuel <= 2) {
		wdgGpred.style.visibility = "visible";
	} else {
		wdgGpred.style.visibility = "hidden";
		wdgGpblack.style.height = Math.max(100 - fuel, 0) + "%";
		wdgFue.innerHTML = fuel;
	}
}

function displayConsumation(c) {
	var i, n;
	n = consa.push(c) - 9;
	while (n > 0) {
		consa.shift();
		n--;
	}
	for (i = 0 ; i < 9 ; i++) {
		if (i + n < 0) {
			wdgConX[i].style.height = "0%";
			wdgConX[i].innerHTML = "";
		} else {
			wdgConX[i].style.height = (100*Math.min(1,consa[i+n]/conscale))+"%";
			wdgConX[i].innerHTML = consa[i+n];
		}
	}
}

function updateConsumation() {
	if (odoprv === undefined) {
		odoprv = odo;
		cons = undefined;
	}
	if (fsrprv === undefined || fsrprv > fsr) {
		fsrprv = fsr;
		cons = undefined;
	}
	if ((odo - odoprv) > .075 && fsr != fsrprv) {
		con = Math.round(1000 * (fsr - fsrprv) / (odo - odoprv)) / 10;
		wdgCon.innerHTML = con;
		var t = Date.now();
		if (cons === undefined) {
			cons = { t: t, f: fsrprv, o: odoprv };
		} else if (t - cons.t >= condt) {
			displayConsumation(Math.round(1000 * (fsr - cons.f) / (odo - cons.o)) / 10);
			cons = { t: t, f: fsr, o: odo };
		}
		odoprv = odo;
		fsrprv = fsr;
	}
}

function gotOdometer(obj) {
	odo = obj.data.value;
	wdgOdo.innerHTML = Math.round(odo * 1000) / 1000;
	updateConsumation();
}

function gotFuelSince(obj) {
	fsr = obj.data.value;
	wdgFsr.innerHTML = Math.round(fsr * 1000) / 1000;
	updateConsumation();
}

function gotStart(obj) {
	curLat = undefined, prvLat = undefined;
	curLon = undefined, prvLon = undefined;
	vspeed = 0, espeed = 0;
	heading = 0;
	odoini = undefined, odo = undefined, odoprv = undefined;
	fsrini = undefined, fsr = undefined, fsrprv = undefined;
	cons = undefined, consa = [ ];

	wdgFsr.innerHTML = wdgOdo.innerHTML = wdgCon.innerHTML = 
	wdgLat.innerHTML = wdgLon.innerHTML =
	wdgVsp.innerHTML = wdgVspeed.innerHTML =
	wdgEsp.innerHTML = wdgEspeed.innerHTML =
	wdgHea.innerHTML = wdgFue.innerHTML = "?";
	for (var i = 0 ; i < 9 ; i++) {
		wdgConX[i].style.height = "0%";
		wdgConX[i].innerHTML = "";
	}
}

function gotStop(obj) {
}

function onAbort() {
	document.body.className = "not-connected";
}

function onOpen() {
	ws.call("txc/subscribe", {event:[
			"engine_speed",
			"fuel_level",
			"fuel_consumed_since_restart",
			"longitude",
			"latitude",
			"odometer",
			"vehicle_speed",
			"START",
			"STOP"]}).then(onSubscribed, onAbort);
}

function onSubscribed() {
	document.body.className = "connected";
	ws.onevent("txc/engine_speed", gotEngineSpeed);
	ws.onevent("txc/fuel_level", gotFuelLevel);
	ws.onevent("txc/fuel_consumed_since_restart", gotFuelSince);
	ws.onevent("txc/longitude", gotLongitude);
	ws.onevent("txc/latitude", gotLatitude);
	ws.onevent("txc/odometer", gotOdometer);
	ws.onevent("txc/vehicle_speed", gotVehicleSpeed);
	ws.onevent("txc/START", gotStart);
	ws.onevent("txc/STOP", gotStop);
}

function replyok(obj) {
	document.getElementById("output").innerHTML = "OK: "+JSON.stringify(obj);
}
function replyerr(obj) {
	document.getElementById("output").innerHTML = "ERROR: "+JSON.stringify(obj);
}
function send(message) {
	var api = document.getElementById("api").value;
	var verb = document.getElementById("verb").value;
	ws.call(api+"/"+verb, {data:message}).then(replyok, replyerr);
}

function doStart(fname) {
	ws.call('txc/start',{filename: fname});
}

function doStop() {
	ws.call('txc/stop',true);
}

function init() {
	document.body.className = "connecting";
	wdgLat = document.getElementById("lat");
	wdgLon = document.getElementById("lon");
	wdgVsp = document.getElementById("vsp");
	wdgVspeed = document.getElementById("vspeed");
	wdgEsp = document.getElementById("esp");
	wdgEspeed = document.getElementById("espeed");
	wdgView1 = document.getElementById("view1");
	wdgView2 = document.getElementById("view2");
	wdgHea = document.getElementById("hea");
	wdgCar = document.getElementById("car");
	wdgFue = document.getElementById("fue");
	wdgGpred = document.getElementById("gpred");
	wdgGpblack = document.getElementById("gpblack");
	wdgOdo = document.getElementById("odo");
	wdgFsr = document.getElementById("fsr");
	wdgCon = document.getElementById("con");
	wdgConX = [
			document.getElementById("con1"),
			document.getElementById("con2"),
			document.getElementById("con3"),
			document.getElementById("con4"),
			document.getElementById("con5"),
			document.getElementById("con6"),
			document.getElementById("con7"),
			document.getElementById("con8"),
			document.getElementById("con9")
		];
	ws = new afb.ws(onOpen, onAbort);
}

