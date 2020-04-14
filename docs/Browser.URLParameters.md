# URL encoded parameters
## Theme:
Theme parameter decides the image/icon style and external resources available on subsumption navigator.
* Example: 
[default](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?theme=default), 
[GlyGen](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?theme=GlyGen), 
[GlyTouCan](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?theme=GlyTouCan)
## Focus
Focus parameter automatically interprets the GlyTouCan accession. 
### Composition Browser
As the name suggests, composition browser only supports composition and base composition.
The URL directly jumps into subsumption navigator for more detail.
* Example:
[Base Composition](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.compositionselector.html?focus=G92050GC), 
[Composition](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.compositionselector.html?focus=G21581IH)
### Structure Browser
Focus parameter works slightly different from composition browser. Compositions are interpreted into corresponding monosaccharide button configuration. Topologies or saccharides bring you to subsumption navigator.
* Example:
[Base Composition](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G92050GC), 
[Composition](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G21581IH), 
[Topology](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G44147IO), 
[Saccharide](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G03652TR)

## Monosaccharide button configuration
* Example:
[Hex1&HexNAc1](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?HexNAc=1&Hex=1), 
[GlcNAc=1&Gal=1](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?GlcNAc=1&HexNAc=1&Gal=1&Hex=1), 
[A2G2S2](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?GlcNAc=4&HexNAc=4&Gal=2&Man=3&Hex=5&NeuAc=2), 
[GlcNAc2Man9](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?GlcNAc=2&HexNAc=2&Man=9&Hex=9)
* Note1: The number of Hex should be equal or greater than total number of Gal, Glc and Man.
* Note2: The number of HexNAc should be equal or greater than total number of GalNAc, GlcNAc and ManNAc.
* Note3: The number of dHex should be equal or greater than number of Fuc.