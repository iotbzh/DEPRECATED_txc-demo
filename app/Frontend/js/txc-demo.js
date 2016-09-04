// parse location to get security token
var urlParams={};
location.search.substr(1).split("&").forEach(function(item) {
	var k = item.split("=")[0];
	var v = decodeURIComponent(item.split("=")[1]); 
	if (k in urlParams) urlParams[k].push(v); else urlParams[k] = [v];
});

var afb = new AFB("api"/*root*/, urlParams.token[0]);
var ws;
var curLat,prvLat;
var curLon,prvLon;
var vspeed = 0, espeed = 0;
var heading = 0;
var R2D = 180.0 / Math.PI;
var D2R = Math.PI / 180.0;
var gapikey = "AIzaSyBG_RlEJr2i7zqJVQijKh4jQrE-DkeHau0";
var src1 = "http://maps.googleapis.com/maps/api/streetview?key="+gapikey+"&size=480x320";
var fuel;
var odoini,odo,odoprv;
var fsrini,fsr,fsrprv;
var con,cons,consa = [ ];
var minspeed = 5;
var wdgLat, wdgLon, wdgVsp, wdgVspeed, wdgEsp, wdgEspeed, wdgView1, wdgHea, wdgCar;
var wdgFue, wdgGpred, wdgGpblack;
var wdgOdo, wdgFsr, wdgCon, wdgConX;
var conscale = 15;
var condt = 60000;

var layers={
	googleStreets: L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
		minZoom: 1,
		maxZoom: 20,
		subdomains:['mt0','mt1','mt2','mt3']
	}),
	googleHybrid: L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
		minZoom: 1,
		maxZoom: 20,
		subdomains:['mt0','mt1','mt2','mt3']
	}),
	googleSat: L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
		minZoom: 1,
		maxZoom: 20,
		subdomains:['mt0','mt1','mt2','mt3']
	}),
	googleTerrain: L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
		minZoom: 1,
		maxZoom: 20,
		subdomains:['mt0','mt1','mt2','mt3']
	}),
	openStreetMap: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		minZoom: 1,
		maxZoom: 19,
		attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
	})
};

// leaflet map
var defaultLocation=[47.6243678,-2.7789165];
L.Icon.Default.imagePath="/images";
var maps={
	mapstreet: {
		map: null,
		options: {
			center: defaultLocation,
			layers: layers.openStreetMap,
			zoom: 15,
			attributionControl: false,
		},
		layersControl: {
			"OpenStreetMap": layers.openStreetMap,
			"Google Streets": layers.googleStreets,
			"Google Satellite": layers.googleSat,
			"Google Terrain": layers.googleTerrain,
		},
/*		path: {
			stroke: true,
			color: "#0f0",
			weight: "3",
			opacity: "0.5",
			lineCap: "round",
			lineJoin: "round",
			smoothFactor: 1.0,
		}
*/
	},
	mapsat: {
		map: null,
		options: {
			center: defaultLocation,
			layers: layers.googleHybrid,
			zoom: 17,
			attributionControl: false,
		},
		events: {
			load: adjustCar,
			viewreset: adjustCar,
			zoomend: adjustCar,
			move: adjustCar,
			resize: adjustCar,
		},
/*		icon: {
			iconUrl: '/images/car-top-view.png',
			iconSize: [25,48],
			iconAnchor: [12,33],
		},
		marker: {
			rotationAngle: heading,
			rotationOrigin: "12px 33px"
		}
*/
	}
};

function initMaps() {
	for (var id in maps) {
		var mh=maps[id];
		mh.map=L.map(id,mh.options);
		if (mh.marker) {
			mh.marker=L.marker(mh.map.getCenter(), mh.marker);
			mh.marker.addTo(mh.map);
			if (mh.icon) {
				mh.icon=L.icon(mh.icon);
				mh.marker.setIcon(mh.icon);
			}
		}
		if (mh.events) {
			for (var evt in mh.events) {
				mh.map.on(evt,mh.events[evt]);
	
			}
		}
		if (mh.layersControl) {
			L.control.layers(mh.layersControl).addTo(mh.map);
		}
		if (mh.path) {
			mh.path=L.Polyline([mh.map.getCenter(),mh.map.getCenter()],mh.path);
//			mh.path.setLatLngs([]);
			mh.path.addTo(mh.map);
		}
	}
	adjustCar(); // initial call
	setMapsLockState(false);

	wdgView1.src = src1+"&location="+defaultLocation[0]+","+defaultLocation[1]+"&heading=210";
}

function setMapsLockState(b) {
	// maps shouldn't be draggable while trace is active
	for (var id in maps) {
		if (b) {
			maps[id].map.dragging.disable();
			if (maps[id].path) {
				maps[id].path.setLatLngs([maps[id].map.getCenter(),maps[id].map.getCenter()]);
			}
		}
		else
			maps[id].map.dragging.enable();
	}
	
	// car visible or not
	if (b) {
		// lock state: car visible
		$(wdgCar).removeClass("invisible");
	}
	else {
		$(wdgCar).addClass("invisible");
	}
}

