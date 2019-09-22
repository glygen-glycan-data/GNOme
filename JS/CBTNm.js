"use strict";

var container = document.getElementById("container");

var panelcontainer, hgvcontainer, showAndHideButton;
var leftPanel, rightPanel;
var leftTurnButton, rightTurnButton;

var monoExceptForXxx = ['GlcNAc', 'GalNAc', 'ManNAc', 'HexNAc','Glc', 'Gal', 'Man', 'Hex','Fuc', 'NeuAc', 'NeuGc'];
var allMono = monoExceptForXxx.concat(["Xxx"]);

var monofreq = {};
var maxComp = {};
var maxCompAtCurrentComp = {};
var topTopology =[];
var cacheForMatchedTopology = {};

var icon_config = {
    'GlcNAc': {"shape": "square", "icon_color": "rgb(17,0,250)", "count_color": "white"},
    'ManNAc': {"shape": "square", "icon_color": "rgb(0,200,50)", "count_color": "white"},
    'GalNAc': {"shape": "square", "icon_color": "rgb(254,255,0)", "count_color": "black"},
    'HexNAc': {"shape": "square", "icon_color": "rgb(255,255,255)", "count_color": "black"},
    'Glc': {"shape": "circle", "icon_color": "rgb(17,0,250)", "count_color": "white"},
    'Man': {"shape": "circle", "icon_color": "rgb(0,200,50)", "count_color": "white"},
    'Gal': {"shape": "circle", "icon_color": "rgb(254,255,0)", "count_color": "black"},
    'Hex': {"shape": "circle", "icon_color": "rgb(255,255,255)", "count_color": "black"},
    'Fuc': {"shape": "triangle", "icon_color": "rgb(250,0,0)", "count_color": "white"},
    'NeuAc': {"shape": "diamond", "icon_color": "rgb(200,0,200)", "count_color": "white"},
    'NeuGc': {"shape": "diamond", "icon_color": "rgb(233,255,255)", "count_color": "black"},
    'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"}
};

var urlPara = {};

var keyMap = {
    "n": "GlcNAc",
    "m": "Man",
    "g": "Gal",
    "f": "Fuc",
    "s": "NeuAc",
    //"x": "Xxx"
};

var lastClickedTopology = [];
var matchedTopologies = [];


var cssUpperShow = "";
var cssUpperHide = "";
var cssLeftPanelShow = "display: inline";
var cssLeftPanelHide = "display: none";
var cssButtonShow = "width: 200px; height: 30px; position: absolute; top: 20px; left: 20px; z-index: 500;";
var cssButtonShowL = "width: 30px; height: 30px; position: absolute; top: 20px; left: 250px; z-index: 500;";
var cssButtonShowR = "width: 30px; height: 30px; position: absolute; top: 20px; left: 280px; z-index: 500;";
var cssButtonHide = "display: none";
var cssBottomShow = "";
var cssBottomHide = "display: none";


var option = {
    essentials: {
        div_ID: "viewer", // the ID of div container
        component: {}, // the data
        topoOnly: false,
        viewRoot: "",
        useGlyTouCanAsImageSource: false,
        GlyTouCanImagePara: {
            style: "extended", // Other Options: normal, compact
            format: "png", // Other Options: jpg
            notation: "cfg" // Other Options: cfgbw, uoxf, uoxf-color, cfg-uoxf, iupac
        },
        imgURL1: "http://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/", // Unnecessary if useGlyTouCanAsImageSource is true
        imgURL2: ".png"
    },
    display: {
        enableTitle: false,
        enableNavi: true,
        naviOption: {
            size: 0.2,
            position: 4
        },
        orientation: 2 // 1, 2, 3, 4 Stand for top2bottom left2right bottom2top right2left
    },
    contextMenu: {
        enable: true,
        defaultMenu: false,
        externalURL1: "https://glytoucan.org/glycans/",
        externalURL2: "/image?style=extended&format=png&notation=cfg"
    }
};

