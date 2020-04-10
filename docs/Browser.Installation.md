# GNOme browser
## Theme
Both GNOme viewer support JSON encoded theme. [Default theme](https://github.com/glygen-glycan-data/GNOme/blob/master/JS/theme/default.json) can be located here. <BR>Custom options:
```
Image and Icon style: CFG or SNFG
Linked External resouces: display name, url and glycan set.
```

## Supporting data
2 separate JSON files are required for the viewer.
### [Primary data](https://github.com/glygen-glycan-data/GNOme/blob/master/GNOme.browser.json)
Primary glycan relational information.
### [Composition and base composition button configuration](https://github.com/glygen-glycan-data/GNOme/blob/master/GNOme.browser.composition.json)
Only used for quickly configuring to selected GlyTouCan composition. [Example](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G54064OC)

## 3rd Party JavaScript Dependencies
### [D3.js](https://d3js.org/)
### [Vis.js](https://visjs.org/)
### [jQuery](https://jquery.com/)
### [zebra_dialog](https://github.com/stefangabos/Zebra_Dialog)

## Installation
1. Include JavaScript libraries, style sheet, and 2 driving scripts (CBTN.js/CBTN_cs.js and hgv2.js) in the head section of HTML.
2. Prepare a div in the page with explicit ID.
3. Initiate a CBTN instance, and provide theme, ID of div container and data to the instance.
4. Call initializeFromPara method.

See example: [GNOme Topology Browser](https://github.com/glygen-glycan-data/GNOme/blob/master/GNOme.browser.html)

## Retired viewer
[First version of GNOme viewer](https://rawcdn.githack.com/glygen-glycan-data/GNOme/3df5b91aaafcc83fe24b14103d7288822200830d/GNOme.browser.old.html)
