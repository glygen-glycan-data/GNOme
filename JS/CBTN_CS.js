"use strict";


var CBTN = function () {
    var div_id;
    var container;

    var data;
    var data_composition;

    var panelcontainer, hgvcontainer, showAndHideButton;
    var leftPanel, rightPanel;
    var leftTurnButton, rightTurnButton;
    var badge;

    var monoExceptForXxx = ['GlcNAc', 'GalNAc', 'ManNAc', 'HexNAc','Glc', 'Gal', 'Man', 'Hex','Fuc', 'dHex','NeuAc', 'NeuGc', "S", "P", "Me"];
    var allMono = ['GlcNAc', 'GalNAc', 'ManNAc', 'HexNAc','Glc', 'Gal', 'Man', 'Hex','Fuc', 'dHex','NeuAc', 'NeuGc', "Xxx", "S", "P", "Me", "X"];

    var monofreq = {};
    var maxComp = {};
    var maxCompAtCurrentComp = {};
    var topTopology =[];
    var cacheForMatchedTopology = {};

    var fromRightPanel;
    var lastfocus;

    var icon_config_cfg = {
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

    var icon_config_snfg = {
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

    var image_url_prefix_cfg = "http://edwardslab.bmcb.georgetown.edu/~wzhang/web/glycan_images/cfg/extended/";
    var image_url_suffix_cfg = ".png";

    var image_url_prefix_snfg = "https://image.glycosmos.org/snfg/png/";
    var image_url_suffix_snfg = "";

    var image_url_prefix;
    var image_url_suffix;
    var icon_config = icon_config_cfg;
    var theme = {};
    /*
    var themeConfig = {
        "GlyTouCan": {
            "image_style": "snfg",
            "jump": ["GlyTouCan"]
        },
        "GlyGen": {
            "image_style": "cfg",
            "jump": ["GlyGen"]
        },
        "default": {
            "image_style": "cfg",
            "jump": ["GlycanData", "GlyGen", "GlyTouCan"]
        }
    };
    var externalResourcesConfig = {
        "GlyTouCan": {
            "url_prefix": "https://glytoucan.org/Structures/Glycans/",
            "url_suffix": "",
            "accession_list_json_url": undefined
        },
        "GlyGen": {
            "url_prefix": "https://www.glygen.org/glycan_detail.html?glytoucan_ac=",
            "url_suffix": "",
            "accession_list_json_url": "https://raw.githack.com/glygen-glycan-data/GNOme/master/JS/glygen_accession.json"
        },
        "GlycanData": {
            "url_prefix": "https://edwardslab.bmcb.georgetown.edu/glycandata/",
            "url_suffix": "",
            "accession_list_json_url": "https://raw.githack.com/glygen-glycan-data/GNOme/master/JS/glycandata_accession.json"
        }
    };

    if (true){
        image_url_prefix = image_url_prefix_cfg;
        image_url_suffix = image_url_suffix_cfg;
        icon_config = icon_config_cfg;
    }else{
        image_url_prefix = image_url_prefix_snfg;
        image_url_suffix = image_url_suffix_snfg;
        icon_config = icon_config_snfg;
    }

     */


    var urlPara = {};
    var suppressStatusChange = false;

    var keyMap = {
        "n": "GlcNAc",
        "m": "Man",
        "g": "Gal",
        "f": "Fuc",
        "s": "NeuAc",
        //"x": "Xxx"
    };

    var hintContentUpper = "* Click controls at left to add/remove monosaccharides<br>" +
        "* Click a Topology to jump to Subsumption Navigator<br>" +
        "* Shortcuts:<br>" +
        "&nbsp&nbsp&nbsp&nbsp&nbspn/N - add/remove GlcNAc<br>" +
        "&nbsp&nbsp&nbsp&nbsp&nbspm/M - add/remove Man<br>" +
        "&nbsp&nbsp&nbsp&nbsp&nbspg/G - add/remove Gal<br>" +
        "&nbsp&nbsp&nbsp&nbsp&nbspf/F - add/remove Fuc<br>" +
        "&nbsp&nbsp&nbsp&nbsp&nbsps/S - add/remove NeuAc";
    var hintContentLower = "* Double click on structure to navigate subsumption hierarchy.<br>" +
        "* Right click popup to jump to GlyGen, GlycanData, GlyTouCan.";

    var hintContentUpper = "<ul style='position: relative; top: -20px;'><li>Click controls at left to add/remove monosaccharides</li>" +
        "<li>Click a Topology to jump to Subsumption Navigator</li>" +
        "<li>Shortcuts:</li><ul>" +
        "<li>n/N - add/remove GlcNAc</li>" +
        "<li>m/M - add/remove Man</li>" +
        "<li>g/G - add/remove Gal</li>" +
        "<li>f/F - add/remove Fuc</li>" +
        "<li>s/S - add/remove NeuAc</li></ul></ul>";
    var hintContentLower = "<ul style='position: relative; top: -20px;'><li>Double click on structure to navigate subsumption hierarchy.</li>" +
        "<li>Right click popup to jump to GlyGen, GlycanData, GlyTouCan.</li></ul>";
    var hintContentCurrent = hintContentUpper;


    var hintHeaderUpper = "Composition Selector";
    var hintHeaderLower = "Subsumption Navigator";
    var hintHeaderCurrent = hintHeaderUpper;

    var lastClickedTopology = [];
    var matchedTopologies = [];


    var cssUpperShow = "";
    var cssUpperHide = "";
    var cssLeftPanelShow = "display: inline";
    var cssLeftPanelHide = "display: none";
    var cssButtonShow = "position: absolute; top: 20px; left: 20px; z-index: 500; ";
    var cssButtonShowL = "width: 30px; height: 30px; position: absolute; top: 20px; left: 250px; z-index: 500;";
    var cssButtonShowR = "width: 30px; height: 30px; position: absolute; top: 20px; left: 280px; z-index: 500;";
    var cssButtonHide = "display: none";
    var cssBottomShow = "";
    var cssBottomHide = "display: none";
    var cssIconHint = "position: absolute; top: 20px; right: 20px; z-index: 500; ";

    var up_arrow_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAIlUExURQAAAKanpaampqWlpaanpP///6SkpKKioqWnpKWloqWmpaanpaWmpKanpaWmpaanpaWnpaSppKWmpKWnpaWnpKampKampqqqqqWmpKWnpba2tqWmpKWnpbKymaampaWmpKWmpKWmpKWlpb+/v6anpaSppKampaWmpKampKWnpaWnpKampKanpaaopqanpaenp6ampqWmpaWmpKWmpaWmpKWlpaanpaampaampqampaampaWlpaWopaanpaWnpaWmpaenpKWopaWlpaGhoaampKampKampqWmpaWnpKanpaanpaampKSopKWmpKampKiooqSkpKampKWmpaampOPj46anpWRkZM3Nzaenp+Li4t7e3uHh4eDg4KmqqHJyctjZ2NnZ2aytrNXW1dvb239/f9/f38fIx2lpaby8u9bX1t3d3bOzsq6vrausq8bGxdvb2qipp8jIyKeopsDAv83NzM3OzdPU09ra2sXFxLe4t2VlZZGRkWdnZ7a2tm5ubsnJyNTU1Ly8vMLCwdXV1NLT0ouLi7q6ur2+vbu7umpqarm5udDQz8vLyqWlpbW2taGhobe3tri5uI6OjsHBwKioqMTEw6urqc/PznFxcWtra4KCgrGxsMPDwtDQ0Hp6erGysb+/v35+fq6vrp+fn93e3bS1tMzMzKCgoH19fWZmZoyMjJSUlImJiY+Pj56enmhoaKqqqrCxr8nJyXt7e72+vJaWlnBwcAOHp2UAAABUdFJOUwDmBSKzAQIQvRvh+vbxPtKOI/yU6JZZD9x6B/B1Cm3i1eoVBO8gn/6kfstT5Cb0KjW82dP7SoFnDcFkGFWr0YxdWzkTfJ5WzbT96XFB+ZAvMHPKhQ5uQCgAAASKSURBVFjDtZhnW1RXEIDHiEq3YUNF7AU19l7Te73v4DZgRRClKZEAKmJDULFHUWNs0WhMYmLa78uHe3f3nLu7uLvPk/m25868d+6Uc86syP8pK3btzNsxaiWULF+2/euqrVmaj12/qAxbFld+9taYjAGjJ/jtPZn+zryMAG8uWWeadViQlRMKXgsYN/lDTztyrW24NhhynPCTA503Lx/ylotnvDEyYbf3Ca039gYcS0Jn/464z9aUjgCYvchVar7os/coQ48BmLR0bNowrgXg+7NOOgkciQKQPy414YsygEij6UHb7f37wiYkfLoDYG3KqJaWADzoMg2qVVXv2J6ciQIUTkwmfD4TYCBkvfKEqqo+sxnBqwDTk/yYOBeg21b+RVVV9egpX0SaAMZP8+WiEqDPVv1OPblT7QvrQ4A8u97fTeHDqaMxhNbU+RhNALNMwlSAh7ZW9XlNiJ0WxwlcBopWGVX9EdBsRdKpq1FTjvncONgKjE/U+hQgYmXTadintuzxMc4CfBzvzUlAo61xTP1yzscYABbEqnQJ8MDuClyzf1VV9WdVVd0/5CuPW8AGryTWAXZfXHAJJ35UVVUvuTVnbEYjsGCTiIjsBJqth3/uV1XV44f3qKpq9TOX8ShoaYVbgS0iIvPLgItWF3jJ6HU8hPPCXbhuu9EGbBYRWQ9EzUgEH7kGV5w4Ivg8vmQmFli8UEQWAafNJ9dd9RdOAmE4ZspV4EsRGQXsNdavuMrPgybCORwLj4kYAvJFVgAR4zt6zfAnEPEkmWmpB4pFdgHXEquHf3eLwH2bgXAuuYz7Bw1GC+CmtC2RDHeT0QtOEiJWsP0Bu2FF8oDheIzvu2qXnBSIWNu8tKtLZAdQG1v6x9eWFiLevIluGQZEyoBY1YXcbtgXTI2IbSH9ie8GRFYCsZ0ifFxVtSbulB/hbWQv4r9rARGgI770UlXPGxulH+FEVPXoQyurIgCJI++Pu7/95IyAcHr7fzU2yHZApAQIpzsAkxG2uB+yHDiYK+IkIPIVcCBXRCfg7nqduSK6AZGlwM1cEYOAyDagJ1dEFBAp8DV7Noh2YKaITAe+zQ3RB+SJyOTk4zRTRDOwUUQ+AW6FckHUAUXzRGTsHGAoF8QN7ztENgCPA9kjgoeAKhER2fopUJ094h5QOD9xN4iGs0W0HwIqvJO9oNh/GmWC6AEKy2MXjBlAx4HsEEcApsZvOeVrgJaGbBBdESDfuPOVTgKuBjJHNLwCZo42r3xLAZoyRoSaAd6zh7F8gG8yRIR6AKb4p6HxAIOBTBANTwHyk6ajguUAl+27UKuqqvr6uOsVwLJpKebSOQBRS/+H46r6ly+bEYBlb6caSBZWAjBgOnLutt61LoPtPQCsnpZmOvwAgFt9Zutb0QnecwfFyWmnxDGzigCItj1J2RU3XEDJtpGGzFXvewPutaF63/7S99SbVFePfs20XrEgNhm3NDUOn6mrr6892dk9GI2tFk59/eS+acZc0sqcivKMpvbZWzYvTmVflFc1P/N/HxbOyi+27edu35j6b4P/ABNAhS1rtF+LAAAAAElFTkSuQmCC";
    var question_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAALiUExURQAAAKanpaanpKanpaqqqqanpaOjo6WnpP///6WlpaqqqqqqqqampqWnpKWmpJ+fn6WmpaWmpKWmpLKymba2tqWmpKWlpaWnpaWmpL+/v6WmpKWmpKWnpKWmpKanpaWlpaWlpaWnpaqqoKKqoqWmpaWmpaWmpKWmpKWnpaampKWnpaampaKioqampaanpaKqoqampaWopaWnpaampKanpaamo6anpaenp6enpKWnpaSkpKenp6ampH9/f6WmpKWopaampKiooqqqqqampqWmpKOqo6anpaenp6Wlpaenp6WnpKWnpZmZmaampaampqampKWmpaOjo6anpaSopKampKWnpaSopKampKampKampqWnpaampKanpaWlpaGhoaWnpKanpaampKampqWlpaampKWlpaampKampaOjo6ampKWlpaqqqqampKWmpaWnpKWnpaampqWmpaWmpaanpKampKWmpaWnpKWnpaWmpePj46anpWRkZK+vr+Li4qenp3l5eYyMjOHh4dzc3KmqqIODg97e3paWlm9vb+Dg4Le3t9vb27+/v7y8u9jY2M7Ozp6enqipp6eopsbGxtra2tXV1cXFxKytrM3Ozb2+va6vrd/f383NzMfIx8XGxdrb2sHBwMjJyNnZ2d3d3bq7ub6/vs/PzsvLysfHxqqrqdXV1Le4t9LS0bKzscLCwdbX1rW2tc7PztXW1a6vrri5t6usqt3e3dvb2re3tq2urKytq8vMy7S0s5qamrCwr8/Pz7a3tcHCwcLDwqysq7KzstDQz6urqrGysMDAv7Cxr97f3tLT0oiIiLGxsLy8vNTV1LO0stPT0tbW1sTEw3t7e6GhodjZ2NPT05WVlbi5uL2+vNTU1KamptTU04uLi7u7usPDwpCQkLW2tLGyscPEw8nJycnJyM/Qz7i4t83NzW5ubra2tre4tr+/vrOzs4qKimdnZ9PU03x8fMbGxbOzsrS1tN3d3M0L7c8AAAB5dFJOUwDxstID+hy9ASIGD1no/BDh3PAKB/YRdeIE6v7L5/Q/SpQbJLzT2fuOlnqzFp/uIcFVfaTjVOYmXWwwKZMC1ltxLxVW+Sf9IDkjtIAF1TSezRngPo2XQZB8K3t/6TYTo+9ubWdoU2WqDoFkDHP11KAXyuSshYvRjNBxUKrdAAAEZElEQVQYGbXBU4BdVxiA0T+ciW0WSdpGtW3btu3/2+dy7JnYrps0SZukTW3btq337n0mczXn3Dvz0LXkf7XLrjd1vHnn0dBhx5E33LjTtdI+ncdOHkW2EVefcmixtFW3rXoRqN+p+0tb7HHOBDI0kWn0VptLIX02O5hmJfcvvK2uLKFauW7V7K/va6TZoG26S1779ML3wOI1Ec2SeOnDEnzjx0i4AZPx3ftdRAMkbl+L03v7zhKi2zicV+7RMJH5s3CKBkug3UdhlSyIaB6VTzRhjdtcApzQAeur6VrAa7Owjt9CWtmvP9achKZ5Xsw4Mc/TDC9uwOrXVXJsMRxrpqbMiJpMDfWaEqnF6tRDsgw4CutbTakyuaKatgJrYrFkOgZrpqaUm9biSU2pxRoiGXpirdCUBhOkVFMiXwJdzpKUPmcC9ya0hWeaVXj1qpr0Sk2zck1Z9hTQ6UhpsTVQMl1bzKgwPk9bVJlmNZryBta+sslpvYEFmtJgfFWaVl9hnJimzQGmDJZmOwDPRbRFssI4Uc1UY3zTNKXsWeAy8R02AbhHU2qME0tqlgbjRDVtATDlCnFOBJ7WtKhxPM02wzhxTat8ALhcrGG9gGc0rdQ4MzRHqbFimmEhsK1YY4FZEU0zTqnmihsrphn+BUZMFZFrgJWaqcbzKso1V9xYMc20AbhSRHYG1mhhMWPFNdNGoEhkF6AkogXVGyeqmaqBq0R2BT7QwsqNU69Z5gIitwALtSDPOHHNVguIdARWayFVxjdNs90BiNwK1GkBnvFFNcdqQGQUUKb5RY0vrrnuAkRGAwnNq9z4SrWVOkAEaNK84sZXmtRWqgERLM0nbnxxDbAeEOkAVGq4cuNr0CB1gMj1wDINVWV8UQ30CSByHbBKwyQrjONpsNmAyA7AbA3jGadcQ8wERLYH3tIwpcaqSGqI5YDIdsDPGiJpnKiGeRAQ6QqURDRYjXGmaYj1QH8R6Qe8p8GqjJPUEEuAiSKyJ/CLBvOMo2H+Bi4UkZOBOxMayDNWTEMsBbpMEpG9hgK3ayDPWDENsRjoKM4RwNqItltZI3CROMcdCPyg7fYk0HeY+E4CZlVqOy1qBM6XZl0HASu1ne4G+g6UTU4Hmt7UAJFfH/m4ToPMx+opLQaOB+bO09Z+M8b8+Ji2Nr0EKCqWlDG9gccjmutV43yhrcx7AejfTTKcgVWruaLGeVtzJV7HOkAydS7Cel5z/GScTzVH4m6srSVbn05Yn0U0S+Wfxpjfp2m2eQ9jFXWXHF13xLqvTLNUv/Py+99otumPYo3sIa0cNBTrwT+0gPklWCPPlgCH7I0zp0zzWPQ9zpY9JNDgw3HuXJLQEGWfN+Js1l1CFA/pgvPQX+s0wKLFjTgdtpM8jj4WX9P9G6s1y9Il/9Bsy26SV+fdzmWTubV33HbX0urqdz+aPXP5Q2zSt2exFHLpNsMJNfS8gdIWAy7edgQBunTcaZi02dQhRYPIMvySCyZJkP8A2G1i90fLGXQAAAAASUVORK5CYII=";


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
            imgURL1: image_url_prefix, // Unnecessary if useGlyTouCanAsImageSource is true
            imgURL2: image_url_suffix,
            highLightedNodes: []
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
            externalLinks: []
        }
    };

    function allcateDIV() {
        container.innerHTML = "";

        panelcontainer = document.createElement("div");
        hgvcontainer = document.createElement("div");
        hgvcontainer.setAttribute("id", "viewer");

        showAndHideButton = document.createElement("img");
        showAndHideButton.src = up_arrow_image_base64;
        showAndHideButton.width = 40;
        showAndHideButton.height = 40;
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

        badge = document.createElement("h4");
        badge.innerHTML = "GNOme - Glycan Naming and Subsumption Ontology";
        badge.style = "position: absolute; bottom: 10px; width: 97%; z-index: 500; text-align: center; color: grey; ";
        badge.onclick = function(){
            window.open("https://gnome.glyomics.org/");
        };

        container.appendChild(showAndHideButton);
        //container.appendChild(leftTurnButton);
        //container.appendChild(rightTurnButton);
        container.appendChild(panelcontainer);
        container.appendChild(hgvcontainer);
        container.appendChild(badge);
    }

    function getParaFromURL() {
        var urlobj = new URL(window.location);
        urlPara = {};
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

        flags["dHex"] = monofreq["Fuc"] < monofreq["dHex"];

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
            if (iupac == "Fuc"){
                monofreq["dHex"] = monofreq["dHex"] + num;
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
        } else if (config.shape == "empty") {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 41);
            ctx.lineTo(41, 41);
            ctx.lineTo(41, 0);
        } else {
            console.log("shape is not supported yet")
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = config.count_color;
        var t = "";

        var x, y = 30;

        var subandsupscript = "⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉";

        if (["S", "P", "Me", "X"].includes(m)){
            ctx.font = "11px Arial";
            ctx.fillText(m, 3, 10);
            ctx.font = "26px Arial";
        }

        t = monofreq[m].toString();
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
        img.src = image_url_prefix + gtcid + image_url_suffix;
        img.style = "width: 200px; height: auto;";
        img.onclick = function () {
            fromRightPanel = gtcid;
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
        iconHint.src = question_image_base64;
        iconHint.width = 40;
        iconHint.height = 40;
        iconHint.onclick = function () {
            var dialog = new $.Zebra_Dialog(hintContentCurrent + "<a href='https://gnome.glyomics.org/' style='position: absolute; bottom: 10px; right: 30px; text-align: right;'>GNOme</a>", {
                type: false,
                title: hintHeaderCurrent,
                buttons: false,
                onClose: function (caption) {

                    // notice that we use the button's label to determine which button was clicked
                    // "caption" will be empty when the dialog box is closed by clicking the dialog
                    // box's close button or by clicking the overlay
                    //alert((caption != '' ? '"' + caption + '"' : 'nothing') + ' was clicked');

                }
            });
        };

        iconHint.style = cssIconHint;

        container.appendChild(iconHint);
    }


    function match2CurrentComposition(thisComp) {


        var currentComp = JSON.parse(JSON.stringify(monofreq));

        for (var mc of allMono) {
            if (mc.includes("Hex")){
                if (currentComp[mc] != thisComp[mc]) {
                    return false
                }
            }else if (['NeuAc', 'NeuGc', "Xxx", "S", "P", "Me", "X"].includes(mc)){
                if (currentComp[mc] != thisComp[mc]) {
                    return false
                }
            }
            else{
                if (currentComp[mc] != 0){
                    if (currentComp[mc] > thisComp[mc]) {
                        return false
                    }
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
            }else if (['NeuAc', 'NeuGc', "Xxx", "S", "P", "Me", "X"].includes(mc)){
                if (nextComp[mc] != thisComp[mc]) {
                    return false
                }
            }
            else{
                if (nextComp[mc] != 0){
                    if (nextComp[mc] > thisComp[mc]) {
                        return false
                    }
                }
            }

        }
        return true
    }

    function getDescendants(n) {
        if (!Array.isArray(data[n].children)){
            // console.log(data[n].children);
            return []
        }

        var res = [];
        for (var nc of data[n].children){
            res = res.concat(JSON.parse(JSON.stringify(getDescendants(nc))));
            res.push(nc);
        }

        var res2 = [];
        res.forEach(function (d) {
            if (!res2.includes(d)){
                res2.push(d);
            }
        });

        return res2
    }
    function getParents(n) {
        var res = [];
        for (var p of Object.keys(data)){
            if (data[p].children.includes(n)){
                res.push(p)
            }
        }
        return res
    }
    function getAncesters(n) {
        var res = getParents(n);
        if (res.length == 0){
            return []
        }

        for (var p of res){
            res = res.concat(getAncesters(p));
            var res2 = [];
            res.forEach(function (d) {
                if (!Object.keys(res2).includes(d)){
                    res2.push(d);
                }
            });
            res = res2;
        }
        return res
    }

    function dataPreprocess() {
        for (var acc of Object.keys(data)){
            for (var m of allMono){
                if (data[acc].comp[m] == undefined){
                    data[acc].comp[m] = 0;
                }
            }

            if (data[acc].top){
                topTopology.push(acc);
            }

            data[acc].decedentNum = getDescendants(acc).length;
        }

        for (var acc of Object.keys(data_composition)){
            for (var m of allMono){
                if (data_composition[acc].comp[m] == undefined){
                    data_composition[acc].comp[m] = 0;
                }
            }
        }
    }


    function findMatchedTopLeverTopology() {
        matchedTopologies = [];


        for (var acc of topTopology){
            if (match2CurrentComposition(data[acc].comp)){
                matchedTopologies.push(acc);
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
            container.style.width = width - 10 + "px";
        }
        else {
            container.style.width = width + 15 + "px";
        }
        if (height == 0){
            height = document.documentElement.clientHeight;
            container.style.height = height - 20 + "px";
        }
        else {
            container.style.height = height + 5 + "px";
        }
        //console.log(width, height);


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
            return data[b].decedentNum - data[a].decedentNum
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
                if (e.key == e.key.toUpperCase()){
                    num = -1;
                }
                compositionChange(keyMap[e.key.toLowerCase()], num);
            } else {
                // Not capturing
            }
        }
    }

    function statusLog(t, gtcid) {

        if (suppressStatusChange){
            suppressStatusChange = false;
            return
        }

        var p = "?";
        if (t == "comp") {
            for (var iupac of allMono) {
                var c = monofreq[iupac];
                if (c != 0) {
                    p += iupac + "=" + c.toString() + "&";
                }
            }
            p = p.slice(0, p.length - 1);
        } else if (["composition", "basecomposition", "topology", "saccharide"].includes(t)) {
            p += t + "=" + gtcid;
        }



        var title_prefix = "";
        var title_content = "";
        if (["composition", "basecomposition"].includes(t)){
            title_prefix = "GNOme Subsumption Navigator:";
            title_content = gtcid;
        }
        else{
            title_prefix = "GNOme Composition Selector:";
            title_content = "";

            var temp_monofreq = {};
            var hexCount = 0, hexnacCount = 0;
            for (var m of allMono) {
                if ( !m.includes("Hex") ){
                    if (monofreq[m] > 0){
                        temp_monofreq[m] = monofreq[m];
                    }
                }
            }
            for (var m of ['GlcNAc', 'GalNAc', 'ManNAc']){
                hexnacCount += monofreq[m];
            }
            for (var m of ['Glc', 'Gal', 'Man']){
                hexCount += monofreq[m];
            }


            if (monofreq["Hex"] - hexCount > 0){
                temp_monofreq["Hex"] = monofreq["Hex"] - hexCount;
            }
            if (monofreq["HexNAc"] - hexnacCount > 0){
                temp_monofreq["HexNAc"] = monofreq["HexNAc"] - hexnacCount;
            }

            for (var m of allMono){
                if (temp_monofreq[m]){
                    title_content += m + "(" + temp_monofreq[m].toString() + ")";
                }
            }
        }


        var html_title = title_prefix + " " + title_content;
        window.document.title = html_title;

        if (p.length < 3) {
            p = location.protocol + '//' + location.host + location.pathname;
        }
        history.pushState({}, "", p);
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

    function updateUpperSilent() {

        afterCompostionChanged();
        updateLeftPanel();
        updateRightPanel();
    }

    function highlightTopTopology(acc) {
        if (document.getElementById("img_" + acc) != null){
            document.getElementById("img_" + acc).style = "border-style: solid; border-color: rgb(42,124,233); margin: 0;";
        }
    }

    function showUpper() {
        showAndHideButton.style = cssButtonHide;
        leftTurnButton.style = cssButtonHide;
        rightTurnButton.style = cssButtonHide;
        hgvcontainer.style = cssBottomHide;

        panelcontainer.style = cssUpperShow;

        hintContentCurrent = hintContentUpper;
        hintHeaderCurrent = hintHeaderUpper;

        if (lastfocus){
            if (lastfocus != fromRightPanel){
                var ancestors = getAncesters(lastfocus);
                for (var anc of ancestors){
                    highlightTopTopology(anc);
                }
            }
            highlightTopTopology(lastfocus);
        }

        resizeContainer();
        statusLog("comp", "");
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

        hgvcontainer.style = "border-style: none; border-color: lightgrey; width: " + w + "px; right: 0; height: " + h + "px; ";

    }

    function showLower(acc, changeMonoFreq) {
        lowerPrep();
        statusLog(data[acc].type, acc);
        lastfocus = acc;
        if (changeMonoFreq){
            monofreq = JSON.parse(JSON.stringify(data[acc].comp));
            updateUpperSilent();
        }
        hintContentCurrent = hintContentLower;
        hintHeaderCurrent = hintHeaderLower;

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


        for (var c of children){
            // console.log(c, getDescendants(c).length);
            if (getDescendants(c).length < 1){
                continue;
            }
            var tridot_name = c + "3dots";
            nodes[tridot_name] = {
                "name": tridot_name,
                "alternativeImageURL": "data:image/jpeg;base64,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QFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAWjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAADhCSU0EAgAAAAAAAgAAOEJJTQQwAAAAAAABAQA4QklNBC0AAAAAAAYAAQAAAAU4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADSQAAAAYAAAAAAAAAAAAAAA8AAAAoAAAACgBVAG4AdABpAHQAbABlAGQALQAxAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAoAAAADwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAADwAAAABSZ2h0bG9uZwAAACgAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAA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bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEwLTIyVDIzOjI5OjAzLTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFjYjdiYzRlLWY0YTUtNDY3NC1hODUzLWEwMmQ2OGI5MTdmNyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmMzMmM4M2FiLTNlMTItNTk0My05ZWIyLTgxMWYwNTEzN2NhOCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjZhZmI2YmNhLWU1MjgtNGM3ZS1hNGFkLWU0MDdhY2Q0NDc4MyIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YWZiNmJjYS1lNTI4LTRjN2UtYTRhZC1lNDA3YWNkNDQ3ODMiIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxY2I3YmM0ZS1mNGE1LTQ2NzQtYTg1My1hMDJkNjhiOTE3ZjciIHN0RXZ0OndoZW49IjIwMTktMTAtMjJUMjM6Mjk6MDMtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGRAAAAAAf/bAIQAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQICAgICAgICAgICAwMDAwMDAwMDAwEBAQEBAQEBAQEBAgIBAgIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/8AAEQgADwAoAwERAAIRAQMRAf/dAAQABf/EAaIAAAAGAgMBAAAAAAAAAAAAAAcIBgUECQMKAgEACwEAAAYDAQEBAAAAAAAAAAAABgUEAwcCCAEJAAoLEAACAQMEAQMDAgMDAwIGCXUBAgMEEQUSBiEHEyIACDEUQTIjFQlRQhZhJDMXUnGBGGKRJUOhsfAmNHIKGcHRNSfhUzaC8ZKiRFRzRUY3R2MoVVZXGrLC0uLyZIN0k4Rlo7PD0+MpOGbzdSo5OkhJSlhZWmdoaWp2d3h5eoWGh4iJipSVlpeYmZqkpaanqKmqtLW2t7i5usTFxsfIycrU1dbX2Nna5OXm5+jp6vT19vf4+foRAAIBAwIEBAMFBAQEBgYFbQECAxEEIRIFMQYAIhNBUQcyYRRxCEKBI5EVUqFiFjMJsSTB0UNy8BfhgjQlklMYY0TxorImNRlUNkVkJwpzg5NGdMLS4vJVZXVWN4SFo7PD0+PzKRqUpLTE1OT0laW1xdXl9ShHV2Y4doaWprbG1ub2Z3eHl6e3x9fn90hYaHiImKi4yNjo+DlJWWl5iZmpucnZ6fkqOkpaanqKmqq6ytrq+v/aAAwDAQACEQMRAD8A3+PfuvdVIfDP+d//AC8Pnr8mO0Pid8c+18vuHtjrSmzuRphnNp5Hbu1+zcNtXJriN0ZrqrcFYzRboocFUyxSOk0dHU1NHJ93SxVFLFPNF7r3WLsL+eP/AC5esPnvt/8Alw7u7jr6P5FZ3Pbc2VNPBtXK1XWm3eyd5RUc20us9x79jAoKHeWe/ilHEiRxz0NNVVkdNVVNPUiSGP3Xunv+Yf8Azn/gd/K93r1F158rt/bow27+5IKjL4TC7J2bkN7Vu29m0mUjwtRv/elNjZY6nD7TOU80EDQpVV1bJSVIpaaY082j3XurWffuvdf/0N/j37r3Wsh/K5/l4fyEfjL8494d4/BH5g9S95/JTfuG39R7L6gxXy/6C7nXq3b+cnfMb3j6j6+6+FPvuOmosLTvRy1WWqs5UUWJEsfmQSTO/uvdNHdX8un/AIT7by/mu0Xy97R+YPTG3PmbiO59jZ7O/F+p+ZHQW29t7h+Q22KvC0u0qrdXSmSmHav9/azclBjZ5sLT5OjpcrkkX7ign+5qY6j3XuhU/nP/AAB/kq/Mvu/o7cX8x35ebE+L/d/XWxxBtjGT/Kzor4/7v7K6krt25SuxOM3Jgu3KTL5nMbIod30uaTH1+HjxtQlVVZCNatnUCH3XutjL37r3X//Z",
                "label": "(" + getDescendants(c).length.toString() + ")"
            };
            edges[c] = [{
                "from": c,
                "to": tridot_name,
                "type": "contains"
            }];

        }

        // console.log(nodes);
        // console.log(edges);


        component["nodes"] = nodes;
        component["edges"] = edges;
        component["root"] = "Pseudo";

        option.essentials.component = component;
        option.essentials.highLightedNodes = [acc];
        glycanviewer.init(option);

        // glycanviewer.network.on("click", captureClickNode);

        function captureClickNode(x) {
            if (x.nodes.length > 0) {
                var accx = x.nodes[0];
                var glycanType = data[accx].type;

                statusLog(glycanType, accx);
            }
        }
    }

    function accessionValidation(acc) {
        var gtc_acc_re = /G\d{5}\w{2}/;
        return gtc_acc_re.test(acc)
    }

    function pop_up(title, msg) {
        new $.Zebra_Dialog(msg, {
            type: false,
            title: title,
            buttons: false})
    }


    function init() {
        // getParaFromURL();
        allcateDIV();
        keyPress();
        dataPreprocess();


        window.onpopstate = function(event) {
            getParaFromURL();
            testFunc();
        };


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


        if (Object.keys(urlPara).includes("composition")) {
            lowerInit(urlPara["composition"]);
        } else if (Object.keys(urlPara).includes("basecomposition")) {
            lowerInit(urlPara["basecomposition"]);
        } else if (Object.keys(urlPara).includes("focus")) {
            lowerInit(urlPara["focus"]);
        } else if (iupacCompositionInitFlag) {
            iupacCompositionInit();
        } else {
            normalInit();
        }
    }

    function testFunc(){
        suppressStatusChange = true;

        var iupacCompositionInitFlag = false;
        for (var iupac of allMono) {
            if (Object.keys(urlPara).includes(iupac)) {
                iupacCompositionInitFlag = true;
                break
            }
        }

        if (Object.keys(urlPara).includes("composition")) {
            lowerInit(urlPara["composition"]);
        } else if (Object.keys(urlPara).includes("basecomposition")) {
            lowerInit(urlPara["basecomposition"]);
        } else if (Object.keys(urlPara).includes("focus")) {
            lowerInit(urlPara["focus"]);
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
        if (!accessionValidation(acc)){
            pop_up("Error", "Bad GlyTouCan accession: " + acc);
            normalInit();
            return
        }
        if (!Object.keys(data).includes(acc)){
            pop_up("Error", "Unsupported GlyTouCan accession: " + acc);
            normalInit();
            return
        }
        for (var m of allMono){
            monofreq[m] = data[acc].comp[m];
        }

        // updateUpper();
        updateUpperSilent();
        showLower(acc);
    }

    function iupacCompositionInit(){
        for (var m of allMono){
            monofreq[m] = 0;
        }
        for (var m of Object.keys(urlPara)){
            if (allMono.includes(m)){
                monofreq[m] = parseInt(urlPara[m]);
            }
        }

        if (monofreq["dHex"] < monofreq["Fuc"]){
            monofreq["dHex"] = monofreq["Fuc"];
        }

        var hexnacCount = 0, hexCount = 0;
        for (var m of ['GlcNAc', 'GalNAc', 'ManNAc']){
            hexnacCount += monofreq[m];
        }
        if (hexnacCount > monofreq["HexNAc"]){
            monofreq["HexNAc"] = hexnacCount;
        }

        for (var m of ['Glc', 'Gal', 'Man']){
            hexCount += monofreq[m];
        }
        if (hexCount > monofreq["Hex"]){
            monofreq["Hex"] = hexCount
        }

        updateUpper();
    }


    function glytoucanCompositionInit() {
        var comp_acc = urlPara["composition"];

        if (!accessionValidation(comp_acc)){
            normalInit();
            return
        }
        if (!Object.keys(data_composition).includes(comp_acc)){
            normalInit();
            return
        }

        if (Object.keys(data_composition).includes(comp_acc)){
            monofreq = data_composition[comp_acc].comp;
            updateUpper();
        }else{
            normalInit();
        }
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
    
    function getJSON(url) {
        return new Promise(resolve => {
            jQuery.getJSON(url, function(d) {
                resolve(d);
            });
        })
    }

    async function initializeFromPara(p) {
        urlPara = p;

        div_id = p["div_id"];
        container = document.getElementById(div_id);

        var themename = p["theme"];
        if (!Object.keys(p).includes("theme")){
            themename = "";
        }
        var themeURL = "";
        if (themename.startsWith("http")){
            themeURL = themename;
        }else {
            // themeURL = "./JS/theme/" + themename + ".json";
            themeURL = "https://raw.githack.com/glygen-glycan-data/GNOme/master/JS/theme/" + themename + ".json";
        }

        if (Object.keys(p).includes("theme_URL")){
            themeURL = p["theme_URL"];
        }
        theme = await getJSON(themeURL);

        for (var j of theme["external_resources"]){
            if (j["glycan_set"] == null){
                j["glycan_set"] = undefined;
            }
        }

        /*
        theme.external_resources.unshift({
            "name": "GNOme",
            "url_prefix": "https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?composition=",
            "url_suffix": "",
            "glycan_set": undefined,
        });
        */


        /*
        if (themeConfig[theme]["image_style"] == "cfg"){
            image_url_prefix = image_url_prefix_cfg;
            image_url_suffix = image_url_suffix_cfg;
            icon_config = icon_config_cfg;
        }else if (themeConfig[theme]["image_style"] == "snfg"){
            image_url_prefix = image_url_prefix_snfg;
            image_url_suffix = image_url_suffix_snfg;
            icon_config = icon_config_snfg;
        }else{

        }

         */

        image_url_prefix = theme["image_source_prefix"];
        image_url_suffix = theme["image_source_suffix"];
        if (theme["icon_style"] == "cfg"){
            icon_config = icon_config_cfg;
        }else if (theme["icon_style"] == "snfg"){
            icon_config = icon_config_snfg;
        }else{

        }

        option.contextMenu.externalLinks = theme["external_resources"];
        option.essentials.imgURL1 = image_url_prefix;
        option.essentials.imgURL2 = image_url_suffix;
        option["cbtn"] = p["this"];


        data = await getJSON(p["subsumption_json_url"]);
        data_composition = {};
        if (Object.keys(p).includes("compositon")){
            data_composition = await getJSON(p["compositon"]);
        }

        init();
    }



    return {
        initializeFromPara: initializeFromPara,
        init: init,
        showLower: showLower,
        getDescendants: getDescendants
    }

};
