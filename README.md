#GNOme - Glycan Naming and Subsumption Ontology

[GlyTouCan](http://glytoucan.org) provides stable accessions for glycans described at varyious degrees of characterization, including compositions (no linkage) and topologies (no carbon bond positions or anomeric configurations). 

GNOme organizes these stable accessions  
* for [interative browsing](#interactive-tools),
* for [text-based searching](#semantic-names), and
* for [automated reasoning](#current-release)
* with well-defined characterization levels.

GNOme is an [OBO Foundry](http://obofoundry.org/ontology/gno) ontology.

## Interactive Tools
Use the [GNOme Glycan Structure Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html) to find glycan structures by composition, topology, and subsumption relationships. 

Use the [GNOme Glycan Composition Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.compositionselector.html) to find glycan compositions by composition and subsumption relationships.

Deep-linking is also supported, to jump to a specific GlyTouCan acccession: [G62109NW](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?focus=G62109NW) or button state: [HexNAc(5)Hex(6)](https://raw.githack.com/glygen-glycan-data/GNOme/master/GNOme.browser.html?HexNAc=5&Hex=6).

### Restrictions ###
[GNOme restrictions](restrictions) support speciifc subsets of GlyTouCan accessions:
* [GlyGen](http://glygen.org): [Structure Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_GlyGen.browser.html), [Composition Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_GlyGen.compositionselector.html).
* [GlycanData](http://grg.tn/GlycanData): [Structure Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_GlycanData.browser.html), [Composition Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_GlycanData.compositionselector.html).
* [BCSDB](http://http://csdb.glycoscience.ru/bacterial/): [Structure Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_BCSDB.browser.html), [Composition Browser](https://raw.githack.com/glygen-glycan-data/GNOme/master/restrictions/GNOme_BCSDB.compositionselector.html).

## Semantic Names
[GNOme Glycan Synonyms](data/exact_synonym.txt) support quick lookup of commonly used composition strings and other semantic glycan names. 

## Current Release
[GNOme.owl](https://github.com/glygen-glycan-data/GNOme/releases/latest/download/GNOme.owl), 
[GNOme.obo](https://github.com/glygen-glycan-data/GNOme/releases/latest/download/GNOme.obo), 
[GNOme.json](https://github.com/glygen-glycan-data/GNOme/releases/latest/download/GNOme.json)

### Stable URLs
The current release of GNOme is always available at the permanent URLs: 
* http://purl.obolibrary.org/obo/gno.owl
* http://purl.obolibrary.org/obo/gno.obo
* http://purl.obolibrary.org/obo/gno.json

### Older Releases
Tagged and versioned releases are also [available](https://github.com/glygen-glycan-data/GNOme/releases).

## Contact
Please submit issues, suggestions, corrections to the [issue tracker](https://github.com/glygen-glycan-data/GNOme/issues).  

