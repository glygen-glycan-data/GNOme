# GNOme Release Process

## Pre-requisite
1. Python
2. PyGly Package
3. Robot packed in docker container
4. Git and permission to write to GNOme remote repository

## Process
### Update raw materials for building process
1. Raw GNOme subsumption file
2. Accessions for each restriction sets: [BCSDB](https://github.com/glygen-glycan-data/GNOme/blob/master/restrictions/GNOme_BCSDB.accessions.txt), [GlyGen](https://github.com/glygen-glycan-data/GNOme/blob/master/restrictions/GNOme_GlyGen.accessions.txt) and [GlyCosmos](https://github.com/glygen-glycan-data/GNOme/blob/master/restrictions/GNOme_GlyCosmos.accessions.txt)
3. Synonyms
4. Archived and replaced GlyTouCan accessions
5. Push all the changes to GNOme repository master branch

Detail of file mapping relationship:
1. GNOme raw file: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/gnome_subsumption_raw.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/gnome_subsumption_raw.txt)
2. Archived: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/glytoucan_archived.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/glytoucan_archived.txt)
3. Replaced: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/glytoucan_replaced.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/glytoucan_replaced.txt)
4. Byonic synonyms: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/byonic2glytoucan.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/byonic2glytoucan.txt)
5. Shortuckbcomp: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/shortuckbcomp2glytoucan.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/shortuckbcomp2glytoucan.txt)
6. Shortcomp: [PyGly](https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/data/shortcomp2glytoucan.txt) -> [GNOme](https://github.com/glygen-glycan-data/GNOme/blob/master/data/shortcomp2glytoucan.txt)
   

### Run build script
Execute [build script](https://github.com/glygen-glycan-data/PyGly/blob/master/scripts/gnome.sh) in the terminal by:
```
# Provide the tag number in the following format
./gnome.sh V1.2.3
```
The [build script](https://github.com/glygen-glycan-data/PyGly/blob/master/scripts/gnome.sh) handles the following things automatically:
1. Get the most up-to-date GNOme repository from GitHub.
2. Generate the GNOme.owl file from a variety of materials, which is the foundation of all the other files generated in the next few steps. 
In the meantime, the [all_accession](https://github.com/glygen-glycan-data/GNOme/blob/master/data/all_accession), [exact_synonym.txt](https://github.com/glygen-glycan-data/GNOme/blob/master/data/exact_synonym.txt) and [mass_lookup_2decimal](https://github.com/glygen-glycan-data/GNOme/blob/master/data/mass_lookup_2decimal) files are automatically and incrementally updated.
3. Generate OBO and JSON ontology formats by robot.
4. Generate the GNOme browser json data files.
5. Do the same step 2~4 for each restriction set.
6. Update the themes.
7. Commit and push all the changes back to GitHub in a separate branch. 

Depending on network and machine, it may take 20~50 minutes to run.


### Exam the changes and make sure the browser works as expected
1. Check the expected changes.
2. Check whether the GNOme browser functions correctly.
We can use [raw.githack](https://raw.githack.com/) to exam the browsers before merging the braches.
2.1. Structure Browser URL: https://raw.githack.com/glygen-glycan-data/GNOme/Branch_VX.Y.Z/StructureBrowser.html
2.2. Composition Browser URL: https://raw.githack.com/glygen-glycan-data/GNOme/Branch_VX.Y.Z/CompositionBrowser.html
2.3. GlyGen Restriction Structure Browser URL: https://raw.githack.com/glygen-glycan-data/GNOme/Branch_VX.Y.Z/restrictions/GlyGen.StructureBrowser.html
3. Merge the branch back into master and delete it.


### Lanuch a new release in GitHub
1. Provide title, tag and what's new in this update.
2. Draw the GNOme.owl, GNOme.json and GNOme.obo to the upload fields. 
3. Submit
4. Additional work on OBO foundry side

See [example](https://github.com/glygen-glycan-data/GNOme/releases/tag/V1.7.2).






