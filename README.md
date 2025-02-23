<A href="https://gnome.glyomics.org/StructureBrowser.html"><img align="right" width="200px" src="img/GNOme Structure Browser Button.png"/></A> [GlyTouCan](http://glytoucan.org) provides stable accessions for glycans described at varyious degrees of characterization, including compositions (no linkage) and topologies (no carbon bond positions or anomeric configurations). 

GNOme organizes these stable accessions  
* for [interactive browsing](#interactive-tools),
* for [text-based searching](#semantic-names), and
* for [automated reasoning](#current-release)
* with well-defined characterization levels.

GNOme is a subproject of and is supported by the [GlyGen: Computational and Informatics Resources for Glycoscience](http://glygen.org/) project. 

GNOme is an [OBO Foundry](http://obofoundry.org/ontology/gno) ontology.

## Interactive Tools
Use the **[GNOme Glycan Structure Browser](https://gnome.glyomics.org/StructureBrowser.html)** to find glycan structures by composition, topology, and subsumption relationships. 

Use the **[GNOme Glycan Composition Browser](https://gnome.glyomics.org/CompositionBrowser.html)** to find glycan compositions by composition and subsumption relationships.

Deep-linking is also supported, to jump to a specific GlyTouCan acccession: [G62109NW](https://gnome.glyomics.org/StructureBrowser.html?focus=G62109NW) or button state: [HexNAc(5)Hex(6)](https://gnome.glyomics.org/StructureBrowser.html?HexNAc=5&Hex=6).


### Restrictions ###
[GNOme restrictions](restrictions) support specific subsets of GlyTouCan accessions:
* [N-linked](https://glycomotif.glyomics.org/glycomotifdev/GGM.001001#Alignments) Glycans: [Structure Browser](https://gnome.glyomics.org/restrictions/NGlycans.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/NGlycans.CompositionBrowser.html).
* [GlyGen](http://glygen.org): [Structure Browser](https://gnome.glyomics.org/restrictions/GlyGen.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlyGen.CompositionBrowser.html).
  * [GlyGen](http://glygen.org) N-linked Glycans: [Structure Browser](https://gnome.glyomics.org/restrictions/GlyGen_NGlycans.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlyGen_NGlycans.CompositionBrowser.html).
  * [GlyGen](http://glygen.org) N-linked [GlycoTree](https://sandbox.glyomics.org/) Glycans: [Structure Browser](https://gnome.glyomics.org/restrictions/GlycoTree_NGlycans.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlycoTree_NGlycans.CompositionBrowser.html).
  * [GlyGen](http://glygen.org) O-linked Glycans: [Structure Browser](https://gnome.glyomics.org/restrictions/GlyGen_OGlycans.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlyGen_OGlycans.CompositionBrowser.html).
  * [GlyGen](http://glygen.org) O-linked [GlycoTree](https://sandbox.glyomics.org/) Glycans: [Structure Browser](https://gnome.glyomics.org/restrictions/GlycoTree_OGlycans.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlycoTree_OGlycans.CompositionBrowser.html).
* [GlyCosmos](https://glycosmos.org/glycans/index): [Structure Browser](https://gnome.glyomics.org/restrictions/GlyCosmos.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlyCosmos.CompositionBrowser.html).
* [PubChem Compounds](https://pubchem.ncbi.nlm.nih.gov/): [Structure Browser](https://gnome.glyomics.org/restrictions/PubChemCID.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/PubChemCID.CompositionBrowser.html).
* [GlyConnect Structures](https://glyconnect.expasy.org/): [Structure Browser](https://gnome.glyomics.org/restrictions/GlyConnect.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/GlyConnect.CompositionBrowser.html).
* [BCSDB](http://csdb.glycoscience.ru/bacterial/): [Structure Browser](https://gnome.glyomics.org/restrictions/BCSDB.StructureBrowser.html), [Composition Browser](https://gnome.glyomics.org/restrictions/BCSDB.CompositionBrowser.html).

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

## Repository
GNOme input data-files, resulting ontologies, and interactive widgets are managed at [GitHub](https://github.com/glygen-glycan-data/GNOme). 

## Contact
Please submit issues, suggestions, corrections to the [issue tracker](https://github.com/glygen-glycan-data/GNOme/issues).

## Reference
If you use GNOme in your work, please cite the GNOme manuscript: Zhang W, Vesser M, Edwards N. [GNOme, an ontology for glycan naming and subsumption.](https://doi.org/10.1007/s00216-025-05757-8) Anal Bioanal Chem. 2025 Feb 8. doi:[10.1007/s00216-025-05757-8](https://doi.org/10.1007/s00216-025-05757-8). Epub ahead of print. PMID:[39921684](https://pubmed.ncbi.nlm.nih.gov/39921684/).

