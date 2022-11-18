"use strict";

let glycanviewer = {
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
                //thisLib.imageHeight.push(undefined);
                //thisLib.imageWidth.push(undefined);

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
                    Object.values(edges._data).forEach(function (e) {
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
                    Object.values(edges._data).forEach(function (e) {
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
        Object.keys(component.nodes).forEach(function (k) {
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
        Object.keys(component.edges).forEach(function (k) {
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
                    //para.cbtn.showLower(selectnode[0], true);
                    para.GNOmeBrowser.SetFocusAccession(selectnode[0]);
                    para.GNOmeBrowser.RefreshUI();
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

        var touchstartts;
        thisLib.div_network.addEventListener("touchstart", function (clickData){
            var d = new Date();
            touchstartts = d.getTime();
        }, false);

        thisLib.div_network.addEventListener("touchend", function (clickData){

            var d = new Date();
            var touchduration = d.getTime() - touchstartts;

            if (touchduration > 1000) {
                rightClickMenuGenerator(clickData, thisLib.para);
            }

        }, false);


        function CreateEntryPrimary(display, menuList) {
            var entry = document.createElement("dt");
            entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";

            entry.innerHTML = "&nbsp" + display;
            menuList.appendChild(entry)
            return entry
        }

        function CreateEntrySecondary(display, menuList) {
            var entry = CreateEntryPrimary("&nbsp&nbsp" + display, menuList);

            entry.onmouseover = function(d){
                this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
            };
            entry.onmouseout = function(d){
                this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
            };

            return entry
        }

        function ToClipBoard(str) {
            const el = document.createElement('textarea');
            el.value = str;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }

        function rightClickMenuGenerator(clickData, para){
            //console.log(clickData);
            document.addEventListener("click",clearEverythingInContextMenu,{once: true});

            var menuELE = thisLib.div_contextMenu;
            var menuList = document.createElement("dl");

            clearEverythingInContextMenu();

            // NEED to change if it is not working in full window mode
            var x = clickData.clientX;
            var y = clickData.clientY;
            var gnome = thisLib.para.GNOmeBrowser;

            var left = x;
            var top = y;
            if (y + 350 > window.innerHeight){
                top = window.innerHeight - 400;
            }
            clickData.preventDefault();

            // Approx width 150 * height 350
            menuELE.style = "margin: 0; padding: 0; overflow: hidden; position: absolute; left: "+left+"px; top: "+top+"px; background-color: #333333; border: none; width: 145px";//width: 100px; height: 100px


            var selectedNode = thisLib.network.getNodeAt({x:x,y:y});
            if (selectedNode == undefined || selectedNode == "Topology" || selectedNode.startsWith("fake") || selectedNode.startsWith("Query") || selectedNode.endsWith("3dots")){
                return
            }

            var pureGTCre = /^G\d{5}\w{2}$/;
            var pureGTCres = selectedNode.match(pureGTCre);

            CreateEntryPrimary("Copy:", menuList);

            if (Array.isArray(pureGTCres) && pureGTCres.length == 1){
                var entry = CreateEntrySecondary("Accession", menuList);
                entry.name = selectedNode;

                entry.onclick = function(){
                    ToClipBoard(this.name);
                };
            }

            var things = [
                ["Ancestors", gnome.GetAncestorsForCopy(selectedNode)],
                ["Descendants", gnome.GetDescendantsForCopy(selectedNode)]
            ];

            if (things[1][1].length == 1){
                things[1][1] = []
            }


            for (var thing of things){
                var title = thing[0];
                var targets = thing[1];

                if (targets.length > 1){
                    var entry = CreateEntrySecondary(title, menuList);

                    var strx = "";
                    for (var x of targets){
                        strx += x + "\n";
                    }
                    entry.name = strx;

                    entry.onclick = function(){
                        ToClipBoard(this.name);
                    };
                }
            }

            CreateEntryPrimary("Links:", menuList);

            var nojumpflag = true;
            var externalLinks = JSON.parse(JSON.stringify(para["contextMenu"]["externalLinks"]));

            var gnomepurl = {
                "name": "GNOme",
                "url_prefix": "http://purl.obolibrary.org/obo/GNO_",
                "url_suffix": "",
                "glycan_set": undefined,
            }
            externalLinks.splice(0, 0, gnomepurl);

            for (var externalLink of externalLinks){
                var title = externalLink["name"] || "";
                var prefix = externalLink["url_prefix"] || "";
                var suffix = externalLink["url_suffix"] || "";
                var accs = externalLink["glycan_set"];

                var existFlag = false;
                if (accs == undefined){
                    existFlag = true;
                }
                else if (accs.includes(selectedNode)){
                    existFlag = true;
                }

                if (!existFlag){
                    continue
                }

                var entry = CreateEntrySecondary(title, menuList);
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


            }


            CreateEntryPrimary("Browse:", menuList);
            var gnomejumptype = "Structure";
            if (gnome instanceof GNOmeStructureBrowser){
                gnomejumptype = "Composition"
            }

            var parentpath = window.location.pathname.split("/");
            parentpath = parentpath.slice(0, parentpath.length-1)
            parentpath = parentpath.join("/")


            var currenturl = window.location.pathname;
            var filename = currenturl.substring(currenturl.lastIndexOf('/')+1);
            var tmp = filename.split(".");

            var restriction = "";
            if (tmp.length == 3 && tmp[1].endsWith("Browser") && tmp[2] == "html"){
                restriction = tmp[0] + ".";
            }



            var externalURL = location.protocol
                + '//'
                +location.hostname
                +(location.port ? ':'+location.port: '')
                +parentpath
                + "/"
                + restriction + gnomejumptype + "Browser.html";

            if (gnomejumptype == "Structure"){
                externalURL += "?focus=" + selectedNode;
            } else {
                externalURL += "?";

                var buttons = gnome.SubsumptionData[selectedNode].ButtonConfig;

                for (var k of Object.keys(buttons)){
                    var count = buttons[k];
                    if (count != 0){
                        externalURL += k + "=" + count.toString() + "&";
                    }
                }
            }

            var entry =CreateEntrySecondary(gnomejumptype, menuList);
            entry.setAttribute("data-jumplink", externalURL);
            entry.onclick = function (){
                var externalURL = this.getAttribute("data-jumplink");
                window.open(externalURL);
            }

            menuELE.appendChild(menuList);

        }

        function clearEverythingInContextMenu(){
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
        thisLib.network.selectNodes(thisLib.para.essentials.highLightedNodes);

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
            Object.keys(component.edges).forEach(function (k) {
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

        Object.keys(component.nodes).forEach(function (k) {
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
        Object.keys(component.nodes).forEach(function (k) {
            var d = component.nodes[k];
            d.id = d.name;
            d.level -= rootlevel;
            d.shape = 'image';
            //d.image = "https://glytoucan.org/glycans/"+d.name+"/image?style=extended&format=png&notation=cfg";
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
        Object.keys(component.edges).forEach(function (k) {
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

function GNOmeBrowserBase (DIVID) {

    this.ContainerID = DIVID;

    // Primary Data
    this.SubsumptionData = {};
    this.IUPACCompositionData = {};
    this.TopLevelThings = [];
    this.Synonym = {};
    this.AllChildren = {};

    this.SubsumptionDataBackUp = {};


    // Tailored parameter for different browser
    this.AllItems = undefined;

    // Image and icon style
    this.IconStyle = "snfg";

    this.ImageURLPrefix = "https://glymage.glyomics.org/image/snfg/extended/";
    this.ImageURLSuffix = ".png";
    this.ImageGenerationSubmitURL = "https://glymage.glyomics.org/submit"
    this.ImageGenerationGetImageURL = "https://glymage.glyomics.org/getimage?"

    // this.ImageURLPrefix = "http://localhost:10985/image/snfg/extended/";
    // this.ImageURLSuffix = ".png";
    // this.ImageGenerationURL = "http://localhost:10985/getimage?"

    this.IconConfig;
    this.ImageComputed = {};


    // The data decides what to show
    this.ItemCount = {};
    this.ItemCountMax = {};
    this.MatchedGlycans = [];
    this.HighLightGlycans = [];
    this.SubsumptionNavigatorFocusAccession = "";
    this.DisplayScreen = 0;
    this.brand = null;
    this.ScreenATitle = "";
    this.ScreenBTitle = "GNOme Subsumption Navigator";
    this.UpdateHighlightGlycansFlag = true;
    this.UpdateMonoFreqFlag = true;

    this.ShowScoreFlag = false;
    this.ShowSynonymFlag = true;

    this.TooltipHide = true;
    this.TooltipIndex = 0;

    // Display parameters
    this.Width = 1000;
    this.Height = 600;
    this.MinWidth = 600;
    this.MinHeight = 600;

    // HTML elements
    this.Container;
    this.ContainerInner;
    this.ContainerScreenA;
    this.ContainerScreenAPartA;
    this.ContainerScreenAPartB;
    this.ContainerScreenB;
    this.ContainerScreenSwitch;
    this.ContainerBanner;
    this.ContainerGreyBackground;
    this.ContainerAlert;
    this.ContainerTooltip;
    this.ContainerTooltipArrow;
    // this.LeftTurnButton;
    // this.RightTurnButton;


    // Base64 encoded images
    this.ImageTriDots       = "data:image/jpeg;base64,/9j/4QQuRXhpZgAATU0AKgAAAAgABwESAAMAAAABAAEAAAEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIAAAExAAIAAAAkAAAAcgEyAAIAAAAUAAAAlodpAAQAAAABAAAArAAAANgACvyAAAAnEAAK/IAAACcQQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkAMjAxOToxMDoyMiAyMzoyOTowMwAAAAADoAEAAwAAAAH//wAAoAIABAAAAAEAAAAooAMABAAAAAEAAAAPAAAAAAAAAAYBAwADAAAAAQAGAAABGgAFAAAAAQAAASYBGwAFAAAAAQAAAS4BKAADAAAAAQACAAACAQAEAAAAAQAAATYCAgAEAAAAAQAAAvAAAAAAAAAASAAAAAEAAABIAAAAAf/Y/+0ADEFkb2JlX0NNAAH/7gAOQWRvYmUAZIAAAAAB/9sAhAAMCAgICQgMCQkMEQsKCxEVDwwMDxUYExMVExMYEQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQ0LCw0ODRAODhAUDg4OFBQODg4OFBEMDAwMDBERDAwMDAwMEQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAPACgDASIAAhEBAxEB/90ABAAD/8QBPwAAAQUBAQEBAQEAAAAAAAAAAwABAgQFBgcICQoLAQABBQEBAQEBAQAAAAAAAAABAAIDBAUGBwgJCgsQAAEEAQMCBAIFBwYIBQMMMwEAAhEDBCESMQVBUWETInGBMgYUkaGxQiMkFVLBYjM0coLRQwclklPw4fFjczUWorKDJkSTVGRFwqN0NhfSVeJl8rOEw9N14/NGJ5SkhbSVxNTk9KW1xdXl9VZmdoaWprbG1ub2N0dXZ3eHl6e3x9fn9xEAAgIBAgQEAwQFBgcHBgU1AQACEQMhMRIEQVFhcSITBTKBkRShsUIjwVLR8DMkYuFygpJDUxVjczTxJQYWorKDByY1wtJEk1SjF2RFVTZ0ZeLys4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9ic3R1dnd4eXp7fH/9oADAMBAAIRAxEAPwD1VYHRfrx9Xet9Tv6X0+8vyaASNzS1tgadr3UPP09q31xf1W+rv1B6d1yzN6L1CrKz7g8V44yarfTafdb9nqq/S/R/0nq/o0lOrkfXn6uY3X2fV+3IIznubWTtJrbY/wDm6X2/6R+5ql9Yvrp0H6t349HU7XNtyfc1tbS8tYDt9Wzb9GvcsbN+rn+L6762DquT1ClnVG3Mc7COVU1rr27fT34x/T+rv2fo9/6R/wDg0f66fV/6ldXzsaz6wdQZgZdLPY37RVQ6youJa17cjc51XqepsdXs/wAIkp69JJJJT//Z/+0MNFBob3Rvc2hvcCAzLjAAOEJJTQQlAAAAAAAQAAAAAAAAAAAAAAAAAAAAADhCSU0EOgAAAAAA5QAAABAAAAABAAAAAAALcHJpbnRPdXRwdXQAAAAFAAAAAFBzdFNib29sAQAAAABJbnRlZW51bQAAAABJbnRlAAAAAENscm0AAAAPcHJpbnRTaXh0ZWVuQml0Ym9vbAAAAAALcHJpbnRlck5hbWVURVhUAAAAAQAAAAAAD3ByaW50UHJvb2ZTZXR1cE9iamMAAAAMAFAAcgBvAG8AZgAgAFMAZQB0AHUAcAAAAAAACnByb29mU2V0dXAAAAABAAAAAEJsdG5lbnVtAAAADGJ1aWx0aW5Qcm9vZgAAAAlwcm9vZkNNWUsAOEJJTQQ7AAAAAAItAAAAEAAAAAEAAAAAABJwcmludE91dHB1dE9wdGlvbnMAAAAXAAAAAENwdG5ib29sAAAAAABDbGJyYm9vbAAAAAAAUmdzTWJvb2wAAAAAAENybkNib29sAAAAAABDbnRDYm9vbAAAAAAATGJsc2Jvb2wAAAAAAE5ndHZib29sAAAAAABFbWxEYm9vbAAAAAAASW50cmJvb2wAAAAAAEJja2dPYmpjAAAAAQAAAAAAAFJHQkMAAAADAAAAAFJkICBkb3ViQG/gAAAAAAAAAAAAR3JuIGRvdWJAb+AAAAAAAAAAAABCbCAgZG91YkBv4AAAAAAAAAAAAEJyZFRVbnRGI1JsdAAAAAAAAAAAAAAAAEJsZCBVbnRGI1JsdAAAAAAAAAAAAAAAAFJzbHRVbnRGI1B4bEBSAAAAAAAAAAAACnZlY3RvckRhdGFib29sAQAAAABQZ1BzZW51bQAAAABQZ1BzAAAAAFBnUEMAAAAATGVmdFVudEYjUmx0AAAAAAAAAAAAAAAAVG9wIFVudEYjUmx0AAAAAAAAAAAAAAAAU2NsIFVudEYjUHJjQFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAWjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAADhCSU0EAgAAAAAAAgAAOEJJTQQwAAAAAAABAQA4QklNBC0AAAAAAAYAAQAAAAU4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADSQAAAAYAAAAAAAAAAAAAAA8AAAAoAAAACgBVAG4AdABpAHQAbABlAGQALQAxAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAoAAAADwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAADwAAAABSZ2h0bG9uZwAAACgAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAAAAAABm9yaWdpbmVudW0AAAAMRVNsaWNlT3JpZ2luAAAADWF1dG9HZW5lcmF0ZWQAAAAAVHlwZWVudW0AAAAKRVNsaWNlVHlwZQAAAABJbWcgAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAAAA8AAAAAUmdodGxvbmcAAAAoAAAAA3VybFRFWFQAAAABAAAAAAAAbnVsbFRFWFQAAAABAAAAAAAATXNnZVRFWFQAAAABAAAAAAAGYWx0VGFnVEVYVAAAAAEAAAAAAA5jZWxsVGV4dElzSFRNTGJvb2wBAAAACGNlbGxUZXh0VEVYVAAAAAEAAAAAAAlob3J6QWxpZ25lbnVtAAAAD0VTbGljZUhvcnpBbGlnbgAAAAdkZWZhdWx0AAAACXZlcnRBbGlnbmVudW0AAAAPRVNsaWNlVmVydEFsaWduAAAAB2RlZmF1bHQAAAALYmdDb2xvclR5cGVlbnVtAAAAEUVTbGljZUJHQ29sb3JUeXBlAAAAAE5vbmUAAAAJdG9wT3V0c2V0bG9uZwAAAAAAAAAKbGVmdE91dHNldGxvbmcAAAAAAAAADGJvdHRvbU91dHNldGxvbmcAAAAAAAAAC3JpZ2h0T3V0c2V0bG9uZwAAAAAAOEJJTQQoAAAAAAAMAAAAAj/wAAAAAAAAOEJJTQQRAAAAAAABAQA4QklNBBQAAAAAAAQAAAAGOEJJTQQMAAAAAAMMAAAAAQAAACgAAAAPAAAAeAAABwgAAALwABgAAf/Y/+0ADEFkb2JlX0NNAAH/7gAOQWRvYmUAZIAAAAAB/9sAhAAMCAgICQgMCQkMEQsKCxEVDwwMDxUYExMVExMYEQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQ0LCw0ODRAODhAUDg4OFBQODg4OFBEMDAwMDBERDAwMDAwMEQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAPACgDASIAAhEBAxEB/90ABAAD/8QBPwAAAQUBAQEBAQEAAAAAAAAAAwABAgQFBgcICQoLAQABBQEBAQEBAQAAAAAAAAABAAIDBAUGBwgJCgsQAAEEAQMCBAIFBwYIBQMMMwEAAhEDBCESMQVBUWETInGBMgYUkaGxQiMkFVLBYjM0coLRQwclklPw4fFjczUWorKDJkSTVGRFwqN0NhfSVeJl8rOEw9N14/NGJ5SkhbSVxNTk9KW1xdXl9VZmdoaWprbG1ub2N0dXZ3eHl6e3x9fn9xEAAgIBAgQEAwQFBgcHBgU1AQACEQMhMRIEQVFhcSITBTKBkRShsUIjwVLR8DMkYuFygpJDUxVjczTxJQYWorKDByY1wtJEk1SjF2RFVTZ0ZeLys4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9ic3R1dnd4eXp7fH/9oADAMBAAIRAxEAPwD1VYHRfrx9Xet9Tv6X0+8vyaASNzS1tgadr3UPP09q31xf1W+rv1B6d1yzN6L1CrKz7g8V44yarfTafdb9nqq/S/R/0nq/o0lOrkfXn6uY3X2fV+3IIznubWTtJrbY/wDm6X2/6R+5ql9Yvrp0H6t349HU7XNtyfc1tbS8tYDt9Wzb9GvcsbN+rn+L6762DquT1ClnVG3Mc7COVU1rr27fT34x/T+rv2fo9/6R/wDg0f66fV/6ldXzsaz6wdQZgZdLPY37RVQ6youJa17cjc51XqepsdXs/wAIkp69JJJJT//ZOEJJTQQhAAAAAABdAAAAAQEAAAAPAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwAAAAFwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEMAQwAgADIAMAAxADkAAAABADhCSU0EBgAAAAAABwAIAAAAAQEA/+EN4Wh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEwLTIyVDIzOjI5OjAzLTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFjYjdiYzRlLWY0YTUtNDY3NC1hODUzLWEwMmQ2OGI5MTdmNyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmMzMmM4M2FiLTNlMTItNTk0My05ZWIyLTgxMWYwNTEzN2NhOCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjZhZmI2YmNhLWU1MjgtNGM3ZS1hNGFkLWU0MDdhY2Q0NDc4MyIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YWZiNmJjYS1lNTI4LTRjN2UtYTRhZC1lNDA3YWNkNDQ3ODMiIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxY2I3YmM0ZS1mNGE1LTQ2NzQtYTg1My1hMDJkNjhiOTE3ZjciIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGRAAAAAAf/bAIQAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAwMDAwMDAwMDAwEBAQEBAQEBAQEBAgIBAgIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/8AAEQgADwAoAwERAAIRAQMRAf/dAAQABf/EAaIAAAAGAgMBAAAAAAAAAAAAAAcIBgUECQMKAgEACwEAAAYDAQEBAAAAAAAAAAAABgUEAwcCCAEJAAoLEAACAQMEAQMDAgMDAwIGCXUBAgMEEQUSBiEHEyIACDEUQTIjFQlRQhZhJDMXUnGBGGKRJUOhsfAmNHIKGcHRNSfhUzaC8ZKiRFRzRUY3R2MoVVZXGrLC0uLyZIN0k4Rlo7PD0+MpOGbzdSo5OkhJSlhZWmdoaWp2d3h5eoWGh4iJipSVlpeYmZqkpaanqKmqtLW2t7i5usTFxsfIycrU1dbX2Nna5OXm5+jp6vT19vf4+foRAAIBAwIEBAMFBAQEBgYFbQECAxEEIRIFMQYAIhNBUQcyYRRxCEKBI5EVUqFiFjMJsSTB0UNy8BfhgjQlklMYY0TxorImNRlUNkVkJwpzg5NGdMLS4vJVZXVWN4SFo7PD0+PzKRqUpLTE1OT0laW1xdXl9ShHV2Y4doaWprbG1ub2Z3eHl6e3x9fn90hYaHiImKi4yNjo+DlJWWl5iZmpucnZ6fkqOkpaanqKmqq6ytrq+v/aAAwDAQACEQMRAD8A3+PfuvdVIfDP+d//AC8Pnr8mO0Pid8c+18vuHtjrSmzuRphnNp5Hbu1+zcNtXJriN0ZrqrcFYzRboocFUyxSOk0dHU1NHJ93SxVFLFPNF7r3WLsL+eP/AC5esPnvt/8Alw7u7jr6P5FZ3Pbc2VNPBtXK1XWm3eyd5RUc20us9x79jAoKHeWe/ilHEiRxz0NNVVkdNVVNPUiSGP3Xunv+Yf8Azn/gd/K93r1F158rt/bow27+5IKjL4TC7J2bkN7Vu29m0mUjwtRv/elNjZY6nD7TOU80EDQpVV1bJSVIpaaY082j3XurWffuvdf/0N/j37r3Wsh/K5/l4fyEfjL8494d4/BH5g9S95/JTfuG39R7L6gxXy/6C7nXq3b+cnfMb3j6j6+6+FPvuOmosLTvRy1WWqs5UUWJEsfmQSTO/uvdNHdX8un/AIT7by/mu0Xy97R+YPTG3PmbiO59jZ7O/F+p+ZHQW29t7h+Q22KvC0u0qrdXSmSmHav9/azclBjZ5sLT5OjpcrkkX7ign+5qY6j3XuhU/nP/AAB/kq/Mvu/o7cX8x35ebE+L/d/XWxxBtjGT/Kzor4/7v7K6krt25SuxOM3Jgu3KTL5nMbIod30uaTH1+HjxtQlVVZCNatnUCH3XutjL37r3X//Z";

    this.SVGUpArrow = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16">\n' +
        '  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>\n' +
        '</svg>';
    this.SVGQuestionMark = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16">\n' +
        '  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n' +
        '  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>\n' +
        '</svg>';
    this.SVGMaginifyGlass = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">\n' +
        '  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>\n' +
        '</svg>';
    this.SVGMaginifyGlass2 = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">\n' +
        '  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>\n' +
        '</svg>';
    this.SVGReset = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">\n' +
        '  <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>\n' +
        '  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>\n' +
        '</svg>';
    this.SVGCompute = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16">\n' +
        '  <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>\n' +
        '  <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>\n' +
        '</svg>';
    this.SVGSetting = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16">\n' +
        '  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>\n' +
        '  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>\n' +
        '</svg>';


    // CSS style
    this.StyleScreenA = "overflow: auto; padding-top: 8px; ";
    this.StyleScreenAPartA = "float: left; padding-left: 8px; ";
    this.StyleScreenAPartB = "float: left; ";
    this.StyleScreenB = "";

    this.StyleSwitchBase = "position: absolute; z-index: 10; cursor: pointer;";
    this.StyleScreenSwitch = this.StyleSwitchBase + "left: 20px; top: 20px; display: none; ";
    this.StyleSwitchBaseRight   = this.StyleSwitchBase + " right: 20px; ";
    this.StyleSearchSwitch      = this.StyleSwitchBaseRight + " top: 20px; ";
    this.StyleCalculationSwitch = this.StyleSwitchBaseRight + " top: 80px; ";
    this.StyleResetSwitch       = this.StyleSwitchBaseRight + " top: 140px; ";
    this.StyleSettingSwitch     = this.StyleSwitchBaseRight + " top: 200px; ";
    this.StyleHintSwitch        = this.StyleSwitchBaseRight + " top: 260px; ";

    this.StyleGreyBackground = "position: absolute; z-index: 11; background-color: rgba(100,100,100,0.5); width: 101%; height: 100%; display: none; backdrop-filter: blur(3px);";
    this.StyleAlert = "position: absolute; z-index: 11; display: none; top: 50%; left: 50%; margin-top: -50px; margin-left: -100px;";
    this.StyleTooltip =      "position: absolute; z-index: 11; display: none; top: 10px; right: 100px; background-color: rgba(240, 240, 240, 0.9); width: 200px; height: 250px; border-radius: 10px 10px 10px 10px; box-shadow: 5px 5px 3px grey;";
    this.StyleTooltipArrow = "position: absolute; z-index: 11; display: none; top: 29px; right:  70px;";


    // External links

    // this.GlyLookupURL = "http://localhost:10981/";
    this.GlyLookupURL = "https://glylookup.glyomics.org/";

    // this.SubsumptionComputingURL = "http://localhost:10984/";
    this.SubsumptionComputingURL = "https://subsumption.glyomics.org/";
    this.SubsumptionComputingDetailURL = "";



    // Subsumption Navigator related things
    this.SubsumptionNavigatorOption = {
        essentials: {
            div_ID: "", // the ID of div container
            component: {}, // the data
            topoOnly: false,
            viewRoot: "",
            useGlyTouCanAsImageSource: false,
            GlyTouCanImagePara: {
                style: "extended", // Other Options: normal, compact
                format: "png", // Other Options: jpg
                notation: "cfg" // Other Options: cfgbw, uoxf, uoxf-color, cfg-uoxf, iupac
            },
            imgURL1: "https://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/", // Unnecessary if useGlyTouCanAsImageSource is true
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
    this.SubsumptionNavigatorOption.GNOmeBrowser = this;

    this.SubsumptionNavigatorController = jQuery.extend({}, glycanviewer);


    // Preset things...
    const IconConfigCFG = {
        'GlcNAc': {"shape": "square", "icon_color": "rgb(17,0,250)", "count_color": "white"},
        'ManNAc': {"shape": "square", "icon_color": "rgb(0,200,50)", "count_color": "white"},
        'GalNAc': {"shape": "square", "icon_color": "rgb(254,255,0)", "count_color": "black"},
        'HexNAc': {"shape": "square", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'Glc': {"shape": "circle", "icon_color": "rgb(17,0,250)", "count_color": "white"},
        'Man': {"shape": "circle", "icon_color": "rgb(0,200,50)", "count_color": "white"},
        'Gal': {"shape": "circle", "icon_color": "rgb(254,255,0)", "count_color": "black"},
        'Hex': {"shape": "circle", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'dHex': {"shape": "triangle", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'Fuc': {"shape": "triangle", "icon_color": "rgb(250,0,0)", "count_color": "white"},
        'NeuAc': {"shape": "diamond", "icon_color": "rgb(200,0,200)", "count_color": "white"},
        'NeuGc': {"shape": "diamond", "icon_color": "rgb(233,255,255)", "count_color": "black"},
        'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"},
        'S': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'P': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'Me': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'X': {"shape": "empty", "icon_color": "grey", "count_color": "black"}
    };

    const IconConfigSNFG = {
        'GlcNAc': {"shape": "square", "icon_color": "rgb(2,145,188)", "count_color": "white"},
        'ManNAc': {"shape": "square", "icon_color": "rgb(3,166,81)", "count_color": "white"},
        'GalNAc': {"shape": "square", "icon_color": "rgb(255,212,0)", "count_color": "black"},
        'HexNAc': {"shape": "square", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'Glc': {"shape": "circle", "icon_color": "rgb(2,145,188)", "count_color": "white"},
        'Man': {"shape": "circle", "icon_color": "rgb(3,166,81)", "count_color": "white"},
        'Gal': {"shape": "circle", "icon_color": "rgb(255,212,0)", "count_color": "black"},
        'Hex': {"shape": "circle", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'dHex': {"shape": "triangle", "icon_color": "rgb(255,255,255)", "count_color": "black"},
        'Fuc': {"shape": "triangle", "icon_color": "rgb(237,29,37)", "count_color": "white"},
        'NeuAc': {"shape": "diamond", "icon_color": "rgb(165,68,153)", "count_color": "white"},
        'NeuGc': {"shape": "diamond", "icon_color": "rgb(143,203,233)", "count_color": "black"},
        'Xxx': {"shape": "circle", "icon_color": "grey", "count_color": "white"},
        'S': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'P': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'Me': {"shape": "empty", "icon_color": "lightgrey", "count_color": "black"},
        'X': {"shape": "empty", "icon_color": "grey", "count_color": "black"}
    };
    this.IconConfig = IconConfigCFG;

    // Hint title and message
    this.HintTitleForScreenA = 'Topology Selector';
    this.HintTitleForScreenB = 'Subsumption Navigator';

    this.HintMessageForScreenA = "<ul style='position: relative; top: -20px; text-align: left; '>" +
        "<li>Click controls at left to add/remove monosaccharides</li>" +
        "<li>Click a Topology to jump to Subsumption Navigator</li>" +
        "<li>Click notepad on top right to align novel glycan</li>" +
        "<li><a target='_blank' href='https://gnome.glyomics.org/docs/'>More...</a></li>" +
        "</ul>";

    this.HintMessageForScreenB = "<ul style='position: relative; top: -20px; text-align: left; '>" +
        "<li>Double click on structure to navigate subsumption hierarchy.</li>" +
        "<li>Right click popup to jump to GlyGen, GlycanData, GlyTouCan.</li>" +
        "<li><a target='_blank' href='https://gnome.glyomics.org/docs/'>More...</a></li>" +
        "</ul>";



    // Functions start here
    this.Init = async function (para) {

        let theme = {};

        if (Object.keys(para).includes('theme')){
            theme = await jQuery.getJSON(para.theme);
        }

        // Backward compatibility with theme encoding
        if (Object.keys(theme).includes('image_source_prefix')){
            theme['image_url_prefix'] = theme['image_source_prefix'];
        }
        if (Object.keys(theme).includes('image_source_suffix')){
            theme['image_url_suffix'] = theme['image_source_suffix'];
        }

        if (Object.keys(para).includes('icon_style')){
            theme['icon_style'] = para['icon_style'];
        }

        if (Object.keys(para).includes('image_url_prefix')){
            theme['image_url_prefix'] = para['image_url_prefix'];
        }

        if (Object.keys(para).includes('image_url_suffix')){
            theme['image_url_suffix'] = para['image_url_suffix'];
        }


        if (Object.keys(theme).includes('icon_style')){
            this.SetIconConfig(theme['icon_style']);
        }

        if (Object.keys(theme).includes('brand')){
            this.SetBrand(theme['brand']);
        }

        if (Object.keys(theme).includes('image_url_prefix') && Object.keys(theme).includes('image_url_suffix')){
            this.SetImageSource(theme['image_url_prefix'], theme['image_url_suffix'])
        }


        if (Object.keys(theme).includes('external_resources')){
            this.SubsumptionNavigatorOption.contextMenu.externalLinks = theme["external_resources"];
            for (let er of theme["external_resources"]){
                if (er["glycan_set"] == null){
                    er["glycan_set"] = undefined;
                }
            }
        }

        for (var m of this.AllItems) {
            this.ItemCount[m] = 0;
        }
        this.AllocateDIV();


        let RawData = await jQuery.getJSON(para.data);
        this.DataPreProcess(RawData);
        this.ComputeTopLevelThings();
        this.SubsumptionDataBackUp = JSON.parse(JSON.stringify(this.SubsumptionData));
        this.UpdateMaxPossibleComp();

        this.RefreshUI();

        let tmp = this.GetCookie("ShowScoreFlag")
        if (tmp == "true"){
            this.SetShowScoreFlag(true)
        }
        else if (tmp == "false"){
            this.SetShowScoreFlag(false)
        }


        tmp = this.GetCookie("ShowSynonymFlag")
        if (tmp == "true"){
            this.SetShowSynonymFlag(true)
        }
        else if (tmp == "false"){
            this.SetShowSynonymFlag(false)
        }


        this.ProcessRawDataWithRelationship(RawData);

    }

    this.DataPreProcess = function (d) {
        throw "NotImplement";
    }

    this.ComputeTopLevelThings = function (d) {
        throw "NotImplement";
    }

    this.ProcessRawDataWithRelationship = function (d) {

        for (let acc of Object.keys(d)) {
            if (Array.isArray(d[acc].children)) {
                this.AllChildren[acc] = d[acc].children;
            }
        }
    }

    this.AllocateDIV = function (d) {

        this.Container = document.getElementById(this.ContainerID);
        this.Container.innerHTML = "";
        this.Container.style = "";

        this.ContainerInner = document.createElement("div");
        this.ContainerInner.style = "position: relative; overflow: hidden;";
        this.ContainerInner.style.width = this.Width + "px";
        this.ContainerInner.style.height = this.Height + "px";

        this.ContainerScreenA = document.createElement("div");
        this.ContainerScreenB = document.createElement("div");
        this.ContainerScreenB.setAttribute("id", this.ContainerID + "_screenB");

        this.SubsumptionNavigatorOption.essentials.div_ID = this.ContainerID + "_screenB";

        this.ContainerScreenA.style = this.StyleScreenA;

        this.ContainerTooltip = document.createElement("div");
        this.ContainerTooltip.style = this.StyleTooltip;

        this.ContainerTooltipArrow = document.createElement("div");
        this.ContainerTooltipArrow.style = this.StyleTooltipArrow;
        this.ContainerTooltipArrow.innerHTML = "&#x21e8;";

        this.ContainerScreenSwitch = document.createElement("div");
        this.ContainerScreenSwitch.innerHTML = this.SVGUpArrow;
        this.ContainerScreenSwitch.width = 40;
        this.ContainerScreenSwitch.height = 40;
        this.ContainerScreenSwitch.style = this.StyleScreenSwitch;
        let thisLib = this;
        this.ContainerScreenSwitch.onclick = function () {
            thisLib.SetToScreenA();
            thisLib.RefreshUI();
        };

        this.ContainerSearchSwitch = document.createElement("div");
        this.ContainerSearchSwitch.innerHTML = this.SVGMaginifyGlass;
        this.ContainerSearchSwitch.title = "Find";
        this.ContainerSearchSwitch.style = this.StyleSearchSwitch;
        this.ContainerSearchSwitch.onclick = function () {
            thisLib.SearchBoxShow();
        };

        this.ContainerSearchSwitch.onmouseover = function (){
            thisLib.TooltipHide = false;
            thisLib.TooltipIndex = 0;
            setTimeout(function (){
                thisLib.TooltipLowLevel();
            }, 2000)
        }
        this.ContainerSearchSwitch.onmouseleave = function (){
            thisLib.TooltipHide = true;
            thisLib.TooltipClose();
        }

        this.ContainerHintSwitch = document.createElement("div");
        this.ContainerHintSwitch.innerHTML = this.SVGQuestionMark;
        this.ContainerHintSwitch.title = "Help";
        this.ContainerHintSwitch.style = this.StyleHintSwitch;
        this.ContainerHintSwitch.onclick = function () {
            thisLib.HintShow();
        };
        this.ContainerHintSwitch.onmouseover = function (){
            thisLib.TooltipHide = false;
            thisLib.TooltipIndex = 1;
            setTimeout(function (){
                thisLib.TooltipLowLevel();
            }, 2000)
        }
        this.ContainerHintSwitch.onmouseleave = function (){
            thisLib.TooltipHide = true;
            thisLib.TooltipClose();
        }


        this.ContainerResetSwitch = document.createElement("div");
        this.ContainerResetSwitch.innerHTML = this.SVGReset;
        this.ContainerResetSwitch.title = "Reset";
        this.ContainerResetSwitch.style = this.StyleResetSwitch;
        this.ContainerResetSwitch.onclick = function () {
            thisLib.Reset();
        };

        this.ContainerResetSwitch.onmouseover = function (){
            thisLib.TooltipHide = false;
            thisLib.TooltipIndex = 2;
            setTimeout(function (){
                thisLib.TooltipLowLevel();
            }, 2000)
        }
        this.ContainerResetSwitch.onmouseleave = function (){
            thisLib.TooltipHide = true;
            thisLib.TooltipClose();
        }


        this.ContainerCalculationSwitch = document.createElement("div");
        this.ContainerCalculationSwitch.innerHTML = this.SVGCompute;
        this.ContainerCalculationSwitch.title = "Align";
        this.ContainerCalculationSwitch.style = this.StyleCalculationSwitch;
        this.ContainerCalculationSwitch.onclick = function () {
            thisLib.CalculationBoxShow();
        };

        this.ContainerCalculationSwitch.onmouseover = function (){
            thisLib.TooltipHide = false;
            thisLib.TooltipIndex = 3;
            setTimeout(function (){
                thisLib.TooltipLowLevel();
            }, 2000)
        }
        this.ContainerCalculationSwitch.onmouseleave = function (){
            thisLib.TooltipHide = true;
            thisLib.TooltipClose();
        }


        this.ContainerSettingSwitch = document.createElement("div");
        this.ContainerSettingSwitch.innerHTML = this.SVGSetting;
        this.ContainerSettingSwitch.title = "Setting";
        this.ContainerSettingSwitch.style = this.StyleSettingSwitch;
        this.ContainerSettingSwitch.onclick = function () {
            thisLib.DisplaySetting();
        };

        this.ContainerSettingSwitch.onmouseover = function (){
            thisLib.TooltipHide = false;
            thisLib.TooltipIndex = 2;
            setTimeout(function (){
                thisLib.TooltipLowLevel();
            }, 2000)
        }
        this.ContainerSettingSwitch.onmouseleave = function (){
            thisLib.TooltipHide = true;
            thisLib.TooltipClose();
        }


        this.ContainerScreenAPartA = document.createElement("div");
        this.ContainerScreenAPartB = document.createElement("div");
        //this.ContainerScreenAPartA.style = "float: left; width: 130px; margin: 0px; padding: 0px;";

        this.ContainerScreenA.appendChild(this.ContainerScreenAPartA);
        this.ContainerScreenA.appendChild(this.ContainerScreenAPartB);

        this.ContainerBanner = document.createElement("h4");
        this.ContainerBanner.style = "position: absolute; bottom: 10px; z-index: 500; text-align: center; color: grey; ";


        this.ContainerGreyBackground = document.createElement("div");
        this.ContainerGreyBackground.style = this.StyleGreyBackground;

        this.ContainerAlert = document.createElement("div");
        this.ContainerAlert.style = this.StyleAlert;


        this.Container.appendChild(this.ContainerInner);
        this.ContainerInner.appendChild(this.ContainerGreyBackground);
        this.ContainerInner.appendChild(this.ContainerAlert);
        this.ContainerInner.appendChild(this.ContainerTooltip);
        this.ContainerInner.appendChild(this.ContainerTooltipArrow);
        this.ContainerInner.appendChild(this.ContainerScreenSwitch);
        this.ContainerInner.appendChild(this.ContainerSearchSwitch);
        this.ContainerInner.appendChild(this.ContainerHintSwitch);
        this.ContainerInner.appendChild(this.ContainerResetSwitch);
        this.ContainerInner.appendChild(this.ContainerCalculationSwitch);
        this.ContainerInner.appendChild(this.ContainerSettingSwitch);
        //container.appendChild(leftTurnButton);
        //container.appendChild(rightTurnButton);
        this.ContainerInner.appendChild(this.ContainerScreenA);
        this.ContainerInner.appendChild(this.ContainerScreenB);
        this.ContainerInner.appendChild(this.ContainerBanner);
    }

    this.RefreshUI = function (cmd) {

        this.ContainerScreenAPartA.innerHTML = "";
        this.ContainerScreenAPartB.innerHTML = "";
        this.ContainerScreenB.innerHTML = "";

        this.ContainerScreenAPartA.style = "";
        this.ContainerScreenAPartB.style = "";
        this.ContainerScreenB.style = "";

        this.ContainerInner.style.width = this.Width + "px";
        this.ContainerInner.style.height = this.Height + "px";
        //this.Container.style.width = this.Width + "px";
        //this.Container.style.height = this.Height + "px";

        if ( this.DisplayScreen == 0){


            this.ContainerScreenAPartA.style = this.StyleScreenAPartA;
            this.ContainerScreenAPartB.style = this.StyleScreenAPartB;
            this.ContainerScreenAPartB.style.width = this.Width - 190 + "px";
            this.ContainerScreenAPartB.style.height = this.Height + "px";

            this.ContainerScreenSwitch.style.display = "none";

            this.AddAllMonoButtons();
            this.FindAllMatchedThings();
            this.RefreshMatchedGlycans();

        }
        else if ( this.DisplayScreen == 1){

            this.ContainerScreenB.style = this.StyleScreenB;
            this.ContainerScreenB.style.width = this.Width + "px";
            this.ContainerScreenB.style.height = this.Height + "px";

            this.ContainerScreenSwitch.style.display = "inline";

            if (this.UpdateMonoFreqFlag){
                this.ItemCount = JSON.parse(JSON.stringify(this.SubsumptionData[this.SubsumptionNavigatorFocusAccession].ButtonConfig));
            }
            else {
                this.UpdateMonoFreqFlag = true;
            }

            if (this.UpdateHighlightGlycansFlag){
                this.UpdateHighlightGlycans(this.SubsumptionNavigatorFocusAccession);
            }
            else {
                this.HighLightGlycans = [this.SubsumptionNavigatorFocusAccession];
                this.UpdateHighlightGlycansFlag = true;
            }

            this.ShowSubsumptionNavigator();
        }


        this.ContainerBanner.style.width = this.Width * 0.97 + "px";
        this.ContainerBanner.innerHTML = "<a href='https://gnome.glyomics.org/' target='_blank'>GNOme</a> - Glycan Naming and Subsumption Ontology";
        if (this.brand){
            this.ContainerBanner.innerHTML += " (" + this.brand + ")";

        }
    }

    this.Reset = function (){
        let thisLib = this;

        this.SetToScreenA();

        for (let m of Object.keys(this.ItemCount)){
            // console.log(m, this.ItemCount[m])
            this.ItemCount[m] = 0;
        }

        this.SubsumptionData = JSON.parse(JSON.stringify(this.SubsumptionDataBackUp));

        this.MatchedGlycans = [];
        this.HighLightGlycans = [];
        this.SubsumptionNavigatorFocusAccession = "";

        this.ImageComputed = {};

        this.ComputeTopLevelThings();

        this.ClearCookie();
        this.RefreshUI();
    }

    this.SetCookie = function (k, v, exdays){
        let d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = k + "=" + v + ";" + expires + ";path=/";
    }

    this.GetCookie = function (k){
        let name = k + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    this.ClearCookie = function (){
        this.SetCookie("SubsumptionRTSeq", "Something", -1);
    }


    this.Alert = function (title, msg, GNOmelinkFlag) {
        let ele = document.createElement('div');
        ele.style = "width: 400px; height: 260px; background-color: white; border-radius: 10px; box-shadow: 5px 5px 3px grey;";

        let titleEle = document.createElement('h3');
        let closeEle = document.createElement('div');
        let separationEle = document.createElement("div");
        let messageEle = document.createElement('div');
        let glinkEle = document.createElement('a');

        titleEle.style = 'width: 100%; text-align: center; padding-top: 20px; ';
        closeEle.style = 'position: absolute; top: 20px; right: 10px; font-size: 30px; color: grey; cursor: default; font-family: Arial, sans-serif;';
        separationEle.style = 'width: 100%; height: 0; border: 0 0 1px 0; border-style: solid; border-color: grey; ';
        messageEle.style = 'width: 100%; height: 100%; text-align: center; padding: 20px 0 0 0';
        glinkEle.style = 'position: absolute; bottom: 0px; right: 40px; text-align: right;';

        titleEle.innerText = title;
        closeEle.innerText = "x";
        glinkEle.innerText = 'GNOme';
        glinkEle.href = "https://gnome.glyomics.org/";

        messageEle.innerHTML = msg;

        if (title != ''){
            ele.appendChild(titleEle);
            ele.appendChild(closeEle);
            ele.appendChild(separationEle);

            let thisLib = this;
            closeEle.onclick = function () {
                thisLib.CloseAlert();
            }
        }

        ele.appendChild(messageEle);

        if (GNOmelinkFlag){
            ele.appendChild(glinkEle);
        }

        this.AlertLowLevel(ele, 400, 260, "45%");
    }


    this.AlertLowLevel = function (ele, width, height, VerticalPositionPercentage) {
        if (VerticalPositionPercentage == undefined){
            VerticalPositionPercentage = "50%"
        }
        this.ContainerGreyBackground.style.display = "";
        this.ContainerAlert.style.display = "";
        this.ContainerAlert.innerHTML = "";
        this.ContainerAlert.appendChild(ele);

        this.ContainerAlert.style.width = width + "px";
        this.ContainerAlert.style.height = height + "px";

        this.ContainerAlert.style.marginLeft = -width/2 + "px";
        this.ContainerAlert.style.marginTop = -height/2 + "px";

        this.ContainerAlert.style.top = VerticalPositionPercentage;

        let thisLib = this;
        this.ContainerGreyBackground.onclick = function () {
            thisLib.CloseAlert();
        }

        document.addEventListener("keyup", function (d) {

            if (d.key == 'Escape'){
                thisLib.CloseAlert();
            }
        })

    }

    this.CloseAlert = function () {
        this.ContainerGreyBackground.style.display = "none";
        this.ContainerAlert.style.display = "none";
    }

    this.HintShow = function () {
        let title, msg;
        if (this.DisplayScreen == 0){
            title = this.HintTitleForScreenA;
            msg = this.HintMessageForScreenA;
        }
        else if (this.DisplayScreen == 1){
            title = this.HintTitleForScreenB;
            msg = this.HintMessageForScreenB;
        }

        this.Alert(title, msg, true);
    }

    this.SearchBoxShow = function () {
        let thisLib = this;

        let searchBox = document.createElement("div");
        searchBox.style = "width: 400px; height: 40px; overflow: hidden; background: rgb(255, 255, 255); opacity:0.8; border: none; border-radius: 10px; position: absolute; top: 40px; align: center; box-shadow: 5px 5px 3px grey;";

        let searchBoxInput = document.createElement("input");
        searchBoxInput.placeholder = "GlyTouCan accession or GNOme synonym...";
        searchBoxInput.type = "text";
        searchBoxInput.style = "font-size: 100%; border: none; border-color: transparent; height: 40px; width: 350px; background: transparent; overflow: hidden; ";
        searchBoxInput.addEventListener("keyup", function (d) {
            if (d.key == "Enter") {
                thisLib.SearchGo(this.value);
            }
        })

        let searchBoxButton = document.createElement("div");
        searchBoxButton.style = "border: none; background: inherit; padding: 10px 10px 10px 0; float: right";
        searchBoxButton.innerHTML = this.SVGMaginifyGlass2;
        searchBoxButton.onclick = function (){
            thisLib.SearchGo(searchBoxInput.value);
        }

        searchBox.innerHTML = "&nbsp;&nbsp;&nbsp;";
        searchBox.appendChild(searchBoxInput);
        searchBox.appendChild(searchBoxButton);

        let msg = searchBox;

        this.AlertLowLevel(msg, 400, 100, "20%");
    }

    this.SearchGo = function (d) {
        this.ContainerAlert.style.display = "none";
        this.ContainerGreyBackground.style.display = "none";

        this.SetFocus(d);
        this.RefreshUI();
    }

    this.ToggleSwitch = function (defalut_select){

        let res = document.createElement("div");
        res.style = "border-radius: 34px; cursor: pointer; width: 60px; height: 34px; ";

        let select_color = "#2196F3";
        let de_select_color = "#ccc";

        let slider = document.createElement("div");
        slider.style = "border-radius: 28px; width: 28px; height: 28px; background-color: white; position: relative; top: 3px";

        let select_left = "28px";
        let de_select_left = "3px";

        res.appendChild(slider);


        function selected(){
            return slider.getAttribute("data-select") == "y";
        }

        function select(){
            res.style.backgroundColor = select_color;
            slider.style.left = select_left;
            slider.setAttribute("data-select", "y")
        }

        function de_select(){
            res.style.backgroundColor = de_select_color;
            slider.style.left = de_select_left;
            slider.setAttribute("data-select", "n")
        }

        if (defalut_select){
            select();
        }
        else {
            de_select();
        }


        res.onclick = function (){
            if (selected()){
                de_select();
            }
            else {
                select();
            }
        }

        return [res, selected]
    }

    this.DisplaySetting = function () {
        let thisLib = this;

        let DisplaySettingBox = document.createElement("div");
        DisplaySettingBox.style = "width: 100%; height: 400px; overflow: hidden; background: rgb(255, 255, 255); opacity:0.8; border: none; border-radius: 10px; position: absolute; top: 40px; align: center; box-shadow: 5px 5px 3px grey;";

        let DisplaySettingBoxTitle = document.createElement("p");
        DisplaySettingBoxTitle.style = "width: 100%; height: 23px; opacity: 0.8; border: none; text-align: center; font-size: 20px;";
        DisplaySettingBoxTitle.innerText = "Display Settings";




        let DisplaySettingBoxContent = document.createElement("div");
        DisplaySettingBoxContent.style = "font-size: 100%; height: 250px; width: 80%; max-width: 80%; background: transparent; overflow: hidden; margin: 0 0 0 55.6px; ";


        let option_table = document.createElement("table");
        option_table.style = "padding-top: 10px; width: 100%; "

        let tr = document.createElement("tr");
        let td1 = document.createElement("td");
        td1.style.maxWidth = "30%; "
        td1.innerText = "Show GNOme Synonym: "

        let td2 = document.createElement("td");
        let tmp = this.ToggleSwitch(this.ShowSynonymFlag);
        let sym_toggle_switch = tmp[0];
        let sym_selected = tmp[1];
        td2.appendChild(sym_toggle_switch);

        tr.appendChild(td1);
        tr.appendChild(td2);

        if (thisLib instanceof GNOmeCompositionBrowser){
            option_table.appendChild(tr);
        }

        tr = document.createElement("tr");
        td1 = document.createElement("td");
        td1.style.maxWidth = "30%; "
        td1.innerText = "Show Structure Characterization Score: "

        td2 = document.createElement("td");
        tmp = this.ToggleSwitch(this.ShowScoreFlag);
        let score_toggle_switch = tmp[0];
        let score_selected = tmp[1];
        td2.appendChild(score_toggle_switch);

        tr.appendChild(td1);
        tr.appendChild(td2);

        option_table.appendChild(tr);

        DisplaySettingBoxContent.appendChild(option_table);




        let DisplaySettingBoxButton = document.createElement("button");
        DisplaySettingBoxButton.style = "position: absolute; bottom: 20px; left: 414px; font-size: 100%; border: solod border-color: black; width: 130px; height: 50px; background: inherit; ";
        DisplaySettingBoxButton.innerHTML = "Save";
        DisplaySettingBoxButton.type = "text";
        DisplaySettingBoxButton.onclick = function (){
            thisLib.CloseAlert();

            let refresh = false;
            if (sym_selected() != thisLib.ShowSynonymFlag){
                refresh = true;
            }
            if (score_selected() != thisLib.ShowScoreFlag){
                refresh = true;
            }
            thisLib.SetShowSynonymFlag(sym_selected());
            thisLib.SetShowScoreFlag(score_selected());

            if (refresh){
                thisLib.RefreshUI();
            }
        }


        DisplaySettingBox.appendChild(DisplaySettingBoxTitle);
        DisplaySettingBox.appendChild(DisplaySettingBoxContent);
        DisplaySettingBox.appendChild(DisplaySettingBoxButton);

        let msg = DisplaySettingBox;
        this.AlertLowLevel(msg, 600, 300, "25%");

    }

    this.CalculationBoxShow = function () {
        let thisLib = this;

        let searchBox = document.createElement("div");
        searchBox.style = "width: 100%; height: 400px; overflow: hidden; background: rgb(255, 255, 255); opacity:0.8; border: none; border-radius: 10px; position: absolute; top: 40px; align: center; box-shadow: 5px 5px 3px grey;";

        let searchBoxInputTitle = document.createElement("p");
        searchBoxInputTitle.style = "width: 100%; height: 23px; opacity: 0.8; border: none; text-align: center; font-size: 20px;";
        searchBoxInputTitle.innerText = "On-Demand Subsumption Alignment";

        let searchBoxInput = document.createElement("textarea");

        let defaultmessage = "WURCS/GlycoCT format glycan structure..."
        let defaultSeq = defaultmessage;


        if (thisLib.GetCookie("SubsumptionRTSeq") != ""){
            defaultSeq = decodeURIComponent(thisLib.GetCookie("SubsumptionRTSeq"));
            // console.log("Getting from cookie...", defaultSeq);
        }

        searchBoxInput.value = defaultSeq;
        searchBoxInput.style = "font-size: 100%; border: solid; border-color: lightgrey; height: 250px; width: 80%; max-width: 80%; background: transparent; overflow: hidden; margin: 0 0 0 55.6px; overflow-y: scroll";

        if (defaultmessage == defaultSeq){
            searchBoxInput.style.color = "grey";
        }


        searchBoxInput.onclick = function (){
            if (this.value.trim() == defaultmessage){

                this.value='';
                this.style.color = "black";

            }
        }

        searchBoxInput.addEventListener("keyup", function (d) {
            if (d.key == "Enter" && !d.shiftKey) {
                thisLib.CloseAlert();
                thisLib.CalculationGO(this.value);
            }
        })

        /*
        let explanation = document.createElement("p");
        explanation.innerHTML = "Input novel glycan with either GlycoCT or WURCS format<br>" +
            "And click compute to see the result" +
            "&nbsp;&nbsp;&nbsp;";
        explanation.style = "width: 95%; padding: 0 0 0 15px;";
         */

        let searchBoxButton = document.createElement("button");
        searchBoxButton.style = "position: absolute; bottom: 20px; left: 414px; font-size: 100%; border: solod border-color: black; width: 130px; height: 50px; background: inherit; ";
        searchBoxButton.innerHTML = "Align";
        searchBoxButton.type = "text";
        searchBoxButton.onclick = function (){
            thisLib.CloseAlert();
            thisLib.CalculationGO(searchBoxInput.value, "");
        }




        searchBox.appendChild(searchBoxInputTitle);
        searchBox.appendChild(searchBoxInput);
        // searchBox.appendChild(explanation);

        searchBox.appendChild(searchBoxButton);

        let msg = searchBox;

        this.AlertLowLevel(msg, 600, 300, "25%");

    }

    this.LoadingCircleShow = function () {
        let thisLib = this;

        let SpinningCircleContainer = document.createElement("div");


        let SpinningCircle = document.createElement("img");
        SpinningCircle.src = "https://gnome.glyomics.org/JS/loader.gif"
        SpinningCircle.style = "width: 200px; height: 200px; align: center; padding: 40px 0 0 100px";

        let words = document.createElement("p");
        words.style = "text-align: center; "
        words.innerText = "Computing subsumption alignment...";

        SpinningCircleContainer.style = "width: 400px; height: 320px; overflow: hidden; background: rgb(255, 255, 255); opacity:0.8; border: none; border-radius: 10px; position: absolute; top: 40px; align: center; box-shadow: 5px 5px 3px grey;"

        SpinningCircleContainer.appendChild(SpinningCircle)
        SpinningCircleContainer.appendChild(document.createElement("br"));
        SpinningCircleContainer.appendChild(words)

        this.AlertLowLevel(SpinningCircleContainer, 400, 100, "20%");
    }

    this.TooltipLowLevel = function () {
        // Custom tooltip function - deprecated
        return

        if (this.TooltipHide == true){
            return
        }

        let para = this.TooltipIndex;

        let title = {
            0: "Search",
            1: "Hint",
            2: "Reset",
            3: "Subsumption on-demand computation"
        }[para];

        let content = {
            0: "Jump to GlyTouCan accession or synonyms. ",
            1: "Click me for more detail.",
            2: "Clear everything",
            3: "Subsumption on-demand computation for novel glycan. It supports both GlycoCT and WURCS. "
        }[para];

        let thisLib = this;
        thisLib.ContainerTooltip.style.display = "";
        thisLib.ContainerTooltip.innerHTML = "<br>" + "<p style='text-align: center'>"+title+"</p>" +
            "<p style='padding: 10px'>" + content + "</p>";

        thisLib.ContainerTooltipArrow.style.display = "";
        thisLib.ContainerTooltipArrow.style.top = (29 + para * 60).toString() + "px";


    }

    this.TooltipClose = function (){
        this.ContainerTooltip.style.display = "none";
        this.ContainerTooltipArrow.style.display = "none";
    }

    this.CalculationGO = function (sequences, PreviousJobID){

        sequences = sequences.trim();

        this.LoadingCircleShow();

        this.Reset();

        let thisLib = this;

        this.SetCookie("SubsumptionRTSeq", encodeURIComponent(sequences), 7);


        let requestURL = thisLib.GlyLookupURL + "/submit";
        let requestPara = {
            "developer_email": "gnomebrowser@glyomics.org",
            "task": JSON.stringify({
                "seq": sequences
            })
        }

        function GetResult(GlylookupJobid){
            let requestURL = thisLib.GlyLookupURL + "/retrieve?task_id=" + GlylookupJobid;

            jQuery.getJSON(requestURL).then(function (d) {
                d = d[0];

                if (d.finished){

                    let eqgtcacc = d["result"];
                    if (eqgtcacc.length > 0){
                        thisLib.CloseAlert();
                        thisLib.RenderRTResultWithKnownGlyTouCanAccession(eqgtcacc[0].accession);
                    } else {
                        thisLib.SubsumptionRequest(sequences);
                    }
                }else{
                    setTimeout(GetResult, 1000, GlylookupJobid);
                }
            })
        }


        jQuery.post(requestURL, requestPara).then(function (d) {
            d = d[0]
            thisLib.SetCookie("SubsumptionTaskID", d.id, 7);
            GetResult(d.id);
        })

    }


    this.SubsumptionRequest = function (sequences, ondemandtaskid){
        let thisLib = this;


        let imagepara = {
            "notation": this.IconStyle,
            "display": "extended",
            "format": "png",
            "seq": sequences
        }
        let QueryImageRequest = jQuery.post(this.ImageGenerationSubmitURL, {"developer_email": "gnomebrowser@glyomics.org", "task": JSON.stringify(imagepara)});


        let requestURL = thisLib.SubsumptionComputingURL + "/submit";
        let requestPara = {
            "developer_email": "gnomebrowser@glyomics.org",
            "task": JSON.stringify({
                "seqs": {"Query": sequences}
            })
        }
        function GetResult(RealTimeCalculationHash){
            let requestURL = thisLib.SubsumptionComputingURL + "/retrieve?task_id=" + RealTimeCalculationHash;

            jQuery.getJSON(requestURL).then(function (d) {
                d = d[0];

                if (typeof d.error === "string" && d.error.includes("not found")){
                    thisLib.Alert("Error", d.error, false)
                    return
                }

                if (d.finished){

                    QueryImageRequest.then(function (ImageTaskSubmitResult){

                        let imgURL = thisLib.ImageGenerationGetImageURL + "task_id=" + ImageTaskSubmitResult[0].id;
                        thisLib.ImageComputed["Query"] = imgURL;

                        thisLib.CloseAlert();
                        thisLib.RenderRTResult(d);
                    })

                }else{
                    setTimeout(GetResult, 1000, RealTimeCalculationHash);
                }
            })
        }


        if (ondemandtaskid == undefined){
            jQuery.post(requestURL, requestPara).then(function (d) {
                d = d[0]
                GetResult(d.id);
            })
        } else {
            GetResult(ondemandtaskid);
        }
    }


    this.RenderRTResultWithKnownGlyTouCanAccession = function (acc) {
        this.SetFocus(acc);
        this.RefreshUI();
    }



    this.RenderRTResult = function (d) {
        let thisLib = this;

        let equivalent = d["result"]["equivalent"];
        let relationship = d["result"]["relationship"];
        let subsumptionlvl = d["result"]["subsumption_level"];
        let buttonconfig = d["result"]["buttonconfig"];
        let score = d["result"]["score"]

        let warningmsg = d["error"];

        if (warningmsg.length > 0){

            let message = ""
            for (let i in warningmsg){
                let wmsg = warningmsg[i];

                let numberx = parseInt(i)+1
                message += "<p>"+numberx.toString() + ". " +wmsg.replaceAll("\n","<br>")+"</p>"
            }


            this.Alert("Error(s)", message, false);
        }

        if (Object.keys(equivalent).includes("Query")){
            this.RenderRTResultWithKnownGlyTouCanAccession(equivalent["Query"]);
            return
        }


        let focus = "Query";
        let addquery = this.IsAllowedSubsumptionCategory(subsumptionlvl["Query"]);
        for (let parent of Object.keys(relationship)) {
            let children = relationship[parent];

            if (Object.keys(this.SubsumptionData).includes(parent)) {
                this.SubsumptionData[parent].Children = this.FilterChildren(children, addquery)
            } else if (parent.startsWith("Query")) {

                let eqgtcacc = equivalent[parent];
                if (eqgtcacc != undefined) {
                    this.SubsumptionData[eqgtcacc].Children = this.FilterChildren(children, addquery)
                } else {
                    let allow = this.IsAllowedSubsumptionCategory(subsumptionlvl[parent]);

                    if (allow){
                        this.SubsumptionData[parent] = {
                            "SubsumptionLevel": subsumptionlvl[parent],
                            "Children": this.FilterChildren(children, addquery),
                            "ButtonConfig": this.ButtonConfigCleanUp(buttonconfig[parent]),
                            "score": score[parent]
                        }
                    }

                    if (["composition", "basecomposition"].includes(subsumptionlvl[parent])){
                        this.IUPACCompositionData[parent] = this.ButtonConfigCleanUp(buttonconfig[parent])
                    }
                }
            }
        }

        this.ComputeTopLevelThings();

        thisLib.SetFocus(focus);
        thisLib.RefreshUI();

    }

    this.IsAllowedSubsumptionCategory = function (){
        throw "NotImplement";
    }

    this.FilterChildren = function (children, addquery){
        let allowedChildren = [];

        for (let c of children){
            if (c == "Query" && addquery){
                allowedChildren.push(c)
                continue
            }

            if (!Object.keys(this.SubsumptionData).includes(c)){
                continue
            }
            if (allowedChildren.includes(c)){
                continue
            }
            if (this.IsAllowedSubsumptionCategory(this.SubsumptionData[c].SubsumptionLevel)){
                allowedChildren.push(c)
            }
        }

        return allowedChildren
    }

    this.AddAllMonoButtons = function () {

        for (let m of this.AllItems){
            this.AddEachMonoButtons(m);
            if (m != this.AllItems[this.AllItems.length - 1]){
                this.ContainerScreenAPartA.appendChild(document.createElement("br"));
            }
        }

    }

    this.AddEachMonoButtons = function (IUPACSym) {
        var thisLib = this;
        let ind = this.AllItems.indexOf(IUPACSym);
        let icon = this.CreateMonoIcon(IUPACSym);


        let g;
        g = !this.SubFlag()[IUPACSym];
        let SubButton = this.CreateAddAndSubButton(false, g);
        SubButton.onclick = function () {
            thisLib.CompositionChange(IUPACSym, -1);
            thisLib.RefreshUI();
        };

        g = !this.AddFlag()[IUPACSym];
        let AddButton = this.CreateAddAndSubButton(true, g);
        AddButton.onclick = function () {
            thisLib.CompositionChange(IUPACSym, 1);
            thisLib.RefreshUI()
        };

        this.ContainerScreenAPartA.appendChild(SubButton);
        this.ContainerScreenAPartA.appendChild(icon);
        this.ContainerScreenAPartA.appendChild(AddButton);

        return 0
    }

    this.CreateMonoIcon = function (IUPACSym) {

        let icon = document.createElement("canvas");
        icon.setAttribute("width", "40px");
        icon.setAttribute("height", "40px");

        let config = this.IconConfig[IUPACSym];

        let ctx = icon.getContext("2d");
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
        } else if (config.shape == "empty") {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 41);
            ctx.lineTo(41, 41);
            ctx.lineTo(41, 0);
        } else {
            throw "UnsupportedShape";
        }

        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = config.count_color;
        let t = this.ItemCount[IUPACSym].toString();
        let x, y = 30;

        if (["S", "P", "Me", "X"].includes(IUPACSym)){
            ctx.font = "11px Arial";
            ctx.fillText(IUPACSym, 3, 10);
            ctx.font = "26px Arial";
        }

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

    this.CreateAddAndSubButton = function(add, grey) {
        let button = document.createElement("canvas");
        let color = "DodgerBlue";
        button.setAttribute("width", "40px");
        button.setAttribute("height", "40px");
        let ctx = button.getContext('2d');
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

    this.RefreshMatchedGlycans = function () {


        let colnum = parseInt((this.Width - 135) / 210);
        if (colnum == 0) {
            colnum == 1
        }


        let table = document.createElement("table");
        let row = document.createElement("tr");
        let c = 0;


        let thisLib = this;
        this.MatchedGlycans.sort(function (a, b) {
            return thisLib.GetDescendants(b).length - thisLib.GetDescendants(a).length
        });

        for (let acc of this.MatchedGlycans){
            let GlycanImage = this.CreateGlycanFigure(acc);

            if (this.HighLightGlycans.includes(acc)) {
                GlycanImage.style.border = "solid";
                GlycanImage.style.borderColor = "rgb(43, 124, 233)";
            }

            let td = document.createElement("td");

            td.appendChild(GlycanImage);
            c++;

            row.appendChild(td);
            if (c % colnum == 0) {
                table.appendChild(row);
                row = document.createElement("tr");
            }

        }
        if (c % colnum != 0) {
            table.appendChild(row);
        }

        this.ContainerScreenAPartB.appendChild(table);
        if (c % colnum > 0.5 * colnum) {
            // Make the banner more visible
            let placeholder = document.createElement("div")
            placeholder.style = "height: 50px";
            this.ContainerScreenAPartB.appendChild(placeholder);
        }
    }

    this.findByonicSynonym = function (gtcid){

        for (let sym0 of Object.keys(this.Synonym)){
            if (this.Synonym[sym0] == gtcid){

                if (sym0.includes("(")){
                    // Well, determine whether this synonym is byonic
                    return sym0
                }

            }
        }

        return undefined
    }

    this.CreateGlycanFigure = function (gtcid) {
        let figure = document.createElement("figure");
        figure.style.margin = 0;
        figure.id = "img_" + gtcid;
        let img = document.createElement("img");
        if (gtcid.startsWith("Query")){
            img.src = this.ImageComputed[gtcid];
        } else {
            img.src = this.ImageURLPrefix + gtcid + this.ImageURLSuffix;
        }

        img.style = "width: 200px; height: auto;";
        let thisLib = this;
        img.onclick = function () {
            thisLib.SubsumptionNavigatorFocusAccession = gtcid;
            thisLib.SetToScreenB();
            thisLib.UpdateHighlightGlycansFlag = false;
            thisLib.UpdateMonoFreqFlag = false;
            thisLib.RefreshUI();
        };
        let caption = document.createElement("figcaption");
        caption.innerHTML = gtcid;


        let sym = this.findByonicSynonym(gtcid);
        if (sym && this.ShowSynonymFlag){
            caption.innerHTML += "<br>" + sym;
        }
        if (this.ShowScoreFlag){
            caption.innerHTML += "<br>" + this.SubsumptionData[gtcid].score;
        }
        caption.style.textAlign = "center";

        figure.appendChild(img);
        figure.appendChild(caption);

        return figure
    }


    this.UpdateMaxPossibleComp = function() {

        for (let m of this.AllItems){
            this.ItemCountMax[m] = 0;
        }

        for (let acc of this.TopLevelThings){

            let thisComp = this.SubsumptionData[acc].ButtonConfig;
            let f = true;

            for (let m of this.AllItems) {
                if (this.ItemCount[m] > thisComp[m]) {
                    f = false;
                    break;
                }
            }

            if (f){
                for (let m of this.AllItems){
                    if (thisComp[m] > this.ItemCountMax[m] ){
                        this.ItemCountMax[m] = thisComp[m]
                    }
                }
            }
        }

    }

    this.UpdateHighlightGlycans = function (acc) {
        this.HighLightGlycans = [];
        let anc = this.GetAncestors(acc);
        anc.push(acc);

        for (let x of anc){
            if (!this.HighLightGlycans.includes(x)){
                if (this.TopLevelThings.includes(x)){

                }
                this.HighLightGlycans.push(x);
            }
        }

        return 0
    }

    this.FindAllMatchedThings = function () {
        this.MatchedGlycans = [];
        for (let acc of this.TopLevelThings){
            if (this.MatchToCurrentItemCount(this.SubsumptionData[acc].ButtonConfig)){
                this.MatchedGlycans.push(acc);
            }
        }
    }


    this.AddFlag = function () {
        let res = {};

        for (var m of this.AllItems){
            res[m] = this.ItemCount[m] < this.ItemCountMax[m];
        }

        if (this.ItemCount["Hex"] == this.ItemCountMax["Hex"]){
            res["Glc"] = false;
            res["Gal"] = false;
            res["Man"] = false;
        }
        if (this.ItemCount["HexNAc"] == this.ItemCountMax["HexNAc"]){
            res["GlcNAc"] = false;
            res["GalNAc"] = false;
            res["ManNAc"] = false;
        }
        if (this.ItemCount["dHex"] == this.ItemCountMax["dHex"]){
            res["Fuc"] = false;
        }

        return res
    }

    this.SubFlag = function () {
        let res = {};

        for (var m of this.AllItems){
            res[m] = this.ItemCount[m] > 0;
        }

        let hexnacCount = 0;
        for (let m of ['GlcNAc', 'GalNAc', 'ManNAc']){
            hexnacCount += this.ItemCount[m];
        }
        res["HexNAc"] = hexnacCount < this.ItemCount["HexNAc"];

        let hexCount = 0;
        for (let m of ['Glc', 'Gal', 'Man']){
            hexCount += this.ItemCount[m];
        }
        res["Hex"] = hexCount < this.ItemCount["Hex"];

        res["dHex"] = this.ItemCount["Fuc"] < this.ItemCount["dHex"];

        return res
    }

    this.CompositionChange = function(iupac, num) {
        let c = this.ItemCount[iupac];

        let AddFlag = this.AddFlag();
        let SubFlag = this.SubFlag();

        if (num < 0 && c + num < 0) {
            // ignore minus count
        } else if (num > 0 && !AddFlag[iupac]) {
            // exceed maximum possible configuration
        } else if (num < 0 && !SubFlag[iupac]) {
            // exceed maximum possible configuration
        } else {
            this.ItemCount[iupac] = this.ItemCount[iupac] + num;
            if (['GlcNAc', 'GalNAc', 'ManNAc', 'Glc', 'Gal', 'Man'].includes(iupac)){
                this.ItemCount[{3: "Hex", 6:"HexNAc"}[iupac.length]] = this.ItemCount[{3: "Hex", 6:"HexNAc"}[iupac.length]]+ num;
            }
            if (iupac == "Fuc"){
                this.ItemCount["dHex"] = this.ItemCount["dHex"] + num;
            }
        }

        this.UpdateMaxPossibleComp();
    }

    this.GetDescendants = function (acc) {
        let res = [];
        if (!Array.isArray(this.SubsumptionData[acc].Children)){
            return res
        }

        for (let nc of this.SubsumptionData[acc].Children){
            res = res.concat(JSON.parse(JSON.stringify(this.GetDescendants(nc))));
            res.push(nc);
        }

        let res2 = [];
        res.forEach(function (d) {
            if (!res2.includes(d)){
                res2.push(d);
            }
        });

        return res2
    }


    this.GetParents = function (acc) {
        let res = [];
        for (let p of Object.keys(this.SubsumptionData)){
            if (this.SubsumptionData[p].Children.includes(acc)){
                res.push(p)
            }
        }
        return res
    }


    this.GetAncestors = function (acc) {
        let res = this.GetParents(acc);
        if (res.length == 0){
            return []
        }

        for (let p of res){
            res = res.concat(this.GetAncestors(p));
            let res2 = [];
            res.forEach(function (d) {
                if (!res2.includes(d)){
                    res2.push(d);
                }
            });
            res = res2;
        }
        return res
    }


    this.GetDescendantsForCopy = function (acc) {
        let res = [];
        if (!Array.isArray(this.AllChildren[acc])){
            return [acc]
        }

        for (let nc of this.AllChildren[acc]){
            res = res.concat(JSON.parse(JSON.stringify(this.GetDescendantsForCopy(nc))));
            res.push(nc);
        }

        let res2 = [];
        res.forEach(function (d) {
            if (!res2.includes(d)){
                res2.push(d);
            }
        });
        if (!res2.includes(acc)){
            res2.push(acc)
        }

        return res2
    }

    this.GetParentsForCopy = function (acc) {
        let res = [];
        for (let p of Object.keys(this.AllChildren)){
            if (this.AllChildren[p].includes(acc)){
                res.push(p)
            }
        }
        return res
    }


    this.GetAncestorsForCopy = function (acc) {
        let res = this.GetParentsForCopy(acc);
        if (res.length == 0){
            return [acc]
        }

        for (let p of res){
            res = res.concat(this.GetAncestorsForCopy(p));
            let res2 = [];
            res.forEach(function (d) {
                if (!res2.includes(d)){
                    res2.push(d);
                }
            });
            res = res2;
        }
        if (!res.includes(acc)){
            res.push(acc)
        }
        return res
    }


    this.ShowSubsumptionNavigator = function () {

        let acc = this.SubsumptionNavigatorFocusAccession;
        let thisLib = this;

        let component = {};
        let parent = [];

        for (let p of Object.keys(this.SubsumptionData)){
            let tmpx = this.SubsumptionData[p].Children;
            if (tmpx == undefined){
                continue
            }
            if (tmpx.includes(acc)){
                parent.push(p);
            }
        }

        let children = this.SubsumptionData[acc].Children;
        if (children == undefined){
            children = [];
        }

        let allNodes = parent.concat(children);
        allNodes.push(acc);
        allNodes.push("Pseudo");

        let nodes = {};
        for (let n of allNodes){
            nodes[n] = {"name": n};
            let label = n;

            let sym = this.findByonicSynonym(n)
            if (sym && this.ShowSynonymFlag){
                label += "\n" + sym;
            }

            if (this.ShowScoreFlag && this.SubsumptionData[n] != undefined){
                label += "\n" + this.SubsumptionData[n].score;
            }

            nodes[n].label = label


            if (n == "Pseudo"){
                nodes[n].type = "Pseudo";
                nodes[n].hidden = true;
            }else{
                nodes[n].type = this.SubsumptionData[n].SubsumptionLevel;

                if (n.startsWith("Query")){
                    nodes[n].alternativeImageURL = this.ImageComputed[n];
                }
            }
        }

        let edges = {};
        for (let n of parent){
            let e = {};
            e.from = n;
            e.to = acc;
            e.type = "contains";
            edges[n] = [e];
        }
        let temp = [];
        for (let n of children){
            let e = {};
            e.from = acc;
            e.to = n;
            e.type = "contains";
            temp.push(e);
        }
        if (children.length > 0){
            edges[acc] = temp;
        }

        let temp2 = [];

        if(parent.length > 0){
            for (let n of parent){
                let e = {};
                e.from = "Pseudo";
                e.to = n;
                e.type = "contains";
                temp2.push(e);

                let e2 = {};
                e2.from = n;
                e2.to = acc;
                e2.type = "contains";
                edges[n] = [e2];
            }
        }else{
            let e = {};
            e.from = "Pseudo";
            e.to = acc;
            e.type = "contains";
            temp2.push(e);
        }
        edges["Pseudo"] = temp2;


        for (let c of children){

            if (this.GetDescendants(c).length < 1){
                continue;
            }
            let tridot_name = c + "3dots";
            nodes[tridot_name] = {
                "name": tridot_name,
                "alternativeImageURL": thisLib.ImageTriDots,
                "label": "(" + this.GetDescendants(c).length.toString() + ")"
            };
            edges[c] = [{
                "from": c,
                "to": tridot_name,
                "type": "contains"
            }];

        }

        component["nodes"] = nodes;
        component["edges"] = edges;
        component["root"] = "Pseudo";

        this.SubsumptionNavigatorOption.essentials.component = component;
        this.SubsumptionNavigatorOption.essentials.highLightedNodes = [acc];
        this.SubsumptionNavigatorController.init(this.SubsumptionNavigatorOption);


    }

    this.InjectGoogleAnalytics = function () {

        /*
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-164151077-4"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'UA-164151077-4');
        </script>
         */

    }

    // Functions for setting things
    this.SetIconConfig = function (IconStyle) {
        if (['cfg', 'snfg'].includes(IconStyle)){
            this.IconStyle = IconStyle;

            if (IconStyle == "cfg"){
                this.IconConfig = IconConfigCFG;
            }
            else if (IconStyle == "snfg"){
                this.IconConfig = IconConfigSNFG;
            }
            else{
                throw 'NotSupportedIconStyle'
            }
        }

    }

    this.SetImageSource = function (prefix, suffix) {
        this.ImageURLPrefix = prefix;
        this.ImageURLSuffix = suffix;

        this.SubsumptionNavigatorOption.essentials.imgURL1 = prefix;
        this.SubsumptionNavigatorOption.essentials.imgURL2 = suffix;
    }

    this.SetWidth = function (w) {

        if (typeof w == "number"){
            if (w >= this.MinWidth){
                this.Width = w;
            }
            else {
                this.Width = this.MinWidth;
            }
        }

    }

    this.SetHeight = function (h) {

        if (typeof h == "number"){
            if (h >= this.MinHeight){
                this.Height = h;
            }
            else {
                this.Height = this.MinHeight;
            }
        }

    }

    this.SetBrand = function (b) {
        this.brand = b;
    }

    this.SetToScreenA = function () {
        this.DisplayScreen = 0;
    }

    this.SetToScreenB = function () {
        this.DisplayScreen = 1;
    }

    this.SetFocusAccession = function (acc) {
        this.SubsumptionNavigatorFocusAccession = acc;
    }

    this.SetItemCount = function (IC) {
        let thisLib = this;

        Object.keys(IC).forEach(function (k) {
            if (!thisLib.AllItems.includes(k)){
                return
            }
            if (parseInt(IC[k]) >= 0){
                thisLib.ItemCount[k] = parseInt(IC[k]);
            }
        })

    }

    this.SetFocus = function (d) {
        let s = d.trim();
        let acc = s;

        if (this.GlyTouCanAccessionRegex(acc)){
            acc = acc.toUpperCase();
        }

        if (Object.keys(this.Synonym).includes(s)){
            acc = this.Synonym[s];
        }

        if (Object.keys(this.SubsumptionData).includes(acc)){
            this.SetToScreenB();
            this.SetFocusAccession(acc);
        }
        else if (Object.keys(this.IUPACCompositionData).includes(acc)){
            this.SetToScreenA();
            this.ItemCount = JSON.parse(JSON.stringify(this.IUPACCompositionData[acc]))
        }
        else{
            let msg = '<br><br><br>';
            if (this.GlyTouCanAccessionRegex(acc)){
                msg += 'GlyTouCan accession not supported: ' + acc;
            }
            else{
                msg += d.trim() + " not found";
            }

            this.Alert('Error', msg, false)
            return
        }

        // this.RefreshUI();

    }


    this.SetShowScoreFlag = function (f){
        this.ShowScoreFlag = f;
        this.SetCookie("ShowScoreFlag", f, 7)
    }

    this.SetShowSynonymFlag = function (f){
        this.ShowSynonymFlag = f;
        this.SetCookie("ShowSynonymFlag", f, 7)
    }

    this.GlyTouCanAccessionRegex = function (acc) {
        let re = /g|G\d{5}\w{2}/;
        return re.test(acc)
    }








    // Functions for getting things
    this.GetStatus = function () {
        let res = {};
        res.Screen = this.DisplayScreen;
        res.MonoCount = this.ItemCount;
        res.FocusAccession = this.SubsumptionNavigatorFocusAccession;
        res.ScreenATitle = this.ScreenATitle;
        res.ScreenBTitle = this.ScreenBTitle;

        return JSON.parse(JSON.stringify(res))
    }



}


function GNOmeStructureBrowser (DIVID) {
    GNOmeBrowserBase.call(this, DIVID);

    this.AllItems = ['GlcNAc', 'GalNAc', 'ManNAc', 'HexNAc','Glc', 'Gal', 'Man', 'Hex','Fuc', 'dHex', 'NeuAc', 'NeuGc', 'Xxx'];
    this.ScreenATitle = "GNOme Topology Selector";

    this.IsAllowedSubsumptionCategory = function (d) {
        return ['topology', 'saccharide'].includes(d)
    }

    this.ComputeTopLevelThings = function (){
        this.TopLevelThings = [];

        let TopLevelCandidate = [];
        let Parents = {};

        let AllAccession = Object.keys(this.SubsumptionData);

        for (let acc of AllAccession){
            Parents[acc] = []
        }

        for (let acc of AllAccession){
            for (let c of this.SubsumptionData[acc].Children){
                if (!Parents[c].includes(acc)){
                    Parents[c].push(acc)
                }
            }
        }

        for (let acc of Object.keys(Parents)){

            if (this.SubsumptionData[acc].SubsumptionLevel != "topology"){
                continue
            }

            TopLevelCandidate.push(acc);
        }


        for (let acc of TopLevelCandidate){

            let AppendFlag = true;
            for (let p of Parents[acc]){
                let same = true;
                let ItemCountP = this.SubsumptionData[p].ButtonConfig;
                let ItemCountC = this.SubsumptionData[acc].ButtonConfig;

                for (let m of this.AllItems){

                    if (ItemCountP[m] != ItemCountC[m]){
                        same = false;
                        break
                    }

                }
                if (same){
                    AppendFlag = false;
                }
            }

            if (AppendFlag){
                this.TopLevelThings.push(acc);
            }
        }
    }

    this.DataPreProcess = function (RawData) {

        let AllAccession = Object.keys(RawData);

        for (let acc of AllAccession){

            let d = RawData[acc];

            let ButtonConfig = this.ButtonConfigCleanUp(d.count);
            let Children = [];
            let syms = d.syms;

            if (syms != undefined){
                for (let sym of syms){
                    this.Synonym[sym] = acc;
                }
            }

            // Filter which child to keep
            if (d.children != undefined){
                for (let c of d.children){
                    let tmp = RawData[c];
                    if (tmp == undefined){
                        continue
                    }
                    if (this.IsAllowedSubsumptionCategory(tmp.level)){
                        Children.push(c);
                    }
                }
            }

            if ( this.IsAllowedSubsumptionCategory(d.level) ){
                this.SubsumptionData[acc] = {
                    "SubsumptionLevel": d.level,
                    "Children": Children,
                    "ButtonConfig": ButtonConfig,
                    "score": d.score
                };

            }
            if ( ['basecomposition', 'composition'].includes(d.level) ){
                this.IUPACCompositionData[acc] = ButtonConfig;
            }

        }

    }

    this.ButtonConfigCleanUp = function (d) {
        let res = {};

        for (let m of ['GlcNAc', 'GalNAc', 'ManNAc', 'Glc', 'Gal', 'Man', 'Fuc', 'NeuAc', 'NeuGc', "Hex", "HexNAc", "dHex"]){
            if (d[m]!= undefined){
                res[m] = d[m];
            }
            else{
                res[m] = 0;
            }
        }
        let xxx = 0
        for (let m of ['Pent', 'HexA', 'HexN', "Xxx"]){
            if (d[m]!= undefined){
                xxx += d[m];
            }
        }
        res["Xxx"] = xxx;
        return res
    }

    this.MatchToCurrentItemCount = function (ItemCountX) {

        for (let mc of this.AllItems) {
            if (mc.includes("Hex")){
                if (this.ItemCount[mc] != ItemCountX[mc]) {
                    return false
                }
            }else if (['NeuAc', 'NeuGc', "Xxx"].includes(mc)){
                if (this.ItemCount[mc] != ItemCountX[mc]) {
                    return false
                }
            }
            else{
                if (this.ItemCount[mc] > ItemCountX[mc]) {
                    return false
                }
            }

        }
        return true
    }



}
GNOmeStructureBrowser.prototype = new GNOmeBrowserBase();
GNOmeStructureBrowser.prototype.constructor = GNOmeStructureBrowser;


function GNOmeCompositionBrowser(DIVID) {
    GNOmeBrowserBase.call(this, DIVID);

    this.AllItems = ['GlcNAc', 'GalNAc', 'ManNAc', 'HexNAc','Glc', 'Gal', 'Man', 'Hex','Fuc', 'dHex', 'NeuAc', 'NeuGc', 'Xxx', 'S', 'P', 'Me', 'X'];
    this.ScreenATitle = "GNOme Composition Selector";
    this.MinHeight = 750;

    this.IsAllowedSubsumptionCategory = function (d) {
        return ['basecomposition', 'composition'].includes(d)
    }

    this.ComputeTopLevelThings = function (){
        this.TopLevelThings = [];

        let TopLevelCandidate = [];
        let Parents = {};

        for (let acc of Object.keys(this.SubsumptionData)){
            Parents[acc] = []
        }


        for (let acc of Object.keys(this.SubsumptionData)){
            TopLevelCandidate.push(acc);

            for (let c of this.SubsumptionData[acc].Children){

                if (!Parents[c].includes(acc)){
                    Parents[c].push(acc)
                }
            }

        }

        for (let acc of TopLevelCandidate){
            let AppendFlag = true;

            for (let p of Parents[acc]){
                let same = true;
                let ItemCountP = this.SubsumptionData[p].ButtonConfig;
                let ItemCountC = this.SubsumptionData[acc].ButtonConfig;

                for (let m of this.AllItems){

                    if (ItemCountP[m] != ItemCountC[m]){
                        same = false;
                        break
                    }

                }
                if (same){
                    AppendFlag = false;
                }
            }

            if (AppendFlag){
                this.TopLevelThings.push(acc);
            }
        }
    }


    this.DataPreProcess = function (RawData) {

        let AllAccession = Object.keys(RawData);

        for (let acc of AllAccession){

            let d = RawData[acc];
            if ( !this.IsAllowedSubsumptionCategory(d.level) ){
                continue
            }

            let ButtonConfig = this.ButtonConfigCleanUp(d.count);
            let Children = [];

            let syms = d.syms;

            if (syms != undefined){
                for (let sym of syms){
                    this.Synonym[sym] = acc;
                }
            }

            if (d.children != undefined){
                for (let c of d.children){
                    let tmp = RawData[c];
                    if (tmp == undefined){continue}
                    if (this.IsAllowedSubsumptionCategory(tmp.level)){
                        Children.push(c);
                    }
                }
            }

            this.SubsumptionData[acc] = {
                "SubsumptionLevel": d.level,
                "Children": Children,
                "ButtonConfig": ButtonConfig,
                "score": d.score
            };
            this.IUPACCompositionData[acc] = ButtonConfig;

        }



    }

    this.ButtonConfigCleanUp = function (d) {
        let res = {};

        for (let m of ['GlcNAc', 'GalNAc', 'ManNAc', 'Glc', 'Gal', 'Man', 'Fuc', 'NeuAc', 'NeuGc', "Hex", "HexNAc", "dHex", 'S', 'P', 'Me', 'X']){
            if (d[m]!= undefined){
                res[m] = d[m];
            }
            else{
                res[m] = 0;
            }
        }
        let xxx = 0
        for (let m of ['Pent', 'HexA', 'HexN', "Xxx"]){
            if (d[m]!= undefined){
                xxx += d[m];
            }
        }
        res["Xxx"] = xxx;
        return res
    }





    this.MatchToCurrentItemCount = function (ItemCountX) {

        for (let mc of this.AllItems) {
            if (mc.includes("Hex")){
                if (this.ItemCount[mc] != ItemCountX[mc]) {
                    return false
                }
            }else if (['NeuAc', 'NeuGc', "Xxx", 'S', 'P', 'Me', 'X'].includes(mc)){
                if (this.ItemCount[mc] != ItemCountX[mc]) {
                    return false
                }
            }
            else{
                if (this.ItemCount[mc] > ItemCountX[mc]) {
                    return false
                }
            }

        }
        return true
    }


    // Hint title and message
    this.HintTitleForScreenA = 'Composition Selector';
    this.HintTitleForScreenB = 'Subsumption Navigator';

    this.HintMessageForScreenA = "<ul style='position: relative; top: -20px; text-align: left; '>" +
        "<li>Click controls at left to add/remove monosaccharides</li>" +
        "<li>Click a Composition to jump to Subsumption Navigator</li>" +
        "<li>Click notepad on top right to align novel glycan</li>" +
        "<li><a target='_blank' href='https://gnome.glyomics.org/docs/'>More...</a></li>" +
        "</ul>";

}
GNOmeCompositionBrowser.prototype = new GNOmeBrowserBase();
GNOmeCompositionBrowser.prototype.constructor = GNOmeCompositionBrowser;


function GNOmeDisplayPresetFullScreen(GNOmeBrowserX) {

    this.WindowWidth = window.innerWidth;
    this.WindowHeight = window.innerHeight;
    this.LastBrowserStatus = GNOmeBrowserX.GetStatus();

    this.PreventPushState = false;

    let KeyboardShortcuts = {
        "n": "GlcNAc",
        "m": "Man",
        "g": "Gal",
        "f": "Fuc",
        "s": "NeuAc",
        //"x": "Xxx"
    };

    this.Monitor = function(thisLib){

        let BrowserStatus = GNOmeBrowserX.GetStatus();
        let Screen = BrowserStatus.Screen;
        let Freq = BrowserStatus.MonoCount;
        let Acc = BrowserStatus.FocusAccession;
        let ScreenATitle = BrowserStatus.ScreenATitle;
        let ScreenBTitle = BrowserStatus.ScreenBTitle;

        let title = "";
        if (Screen == 0) {
            title = ScreenATitle + ": "
            Object.keys(Freq).sort().forEach(function (k) {
                if (Freq[k] != 0){
                    title += k + "(" + Freq[k] + ")";
                }
            })
        }
        else if (Screen == 1) {
            title = ScreenBTitle + ": "
            title += Acc;
        }

        if (title != document.title){
            document.title = title;
        }
        else{
            return
        }


        let URL = location.protocol + '//' + location.host + location.pathname;
        let URLPara = "";
        if (Screen == 0) {
            Object.keys(Freq).sort().forEach(function (k) {
                if (Freq[k] != 0){
                    URLPara += k + "=" + Freq[k] + "&";
                }
            })
        }
        else if (Screen == 1) {
            URLPara = "focus=" + Acc
        }

        let FullURL = URL;
        if (URLPara.length > 0){
            FullURL += "?" + URLPara;
        }
        if (thisLib.PreventPushState){
            thisLib.PreventPushState = false;
        }else{
            if (FullURL != window.location.href){
                history.pushState({}, "", FullURL);
            }

        }


    }


    this.TmpTimeStamp = new Date().getTime();

    this.StartMonitor = function () {
        let thisLib = this;
        document.getElementsByTagName('body')[0].onresize = function () {
            thisLib.TmpTimeStamp = new Date().getTime();

            setTimeout(thisLib.AfterResize, 510, thisLib)

        }

        window.setInterval(this.Monitor, 100, thisLib);

        window.onpopstate = function () {
            thisLib.PreventPushState = true;
            let p = thisLib.GetURLParameter(thisLib);
            thisLib.UpdateGNOmeBrowser(p);
        }
    }

    this.AfterResize = function (thisLib) {
        if (new Date().getTime() - thisLib.TmpTimeStamp > 500){
            thisLib.ResizeToCurrent();
        }
    }

    this.ResizeToCurrent = function () {
        this.WindowWidth = window.innerWidth;
        this.WindowHeight = window.innerHeight;

        GNOmeBrowserX.SetHeight(this.WindowHeight);
        GNOmeBrowserX.SetWidth(this.WindowWidth);
        GNOmeBrowserX.RefreshUI();
    }

    this.UpdateGNOmeBrowser = function (para) {

        if (Object.keys(para).includes('ondemandtaskid')){
            GNOmeBrowserX.LoadingCircleShow();
            GNOmeBrowserX.SubsumptionRequest("", para.ondemandtaskid);
            return
        }

        if (Object.keys(para).includes('focus')){
            GNOmeBrowserX.SetFocus(para.focus);
        } else {
            let NewCount = {};
            GNOmeBrowserX.AllItems.forEach(function (k) {
                if (Object.keys(para).includes(k)){
                    NewCount[k] = parseInt(para[k]);
                }
                else{
                    NewCount[k] = 100;
		    for (let acc of GNOmeBrowserX.TopLevelThings){

                        let thisComp = GNOmeBrowserX.SubsumptionData[acc].ButtonConfig;

                        if (thisComp[k] < NewCount[k] ){
                            NewCount[k] = thisComp[k];
                        }
                    }
                }
	    })
            GNOmeBrowserX.SetItemCount(NewCount);
            GNOmeBrowserX.SetToScreenA();
        }

        if (Object.keys(para).includes('score')){
            if (["true", "t", "yes", "y", "on"].includes(para["score"].toLowerCase())){
                GNOmeBrowserX.SetShowScoreFlag(true);
            } else if (["false", "f", "no", "n", "off"].includes(para["score"].toLowerCase())){
                GNOmeBrowserX.SetShowScoreFlag(false);
            }
        }


        GNOmeBrowserX.RefreshUI();
    }

    this.GetURLParameter = function (thisLib) {

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        let res = {};

        for (let k of urlParams.keys()){
            res[k] = urlParams.get(k)
        }

        return res
    }

    this.FixAnyHexCount = function (p) {
        let hex = 0;
        let hexnac = 0;
        let dhex = 0;

        for (let m of ['Glc', 'Gal', 'Man']){
            if (Object.keys(p).includes(m)){
                hex += parseInt(p[m]);
            }
        }

        for (let m of ['GlcNAc', 'GalNAc', 'ManNAc']){
            if (Object.keys(p).includes(m)){
                hexnac += parseInt(p[m]);
            }
        }

        for (let m of ['Fuc']){
            if (Object.keys(p).includes(m)){
                dhex += parseInt(p[m]);
            }
        }

        for (let m of ['Hex','HexNAc','dHex']){
            if (p[m] == undefined){
                p[m] = "0";
            }
        }

        if (hex > 0 && parseInt(p['Hex']) < hex){
            p['Hex'] = hex.toString();
        }

        if (hexnac > 0 && parseInt(p['HexNAc']) < hexnac){
            p['HexNAc'] = hexnac.toString();
        }

        if (dhex > 0 && parseInt(p['dHex']) < dhex){
            p['dHex'] = dhex.toString();
        }
        return p

    }

    this.FixBodyEle = function (){
        let bodyele = document.getElementsByTagName("body")[0];
        bodyele.style.margin = 0;
    }

}














