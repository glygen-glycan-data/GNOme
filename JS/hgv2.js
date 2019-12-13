"use strict";

var glycanviewer = {
    // The "global variables" are declared here
    // It is not necessary to do so
    // It is just a reminder of I can use this "things" directly

    firstInit: true,
    // A list of div in HTML page. save the trouble of document.getElement blah blah
    div_root: 0,
    div_header: 0,
    div_img: 0,
    div_network: 0,
    div_navi: 0,

    // Parameters from HTML file
    para: 0,
    // A portion of json file that will be used to build the network
    component: 0,
    // Things related to the network
    rootname: 0,
    topoonly: 0,
    rootlevel: 0,
    displaynodes: 0,
    verticalSpace: 0,
    horizontalSpace: 0,

    // Image cache
    resourceStatus: {},
    nodeImg: {},
    imageWidth: [],
    imageHeight: [],


    // Network canvas
    naviNetwork: 0,



    // Constant
    brokenImageSubstituentBase64: "",

    init: function (parameters) {
        if (this.IEQuestionMark())
        {
            this.compatibleDraw(parameters);
        }
        else {
            this.para = this.paraCheck(parameters);
            this.allocateDiv();
            this.dataPreProcessing();
        }
    },

    // Check the integrity and legitimacy of the parameters
    paraCheck : function (para){
        var checked = para;
        if (!para.display.naviOption.size){
            checked.display.naviOption.size = 0.15;
        }
        if (!para.display.naviOption.postion){
            checked.display.naviOption.postion = 4;
        }
        if (![1,2,3,4].includes(para.display.naviOption.postion)){
            checked.display.naviOption.postion = 4;
        }
        if (para.essentials.useGlyTouCanAsImageSource){
            if (!["extended","normal","compact"].includes(para.essentials.GlyTouCanImagePara.style)){
                checked.essentials.GlyTouCanImagePara.style = "extended";
            }
            if (!["png","jpg"].includes(para.essentials.GlyTouCanImagePara.format)){
                checked.essentials.GlyTouCanImagePara.format = "png";
            }
            if (!["cfg","cfgbw","uoxf","uoxf-color","cfg-uoxf","iupac"].includes(para.essentials.GlyTouCanImagePara.notation)){
                checked.essentials.GlyTouCanImagePara.notation = "cfg";
            }
        }
        if (![1,2,3,4].includes(para.display.orientation)){
            checked.display.orientation = 1;
        }
        return checked
    },

    // Allocate the DIV
    allocateDiv: function () {
        var thisLib = this;

        // This variable stands for the prefix of the div id.
        var id = this.para.essentials.div_ID + "_glycanviewer_";

        //Locate the div && pre allocate space for each gadgets
        this.div_root = document.getElementById(thisLib.para.essentials.div_ID);
        while (thisLib.div_root.firstChild){
            thisLib.div_root.removeChild(thisLib.div_root.firstChild);
        }
        this.div_root.style.overflow = "hidden";

        this.div_header = document.createElement("div");
        this.div_header.setAttribute("id",id+"header");

        this.div_realStuff = document.createElement("div");
        this.div_realStuff.setAttribute("id",id+"realStuff");
        this.div_realStuff.style = "width: 100%; height: 100%; position: relative; left: 0; top: 0;";

        this.div_network = document.createElement("div");
        this.div_network.setAttribute("id",id+"container");
        this.div_network.style = "width: 100%; height: 100%;position: relative; left: 0; top: 0;";
        this.div_navi = document.createElement("div");
        this.div_navi.setAttribute("id",id+"navi");
        //this.div_navi.style = "position: absolute; left: 0; top: 0; float: right; width: 100%; height: 100%";
        this.div_contextMenu = document.createElement("div");
        this.div_contextMenu.setAttribute("id",id+"contextMenu");

        this.div_realStuff.appendChild(this.div_network);
        this.div_realStuff.appendChild(this.div_navi);
        this.div_realStuff.appendChild(this.div_contextMenu);

        this.div_root.appendChild(this.div_header);
        this.div_root.appendChild(this.div_realStuff);
    },


    dataPreProcessing: function(){
        var thisLib = this;

        this.component = this.para.essentials.component;
        var topoonly = this.para.essentials.topoOnly;

        var component = this.component;
        var rootname = component.root;
        this.rootname = rootname;


        if (this.para.essentials.viewRoot){
            rootname = this.para.essentials.viewRoot;
        }

        this.levelCalculation(component, rootname);
        this.network = new vis.Network(thisLib.div_network);


        // After all images are cached (allow some of them not found), the rest pipeline are proceed by resourceSync
        this.cacheImage();

    },

    levelCalculation: function(component, rootname){
        var rootlevel = 0;
        var thisLevel = 0;
        var thisLevelNodes = [ rootname ];
        var nextLevelNodes = [];
        var displaynodes = {};

        // Change all nodes level to undefined
        for (var node in component.nodes){
            var a = component.nodes[node].level;
            component.nodes[node].level = 1;
            var b = component.nodes[node].level;
        }

        while (thisLevelNodes.length > 0){
            for(var i=0; i < thisLevelNodes.length; i++){
                var currentNode = thisLevelNodes[i];
                var edgesOfCurrentNode = component.edges[currentNode];
                if ( edgesOfCurrentNode != undefined ){
                    for (var currentEdgeIndex in edgesOfCurrentNode){
                        var currentEdge = edgesOfCurrentNode[currentEdgeIndex];
                        nextLevelNodes.push(currentEdge.to);
                        component.nodes[ currentNode ].level = thisLevel;
                        if (thisLevel < 10001 ){
                            displaynodes[ currentNode ] = 1;
                        }
                        else{
                            displaynodes[ currentNode ] = 0;
                        }
                    }
                }
                else{
                    component.nodes[ currentNode ].level = thisLevel;

                    if (thisLevel < 10000 ){
                        displaynodes[ currentNode ] = 1;
                    }
                    else {
                        displaynodes[currentNode] = 0;
                    }
                }
                //var debug = "Node: " +currentNode + " is set to level-" + thisLevel;
                //console.log(debug);

            }



            thisLevelNodes = nextLevelNodes;
            nextLevelNodes = [];
            thisLevel += 1;
        }

        for (var node of Object.keys(component.nodes)){
            if (node.includes("3dots")){
                component.nodes[node].level -= 0.33;
            }
        }

        this.rootlevel = rootlevel;
        this.displaynodes = displaynodes;
        this.component = component;
    },

    getImageURL: function(acc){
        var imgURL = "";

        if (this.para.essentials.useGlyTouCanAsImageSource){
            imgURL = "https://glytoucan.org/glycans/" + acc + "/image?";
            imgURL += "style=" + this.para.essentials.GlyTouCanImagePara.style;
            imgURL += "&format=" + this.para.essentials.GlyTouCanImagePara.format;
            imgURL += "&notation=" + this.para.essentials.GlyTouCanImagePara.notation;
        }else {
            imgURL = this.para.essentials.imgURL1 + acc + this.para.essentials.imgURL2;
        }
        return imgURL
    },

    cacheImage: function(){
        var thisLib = this;
        var component = this.component;
        var nodes = component.nodes;

        for (var node in component.nodes) {
            var nodeAcc = component.nodes[node].name;
            this.resourceStatus[nodeAcc] = false;
        }

        for (var node in component.nodes) {

            var nodeContent = component.nodes[node];
            var nodeAcc = component.nodes[node].name;

            var imageURL = "";
            if (nodeContent.alternativeImageURL){
                imageURL = nodeContent.alternativeImageURL;
            }
            else {
                imageURL = this.getImageURL(nodeAcc);
            }
            nodeContent.imageURL = imageURL;

            var imgEle = document.createElement("img");
            imgEle.name = nodeAcc;
            imgEle.src = imageURL;
            imgEle.onload = function(){
                thisLib.imageHeight.push(this.height);
                thisLib.imageWidth.push(this.width);

                thisLib.resourceStatus[this.name] = true;
                thisLib.resourceSync();
            };
            imgEle.onerror = function(){
                // Do something while image can not be found?
                thisLib.imageHeight.push(undefined);
                thisLib.imageWidth.push(undefined);

                thisLib.resourceStatus[this.name] = true;
                thisLib.resourceSync();
            };

        }


    },

    resourceSync: function(){
        var thisLib = this;

        var proceed = true;
        for (var key in this.resourceStatus){
            if (!this.resourceStatus[key]){
                proceed = false;
            }
        }

        if (proceed){
            this.displayTitle();
            this.layoutCalculation();
            var options = this.visOptionGenerate();
            var data = this.createNodeAndEdges();
            this.data = data;
            this.options = options;

            this.network.setOptions(options);

            this.forceRedraw(true);


            this.doubleClickEvent();

            if (this.para.contextMenu.enable){
                if (this.para.contextMenu.defaultMenu){
                    this.defaultContextMenu();
                }
                else{
                    this.customizedContextMenu();
                }
            }
        }
    },

    displayTitle: function(){
        var rootname = this.rootname;
        var component = this.component;

        if (this.para.display.enableTitle){
            var header = document.createElement("h2");
            header.style = "margin: 1px;";
            this.div_header.appendChild(header);
            header.innerHTML = rootname + " (" + component.mw + ") - " + "Level " + component.nodes[rootname].level;
        }
    },

    layoutCalculation: function(){
        var allWidth = this.imageWidth;
        var allHeight = this.imageHeight;

        allWidth.sort(function(a, b){return b-a});
        allHeight.sort(function(a, b){return b-a});
        var greatestWidth = allWidth[0];
        var greatestHeight = allHeight[0];

        // vertical space is the distance between 2 level
        // horizontal space is the distance between the center of 2 image
        var horizontalSpace, verticalSpace;

        if (greatestWidth != undefined && greatestHeight != undefined ){
            if ([2,4].includes(this.para.display.orientation)){
                verticalSpace = greatestWidth * 1.3;
                horizontalSpace = greatestHeight * 1.3 + 30; // Extra 35 is for the label
            }
            else{
                horizontalSpace = greatestWidth * 1.05;
                verticalSpace = greatestHeight * 1.3 + 30; // Extra 35 is for the label
            }
        }
        else{

            verticalSpace = 220;
            horizontalSpace = 400;
        }

        // console.log(greatestHeight, greatestWidth);
        // console.log(verticalSpace, horizontalSpace);

        this.verticalSpace = verticalSpace;
        this.horizontalSpace = horizontalSpace;
    },

    visOptionGenerate: function(){
        var thisLib = this;
        var option_template = {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    enabled: true,
                    levelSeparation: thisLib.verticalSpace, // the default value is 150
                    nodeSpacing: thisLib.horizontalSpace // might be affected by physics engine, default value 100
                }
            },
            manipulation: {
                enabled: false,
                initiallyActive: true,
                addNode: false,
                addEdge:  function(edgeData,callback) {
                    console.log(JSON.stringify(edgeData,null,4));
                    var lvl = nodes._data[edgeData.from].level;
                    d3.values(edges._data).forEach(function (e) {
                        if ((e.to == edgeData.to) && (e.id != edgeData.id)) {
                            if (nodes._data[e.from].level > lvl) {
                                lvl = nodes._data[e.from].level;
                            }
                        }
                    });
                    nodes._data[edgeData.to].level = (lvl + 1);
                    callback(edgeData);
                    forceredraw(false);
                },
                editEdge: function(edgeData,callback) {
                    console.log(JSON.stringify(edgeData,null,4));
                    var lvl = nodes._data[edgeData.from].level;
                    d3.values(edges._data).forEach(function (e) {
                        if ((e.to == edgeData.to) && (e.id != edgeData.id)) {
                            if (nodes._data[e.from].level > lvl) {
                                lvl = nodes._data[e.from].level;
                            }
                        }
                    });
                    nodes._data[edgeData.to].level = (lvl + 1);
                    callback(edgeData);
                    forceredraw(false);
                },
                deleteEdge: function(edgeData,callback){
                    callback(edgeData);
                    forceredraw(false);
                }
            },
            physics: {
                enabled: false,
                hierarchicalRepulsion: {
                    springConstant: 0.3,
                    nodeDistance: thisLib.horizontalSpace
                }
            },
            interaction: {
                dragNodes: true,
            },
            nodes: {
                borderWidth: 2,
                borderWidthSelected: 2,
                chosen: true,
                color: {
                    border: '#FFFFFF',
                    background: '#FFFFFF',
                    highlight: {
                        border: '#2B7CE9',
                        background: '#FFFFFF'
                    },
                    hover: {
                        border: '#2B7CE9',
                        background: '#FFFFFF'
                    }
                }
            }
        };


        var orientationDict = {1:"UD", 2:"LR", 3:"DU", 4:"RL"};
        var orientationValue = orientationDict[this.para.display.orientation];
        option_template.layout.hierarchical.direction = orientationValue;

        return option_template
    },

    createNodeAndEdges: function(){
        var thisLib = this;
        var component = this.component;
        var rootlevel = this.rootlevel;
        var displaynodes = this.displaynodes;

        var nodes = new vis.DataSet();
        d3.keys(component.nodes).forEach(function (k) {
            var d = component.nodes[k];
            //d.id = d.id;
            //d.label = d.label;
            d.level -= rootlevel;
            d.shape = 'image';

            d.id = d.name;

            if (d.label){}
            else{
                d.label = d.name;
            }

            d.borderColor = "#FFFFFF";
            d.shapeProperties = {
                useBorderWithImage: true,
                useImageSize: true
            };

            d.image = d.imageURL;

            //d.brokenImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII";

            if (d.name == "Pseudo"){
                d.label = "";
                d.hidden = true;
            }


            if (displaynodes[k] != 1) {
                // d.hidden = true;
            } else {
                // d.hidden = false;
                if (d.name != "Pseudo"){
                    nodes.update(d);
                }
            }
        });

        var edges = new vis.DataSet();
        d3.keys(component.edges).forEach(function (k) {
            component.edges[k].forEach(function(e) {
                if (k == "Pseudo"){
                    e.hidden = true;
                }
                e.arrows = 'middle';
                if (e.type == 'equals') {
                    e.color = {color:'red'};
                } else if (e.type == 'contains') {
                    e.color = {color: 'blue'};
                }else{
                    e.color = {};
                }
                if ((e.to in displaynodes) && (e.from in displaynodes)){
                    if (k != "Pseudo"){
                        edges.update(e);
                    }

                }
            });
        });

        this.nodes = nodes;
        this.edges = edges;

        // create a data set for network
        var data = {
            nodes: nodes,
            edges: edges
        };

        return data
    },

    forceRedraw: function(init){
        var thisLib = this;
        thisLib.network.setData(thisLib.data);
        function drawNavi(){
            if (init){
                thisLib.network.fit(thisLib.naviInitial());
            }
            else {
                thisLib.naviInitial();
            }
        }
        function temp(){
            setTimeout(drawNavi,50);
        }
        if (thisLib.para.display.enableNavi ){
            thisLib.network.once('afterDrawing', temp, false);
        }
    },


    // *********************************************************
    // ******* Function for interacting with the canvas ********
    // *********************************************************

    doubleClickEvent: function(){
        var thisLib = this;

        thisLib.network.on("doubleClick", function (clickData) {
            zoomWhenDoubleClicked(clickData, thisLib.para)
        });
        function zoomWhenDoubleClicked(data, para) {
            var selectnode = data.nodes;

            if (selectnode.length>0){
                if (!selectnode[0].includes("dot")){
                    para.cbtn.showLower(selectnode[0], true);
                }
            }
        }
    },

    doubleClickEventOld: function(){
        var thisLib = this;

        thisLib.network.on("doubleClick",zoomWhenDoubleClicked);
        function zoomWhenDoubleClicked(data){
            var selectnode = data.nodes;
            var connectednode = [];
            if (selectnode.length > 0){
                connectednode = thisLib.network.getConnectedNodes(selectnode);
                connectednode.push(selectnode);
            }

            if (connectednode.length > 1) {
                thisLib.network.fit({
                    nodes: connectednode,
                    animation: true
                });
            }

            function w1() {
                thisLib.whereAmI();
            }
            setTimeout(w1,1500);
        }

        thisLib.network.on("doubleClick",highlightWhenDoubleClicked);
        function highlightWhenDoubleClicked(data){
            var selectnode = data.nodes;
            if (selectnode == undefined){
                selectnode = [];
            }
            if (selectnode.length > 0){
                var highLightNodes = [];
                selectnode.forEach(function(node){
                    var connectedNodes = thisLib.network.getConnectedNodes(node);
                    highLightNodes = highLightNodes.concat(connectedNodes);
                    highLightNodes.push(node);
                });

                highLightNodes.forEach(function(nodeID){
                    // Alternative way to highlight the node - Enlarge the node
                    //nodes._data[nodeID].size = nodes._data[nodeID].size * 1.5;
                });

                thisLib.network.selectNodes(highLightNodes);

                //forceredraw(false);

            }
        }
    },

    defaultContextMenu: function(){
        var thisLib = this;
        // Context menu, pop-up when you right click
        // The default context menu give you to chance to change to sub graph view
        thisLib.div_network.addEventListener("contextmenu",rightClickMenuGenerator,false);

        function rightClickMenuGenerator(clickData){
            //console.log(clickData);
            document.addEventListener("click",clearEverythingInContextMenu,{once: true});

            // boolDisplayAll = true;

            var menuELE = thisLib.div_contextMenu;
            var menuList = document.createElement("dl");

            clearEverythingInContextMenu();
            //var x = clickData.pointer.DOM.x;
            //var y = clickData.pointer.DOM.y;
            var x = clickData.layerX;
            var y = clickData.layerY;
            clickData.preventDefault();

            var root = thisLib.rootname;
            //var selectedNodes = thisLib.network.getSelectedNodes();
            var selectedNode = thisLib.network.getNodeAt({x:x,y:y});
            var selectedNodes = [ selectedNode ];
            var connectedNodes = [];

            //updateList("Close Menu","dt");
            menuELE.style = "margin: 0; padding: 0; overflow: hidden; position: absolute; left: "+x+"px; top: "+y+"px; background-color: #333333; border: none; ";//width: 100px; height: 100px

            updateList("Jump to Composition:", "dt");
            updateList(root, "dd");

            if (selectedNode !== undefined){
                selectedNodes.forEach(function(nodeID){
                    var c0 = thisLib.network.getConnectedNodes(nodeID);
                    connectedNodes = connectedNodes.concat(c0);
                });

                updateList("Jump to Selected Nodes:","dt");
                selectedNodes.forEach(function(nodeID){
                    updateList(nodeID,"dd");
                });

                if (connectedNodes.length > 0){
                    updateList("Jump to Connected Nodes:","dt");
                    connectedNodes.forEach(function(nodeID){
                        updateList(nodeID,"dd");
                    });
                }
            }

            menuELE.appendChild(menuList);

            function updateList(id,DOMType){
                // dds are used to call functions
                // dts are just descriptive words

                var entry = document.createElement(DOMType);
                entry.style = "display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                entry.onmouseover = function(d){
                    entry.style = "display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
                };
                entry.onmouseout = function(d){
                    entry.style = "display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
                };
                entry.innerHTML = id;
                if(id == "Close Menu"){
                    entry.onclick = function(){
                        clearEverythingInContextMenu();
                    }
                }
                else if (DOMType == "dd"){
                    entry.onclick = function(){
                        var para = thisLib.para;
                        para.essentials.viewRoot = id;
                        thisLib.init(para)
                    }
                }
                menuList.appendChild(entry);
                return 0;

            }


        }

        function clearEverythingInContextMenu(){
            //console.log("closing");
            var menuELE = thisLib.div_contextMenu;
            while (menuELE.firstChild){
                menuELE.removeChild(menuELE.firstChild);
            }
            menuELE.style = "";
        }
    },

    customizedContextMenu: function(){
        var thisLib = this;
        // Context menu, pop-up when you right click
        // The default context menu give you to chance to change to sub graph view
        thisLib.div_network.addEventListener("contextmenu", function (clickData){
            rightClickMenuGenerator(clickData, thisLib.para);
        }, false);

        function rightClickMenuGenerator(clickData, para){
            //console.log(clickData);
            document.addEventListener("click",clearEverythingInContextMenu,{once: true});

            var menuELE = thisLib.div_contextMenu;
            var menuList = document.createElement("dl");

            clearEverythingInContextMenu();

            var x = clickData.layerX;
            var y = clickData.layerY;
            clickData.preventDefault();

            var root = thisLib.rootname;
            //var selectedNodes = thisLib.network.getSelectedNodes();
            var selectedNode = thisLib.network.getNodeAt({x:x,y:y});
            var selectedNodes = [ selectedNode ];
            var connectedNodes = [];

            if (selectedNode !== undefined && selectedNode !== "Topology" && !selectedNode.startsWith("fake") && !selectedNode.endsWith("3dots")){

            }else{
                return
            }

            var pureGTCre = /^G\d{5}\w{2}$/;
            var pureGTCres = selectedNode.match(pureGTCre);
            if (Array.isArray(pureGTCres) && pureGTCres.length == 1){
                var entry = document.createElement("dt");
                entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                entry.onmouseover = function(d){
                    this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
                };
                entry.onmouseout = function(d){
                    this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
                };
                entry.innerHTML = "Copy accession to clipboard"; //change the description
                entry.name = selectedNode;

                entry.onclick = function(){
                    var nodeID = this.name;

                    const el = document.createElement('textarea');
                    el.value = nodeID;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);

                };
                menuList.appendChild(entry);
            }

            //updateList("Close Menu","dt");
            menuELE.style = "margin: 0; padding: 0; overflow: hidden; position: absolute; left: "+x+"px; top: "+y+"px; background-color: #333333; border: none; ";//width: 100px; height: 100px

            var entry = document.createElement("dt");
            entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
            entry.innerHTML = "Go to:";
            menuList.appendChild(entry);

            var nojumpflag = true;
            var externalLinks = para["contextMenu"]["externalLinks"];
            for (var externalLink of externalLinks){
                var title = externalLink["title"] || "";
                var prefix = externalLink["prefix"] || "";
                var suffix = externalLink["suffix"] || "";
                var accs = externalLink["accessions"];

                if (selectedNode !== undefined && selectedNode !== "Topology" && !selectedNode.startsWith("fake") && !selectedNode.endsWith("3dots")){
                    var entry = document.createElement("dt");
                    entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                    entry.onmouseover = function(d){
                        this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
                    };
                    entry.onmouseout = function(d){
                        this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
                    };
                    entry.innerHTML = " - " + title; //change the description
                    entry.name = selectedNode;
                    entry.setAttribute("data-prefix", prefix);
                    entry.setAttribute("data-suffix", suffix);

                    entry.onclick = function(){
                        var nodeID = this.name;
                        var pre = this.getAttribute("data-prefix");
                        var suf = this.getAttribute("data-suffix");
                        var externalURL = pre + nodeID + suf;
                        window.open(externalURL);
                    };

                    var existFlag = false;
                    if (accs == undefined){
                        existFlag = true;
                    }
                    else if (accs.includes(selectedNode)){
                        existFlag = true;
                    }

                    if (existFlag){
                        nojumpflag = false;
                        menuList.appendChild(entry);
                    }
                }
            }
            /*
            if (nojumpflag){
                var entry = document.createElement("dt");
                entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                entry.innerHTML = "Sorry, no link available.";
                var menuList = document.createElement("dl");
                menuList.appendChild(entry);
            }

             */
            menuELE.appendChild(menuList);


        }

        function clearEverythingInContextMenu(){
            //console.log("closing");
            var menuELE = thisLib.div_contextMenu;
            while (menuELE.firstChild){
                menuELE.removeChild(menuELE.firstChild);
            }
            menuELE.style = "";
        }

    },

    // *********************************************************
    // ******************* Mini Map Function *******************
    // *********************************************************

    // The "global variables" for Mini-map are declared here
    fitScale : 0,
    fitPos : 0,
    rectPointer : 0,
    naviWindowWidth : 0,
    naviWindowHeight : 0,

    naviInitial : function (){
        var thisLib = this;
        var currentScale = this.network.getScale();
        var currentPos = this.network.getViewPosition();

        while(thisLib.div_navi.firstChild){
            thisLib.div_navi.remove(thisLib.div_navi.firstChild)
        }

        var css = thisLib.naviWindowPos() + " background-color: #f2ffff; height: "+ thisLib.naviWindowHeight + "px; width: " + thisLib.naviWindowWidth + "px;";
        thisLib.div_navi.style = css;

        var naviNetworkContainer = document.createElement("div");
        naviNetworkContainer.style = "position: absolute; border: 1px solid lightgray; height: 100%; width: 100%";

        thisLib.div_navi.appendChild(naviNetworkContainer);
        var naviNetwork = new vis.Network(naviNetworkContainer);
        var data, nodes, edges, options;
        data = thisLib.data;
        options = thisLib.options;
        naviNetwork.setOptions(options);
        naviNetwork.setData(data);
        glycanviewer.network.selectNodes(thisLib.para.essentials.highLightedNodes);

        thisLib.naviNetwork = naviNetwork;


        thisLib.rectPointer = document.createElement("canvas");
        thisLib.rectPointer.setAttribute("style","position: absolute; border: 1px solid lightgray;"); // border: 1px solid lightgray
        thisLib.rectPointer.setAttribute("width",thisLib.naviWindowWidth);
        thisLib.rectPointer.setAttribute("height",thisLib.naviWindowHeight);
        thisLib.rectPointer.setAttribute("id","glycanviewer_rect");

        thisLib.div_navi.appendChild(thisLib.rectPointer);

        thisLib.fitScale = thisLib.network.getScale();
        thisLib.fitPos = thisLib.network.getViewPosition();

        thisLib.whereAmI();


        //this.network.fit(capture());


        thisLib.naviNetwork.moveTo({
            position: {x:currentPos.x, y:currentPos.y},
            scale: currentScale * thisLib.para.display.naviOption.size * 0.95,
            offset: {x:0, y:0}
        });

        function capture(){
            var networkCanvas = thisLib.div_network.getElementsByTagName("canvas")[0];
            var image,
                dataURI = networkCanvas.toDataURL();
            thisLib.naviWindowSizeCalc();
            image = document.createElement('img');
            image.src = dataURI;
            image.width = thisLib.naviWindowWidth;
            image.height = thisLib.naviWindowHeight;
            image.setAttribute("style","position: absolute; background-color: #f2ffff; border: 1px solid lightgray;"); // border: 1px solid lightgray

            var navi = thisLib.div_navi;
            navi.setAttribute("style",thisLib.naviWindowPos());
            while (navi.childElementCount > 0) {
                navi.removeChild(navi.children[0]);
            }
            navi.appendChild(image);

            thisLib.rectPointer = document.createElement("canvas");
            thisLib.rectPointer.setAttribute("style","position: absolute; border: 1px solid lightgray;"); // border: 1px solid lightgray
            thisLib.rectPointer.setAttribute("width",thisLib.naviWindowWidth);
            thisLib.rectPointer.setAttribute("height",thisLib.naviWindowHeight);
            thisLib.rectPointer.setAttribute("id","glycanviewer_rect");

            navi.appendChild(thisLib.rectPointer);
            thisLib.fitScale = thisLib.network.getScale();
            thisLib.fitPos = thisLib.network.getViewPosition();
            moveBack();

        }

        function moveBack(){
            thisLib.network.moveTo(
                {
                    position: {x:0, y:0},
                    scale: currentScale,
                    offset: {x:0, y:0}
                },thisLib.whereAmI()
            );
            //console.log(currentPos);
            return 0;
        }
    },

    naviRefresh: function (movedNodes){

        var thisLib = this;
        var data = thisLib.createNodeAndEdges();

        thisLib.naviNetwork.setData(data);
        var pos =thisLib.network.getPositions();

        for (var id in pos){
            var x = pos[id]["x"];
            var y = pos[id]["y"];
            data.nodes.update([{id: id, x: x, y: y}]);
        }

        thisLib.naviNetwork.moveTo({
            position: {x:0, y:0},
            scale: 0.95 * thisLib.para.display.naviOption.size * thisLib.fitScale,
            offset: {x:0, y:0}
        });

    },

    whereAmI : function (){
        var thisLib = this;

        function wrapper1(x){
            //console.log(x.nodes);
            if (x.nodes.length>0){
                //thisLib.naviRefresh(x.nodes);
            }
        }

        working();
        //thisLib.div_network.eventListeners = null;
        thisLib.div_network.addEventListener('click', working);
        thisLib.div_network.addEventListener('wheel', working);
        thisLib.div_network.addEventListener('touchend', working);
        thisLib.network.on("dragEnd", wrapper1);

        function working(){
            var ctx = thisLib.rectPointer.getContext("2d");
            ctx.clearRect(0, 0, thisLib.rectPointer.width, thisLib.rectPointer.height);
            ctx.beginPath();

            var rectWidth, rectHeight, rectRatio, dx, dy;
            var canvas2thumbnailScale;
            var currentScale = thisLib.network.getScale();
            var currentPos = thisLib.network.getViewPosition();

            rectRatio = thisLib.fitScale / currentScale;
            rectWidth = thisLib.naviWindowWidth * rectRatio;
            rectHeight = thisLib.naviWindowHeight * rectRatio;

            var networkCanvas = thisLib.div_network.getElementsByTagName("canvas")[0];
            canvas2thumbnailScale = thisLib.naviWindowWidth / networkCanvas.width;

            dx = (currentPos.x - thisLib.fitPos.x)*thisLib.fitScale*canvas2thumbnailScale - 0.5*(rectWidth - thisLib.naviWindowWidth);
            dy = (currentPos.y - thisLib.fitPos.y)*thisLib.fitScale*canvas2thumbnailScale - 0.5*(rectHeight - thisLib.naviWindowHeight);

            // Consider page zooming issue
            // Not sure whether it will work with browser other than chrome
            var wholePageZoomLevel = thisLib.getZoomLevel();

            // This formula is use to compensate for window scale
            dx = (currentPos.x - thisLib.fitPos.x)*thisLib.fitScale*canvas2thumbnailScale * wholePageZoomLevel - 0.5*(rectWidth - thisLib.naviWindowWidth);
            dy = (currentPos.y - thisLib.fitPos.y)*thisLib.fitScale*canvas2thumbnailScale * wholePageZoomLevel - 0.5*(rectHeight - thisLib.naviWindowHeight);

            // complement the whole rectangle
            var x1, x2, y1, y2;
            x1 = (dx > 0)&&(dx < thisLib.naviWindowWidth);
            x2 = (dx+rectWidth > 0)&&(dx+rectWidth < thisLib.naviWindowWidth);
            y1 = (dy > 0)&&(dy < thisLib.naviWindowHeight);
            y2 = (dy+rectHeight > 0)&&(dy+rectHeight < thisLib.naviWindowHeight);

            // console.log([dx,dy]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "orange";
            ctx.rect(dx,dy,rectWidth,rectHeight);
            if (!x1){ctx.rect(1,dy,0,rectHeight);}
            if (!x2){ctx.rect(thisLib.naviWindowWidth - 1,dy,0,rectHeight);}
            if (!y1){ctx.rect(dx,1,rectWidth,0);}
            if (!y2){ctx.rect(dx,thisLib.naviWindowHeight - 1,rectWidth,0);}
            ctx.stroke();
        }

    },

    naviWindowSizeCalc : function (){
        var networkCanvas = this.div_network.getElementsByTagName("canvas")[0];
        var percentage = this.para.display.naviOption.size;
        var devicePixelRatio = window.devicePixelRatio;
        var w1 = Math.round(networkCanvas.width * percentage / devicePixelRatio);
        var h1 = Math.round(networkCanvas.height * percentage / devicePixelRatio);

        this.naviWindowWidth = w1;
        this.naviWindowHeight = h1;

        return 0;
    },

    getZoomLevel : function () {
        var level = this.div_network.getElementsByTagName("canvas")[0].width / this.div_root.clientWidth;
        return level
    },

    naviWindowPos : function (){
        this.naviWindowSizeCalc();
        var h = this.naviWindowHeight;
        var w = this.naviWindowWidth;
        var pos = this.para.display.naviOption.position;

        var tl2t = 0,
            tl2b = 0,
            tl2r = 0,
            tl2l = 0;
        var css = "position: absolute; ";

        if (pos == 1 || pos == 3){
            tl2l = w / 10;
            css += "left: "+tl2l+"px; "
        }

        if (pos == 2 || pos == 4){
            //tl2r = this.div_root.clientWidth - w * 1.1;
            tl2r = w / 10;
            css += "right: "+tl2r+"px; "
        }

        if (pos == 1 || pos == 2){
            tl2t = h / 10;
            css += "top: "+ tl2t +"px; "
        }

        if (pos == 3 || pos == 4){
            tl2b = h / 10;
            if (this.para.display.enableTitle)
            {
                tl2b = tl2b + 27;
            }
            css += "bottom: "+tl2b+"px; "
        }
        return css;
    },

    // *********************************************************
    // ******************* Helper  Function ********************
    // *********************************************************

    // *********************************************************
    // ********************** IE Related ***********************
    // *********************************************************

    IEQuestionMark : function(){
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        return (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
    },

    compatibleDraw : function(para){
        var component = para.essentials.component;

        var rootname = component.root;
        var topoonly = para.essentials.topoOnly;

        if (para.essentials.viewRoot){
            rootname = para.essentials.viewRoot;
        }
        recomputeLevels(component);

        function recomputeLevels(component) {
            var toexplore = [ component.root ];
            var r;
            while (true) {
                if (toexplore.length == 0) {
                    break;
                }
                r = toexplore.pop();
                var rlevel = component.nodes[r].level;
                if (r in component.edges) {
                    component.edges[r].forEach(function(e) {
                        if (component.nodes[e.to].level < (rlevel+1)) {
                            component.nodes[e.to].level = (rlevel+1);
                        }
                        toexplore.push(e.to);
                    });
                }
            }
        }

        // Loading the title
        var div_root = document.getElementById(para.essentials.div_ID);
        while(div_root.firstChild){
            div_root.removeChild(div_root.firstChild);
        }
        var id = para.essentials.div_ID + "_glycanviewer_";

        var networkContainer = document.createElement("div");
        networkContainer.id = id+"networkContainer";
        networkContainer.setAttribute("style","width: 100%; height: 90%;position: relative; left: 0; top: 0;");
        var header = document.createElement("h2");
        header.innerHTML = "For better user experience and new features, Please Please Please use modern browsers";

        div_root.appendChild(header);
        div_root.appendChild(networkContainer);

        var network = new vis.Network(networkContainer);

        var displaynodes = {};
        var toexplore = [ rootname ];
        var parentnode;
        var rootlevel = component.nodes[rootname].level;

        while (true) {
            if (toexplore.length == 0) {
                break;
            }
            var r = toexplore.pop();
            if (topoonly) {
                if (component.nodes[r].type != 'Saccharide') {
                    displaynodes[r] = 1;
                }
            } else {
                displaynodes[r] = 1;
            }
            d3.keys(component.edges).forEach(function (k) {
                component.edges[k].forEach(function(e) {
                    if (e.from == r) {
                        toexplore.push(e.to);
                    }
                    if (e.to == rootname) {
                        parentnode = e.from;
                    }
                })
            });
        }


        // Calculate the nodeSpace and height scale ratio
        var nodeImageScaleRatioComparedToDefaultSetting = 2.0, // It means how many fold larger do you want your node to present
            nodeHorizotalSpaceRatio = 0.95;
        // How many ford larger do you want the node space to be. 1 means just no overlap
        var allWidth = [],
            allHeight = [];
        var greatestWidth = 0,
            greatestHeight = 0;
        var verticalSpace = 150,
            horizontalSpace = 150; //those 2 values are default value

        d3.keys(component.nodes).forEach(function (k) {
            var d = component.nodes[k];
            if (displaynodes[k] == 1) {
                allWidth.push(d.width);
                allHeight.push(d.height);
            }
        });

        allWidth.sort(function(a, b){return b-a});
        allHeight.sort(function(a, b){return b-a});
        greatestWidth = allWidth[0];
        greatestHeight = allHeight[0];

        var magicNumberForHeightScaleRatio = greatestHeight/nodeImageScaleRatioComparedToDefaultSetting/25;
        horizontalSpace = 25 * nodeImageScaleRatioComparedToDefaultSetting / greatestHeight * greatestWidth * nodeHorizotalSpaceRatio *2;

        var nodes = new vis.DataSet();
        d3.keys(component.nodes).forEach(function (k) {
            var d = component.nodes[k];
            d.id = d.name;
            d.level -= rootlevel;
            d.shape = 'image';
            //d.image = "http://glytoucan.org/glycans/"+d.name+"/image?style=extended&format=png&notation=cfg";
            d.image = para.essentials.imgURL + d.name + '.png';

            d.size = d.height / magicNumberForHeightScaleRatio;
            d.labelHighlightBold = true;


            if (displaynodes[k] != 1) {
                d.hidden = true;
            } else {
                d.hidden = false;
                nodes.update(d);
            }
        });


        var edges = new vis.DataSet();
        d3.keys(component.edges).forEach(function (k) {
            component.edges[k].forEach(function(e) {
                e.arrows = 'middle';
                if (e.type == 'equals') {
                    e.color = {color:'red'};
                } else if (e.type == 'contains') {
                    e.color = {color: 'blue'};
                }
                edges.update(e);
            });
        });

        // create a network
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    enabled: true,
                    levelSeparation: verticalSpace, // the default value is 150
                    nodeSpacing: horizontalSpace // might be affected by physics engine, default value 100
                }
            }
        };

        network.setOptions(options);
        network.setData(data);
        network.fit()

    }

};
