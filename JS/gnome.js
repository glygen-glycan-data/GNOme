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
                entry.innerHTML = "Copy accession"; //change the description
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

            var descendants = thisLib.para.GNOmeBrowser.GetDescendants(selectedNode);
            if (descendants.length > 0){
                var entry = document.createElement("dt");
                entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                entry.onmouseover = function(d){
                    this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
                };
                entry.onmouseout = function(d){
                    this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
                };
                entry.innerHTML = "Copy descendants"; //change the description

                var descendants_str = "";
                for (var des of descendants){
                    descendants_str += des + "\n";
                }
                entry.name = descendants_str;

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
            // menuList.appendChild(entry);

            var nojumpflag = true;
            var externalLinks = para["contextMenu"]["externalLinks"];
            for (var externalLink of externalLinks){
                var title = externalLink["name"] || "";
                var prefix = externalLink["url_prefix"] || "";
                var suffix = externalLink["url_suffix"] || "";
                var accs = externalLink["glycan_set"];

                if (selectedNode !== undefined && selectedNode !== "Topology" && !selectedNode.startsWith("fake") && !selectedNode.endsWith("3dots")){
                    var entry = document.createElement("dt");
                    entry.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none;";
                    entry.onmouseover = function(d){
                        this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #111111";
                    };
                    entry.onmouseout = function(d){
                        this.style = "cursor: default; display: block; color: white; text-align: left; padding: 5px; text-decoration: none; background-color: #333333";
                    };
                    entry.innerHTML = "&nbsp&#x2192;&nbsp" + title; //change the description
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

    // Tailored parameter for different browser
    this.AllItems = undefined;

    // Image and icon style
    this.IconStyle = "cfg";
    this.ImageURLPrefix = "https://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/";
    this.ImageURLSuffix = ".png";
    this.IconConfig;


    // The data decides what to show
    this.ItemCount = {};
    this.ItemCountMax = {};
    this.MatchedGlycans = [];
    this.HighLightGlycans = [];
    this.SubsumptionNavigatorFocusAccession = "";
    this.DisplayScreen = 0;
    this.ScreenATitle = "";
    this.ScreenBTitle = "GNOme Subsumption Navigator";
    this.UpdateHighlightGlycansFlag = true;
    this.UpdateMonoFreqFlag = true;

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
    // this.LeftTurnButton;
    // this.RightTurnButton;


    // Base64 encoded images
    this.ImageUpArrow       = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAIlUExURQAAAKanpaampqWlpaanpP///6SkpKKioqWnpKWloqWmpaanpaWmpKanpaWmpaanpaWnpaSppKWmpKWnpaWnpKampKampqqqqqWmpKWnpba2tqWmpKWnpbKymaampaWmpKWmpKWmpKWlpb+/v6anpaSppKampaWmpKampKWnpaWnpKampKanpaaopqanpaenp6ampqWmpaWmpKWmpaWmpKWlpaanpaampaampqampaampaWlpaWopaanpaWnpaWmpaenpKWopaWlpaGhoaampKampKampqWmpaWnpKanpaanpaampKSopKWmpKampKiooqSkpKampKWmpaampOPj46anpWRkZM3Nzaenp+Li4t7e3uHh4eDg4KmqqHJyctjZ2NnZ2aytrNXW1dvb239/f9/f38fIx2lpaby8u9bX1t3d3bOzsq6vrausq8bGxdvb2qipp8jIyKeopsDAv83NzM3OzdPU09ra2sXFxLe4t2VlZZGRkWdnZ7a2tm5ubsnJyNTU1Ly8vMLCwdXV1NLT0ouLi7q6ur2+vbu7umpqarm5udDQz8vLyqWlpbW2taGhobe3tri5uI6OjsHBwKioqMTEw6urqc/PznFxcWtra4KCgrGxsMPDwtDQ0Hp6erGysb+/v35+fq6vrp+fn93e3bS1tMzMzKCgoH19fWZmZoyMjJSUlImJiY+Pj56enmhoaKqqqrCxr8nJyXt7e72+vJaWlnBwcAOHp2UAAABUdFJOUwDmBSKzAQIQvRvh+vbxPtKOI/yU6JZZD9x6B/B1Cm3i1eoVBO8gn/6kfstT5Cb0KjW82dP7SoFnDcFkGFWr0YxdWzkTfJ5WzbT96XFB+ZAvMHPKhQ5uQCgAAASKSURBVFjDtZhnW1RXEIDHiEq3YUNF7AU19l7Te73v4DZgRRClKZEAKmJDULFHUWNs0WhMYmLa78uHe3f3nLu7uLvPk/m25868d+6Uc86syP8pK3btzNsxaiWULF+2/euqrVmaj12/qAxbFld+9taYjAGjJ/jtPZn+zryMAG8uWWeadViQlRMKXgsYN/lDTztyrW24NhhynPCTA503Lx/ylotnvDEyYbf3Ca039gYcS0Jn/464z9aUjgCYvchVar7os/coQ48BmLR0bNowrgXg+7NOOgkciQKQPy414YsygEij6UHb7f37wiYkfLoDYG3KqJaWADzoMg2qVVXv2J6ciQIUTkwmfD4TYCBkvfKEqqo+sxnBqwDTk/yYOBeg21b+RVVV9egpX0SaAMZP8+WiEqDPVv1OPblT7QvrQ4A8u97fTeHDqaMxhNbU+RhNALNMwlSAh7ZW9XlNiJ0WxwlcBopWGVX9EdBsRdKpq1FTjvncONgKjE/U+hQgYmXTadintuzxMc4CfBzvzUlAo61xTP1yzscYABbEqnQJ8MDuClyzf1VV9WdVVd0/5CuPW8AGryTWAXZfXHAJJ35UVVUvuTVnbEYjsGCTiIjsBJqth3/uV1XV44f3qKpq9TOX8ShoaYVbgS0iIvPLgItWF3jJ6HU8hPPCXbhuu9EGbBYRWQ9EzUgEH7kGV5w4Ivg8vmQmFli8UEQWAafNJ9dd9RdOAmE4ZspV4EsRGQXsNdavuMrPgybCORwLj4kYAvJFVgAR4zt6zfAnEPEkmWmpB4pFdgHXEquHf3eLwH2bgXAuuYz7Bw1GC+CmtC2RDHeT0QtOEiJWsP0Bu2FF8oDheIzvu2qXnBSIWNu8tKtLZAdQG1v6x9eWFiLevIluGQZEyoBY1YXcbtgXTI2IbSH9ie8GRFYCsZ0ifFxVtSbulB/hbWQv4r9rARGgI770UlXPGxulH+FEVPXoQyurIgCJI++Pu7/95IyAcHr7fzU2yHZApAQIpzsAkxG2uB+yHDiYK+IkIPIVcCBXRCfg7nqduSK6AZGlwM1cEYOAyDagJ1dEFBAp8DV7Noh2YKaITAe+zQ3RB+SJyOTk4zRTRDOwUUQ+AW6FckHUAUXzRGTsHGAoF8QN7ztENgCPA9kjgoeAKhER2fopUJ094h5QOD9xN4iGs0W0HwIqvJO9oNh/GmWC6AEKy2MXjBlAx4HsEEcApsZvOeVrgJaGbBBdESDfuPOVTgKuBjJHNLwCZo42r3xLAZoyRoSaAd6zh7F8gG8yRIR6AKb4p6HxAIOBTBANTwHyk6ajguUAl+27UKuqqvr6uOsVwLJpKebSOQBRS/+H46r6ly+bEYBlb6caSBZWAjBgOnLutt61LoPtPQCsnpZmOvwAgFt9Zutb0QnecwfFyWmnxDGzigCItj1J2RU3XEDJtpGGzFXvewPutaF63/7S99SbVFePfs20XrEgNhm3NDUOn6mrr6892dk9GI2tFk59/eS+acZc0sqcivKMpvbZWzYvTmVflFc1P/N/HxbOyi+27edu35j6b4P/ABNAhS1rtF+LAAAAAElFTkSuQmCC";
    this.ImageQuestionMark  = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAALiUExURQAAAKanpaanpKanpaqqqqanpaOjo6WnpP///6WlpaqqqqqqqqampqWnpKWmpJ+fn6WmpaWmpKWmpLKymba2tqWmpKWlpaWnpaWmpL+/v6WmpKWmpKWnpKWmpKanpaWlpaWlpaWnpaqqoKKqoqWmpaWmpaWmpKWmpKWnpaampKWnpaampaKioqampaanpaKqoqampaWopaWnpaampKanpaamo6anpaenp6enpKWnpaSkpKenp6ampH9/f6WmpKWopaampKiooqqqqqampqWmpKOqo6anpaenp6Wlpaenp6WnpKWnpZmZmaampaampqampKWmpaOjo6anpaSopKampKWnpaSopKampKampKampqWnpaampKanpaWlpaGhoaWnpKanpaampKampqWlpaampKWlpaampKampaOjo6ampKWlpaqqqqampKWmpaWnpKWnpaampqWmpaWmpaanpKampKWmpaWnpKWnpaWmpePj46anpWRkZK+vr+Li4qenp3l5eYyMjOHh4dzc3KmqqIODg97e3paWlm9vb+Dg4Le3t9vb27+/v7y8u9jY2M7Ozp6enqipp6eopsbGxtra2tXV1cXFxKytrM3Ozb2+va6vrd/f383NzMfIx8XGxdrb2sHBwMjJyNnZ2d3d3bq7ub6/vs/PzsvLysfHxqqrqdXV1Le4t9LS0bKzscLCwdbX1rW2tc7PztXW1a6vrri5t6usqt3e3dvb2re3tq2urKytq8vMy7S0s5qamrCwr8/Pz7a3tcHCwcLDwqysq7KzstDQz6urqrGysMDAv7Cxr97f3tLT0oiIiLGxsLy8vNTV1LO0stPT0tbW1sTEw3t7e6GhodjZ2NPT05WVlbi5uL2+vNTU1KamptTU04uLi7u7usPDwpCQkLW2tLGyscPEw8nJycnJyM/Qz7i4t83NzW5ubra2tre4tr+/vrOzs4qKimdnZ9PU03x8fMbGxbOzsrS1tN3d3M0L7c8AAAB5dFJOUwDxstID+hy9ASIGD1no/BDh3PAKB/YRdeIE6v7L5/Q/SpQbJLzT2fuOlnqzFp/uIcFVfaTjVOYmXWwwKZMC1ltxLxVW+Sf9IDkjtIAF1TSezRngPo2XQZB8K3t/6TYTo+9ubWdoU2WqDoFkDHP11KAXyuSshYvRjNBxUKrdAAAEZElEQVQYGbXBU4BdVxiA0T+ciW0WSdpGtW3btu3/2+dy7JnYrps0SZukTW3btq337n0mczXn3Dvz0LXkf7XLrjd1vHnn0dBhx5E33LjTtdI+ncdOHkW2EVefcmixtFW3rXoRqN+p+0tb7HHOBDI0kWn0VptLIX02O5hmJfcvvK2uLKFauW7V7K/va6TZoG26S1779ML3wOI1Ec2SeOnDEnzjx0i4AZPx3ftdRAMkbl+L03v7zhKi2zicV+7RMJH5s3CKBkug3UdhlSyIaB6VTzRhjdtcApzQAeur6VrAa7Owjt9CWtmvP9achKZ5Xsw4Mc/TDC9uwOrXVXJsMRxrpqbMiJpMDfWaEqnF6tRDsgw4CutbTakyuaKatgJrYrFkOgZrpqaUm9biSU2pxRoiGXpirdCUBhOkVFMiXwJdzpKUPmcC9ya0hWeaVXj1qpr0Sk2zck1Z9hTQ6UhpsTVQMl1bzKgwPk9bVJlmNZryBta+sslpvYEFmtJgfFWaVl9hnJimzQGmDJZmOwDPRbRFssI4Uc1UY3zTNKXsWeAy8R02AbhHU2qME0tqlgbjRDVtATDlCnFOBJ7WtKhxPM02wzhxTat8ALhcrGG9gGc0rdQ4MzRHqbFimmEhsK1YY4FZEU0zTqnmihsrphn+BUZMFZFrgJWaqcbzKso1V9xYMc20AbhSRHYG1mhhMWPFNdNGoEhkF6AkogXVGyeqmaqBq0R2BT7QwsqNU69Z5gIitwALtSDPOHHNVguIdARWayFVxjdNs90BiNwK1GkBnvFFNcdqQGQUUKb5RY0vrrnuAkRGAwnNq9z4SrWVOkAEaNK84sZXmtRWqgERLM0nbnxxDbAeEOkAVGq4cuNr0CB1gMj1wDINVWV8UQ30CSByHbBKwyQrjONpsNmAyA7AbA3jGadcQ8wERLYH3tIwpcaqSGqI5YDIdsDPGiJpnKiGeRAQ6QqURDRYjXGmaYj1QH8R6Qe8p8GqjJPUEEuAiSKyJ/CLBvOMo2H+Bi4UkZOBOxMayDNWTEMsBbpMEpG9hgK3ayDPWDENsRjoKM4RwNqItltZI3CROMcdCPyg7fYk0HeY+E4CZlVqOy1qBM6XZl0HASu1ne4G+g6UTU4Hmt7UAJFfH/m4ToPMx+opLQaOB+bO09Z+M8b8+Ji2Nr0EKCqWlDG9gccjmutV43yhrcx7AejfTTKcgVWruaLGeVtzJV7HOkAydS7Cel5z/GScTzVH4m6srSVbn05Yn0U0S+Wfxpjfp2m2eQ9jFXWXHF13xLqvTLNUv/Py+99otumPYo3sIa0cNBTrwT+0gPklWCPPlgCH7I0zp0zzWPQ9zpY9JNDgw3HuXJLQEGWfN+Js1l1CFA/pgvPQX+s0wKLFjTgdtpM8jj4WX9P9G6s1y9Il/9Bsy26SV+fdzmWTubV33HbX0urqdz+aPXP5Q2zSt2exFHLpNsMJNfS8gdIWAy7edgQBunTcaZi02dQhRYPIMvySCyZJkP8A2G1i90fLGXQAAAAASUVORK5CYII=";
    this.ImageMaginifyGlass = "data:image/png;base64,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";
    this.ImageTriDots       = "data:image/jpeg;base64,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QFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAWjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAADhCSU0EAgAAAAAAAgAAOEJJTQQwAAAAAAABAQA4QklNBC0AAAAAAAYAAQAAAAU4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADSQAAAAYAAAAAAAAAAAAAAA8AAAAoAAAACgBVAG4AdABpAHQAbABlAGQALQAxAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAoAAAADwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAADwAAAABSZ2h0bG9uZwAAACgAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAA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bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEwLTIyVDIzOjI5OjAzLTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFjYjdiYzRlLWY0YTUtNDY3NC1hODUzLWEwMmQ2OGI5MTdmNyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmMzMmM4M2FiLTNlMTItNTk0My05ZWIyLTgxMWYwNTEzN2NhOCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjZhZmI2YmNhLWU1MjgtNGM3ZS1hNGFkLWU0MDdhY2Q0NDc4MyIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YWZiNmJjYS1lNTI4LTRjN2UtYTRhZC1lNDA3YWNkNDQ3ODMiIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxY2I3YmM0ZS1mNGE1LTQ2NzQtYTg1My1hMDJkNjhiOTE3ZjciIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGRAAAAAAf/bAIQAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAwMDAwMDAwMDAwEBAQEBAQEBAQEBAgIBAgIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/8AAEQgADwAoAwERAAIRAQMRAf/dAAQABf/EAaIAAAAGAgMBAAAAAAAAAAAAAAcIBgUECQMKAgEACwEAAAYDAQEBAAAAAAAAAAAABgUEAwcCCAEJAAoLEAACAQMEAQMDAgMDAwIGCXUBAgMEEQUSBiEHEyIACDEUQTIjFQlRQhZhJDMXUnGBGGKRJUOhsfAmNHIKGcHRNSfhUzaC8ZKiRFRzRUY3R2MoVVZXGrLC0uLyZIN0k4Rlo7PD0+MpOGbzdSo5OkhJSlhZWmdoaWp2d3h5eoWGh4iJipSVlpeYmZqkpaanqKmqtLW2t7i5usTFxsfIycrU1dbX2Nna5OXm5+jp6vT19vf4+foRAAIBAwIEBAMFBAQEBgYFbQECAxEEIRIFMQYAIhNBUQcyYRRxCEKBI5EVUqFiFjMJsSTB0UNy8BfhgjQlklMYY0TxorImNRlUNkVkJwpzg5NGdMLS4vJVZXVWN4SFo7PD0+PzKRqUpLTE1OT0laW1xdXl9ShHV2Y4doaWprbG1ub2Z3eHl6e3x9fn90hYaHiImKi4yNjo+DlJWWl5iZmpucnZ6fkqOkpaanqKmqq6ytrq+v/aAAwDAQACEQMRAD8A3+PfuvdVIfDP+d//AC8Pnr8mO0Pid8c+18vuHtjrSmzuRphnNp5Hbu1+zcNtXJriN0ZrqrcFYzRboocFUyxSOk0dHU1NHJ93SxVFLFPNF7r3WLsL+eP/AC5esPnvt/8Alw7u7jr6P5FZ3Pbc2VNPBtXK1XWm3eyd5RUc20us9x79jAoKHeWe/ilHEiRxz0NNVVkdNVVNPUiSGP3Xunv+Yf8Azn/gd/K93r1F158rt/bow27+5IKjL4TC7J2bkN7Vu29m0mUjwtRv/elNjZY6nD7TOU80EDQpVV1bJSVIpaaY082j3XurWffuvdf/0N/j37r3Wsh/K5/l4fyEfjL8494d4/BH5g9S95/JTfuG39R7L6gxXy/6C7nXq3b+cnfMb3j6j6+6+FPvuOmosLTvRy1WWqs5UUWJEsfmQSTO/uvdNHdX8un/AIT7by/mu0Xy97R+YPTG3PmbiO59jZ7O/F+p+ZHQW29t7h+Q22KvC0u0qrdXSmSmHav9/azclBjZ5sLT5OjpcrkkX7ign+5qY6j3XuhU/nP/AAB/kq/Mvu/o7cX8x35ebE+L/d/XWxxBtjGT/Kzor4/7v7K6krt25SuxOM3Jgu3KTL5nMbIod30uaTH1+HjxtQlVVZCNatnUCH3XutjL37r3X//Z";


    // CSS style
    this.StyleScreenA = "overflow: auto; ";
    this.StyleScreenAPartA = "float: left; ";
    this.StyleScreenAPartB = "float: left; ";
    this.StyleScreenB = "";

    this.StyleScreenSwitch = "position: absolute; top: 20px; left: 20px; display: none; z-index: 10";
    this.StyleSearchSwitch = "position: absolute; top: 20px; right: 20px; z-index: 10";
    this.StyleHintSwitch   = "position: absolute; top: 80px; right: 20px; z-index: 10";
    this.StyleGreyBackground = "position: absolute; z-index: 11; background-color: rgba(100,100,100,0.5); width: 100%; height: 100%; display: none; ";
    this.StyleAlert = "position: absolute; z-index: 11; display: none; top: 50%; left: 50%; margin-top: -50px; margin-left: -100px;";

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

    this.HintMessageForScreenA = "<ul style='position: relative; top: -20px; text-align: left; '><li>Click controls at left to add/remove monosaccharides</li>" +
        "<li>Click a Topology to jump to Subsumption Navigator</li>" +
        "";
        //"<li>Shortcuts:</li><ul>" +
        //"<li>n/N - add/remove GlcNAc</li>" +
        //"<li>m/M - add/remove Man</li>" +
        //"<li>g/G - add/remove Gal</li>" +
        //"<li>f/F - add/remove Fuc</li>" +
        //"<li>s/S - add/remove NeuAc</li></ul></ul>";
    this.HintMessageForScreenB = "<ul style='position: relative; top: -20px; text-align: left; '><li>Double click on structure to navigate subsumption hierarchy.</li>" +
        "<li>Right click popup to jump to GlyGen, GlycanData, GlyTouCan.</li></ul>";




    // Functions start here
    this.Init = async function (para) {

        let theme = {};

        if (Object.keys(para).includes('theme')){
            theme = await this.GetJSON(para.theme);
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


        let RawData = await this.GetJSON(para.data);
        this.DataPreProcess(RawData);
        this.UpdateMaxPossibleComp();

        this.RefreshUI();

    }

    this.GetJSON = function (url) {
        return new Promise(resolve => {
            jQuery.getJSON(url, function(d) {
                resolve(d);
            });
        })
    }

    this.DataPreProcess = function (d) {
        throw "NotImplement";
    }

    this.AllocateDIV = function (d) {

        this.Container = document.getElementById(this.ContainerID);
        this.Container.innerHTML = "";
        this.Container.style = ""; //

        this.ContainerInner = document.createElement("div");
        this.ContainerInner.style = "position: relative; overflow: hidden;";
        this.ContainerInner.style.width = this.Width + "px";
        this.ContainerInner.style.height = this.Height + "px";

        this.ContainerScreenA = document.createElement("div");
        this.ContainerScreenB = document.createElement("div");
        this.ContainerScreenB.setAttribute("id", this.ContainerID + "_screenB");

        this.SubsumptionNavigatorOption.essentials.div_ID = this.ContainerID + "_screenB";

        this.ContainerScreenA.style = this.StyleScreenA;

        this.ContainerScreenSwitch = document.createElement("img");
        this.ContainerScreenSwitch.src = this.ImageUpArrow;
        this.ContainerScreenSwitch.width = 40;
        this.ContainerScreenSwitch.height = 40;
        this.ContainerScreenSwitch.style = this.StyleScreenSwitch;
        let thisLib = this;
        this.ContainerScreenSwitch.onclick = function () {
            thisLib.SetToScreenA();
            thisLib.RefreshUI();
        };

        this.ContainerSearchSwitch = document.createElement("img");
        this.ContainerSearchSwitch.src = this.ImageMaginifyGlass;
        this.ContainerSearchSwitch.width = 40;
        this.ContainerSearchSwitch.height = 40;
        this.ContainerSearchSwitch.style = this.StyleSearchSwitch;
        this.ContainerSearchSwitch.onclick = function () {
            thisLib.SearchBoxShow();
        };

        this.ContainerHintSwitch = document.createElement("img");
        this.ContainerHintSwitch.src = this.ImageQuestionMark;
        this.ContainerHintSwitch.width = 40;
        this.ContainerHintSwitch.height = 40;
        this.ContainerHintSwitch.style = this.StyleHintSwitch;
        this.ContainerHintSwitch.onclick = function () {
            thisLib.HintShow();
        };


        this.ContainerScreenAPartA = document.createElement("div");
        this.ContainerScreenAPartB = document.createElement("div");
        //this.ContainerScreenAPartA.style = "float: left; width: 130px; margin: 0px; padding: 0px;";

        this.ContainerScreenA.appendChild(this.ContainerScreenAPartA);
        this.ContainerScreenA.appendChild(this.ContainerScreenAPartB);

        this.ContainerBanner = document.createElement("h4");
        this.ContainerBanner.innerHTML = "GNOme - Glycan Naming and Subsumption Ontology";
        this.ContainerBanner.style = "position: absolute; bottom: 10px; z-index: 500; text-align: center; color: grey;";
        this.ContainerBanner.onclick = function(){
            window.open("https://gnome.glyomics.org/");
        };

        this.ContainerGreyBackground = document.createElement("div");
        this.ContainerGreyBackground.style = this.StyleGreyBackground;

        this.ContainerAlert = document.createElement("div");
        this.ContainerAlert.style = this.StyleAlert;


        this.Container.appendChild(this.ContainerInner);
        this.ContainerInner.appendChild(this.ContainerGreyBackground);
        this.ContainerInner.appendChild(this.ContainerAlert);
        this.ContainerInner.appendChild(this.ContainerScreenSwitch);
        this.ContainerInner.appendChild(this.ContainerSearchSwitch);
        this.ContainerInner.appendChild(this.ContainerHintSwitch);
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
            this.ContainerScreenAPartB.style.width = this.Width - 130 + "px";
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
        searchBoxInput.placeholder = "Search... ";
        searchBoxInput.type = "text";
        searchBoxInput.style = "font-size: 100%; border: none; border-color: transparent; height: 40px; width: 350px; background: transparent; overflow: hidden; ";
        searchBoxInput.addEventListener("keyup", function (d) {
            if (d.key == "Enter") {
                thisLib.SearchGo(this.value);
            }
        })

        let searchBoxButton = document.createElement("button");
        searchBoxButton.style = "font-size: 100%;border: none;height: 100%;background: inherit;padding: 0 10px 0 0; float: right";
        searchBoxButton.innerHTML = "&#128269";
        searchBoxButton.type = "text";

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

    this.CreateGlycanFigure = function (gtcid) {
        let figure = document.createElement("figure");
        figure.style.margin = 0;
        figure.id = "img_" + gtcid;
        let img = document.createElement("img");
        img.src = this.ImageURLPrefix + gtcid + this.ImageURLSuffix;
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
        caption.innerText = gtcid;
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
                if (!Object.keys(res2).includes(d)){
                    res2.push(d);
                }
            });
            res = res2;
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
            if (n == "Pseudo"){
                nodes[n].type = "Pseudo";
                nodes[n].hidden = true;
            }else{
                nodes[n].type = this.SubsumptionData[n].SubsumptionLevel;
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
                msg += 'Bad GlyTouCan accession: ' + acc;
            }
            else{
                msg += "Unable to recognize: " + d.trim();
            }

            this.Alert('Error', msg, false)
            return
        }

        // this.RefreshUI();

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

    this.DataPreProcess = function (RawData) {

        let AllAccession = Object.keys(RawData);
        let Parents = {};

        for (let acc of AllAccession) {

            let d = RawData[acc];
            if (!['topology'].includes(d.level)) {
                continue
            }
            Parents[acc] = [];
        }



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
                    if (tmp == undefined){continue}
                    if (['topology', 'saccharide'].includes(tmp.level)){
                        Children.push(c);

                        if ('topology' == d.level && 'topology' == tmp.level){
                            Parents[c].push(acc);
                        }

                    }
                }
            }

            if ( ['topology', 'saccharide'].includes(d.level) ){
                this.SubsumptionData[acc] = {
                    "SubsumptionLevel": d.level,
                    "Children": Children,
                    "ButtonConfig": ButtonConfig
                };

            }
            if ( ['basecomposition', 'composition'].includes(d.level) ){
                this.IUPACCompositionData[acc] = ButtonConfig;
            }


        }

        for (let acc of Object.keys(Parents)){
            let f = true;

            for (let p of Parents[acc]) {
                let ItemCountP = this.SubsumptionData[p].ButtonConfig;
                let ItemCountC = this.SubsumptionData[acc].ButtonConfig;

                for (let m of this.AllItems) {

                    if (ItemCountP[m] != ItemCountC[m]) {
                        break
                    }
                    f = false;
                }
            }

            if (f){
                this.TopLevelThings.push(acc);
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
    this.MinHeight = 900;
    this.DataPreProcess = function (RawData) {

        let AllAccession = Object.keys(RawData);
        let TopLevelCandidate = [];
        let Parents = {};

        for (let acc of AllAccession) {

            let d = RawData[acc];
            if (!['basecomposition', 'composition'].includes(d.level)) {
                continue
            }
            Parents[acc] = [];
        }

        for (let acc of AllAccession){

            let d = RawData[acc];
            if ( !['basecomposition', 'composition'].includes(d.level) ){
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
                    if (['basecomposition', 'composition'].includes(tmp.level)){
                        Children.push(c);
                        Parents[c].push(acc);
                    }
                }
            }

            this.SubsumptionData[acc] = {
                "SubsumptionLevel": d.level,
                "Children": Children,
                "ButtonConfig": ButtonConfig
            };
            this.IUPACCompositionData[acc] = ButtonConfig;
            TopLevelCandidate.push(acc);
        }

        for (let acc of TopLevelCandidate){
            let AppendFlag = true;
            for (let p of Parents[acc]){

                let ItemCountP = this.SubsumptionData[p].ButtonConfig;
                let ItemCountC = this.SubsumptionData[acc].ButtonConfig;

                for (let m of this.AllItems){

                    if (ItemCountP[m] != ItemCountC[m]){
                        break
                    }
                    AppendFlag = false;
                }
            }

            if (AppendFlag){
                this.TopLevelThings.push(acc);
            }
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

    this.HintMessageForScreenA = "<ul style='position: relative; top: -20px; text-align: left; '><li>Click controls at left to add/remove monosaccharides</li>" +
        "<li>Click a Composition to jump to Subsumption Navigator</li>" +
        "";
        // "<li>Shortcuts:</li><ul>" +
        // "<li>n/N - add/remove GlcNAc</li>" +
        // "<li>m/M - add/remove Man</li>" +
        //  "<li>g/G - add/remove Gal</li>" +
        //  "<li>f/F - add/remove Fuc</li>" +
        //  "<li>s/S - add/remove NeuAc</li></ul></ul>";
    this.HintMessageForScreenB = "<ul style='position: relative; top: -20px; text-align: left; '><li>Double click on structure to navigate subsumption hierarchy.</li>" +
        "<li>Right click popup to jump to GlyGen, GlycanData, GlyTouCan.</li></ul>";

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

        let FullURL = URL + "?" + URLPara;
        if (thisLib.PreventPushState){
            thisLib.PreventPushState = false;
        }else{
            history.pushState({}, "", FullURL);
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
        this.WindowWidth = window.innerWidth - 20;
        this.WindowHeight = window.innerHeight - 20;

        GNOmeBrowserX.SetHeight(this.WindowHeight);
        GNOmeBrowserX.SetWidth(this.WindowWidth);
        GNOmeBrowserX.RefreshUI();
    }

    this.UpdateGNOmeBrowser = function (para) {

        if (Object.keys(para).includes('focus')){
            GNOmeBrowserX.SetFocus(para.focus);
        } else {
            let NewCount = {};
            GNOmeBrowserX.AllItems.forEach(function (k) {
                if (Object.keys(para).includes(k)){
                    NewCount[k] = parseInt(para[k]);
                }
                else{
                    NewCount[k] = 0;
                }
            })
            GNOmeBrowserX.SetItemCount(NewCount);
            GNOmeBrowserX.SetToScreenA();
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

}















