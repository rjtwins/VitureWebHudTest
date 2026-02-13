let videoEl;
let overlay;

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
    overlay = document.getElementById('other-overlay');

    navigator.getUserMedia(
        { video: {} },
        stream => videoEl.srcObject = stream,
        err => console.error(err)
    )

    setInterval(() => updateLocation(), 1000);
}

async function onPlay(params) {
    updateVideoTransform();
    
    setInterval(async () => {

        const detections = await faceapi.detectAllFaces(videoEl).withFaceExpressions()

        const displaySize = { width: videoEl.clientWidth, height: videoEl.clientHeight }

        //faceapi.matchDimensions(overlay, displaySize)
        
        overlay.innerHTML = "";
        
        if(detections.length <= 0)
            return;

        //console.log(detections);
        detections.forEach(detection => drawDetection(detection))

    }, 50);
}

const cameraFOV = 70 * Math.PI / 180;
const cameraAspect = 4/3;
const cameraVFov = computeVFOV(70, cameraAspect);

const displayFOV = 52 * Math.PI / 180;
const screenAspect = 16/10;
const displayVFOV = computeVFOV(52, screenAspect);

const imageWidth = 640;
const imageHeight = 480;

function computeVFOV(hFOV_degrees, aspectRatio) {

    const hFOV = hFOV_degrees * Math.PI / 180; // convert to radians

    const vFOV =
        2 * Math.atan(
            Math.tan(hFOV / 2) / aspectRatio
        );

    return vFOV * 180 / Math.PI; // return in degrees
}

function cameraPixelToScreen(xPixel, overlayWidth) {

    // 1️⃣ Normalize pixel to -1..1
    const nx = (xPixel / imageWidth - 0.5) * 2;

    // 2️⃣ Convert to camera angle
    const angle = nx * (cameraFOV / 2);

    // 3️⃣ Project into display space
    const projected = Math.tan(angle) / Math.tan(displayFOV / 2);

    // 4️⃣ Convert to screen pixels
    const screenX = (projected * 0.5 + 0.5) * overlayWidth;

    return screenX;
}

function cameraPixelYToScreen(yPixel, overlayHeight) {

    // Normalize to -1..1
    const ny = (yPixel / imageHeight - 0.5) * 2;

    // Convert to camera angle
    const angle = ny * (cameraVFOV / 2);

    // Project into display space
    const projected = Math.tan(angle) / Math.tan(displayVFOV / 2);

    // Convert to pixels
    const screenY = (projected * 0.5 + 0.5) * overlayHeight;

    return screenY;
}

function drawDetection(detection) {
    const box = detection.detection.box;
    const rect = overlay.getBoundingClientRect();

    const screenX = cameraPixelToScreen(box.x, rect.width);
    const screenX2 = cameraPixelToScreen(box.x + box.width, rect.width);
    const boxWidth = screenX2 - screenX;

    const screenY = cameraPixelToScreen(box.y, rect.height);
    const screenY2 = cameraPixelToScreen(box.y + box.height, rect.height);
    const boxHeight = screenY2 - screenY;

    var elem = document.createElement("div");
    elem.style.position = "absolute";
    elem.style.border = "3px solid red";
    elem.style.left = screenX + "px";
    elem.style.top = screenY + "px";
    elem.style.width = boxWidth + "px";
    elem.style.height = boxHeight + "px";
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

    if(event.key == "/")
        videoEl.style.opacity = videoEl.style.opacity == 1 ? 0 : 1;

    if(event.key == "9")
        videoZoomPlus();
    if(event.key == "7")
        videoZoomMin();

    if(event.key == "4")
        videoMoveLeft();
    if(event.key == "6")
        videoMoveRight();
    
    if(event.key == "8")
        videoMoveUp();
    if(event.key == "2")
        videoMoveDown();
});


let videoScale = 2.7;
let videoPosX = 120;
let videoPosY = -374;
function videoZoomPlus(){
    videoScale += 0.1;
    updateVideoTransform();
}

function videoZoomMin(){
    videoScale -= 0.1;
    updateVideoTransform();
}

function videoMoveRight() {
    videoPosX += 1;
    updateVideoTransform()
}

function videoMoveLeft() {
    videoPosX -= 1;
    updateVideoTransform()
}

function videoMoveUp() {
    videoPosY += 1;
    updateVideoTransform()
}

function videoMoveDown() {
    videoPosY -= 1;
    updateVideoTransform()
}

function updateVideoTransform() {
    videoEl.style.transform =
        `translate(-50%, -50%) translate(${videoPosX}px, ${videoPosY}px) scale(${videoScale})`;
}


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