function allcateDIV() {
    panelcontainer = document.createElement("div");
    hgvcontainer = document.createElement("div");
    hgvcontainer.setAttribute("id", "viewer");

    showAndHideButton = document.createElement("button");
    showAndHideButton.innerText = "Show upper panel";
    showAndHideButton.onclick = showUpper;

    leftTurnButton = document.createElement("button");
    leftTurnButton.innerText = "↺";
    leftTurnButton.onclick = function () {
        turn(1);
    };

    rightTurnButton = document.createElement("button");
    rightTurnButton.innerText = "↻";
    rightTurnButton.onclick = function () {
        turn(-1);
    };

    leftPanel = document.createElement("div");
    rightPanel = document.createElement("div");
    leftPanel.style = "float: left; width: 130px; margin: 0px; padding: 0px;";

    panelcontainer.appendChild(leftPanel);
    panelcontainer.appendChild(rightPanel);

    container.appendChild(showAndHideButton);
    container.appendChild(leftTurnButton);
    container.appendChild(rightTurnButton);
    container.appendChild(panelcontainer);
    container.appendChild(hgvcontainer);
}

function getParaFromURL() {
    var urlobj = new URL(window.location);
    for (var p of urlobj.searchParams) {
        urlPara[p[0]] = p[1];
    }
}

function getAddFlag() {
    var flags = {};
    for (var m of allMono){
        flags[m] = monofreq[m]+1 <= maxComp[m];
    }

    return flags
}

function getSubFlag() {
    var flags = {};
    for (var m of allMono){
        flags[m] = monofreq[m] >= 1;
    }
    var hexnacCount = 0, hexCount = 0;
    for (var m of ['GlcNAc', 'GalNAc', 'ManNAc']){
        hexnacCount += monofreq[m];
    }
    flags["HexNAc"] = hexnacCount < monofreq["HexNAc"];

    for (var m of ['Glc', 'Gal', 'Man']){
        hexCount += monofreq[m];
    }
    flags["Hex"] = hexCount < monofreq["Hex"];


    return flags
}


function compositionChange(iupac, num) {
    var c = monofreq[iupac];

    var plusFlag = getAddFlag();
    var minusFlag = getSubFlag();

    if (num < 0 && c + num < 0) {
        // ignore minus count
    } else if (num > 0 && !plusFlag[iupac]) {
        // exceed maximum possible configuration
    } else if (num < 0 && !minusFlag[iupac]) {
        // exceed maximum possible configuration
    } else {
        monofreq[iupac] = monofreq[iupac] + num;
        if (['GlcNAc', 'GalNAc', 'ManNAc', 'Glc', 'Gal', 'Man'].includes(iupac)){
            monofreq[{3: "Hex", 6:"HexNAc"}[iupac.length]] = monofreq[{3: "Hex", 6:"HexNAc"}[iupac.length]]+ num;
        }
        //afterCompostionChanged();
        updateUpper();
        hgvcontainer.innerHTML = "";
    }
}

