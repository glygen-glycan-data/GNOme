# GNOme browser
## Theme
Both GNOme viewer support JSON encoded theme. [Default theme](https://github.com/glygen-glycan-data/GNOme/blob/master/JS/theme/default.json) can be located here. <BR>Custom options:
```
Image and Icon style: CFG or SNFG
Linked External resouces: display name, url and glycan set.
```

## Supporting data
### [GNOme Browser Data](https://github.com/glygen-glycan-data/GNOme/blob/master/BrowserData.json)
It is a minimal version of GNOme data encoded by JSON, only used to support GNOme viewer.

## 3rd Party JavaScript Dependencies
### [Vis.js](https://visjs.org/)
### [jQuery](https://jquery.com/)

## Easy Installation
1. Include 2 JavaScript libraries and the driving scripts (gnome.js) in the head section of HTML.
2. Prepare a div in the page with explicit ID.
3. Initiate a GNOmeBrowser instance, and provide ID of div container to the instance.
4. Call Init method with supported parameters.

## Full Screen mode:
If the whole html page is prepared for the GNOme browser, it is best to let the 
GNOmeDisplayPresetFullScreen class to control resize, URL parameter, HTML title and other things.<br>
See example usage: [GNOme Topology Browser](https://github.com/glygen-glycan-data/GNOme/blob/master/StructureBrowser.html), [GNOme Composition Browser](https://github.com/glygen-glycan-data/GNOme/blob/master/CompositionBrowser.html)

## Widget mode:
1. Use a variety of set method to change widget width, height, Image source, icon style and other things.
2. Use API to get the current status of the widget.
3. Use API to change the current status.
4. Use setfocus to focus on a few things.
5. Use RefreshUI to refresh the widget to show the changes.

## On-demand subsumption alignment
[How to deploy your own subsumption backend](https://subsumption.glyomics.org/about#Deployment_title)

## Retired viewer
First version of GNOme viewer: [GlyTouCan](https://rawcdn.githack.com/glygen-glycan-data/GNOme/3df5b91aaafcc83fe24b14103d7288822200830d/GNOme.browser.old.html), 
[BCSDB](https://rawcdn.githack.com/glygen-glycan-data/GNOme/3df5b91aaafcc83fe24b14103d7288822200830d/restrictions/GNOme_BCSDB.browser.old.html) and
[GlyGen](https://rawcdn.githack.com/glygen-glycan-data/GNOme/3df5b91aaafcc83fe24b14103d7288822200830d/restrictions/GNOme_GlyGen.browser.old.html)


