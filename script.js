let videoEl;
let canvas;

const MODEL_URL = '/VitureWebHudTest/models';

$(document).ready(function() {
    startCamera();
    initMap();
    updateTime();
});


window.addEventListener("deviceorientationabsolute", (event) => {
    console.log(event); // compass direction in degrees
});


window.addEventListener("deviceorientation", (event) => {
    console.log(event);
});

async function startCamera(){
    // console.log(faceapi.nets)

    await faceapi.loadFaceExpressionModel(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
    await faceapi.loadMtcnnModel(MODEL_URL);
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL);

    videoEl = document.getElementById('inputVideo');

    navigator.getUserMedia(
        { video: {} },
        stream => videoEl.srcObject = stream,
        err => console.error(err)
    )

    setInterval(() => updateLocation(), 1000);
}

async function onPlay(params) {
    setInterval(async () => {

        const detections = await faceapi.detectAllFaces(videoEl).withFaceExpressions()

        const displaySize = { width: videoEl.clientWidth, height: videoEl.clientHeight }
        const overlay = document.getElementById("other-overlay");

        faceapi.matchDimensions(overlay, displaySize)
        
        overlay.innerHTML = "";
        
        if(detections.length <= 0)
            return;

        //console.log(detections);
        detections.forEach(detection => drawDetection(detection))

    }, 50);
}

function drawDetection(detection) {
    const box = detection.detection.box;
    var x = box.x/detection.detection.imageWidth * window.innerWidth;
    var y = box.y/detection.detection.imageHeight * window.innerHeight;
    
    var elem = document.createElement("div");
    elem.style.position = "absolute";
    elem.style.border = "2px solid red";
    elem.style.left = x + "px";
    elem.style.top = y + "px";
    elem.style.width = "5px";
    elem.style.height = "5px";
    const overlay = document.getElementById("other-overlay");
    overlay.appendChild(elem);
}

function updateTime(){
    setInterval(() => {                
        const time = new Date();
        const timeString = time.getHours().toString().padStart(2, '0') + ':' +
                            time.getMinutes().toString().padStart(2, '0') + ':' +
                            time.getSeconds().toString().padStart(2, '0');
        document.getElementById("time").innerText = timeString;
    }, 500);
}

function updateLocation(){
    navigator.geolocation.watchPosition((pos) => {
        const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };

        heading = pos.coords?.heading ?? null;
        altitude = pos.coords?.altitude ?? null;
        speed = pos.coords?.speed ?? null;

        map.setView([location.lat, location.lng], 15);
        marker.setLatLng([location.lat, location.lng]);

        document.getElementById("heading").innerText = "Heading: " + (heading?.toFixed(2) ?? "N/A");
        document.getElementById("altitude").innerText = "Altitude: " + (altitude !== null ? altitude.toFixed(2) + " m" : "N/A");
        document.getElementById("speed").innerText = "Speed: " + (speed !== null ? speed.toFixed(2) + " m/s" : "N/A");
    });
}

let map;
let marker;
let heading;
let altitude;
let speed;

function initMap() {
    map = L.map('minimap', {
        zoom: 35,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false
    }).setView([37.5665, 126.9780], 13); // Seoul
        
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    marker = L.marker([37.5665, 126.9780]);
    const icon = marker.getIcon();
    icon.iconSize = [5,5];
    marker.addTo(map);
    updateLocation();
}

addEventListener("keydown", (event) => 
{ 
    if(event.key == "+")
        zoomPlus();
    if(event.key == "-")
        zoomMin();
});

let currentVW = 65;
let currentVH = 65;
function zoomPlus(){
    container = document.getElementById("container");
    currentVW += 1;
    currentVH += 1;
    container.style.width = currentVW + "vw";
    container.style.height = currentVH + "vh";
}

function zoomMin(){
    container = document.getElementById("container");
    currentVW -= 1;
    currentVH -= 1;
    container.style.width = currentVW + "vw";
    container.style.height = currentVH + "vh";
}