function drawEachMonoIcon(m) {
    var icon = document.createElement("canvas");
    icon.setAttribute("width", "40px");
    icon.setAttribute("height", "40px");

    var config = icon_config[m];

    var ctx = icon.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = config.icon_color;
    ctx.font = "26px Arial";

    if (config.shape == "square") {
        ctx.moveTo(2, 2);
        ctx.lineTo(2, 38);
        ctx.lineTo(38, 38);
        ctx.lineTo(38, 2);
    } else if (config.shape == "circle") {
        ctx.arc(20, 20, 19, 0, 2 * Math.PI);
    } else if (config.shape == "triangle") {
        ctx.moveTo(20, 39);
        ctx.lineTo(1, 1);
        ctx.lineTo(39, 1);
    } else if (config.shape == "diamond") {
        ctx.moveTo(20, 1);
        ctx.lineTo(39, 20);
        ctx.lineTo(20, 39);
        ctx.lineTo(1, 20);
    } else {
        console.log("shape is not supported yet")
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = config.count_color;
    var t = monofreq[m].toString();
    var x, y = 30;
    if (t.length == 1) {
        x = 13;
    } else {
        x = 5;
    }
    if (config.shape == "triangle") {
        y = y - 9;
        if (t.length == 1) {
            y += 3;
        }
    }

    ctx.fillText(t, x, y);

    return icon
}


function drawAddAndSubButton(add, grey) {
    var button = document.createElement("canvas");
    var color = "DodgerBlue";
    button.setAttribute("width", "40px");
    button.setAttribute("height", "40px");
    var ctx = button.getContext('2d');
    ctx.beginPath();
    if (add) {
        ctx.moveTo(1, 1);
        ctx.lineTo(39, 20);
        ctx.lineTo(1, 39);
        color = "SlateBlue";
    } else {
        ctx.moveTo(1, 20);
        ctx.lineTo(39, 39);
        ctx.lineTo(39, 1);
    }
    ctx.closePath();
    ctx.lineWidth = 2;
    if (grey) {
        color = "lightgrey";
    }
    ctx.fillStyle = color;
    ctx.fill();
    button.style = "cursor: pointer; ";

    return button
}

function appendIcons(iupacComp) {
    var ind = allMono.indexOf(iupacComp);
    var keystroke = keyMap[ind];

    var icon = drawEachMonoIcon(iupacComp);

    var g;
    g = !getSubFlag()[iupacComp];
    var subbutton = drawAddAndSubButton(false, g);
    subbutton.onclick = function () {
        compositionChange(iupacComp, -1);
    };

    g = !getAddFlag()[iupacComp];

    var addbutton = drawAddAndSubButton(true, g);
    addbutton.onclick = function () {
        compositionChange(iupacComp, 1);
    };

    leftPanel.appendChild(subbutton);
    leftPanel.appendChild(icon);
    leftPanel.appendChild(addbutton);
    leftPanel.appendChild(document.createElement("br"));
}


function getImage(gtcid) {
    var figure = document.createElement("figure");
    figure.style.margin = 0;
    figure.id = "img_" + gtcid;
    var img = document.createElement("img");
    img.src = "https://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/" + gtcid + ".png";
    img.style = "width: 200px; height: auto;";
    img.onclick = function () {
        showLower(gtcid);
    };
    var caption = document.createElement("figcaption");
    caption.innerText = gtcid;
    caption.style.textAlign = "center";

    figure.appendChild(img);
    figure.appendChild(caption);

    return figure
}

function updateLeftPanel() {
    leftPanel.innerHTML = "";
    for (var iupacComp of allMono) {
        appendIcons(iupacComp)
    }

    var iconHint = document.createElement("img");
    iconHint.src = "data:image/png;base64,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";
    iconHint.width = 40;
    iconHint.height = 40;
    iconHint.onclick = function () {
        var s = "- You may use keyboard shortcut to add or subtract the composition for each monosaccharide<br>" +
            "- Move cursor to each monosaccharide to learn more<br>" +
            "- Double click on glycan in bottom for zooming<br>" +
            "- Right click on glycan in bottom to jump to GlyTouCan.org for more detail<br>" +
            "- The topologies are sorted based on graph size on bottom";
        var dialog = new $.Zebra_Dialog(s, {
            type: 'information',
            title: 'Hint',
            buttons: ['Ok!'],
            onClose: function (caption) {

                // notice that we use the button's label to determine which button was clicked
                // "caption" will be empty when the dialog box is closed by clicking the dialog
                // box's close button or by clicking the overlay
                //alert((caption != '' ? '"' + caption + '"' : 'nothing') + ' was clicked');

            }
        });
    };

    iconHint.style = "padding-left: 40px";

    leftPanel.appendChild(iconHint);
}


function match2CurrentComposition(thisComp) {


    var currentComp = JSON.parse(JSON.stringify(monofreq));

    for (var mc of allMono) {
        if (mc.includes("Hex")){
            if (currentComp[mc] != thisComp[mc]) {
                return false
            }
        }else if (['Fuc', 'NeuAc', 'NeuGc', "Xxx"].includes(mc)){
            if (currentComp[mc] != thisComp[mc]) {
                return false
            }
        }
        else{
            if (currentComp[mc] > thisComp[mc]) {
                return false
            }
        }

    }
    return true
}

function compositionMatch(thisComp, nextComp) {


    for (var mc of allMono) {
        if (mc.includes("Hex")){
            if (nextComp[mc] != thisComp[mc]) {
                return false
            }
        }else if (['Fuc', 'NeuAc', 'NeuGc', "Xxx"].includes(mc)){
            if (nextComp[mc] != thisComp[mc]) {
                return false
            }
        }
        else{
            if (nextComp[mc] > thisComp[mc]) {
                return false
            }
        }

    }
    return true
}

function getDecedents(n) {
    if (!Array.isArray(data[n].children)){
        // console.log(data[n].children);
        return []
    }

    var res = [];
    for (var nc of data[n].children){
        res = res.concat(JSON.parse(JSON.stringify(getDecedents(nc))));
        res.push(nc);
    }

    var res2 = [];
    res.forEach(function (d) {
        if (!Object.keys(res2).includes(d)){
            res2.push(d);
        }
    });

    return res2
}

function dataPreprocess() {
    for (var acc of Object.keys(data)){
        for (var m of allMono){
            if (data[acc].comp[m] == undefined){
                data[acc].comp[m] =0;
            }
        }

        if (data[acc].top){
            topTopology.push(acc);
        }

        data[acc].decedentNum = getDecedents(acc).length;
    }
}


function findMatchedTopLeverTopology() {
    matchedTopologies = [];

    var currentCompStr = monofreq2str(monofreq);
    if (Object.keys(cacheForMatchedTopology).includes(currentCompStr)){
        console.log("cached");
        matchedTopologies = cacheForMatchedTopology[currentCompStr];
    }
    else{
        for (var acc of topTopology){
            if (match2CurrentComposition(data[acc].comp)){
                matchedTopologies.push(acc);
            }
        }
    }


}

function updateMaxPossibleComp() {

    for (var m of allMono){
        maxComp[m] = 0;
    }

    for (var acc of topTopology){

        var thisComp = data[acc].comp;
        var f = true;
        var currentComp = JSON.parse(JSON.stringify(monofreq));

        for (var mc of allMono) {
            if (currentComp[mc] > thisComp[mc]) {
                f = false;
            }
        }


        if (f){
            for (var m of allMono){
                if (thisComp[m] > maxComp[m] ){
                    maxComp[m] = thisComp[m]
                }
            }


        }
    }

}

function afterCompostionChanged() {
    updateMaxPossibleComp();
    findMatchedTopLeverTopology();
    cacheNextMonoCompositionOfMatedTopology();
}

function monofreq2str(freq) {
    var res = "";
    for (var m of allMono){
        if (freq[m] > 0){
            res += m+freq[m].toString();
        }
    }
    return res
}

function cacheNextMonoCompositionOfMatedTopology() {
    for (var m of allMono){
        var nextMonoConfig = JSON.parse(JSON.stringify(monofreq));
        if (['GlcNAc', 'GalNAc', 'ManNAc'].includes(m)){
            nextMonoConfig["HexNAc"] += 1;
        }
        else if (['Glc', 'Gal', 'Man'].includes(m)){
            nextMonoConfig["Hex"] += 1;
        }
        nextMonoConfig[m] += 1;

        var monoCompStr = monofreq2str(nextMonoConfig);
        if (Object.keys(cacheForMatchedTopology).includes(monoCompStr)){
            continue
        }
        var matchedTopologyForNextLevel = [];
        for (var acc of topTopology){
            if (compositionMatch(data[acc].comp, nextMonoConfig)){
                matchedTopologyForNextLevel.push(acc);
            }
        }

        cacheForMatchedTopology[monoCompStr] = matchedTopologyForNextLevel;
    }
}


function resizeContainer() {
    var width = leftPanel.clientWidth + rightPanel.getElementsByTagName("table")[0].clientWidth;
    var height = Math.max(leftPanel.clientHeight, rightPanel.clientHeight);

    if (width == 0){
        width = document.documentElement.clientWidth;
    }
    if (height == 0){
        height = document.documentElement.clientHeight;
    }
    //console.log(width, height);

    container.style.height = height + 5 + "px";
    container.style.width = width + 15 + "px";

}

function updateRightPanel() {
    var colnum = parseInt((window.innerWidth - 135) / 210);
    if (colnum == 0) {
        colnum == 1
    }

    rightPanel.innerHTML = "";

    var table = document.createElement("table");
    var row = document.createElement("tr");
    var c = 0;
    matchedTopologies.sort(function (a, b) {
        return data[a].decedentNum - data[b].decedentNum
    });

    for (var gtcid of matchedTopologies) {
        var f = getImage(gtcid);
        var td = document.createElement("td");

        td.appendChild(f);
        c++;
        if (c % colnum != 0) {
            row.appendChild(td);
        } else {
            row.appendChild(td);
            table.appendChild(row);
            row = document.createElement("tr");
        }

    }
    if (c % colnum != 0) {
        table.appendChild(row);
    }
    rightPanel.appendChild(table);

    resizeContainer();
}


function keyPress() {
    var d = document.getElementsByTagName("body")[0];
    d.onkeypress = function (e) {
        if (Object.keys(keyMap).includes(e.key.toLowerCase())) {
            var num = 1;
            if (e.shiftKey) {
                num = -1;
            }
            compositionChange(keyMap[e.key.toLowerCase()], num);
        } else {
            // Not capturing
        }
    }
}

function statusLog(t, gtcid) {
    var p = "?";
    if (t == "comp") {
        for (var iupac of allMono) {
            var c = monofreq[iupac];
            if (c != 0) {
                p += iupac + "=" + c.toString() + "&";
            }
        }
        p = p.slice(0, p.length - 1)
    } else if (["composition", "topology", "saccharide"].includes(t)) {
        p += t + "=" + gtcid;
    }
    if (p.length < 3) {
        p = location.protocol + '//' + location.host + location.pathname;
    }
    history.pushState({}, null, p);
}

function updateUpper() {
    showAndHideButton.style = cssButtonHide;
    leftTurnButton.style = cssButtonHide;
    rightTurnButton.style = cssButtonHide;
    hgvcontainer.style = cssBottomHide;

    panelcontainer.style = cssUpperShow;

    afterCompostionChanged();
    updateLeftPanel();
    updateRightPanel();
    statusLog("comp");
}

function showUpper() {
    showAndHideButton.style = cssButtonHide;
    leftTurnButton.style = cssButtonHide;
    rightTurnButton.style = cssButtonHide;
    hgvcontainer.style = cssBottomHide;

    panelcontainer.style = cssUpperShow;

    resizeContainer();
}

function lowerPrep() {
    var figures = rightPanel.getElementsByTagName("figure");
    for (var figure of figures) {
        figure.style = "border-style: none; margin: 0;";
    }

    panelcontainer.style = "display: none";

    showAndHideButton.style = cssButtonShow;
    leftTurnButton.style = cssButtonShowL;
    rightTurnButton.style = cssButtonShowR;
    var w = document.documentElement.clientWidth - 20;
    var h = document.documentElement.clientHeight - 25;

    hgvcontainer.style = "border-style: none; border-color: lightgrey; width: " + w + "px; right: 0; height: " + h + "px";

}

function showLower(acc) {
    lowerPrep();
    statusLog(data[acc].type, acc);

    //document.getElementById("img_" + acc).style = "border-style: solid; border-color: rgb(42,124,233); margin: 0;";


    var component = {};
    var parent = [];

    for (var p of Object.keys(data)){
        if (data[p].children.includes(acc)){
            parent.push(p);
        }
    }

    var children = data[acc].children;

    var allNodes = parent.concat(children);
    allNodes.push(acc);
    allNodes.push("Pseudo");

    var nodes = {};
    for (var n of allNodes){
        nodes[n] = {"name": n};
        if (n == "Pseudo"){
            nodes[n].type = "Pseudo";
            nodes[n].hidden = true;
        }else{
            nodes[n].type = data[n].type;
        }
    }

    var edges = {};
    for (var n of parent){
        var e = {};
        e.from = n;
        e.to = acc;
        e.type = "contains";
        edges[n] = [e];
    }
    var temp = [];
    for (var n of children){
        var e = {};
        e.from = acc;
        e.to = n;
        e.type = "contains";
        temp.push(e);
    }
    if (children.length > 0){
        edges[acc] = temp;
    }

    var temp2 = [];

    if(parent.length > 0){
        for (var n of parent){
            var e = {};
            e.from = "Pseudo";
            e.to = n;
            e.type = "contains";
            temp2.push(e);

            var e2 = {};
            e2.from = n;
            e2.to = acc;
            e2.type = "contains";
            edges[n] = [e2];
        }
    }else{
        var e = {};
        e.from = "Pseudo";
        e.to = acc;
        e.type = "contains";
        temp2.push(e);
    }
    edges["Pseudo"] = temp2;
    console.log(nodes);
    console.log(edges);
    component["nodes"] = nodes;
    component["edges"] = edges;
    component["root"] = "Pseudo";

    option.essentials.component = component;
    glycanviewer.init(option);

    // glycanviewer.network.on("click", captureClickNode);

    function captureClickNode(x) {
        if (x.nodes.length > 0) {
            var accx = x.nodes[0];
            var glycanType = data[accx].type;

            statusLog(glycanType, accx);
        }
    }
    function highlight(x) {
        glycanviewer.network.selectNodes([x]);
    }
    setTimeout(highlight, 1500, acc);
    // console.log(parent, acc, children)
}



function init() {
    getParaFromURL();
    allcateDIV();
    keyPress();
    dataPreprocess();


    var altOri = getCookie("orientation");
    if (altOri){
        option.display.orientation = parseInt(altOri);
    }

    for (var m of allMono) {
        monofreq[m] = 0;
    }

    var iupacCompositionInitFlag = false;
    for (var iupac of allMono) {
        if (Object.keys(urlPara).includes(iupac)) {
            iupacCompositionInitFlag = true;
            break
        }
    }

    if (Object.keys(urlPara).includes("saccharide")) {
        lowerInit(urlPara["saccharide"]);
    } else if (Object.keys(urlPara).includes("topology")) {
        lowerInit(urlPara["topology"]);
    }else if (Object.keys(urlPara).includes("focus")) {
        lowerInit(urlPara["focus"]);
    } else if (Object.keys(urlPara).includes("composition")) {
        glytoucanCompositionInit()
    } else if (iupacCompositionInitFlag) {
        iupacCompositionInit();
    } else {
        normalInit();
    }
}

function normalInit() {
    afterCompostionChanged();
    updateUpper();
}

function lowerInit(acc) {
    for (var m of allMono){
        monofreq[m] = data[acc].comp[m];
    }

    updateUpper();
    showLower(acc);
}

function iupacCompositionInit(){

    for (var m of Object.keys(urlPara)){
        if (allMono.includes(m)){
            monofreq[m] = parseInt(urlPara[m]);
        }
    }

    updateUpper();
}


function glytoucanCompositionInit() {
    monofreq = data[urlPara["composition"]].comp;
    updateUpper();
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return false;
}

function turn(num) {
    var ori = option.display.orientation;

    var add = {1: 2, 2: 3, 3: 4, 4: 1};
    var sub = {1: 4, 2: 1, 3: 2, 4: 3};
    var newOri = "";
    if (num>0){
        newOri = add[ori];
    }
    else{
        newOri = sub[ori];
    }
    option.display.orientation = newOri;
    setCookie("orientation", newOri, 365);
    glycanviewer.init(option);
}


init();