function adjustCar() {
	/* get zoom level on map and adjust scaling ! */
	/* 
	  zoom => scale
	   19 => 1.0 
	   15 => 0.5 
	*/
	var zl=maps.mapsat.map.getZoom();
	var scale=0.125*zl-1.375;
	if (scale<0.5) scale=0.5;
	var trans="scale("+scale+") translate(-50%,-68%) rotate("+heading+"deg)";
	$(wdgCar).css("transform",trans);
	//console.log("zoom:"+zl+" heading:"+heading+" scale:"+scale);
}

function updatePosition() {
	if (curLat !== undefined && curLon !== undefined) {
		if (prvLat !== undefined && prvLon !== undefined && vspeed >= minspeed) {
			heading = Math.round(R2D * Math.atan2((curLon - prvLon)*Math.cos(D2R*curLat), curLat - prvLat));
			wdgHea.innerHTML = String(heading);
		}

		wdgView1.src = src1+"&location="+curLat+","+curLon+"&heading="+heading;

		for (var id in maps) {
			var mh=maps[id];
			mh.map.panTo([curLat,curLon],{
				animate:true,
				duration: 1.0,
				easeLinearity: 1
			});
			if (mh.marker) {
				mh.marker.setLatLng([curLat,curLon]);
				mh.marker.setRotationAngle(heading);
			}
			if (mh.path) {
				mh.path.addLatLng([curLat,curLon]);
			}
		}
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
			wdgConX[i].innerHTML = "<p>"+consa[i+n]+"</p>";
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
	if ((odo - odoprv) > 0.075 && fsr != fsrprv) {
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
	document.body.className = "started";
	curLat = undefined;
	prvLat = undefined;
	curLon = undefined;
	prvLon = undefined;
	vspeed = 0;
	espeed = 0;
	heading = 0;
	odoini = undefined;
	odo = undefined;
	odoprv = undefined;
	fsrini = undefined;
	fsr = undefined;
	fsrprv = undefined;
	cons = undefined;
	consa = [ ];

	wdgFsr.innerHTML = wdgOdo.innerHTML = wdgCon.innerHTML = 
	wdgLat.innerHTML = wdgLon.innerHTML =
	wdgVsp.innerHTML = wdgVspeed.innerHTML =
	wdgEsp.innerHTML = wdgEspeed.innerHTML =
	wdgHea.innerHTML = wdgFue.innerHTML = "?";
	for (var i = 0 ; i < 9 ; i++) {
		wdgConX[i].style.height = "0%";
		wdgConX[i].innerHTML = "";
	}
	setMapsLockState(true);
}

function gotStop(obj) {
	document.body.className = "connected";
	setMapsLockState(false);
}

function gotStat(obj) {
	wdgStat.innerHTML = obj.data;
}

function onAbort() {
	document.body.className = "not-connected";
	setMapsLockState(false);
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
			"STOP"]}, onSubscribed, onAbort);
	ws.call("stat/subscribe", true);
	ws.onevent("stat/stat", gotStat);
}

function onSubscribed() {
	document.body.className = "connected";
	setMapsLockState(false);
	ws.onevent("txc/engine_speed", gotEngineSpeed);
	ws.onevent("txc/fuel_level", gotFuelLevel);
	ws.onevent("txc/fuel_consumed_since_restart", gotFuelSince);
	ws.onevent("txc/longitude", gotLongitude);
	ws.onevent("txc/latitude", gotLatitude);
	ws.onevent("txc/odometer", gotOdometer);
	ws.onevent("txc/vehicle_speed", gotVehicleSpeed);
	ws.onevent("txc/START", gotStart);
	ws.onevent("txc/STOP", gotStop);
	ws.onevent("txc",function(obj) { 
		if (obj.event != "txc/STOP") {
			document.body.className = "started";
			setMapsLockState(true);
		}
	});
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
	ws.call(api+"/"+verb, {data:message}, replyok, replyerr);
}

function doConnect() {
	document.body.className = "connecting";
	setMapsLockState(false);
	ws = new afb.ws(onOpen, onAbort);
}

function doStart(fname) {
	ws.call('txc/start',{filename: fname});
}

function doStop() {
	ws.call('txc/stop',true);
}

$(function() {
	wdgLat = document.getElementById("lat");
	wdgLon = document.getElementById("lon");
	wdgVsp = document.getElementById("vsp");
	wdgVspeed = document.getElementById("vspeed");
	wdgEsp = document.getElementById("esp");
	wdgEspeed = document.getElementById("espeed");
	wdgView1 = document.getElementById("view1");
	wdgHea = document.getElementById("hea");
	wdgCar = document.getElementById("car");
	wdgFue = document.getElementById("fue");
	wdgGpred = document.getElementById("gpred");
	wdgGpblack = document.getElementById("gpblack");
	wdgOdo = document.getElementById("odo");
	wdgFsr = document.getElementById("fsr");
	wdgStat = document.getElementById("stat");
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
	
	initMaps();

	doConnect();
});

