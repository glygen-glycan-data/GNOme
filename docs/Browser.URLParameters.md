# URL encoded parameters
## Theme:
Theme parameter specifies the external resources available on subsumption navigator popup menus.
* [GlyGen](https://gnome.glyomics.org/StructureBrowser.html?theme=GlyGen),
[GlycoTree Sandbox](https://gnome.glyomics.org/StructureBrowser.html?theme=Sandbox),
[GlyTouCan](https://gnome.glyomics.org/StructureBrowser.html?theme=PubChemCID)
## Focus
Focus parameter automatically interprets the GlyTouCan accession.
### Composition Browser
As the name suggests, composition browser only supports composition and base composition.
The URL directly jumps into subsumption navigator for more detail.
* Example:
[Base Composition](https://gnome.glyomics.org/CompositionBrowser.html?focus=G92050GC), 
[Composition](https://gnome.glyomics.org/CompositionBrowser.html?focus=G21581IH)
### Structure Browser
Focus parameter works slightly different from composition browser. Compositions are interpreted into corresponding monosaccharide button configuration. Topologies or saccharides bring you to subsumption navigator.
* Example:
[Base Composition](https://gnome.glyomics.org/StructureBrowser.html?focus=G92050GC), 
[Composition](https://gnome.glyomics.org/StructureBrowser.html?focus=G21581IH), 
[Topology](https://gnome.glyomics.org/StructureBrowser.html?focus=G44147IO), 
[Saccharide](https://gnome.glyomics.org/StructureBrowser.html?focus=G03652TR)

## Monosaccharide button configuration
* Example:
[Hex1&HexNAc1](https://gnome.glyomics.org/StructureBrowser.html?HexNAc=1&Hex=1), 
[GlcNAc=1&Gal=1](https://gnome.glyomics.org/StructureBrowser.html?GlcNAc=1&HexNAc=1&Gal=1&Hex=1), 
[A2G2S2](https://gnome.glyomics.org/StructureBrowser.html?GlcNAc=4&HexNAc=4&Gal=2&Man=3&Hex=5&NeuAc=2), 
[GlcNAc2Man9](https://gnome.glyomics.org/StructureBrowser.html?GlcNAc=2&HexNAc=2&Man=9&Hex=9)
