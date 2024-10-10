
"use strict";

let d3table = {

    params: {
	"width": "100%",
	"pagesize": "auto",
        "rowpx": 74,
	"paged": true,
	"indices": false,
	"headers": true
    },

    config: function(params) {
        for (var param in params) {
            d3table.params[param] = params[param]
        }
    },

    init: function(params) {
        if (params) {
            d3table.config(params);
        }
        let elts = document.getElementsByClassName('d3table');
        for (let elt of elts) {
            var t = new d3table.D3Table(elt);
	}
    },

    htmlescape: function(unsafe) {
        return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
    },

    getbool: function(s,d) {
	if (s) {
	    if (s == 'true') {
		return true;
            } else {
                return false;
            }
        } else {
	    return d;
        }
    },
    
    getint: function(s,d) {
	if (s && !isNaN(parseInt(s))) {
	    return parseInt(s);
        } else {
	    return d;
        }
    },
    
    D3Table: function(__element__, __params__) {

	this.initialize = function(params,elt) {
	    params = Object.assign({},d3table.params,params);
	    this.divid = elt.getAttribute('id');
	    this.colurl = elt.getAttribute('d3table_cols') || params.colurl;
	    this.dataurl = elt.getAttribute('d3table_data') || params.dataurl;
            this.paged = d3table.getbool(elt.getAttribute('d3table_paged'),params.paged);
            this.pagesize = d3table.getint(elt.getAttribute('d3table_pagesize'),params.pagesize);
            this.rowpx = d3table.getint(elt.getAttribute('d3table_rowpx'),params.pagesize);
            this.indices = d3table.getbool(elt.getAttribute('d3table_indices'),params.indices);
            this.headers = d3table.getbool(elt.getAttribute('d3table_headers'),params.headers);
            this.width = elt.getAttribute('d3table_width') || params.width;
	    this.conststr = elt.getAttribute('d3table_constraint') || params.constraint;
	    this.sortstr = elt.getAttribute('d3table_sort') || params.sort;

            if (this.pagesize == "auto") {
                // document.getElementById(this.divid).height = "100%";
                // let height = document.getElementById(this.divid).clientHeight;
                let height = document.documentElement.clientHeight;
                this.pagesize = Math.floor((height-61-28)/this.rowpx);
                console.log(height,this.pagesize);
            }

	    this.columns = params.columns;
            this.constraint = [];
	    if (this.conststr) {
		let elts = this.conststr.split(" ");
                this.constraint.push([elts[1],elts[0],elts[2]]);
            }
	    if (params.transform != null) {
		this.transform = params.transform;
            }
	    if (params.rowindex != null) {
		this.rowindexmap = params.rowindex;
            }
	    if (!this.columns) {
		this.getcols();
            } else {
		this.getdata();
	    }
	}

	this.getcols = function() {
	    let thethis = this;
	    d3.json(this.colurl).then(function(columns) {
		thethis.columns = columns;
		thethis.getdata();
	    });
	}

	this.getdata = function() {
	    let datatype = this.dataurl.substring(this.dataurl.lastIndexOf(".")+1).toLowerCase();
            let parser = d3.json;
            if (datatype == "tsv") {
		parser = d3.tsv;
            } else if (datatype == "csv") {
		parser = d3.csv;
            }
	    let thethis = this;
            parser(this.dataurl).then(function(data) {
		thethis.transform(data,function(data) {
		    thethis.data = data;
		    thethis.makesortkeys();
		    thethis.maketable();
		    thethis.refresh();
		});
	    });
	}

	this.refresh =  function() {
	    this.tdata = this.page(this.sort(this.filter(this.data)));
	    this.updaterows();
        }
	this.page = function(data) {
	    if (!this.paged) {
		this.pagesize = data.length;
	    }
	    this.maxpagestart = Math.max(0,data.length-this.pagesize);
	    this.pagestart = this.pagestart || 0;
	    let index_start = this.pagestart;
	    let index_end = this.pagestart+this.pagesize;
	    let newdata = [];
	    for (let i=index_start; i<Math.min(index_end,data.length); i++) {
                if (data[i]['_uindex'] !== undefined) {
		    data[i]['_index'] = this.rowindexmap(data[i]['_uindex']);
                } else {
		    data[i]['_index'] = this.rowindexmap(i+1);
                }
		newdata.push(data[i]);
            }
	    return newdata;
	}

	this.rowindexmap = function(i) {
	    return i.toString();
        }

	this.transform = function(data,callback) {
	    callback(data);
        }

	this.sort = function(data) {
            let thethis = this;
	    if (this.sortkeys.length > 0) {
		data.sort(function (a,b) { return thethis.sortcmp(thethis.sortkeys,a,b); });
                if (data.length > 0) {
                  data[0]['_uindex'] = 1;
                  for (let i=1;i<data.length;i++) {
                      if (this.sortcmp(this.sortkeys,data[i-1],data[i]) != 0) {
                          data[i]['_uindex'] = data[i-1]['_uindex'] + 1;
                      } else {
                          data[i]['_uindex'] = data[i-1]['_uindex'];
                      }
                  }
                }
            } else {
                for (let i=0;i<data.length;i++) {
                    if (data[i]['_uindex'] !== undefined) {
                        delete data[i]['_uindex'];
                    }
                }
            }
	    return data;
	}

	this.makesortkeys = function() {
	    this.sortkeys = [];
            if (this.sortstr) {
		for (let ssi of this.sortstr.split(" ")) {
		    this.sortkeys.push(this.sortstr2sortkey(ssi));
                }
            }
	    for (let col of this.columns) {
		for (let sk of this.sortkeys) {
		    if (col.tag == sk[0]) {
			if (sk[2] == 1) {
			    col.sortdirn = 'inc';
			} else {
			    col.sortdirn = 'dec';
			}
			break;
		    }
		}
            }
        }

	this.sortstr2sortkey = function(ss) {
	    var dirn = 1;
	    var tag = ss;
	    if (ss.startsWith('+')) {
		dirn = 1;
                tag = ss.substr(1);
            } else if (ss.startsWith('-')) {
		dirn = -1;
                tag = ss.substr(1);
            } 
	    var cmpfn = null;
	    var datatype = null;
            for (let c of this.columns) {
		if (tag == c.tag) {
		    cmpfn = c.compare;
		    datatype = c.type;
		    if (c.type == "extid") {
			datatype = c.idtype;
		    } else if (c.type == "onclick") {
                        datatype = c.valuetype;
                    }
		    break;
                }
            }
	    if (cmpfn == null || cmpfn == undefined) {
		cmpfn = this.strcmp;
		if (datatype == "int" || datatype == "float" || datatype == "percent") {
		    cmpfn = this.numcmp;
		}
	    }
	    return [tag,cmpfn,dirn];
        }

	this.addsort = function(col) {
	    let tag = col.tag;
	    let dirn = 0;
	    for (let i=this.sortkeys.length-1; i>=0; i--) {
		let sk = this.sortkeys[i];
		if (sk[0] == tag) {
		    if (i == 0) {
			dirn = sk[2];
		    }
		    this.sortkeys.splice(i, 1);
		}
	    }
	    col.sortdirn = null;
	    if (dirn == 0) {
		this.sortkeys.unshift(this.sortstr2sortkey("+"+tag));
		col.sortdirn = 'inc';
            } else if (dirn == 1) {
		this.sortkeys.unshift(this.sortstr2sortkey("-"+tag));
		col.sortdirn = 'dec';
	    } else {
		;
            }
	    this.firstpage();
	}
	
	this.strcmp = function(a,b) {
	    if (a !== undefined && a != "") {
		if (b !== undefined && b != "") {
		    return a.localeCompare(b);
		} else {
		    return -1;
		}
	    } else if (b !== undefined && b != "") {
		return 1;
	    }
	    return 0;
        }

	this.numcmp = function(a,b) {
	    if (!isNaN(parseFloat(a))) {
		if (!isNaN(parseFloat(b))) {
		    return parseFloat(a) - parseFloat(b)
                } else {
		    return -1;
                }
	    } else if (!isNaN(parseFloat(b))) {
		return 1;
            }
            return 0;
        }

	this.sortcmp = function(sortkeys,a,b) {
	    let v = 0;
	    for (let sk of sortkeys) {
		v = sk[2]*sk[1](a[sk[0]],b[sk[0]]);
		if (v != 0) {
                    return v;
                }
            }
            return 0;
        }

        this.check_constraint = function(d,c) {
	    let val = d[c[1]];
            if (typeof(val) === 'string') {
                val = val.trim();
            }
            if (c[0] == "==") {
                if (typeof(c[2]) == 'number') {
                    return (parseFloat(val) == c[2]);
                } else {
                    return (val == c[2]);
                }
            }
            else if (c[0] == "!=") {
                return (val != c[2]);
            }
            else if (c[0] == "~") {
                if (typeof(c[2]) == 'number') {
		    let v = parseFloat(val);
		    if (isNaN(v)) {
		        return false;
                    }
                    return (Math.abs(v-c[2]) <= 1);
                } else {
                    return (val.match(c[2]));
                }
            }
            else if (c[0] == "~~") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (Math.abs(v-c[2]) <= 10);
            }
            else if (c[0] == "~~~") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (Math.abs(v-c[2]) <= 100);
            }
            else if (c[0] == "<=") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (v <= c[2]);
            }
            else if (c[0] == ">=") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (v >= c[2]);
            }
            else if (c[0] == "<") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (v < c[2]);
            }
            else if (c[0] == ">") {
		let v = parseFloat(val);
		if (isNaN(v)) {
		    return false;
                }
                return (v > c[2]);
            }
        }

	this.filter = function(data) {
            let newdata = [];
            for (let i=0; i<data.length; i++) {
                let keep = true;
                for (let j=0; j<this.constraint.length; j++) {
                    if (!this.check_constraint(data[i],this.constraint[j])) {
                         keep=false;
                         break;
                    }
                }
                if (keep) {
                    newdata.push(data[i]);
                }
            }
	    return newdata;
	}

	this.maketable = function() {
            let thethis = this;
            let table = d3.select('#'+this.divid)
                .attr("style","margin-bottom:20px;overflow:auto;")
                .append("table")
                .attr("id",this.divid+'-table')
		.attr("class","ExcelTable2007")
		.attr("style","table-layout:fixed;margin-bottom:0px;")
                .attr("width",this.width);
            let thead = table.append("thead");
	    this.thead = thead;
            // let tbody = table.append("tbody").attr("class","list");
            let tbody = table.append("tbody");
            this.tbody = tbody;

	    if (this.indices) {
		let newcols = [{'tag': '_index', 'label': '&nbsp;', 'width': '40px', 'align': 'center', 'type': 'int', 'cssclass': 'rowindex'}]
		newcols.push.apply(newcols, this.columns);
		this.columns = newcols;
            }
	    
	    this.oddeven = false;
	    for (let c of this.columns) {
		if (c.oddeven) {
		    this.oddeven = true;
		    this.oddeventag = c.tag;
		}
            }

	    if (this.headers) {
		thead.append("tr")
		    .attr("class","ExcelTable2007")
                    .selectAll("th")
                    .data(this.columns)
                    .enter()
                    .append("th")
	            .attr("align","center")
	            .attr("valign","bottom")
	            .attr("width",function(column) {
			if (column.width !== undefined) {
	                    return column.width;
			}
			return null;
                    })
                    .html(function(column) { return "<span style=\"overflow: hidden;text-overflow: ellipsis;white-space: nowrap\">"+column.label+"</span>"; })

		thead.select("tr")
	            .selectAll("th")
	            .data(this.columns)
	            .filter(function (column) {
			if (column.sortable) {
			    return true;
			}
			return false;
		    })
	            .select('span')
		    .on('click',this.handler('addsort'))
		    .style('cursor','pointer');

		thead.select("tr")
                    .selectAll("th")
                    .data(this.columns)
                    .filter(function (column) {
			if (column.searchable) {
                            return true;
			}
			return false;
                    })
                    .append("span")
                    .html("&#x2315;")
                    .attr("title", "Search")
                    .style('cursor','pointer')
                    .style('float','right')
                    .on('click',this.handler('search'))
		    .classed("search",true);
	    
		thead.select("tr")
                    .selectAll("th")
                    .data(this.columns)
                    .filter(function (column) {
			if (column.sortable) {
                            return true;
			}
			return false;
                    })
                    .append("span")
		    .html("&#x23F6;")
                    .attr("title", "Sort")
                    .style('cursor','pointer')
                    .style('float','right')
                    .on('click',this.handler('addsort'))
		    .classed("sortinc",true);

		thead.select("tr")
                    .selectAll("th")
                    .data(this.columns)
                    .filter(function (column) {
			if (column.sortable) {
                            return true;
			}
			return false;
                    })
                    .append("span")
		    .html("&#x23F7;")
                    .attr("title", "Sort")
                    .style('cursor','pointer')
                    .style('float','right')
                    .on('click',this.handler('addsort'))
		    .classed("sortdec",true);
	    }

            if (this.paged) {
                d3.select('#'+this.divid).append("div").style('float','right')
                   .append("i").attr('class','fa-solid fa-arrow-right-to-bracket fa-lg').attr("title","Last Page")
                   .style('cursor','pointer').style('margin-top','20px').style('margin-left','10px').style('margin-bottom','20px')
                   .on('click',this.handler('lastpage'));
                d3.select('#'+this.divid).append("div").style('float','right')
                   .append("i").attr('class','fa-solid fa-arrow-right fa-lg').attr("title","Next Page")
                   .style('cursor','pointer').style('margin-top','20px').style('margin-left','10px').style('margin-bottom','20px')
                   .on('click',this.handler('nextpage'));
                d3.select('#'+this.divid).append("div").style('float','left')
                   .append("i").attr('class','fa-solid fa-arrow-right-to-bracket fa-flip-horizontal fa-lg').attr("title","First Page")
                   .style('cursor','pointer').style('margin-top','20px').style('margin-right','10px').style('margin-bottom','20px')
                   .on('click',this.handler('firstpage'));
                d3.select('#'+this.divid).append("div").style('float','left')
                   .append("i").attr('class','fa-solid fa-arrow-left fa-lg').attr("title","Previous Page")
                   .style('cursor','pointer').style('margin-top','20px').style('margin-right','10px').style('margin-bottom','20px')
                   .on('click',this.handler('prevpage'));
		d3.select('#'+this.divid).append("div").classed('center',true)
                   .style('text-align','center').style('margin-top','6px')
                   .append("span").html('<i class="fa-solid fa-circle-info fa-lg"></i>&nbsp;Help').attr("title","Help")
                   .style('cursor','pointer').style('font-size','17px')
                   .on('click',this.handler('help'));
                d3.select('#'+this.divid).select("div.center").append("span")
                   .html("; Source Data: <a href=\""+this.dataurl+"\">Download</a>");
                // d3.select('#'+this.divid).style('margin-bottom','50px');
           }
        }

        this.updaterows = function() {
            console.log(this.tdata);

            let thethis = this;
	    //
	    this.thead.select("tr")
                .selectAll("th")
                .data(this.columns)
                .filter(function (column,i) {
                    if (column.searchable) {
                        return true;
                    }
                    return false;
                 })
	        .selectAll("span.search")
	        .classed("infilter",function(column) {
		    return column.infilter;
		 });

	    this.thead.select("tr")
                .selectAll("th")
                .data(this.columns)
                .filter(function (column,i) {
                    if (column.sortable) {
                        return true;
                    }
                    return false;
                 })
	        .selectAll("span.sortinc")
	        .classed("sortshow",function(column) {
		    return column.sortdirn == 'inc';
		 });
	    this.thead.select("tr")
                .selectAll("th")
                .data(this.columns)
                .filter(function (column,i) {
                    if (column.sortable) {
                        return true;
                    }
                    return false;
                 })
	        .selectAll("span.sortdec")
	        .classed("sortshow",function(column) {
		    return column.sortdirn == 'dec';
		 });

            //
            this.tbody.selectAll("tr").remove();
            let oecls = 'even'
            let oeval = null;
            var rows = this.tbody.selectAll("tr")
                .data(this.tdata)
                .enter()
                .append("tr")
	        .attr('class',function(d,i) {
		    if (d['_index'] != oeval) {
                        oecls = (oecls === 'odd' ? 'even' : 'odd');
                        oeval = d['_index'];
                    } 
		    return oecls;
		});
            //

            var cells = rows.selectAll("td")
                .data(function(row,i) {
                    return thethis.columns.map(function(column,j) {
		        return {column: column, value: row[column.tag], row: row, rowindex: i, colindex: j};
                    });
                })
                .enter()
                .append("td")
	        .attr("width",function(d) {
		    if (!thethis.headers && d.column.width !== undefined) {
			return d.column.width;
                    }
		    return null;
                })
	        .attr("align",function(d) { 
	            if (d.column.align !== undefined) {
	                return d.column.align;
                    }
	            return "left";
	        })
	        .attr("valign","top")
	        .attr("class",function (d) {
		    if (d.column.cssclass !== undefined) {
			return d.column.cssclass;
		    }
		    return d.column.tag; 
	        })
	        .attr("style",function (d) {
                    if (d.column.tag != '_index' && !d.column.textwrap) {
			return "overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"
		    }
		    return null;
		})
                .html(function(d) { 
	            if (d.column.type == "float" && d.column.fixed !== undefined) {
	                return parseFloat(d.value).toFixed(d.column.fixed);
                    } else if (d.column.type == "percent") {
                        if (d.value != "") {
                            if (d.column.fixed !== undefined) {
	                        return (100*parseFloat(d.value)).toFixed(d.column.fixed)+"%";
                            } else {
	                        return (100*parseFloat(d.value)).toString()+"%";
                            }
                        } else {
                            return "";
                        }
                    } else if (d.column.type == "extid" && d.column.exturl !== undefined) {
                        let val = d.value;
                        if (d.column.urltext !== undefined) {
                            val = d.column.urltext;
                        }
			if (d.column.target != 'self') {
	                    return "<A href="+d.column.exturl+d.value+" target=\"_blank\">"+val+"</A>";
			} else {
	                    return "<A href="+d.column.exturl+d.value+" >"+val+"</A>";			    
			}
                    } else if (d.column.type == "onclick" && d.column.js !== undefined) {
                        let val = d.value;
                        if (d.column.urltext !== undefined) {
                            val = d.column.urltext;
                        }
                        let jsstr = d.column.js.replace('{}',d.value);
	                return "<A href=\"#\" onclick=\""+jsstr+"\">"+val+"</A>";
                    } else if (d.column.type == "img" && d.column.imgurl !== undefined && d.value != "") {
	                var url = d.column.imgurl.replace(/{}/g, d.value);
		        var height = "";
		        var width = "";
		        if (d.column.height !== undefined) {
		            height = " height=\""+d.column.height+"\"";
		        }
		        if (d.column.width !== undefined) {
		            width = " width=\""+d.column.width+"\"";
		        }
		        if (d.column.caption !== undefined) {
		            return "<P align=\"center\"><IMG style=\"margin: 10px;\" src=\""+url+"\""+height+width+" loading=\"lazy\" ><br/>"+d.value+"</P>";
		        }
                        if (d.column.exturl !== undefined) {
                            var exturl = d.column.exturl.replace(/{}/g, d.row[d.column.exturltag]);
	                    return "<A href=\""+exturl+"\" target=\"_blank\"><IMG src=\""+url+"\""+height+width+" loading=\"lazy\" ></A>";
                        }
	                return "<IMG src=\""+url+"\""+height+width+" loading=\"lazy\" >";
                    };
	            return d.value; 
	        })
	        .attr('title', function(d) { return d.value; });
	}

	this.help = function() {
	    alert("Click column header to sort increasing then decreasing.\n\nClick magnifying glass to filter.\n\nTo filter on text fields, enter:\n  [term] for substring match; \n  ^[term] for beginning of string match; \n  [term]$ for end of string match; \n  ==[term] for exact match; \n  !=[term] for exact not-match; \n  != for non-blank; \n  == for blank.\n\nTo filter on numeric fields, enter: \n  [value] for equality; \n  <[value] for less than; \n  >[value] for greater than; \n  <=[value] for less than or equal; \n  >=[value] for greater than or equal; \n  ~[value] for within 1; \n  !=[value] for not equal; \n  != for non-blank; \n  == for blank.\n\nCancel filter on field with empty search term or value.");
	}

	this.firstpage = function() {
            this.pagestart = 0;
            this.refresh()
        }        
	this.prevpage = function() {
            this.pagestart = Math.max(0,(this.pagestart-this.pagesize));
            this.refresh()
        }        
	this.nextpage = function() {
            this.pagestart = Math.min(this.maxpagestart,(this.pagestart+this.pagesize));
            this.refresh()
        }        
	this.lastpage = function() {
            this.pagestart = this.maxpagestart;
            this.refresh()
        }        

        this.search = function(elt) {
            let term = prompt("Search term:");
	    if (term &&  typeof(term) === 'string') {
		term = term.trim();
	    }
	    let tag = elt.tag;
            // remove any constraint with this tag...
	    for (let i=this.constraint.length-1; i>=0; i--) {
		let c = this.constraint[i];
		if (c[1] == tag) {
		    this.constraint.splice(i, 1);
		}
	    }
	    elt.infilter = false;
            if (term == null || term == "") {
		; 
            } else {
		if (elt.type == "float" || elt.type == "int" || elt.type == "percent" || (elt.type == "extid" && elt.idtype == "int")) {
		    if (term.startsWith('<=') || term.startsWith('>=') || term.startsWith('!=') || term.startsWith('==') || (term.startsWith('~~') && !term.startsWith('~~~'))) {
			let v = parseFloat(term.substring(2));
			if (!isNaN(v)) {
                            if (elt.type == "percent") {
                                v = v/100;
                            }
			    this.constraint.push([term.substring(0,2).trim(),tag,v]);
			    elt.infilter = true;
			} else if ((term.startsWith('!=') || term.startsWith('==')) && term.substring(2).trim() == "") {
			    this.constraint.push([term.substring(0,2).trim(),tag,""]);
			    elt.infilter = true;
			}
                    } else if (term.startsWith('<') || term.startsWith('>') || (term.startsWith('~') && !term.startsWith('~~'))) {
			let v = parseFloat(term.substring(1));
			if (!isNaN(v)) {
                            if (elt.type == "percent") {
                                v = v/100;
                            }
			    this.constraint.push([term.substring(0,1).trim(),tag,v]);
			    elt.infilter = true;
			}
                    } else if (term.startsWith('~~~')) {
			let v = parseFloat(term.substring(3));
			if (!isNaN(v)) {
                            if (elt.type == "percent") {
                                v = v/100;
                            }
			    this.constraint.push([term.substring(0,3).trim(),tag,v]);
			    elt.infilter = true;
			}
                    } else {
			let v = parseFloat(term);
			if (!isNaN(v)) {
                            if (elt.type == "percent") {
                                v = v/100;
                            }
			    this.constraint.push(["==",tag,v]);			
                        } else {
			    this.constraint.push(["==",tag,term.trim()]);			
                        }
			elt.infilter = true;
                    }
		} else {
		    if (term.startsWith('!=') || term.startsWith('==')) {
			this.constraint.push([term.substring(0,2).trim(),tag,term.substring(2).trim()]);
			elt.infilter = true;
		    } else {
			this.constraint.push(['~',tag,term.trim()]);
			elt.infilter = true;
		    }
		}
            }
            console.log(this.constraint);
            this.firstpage();
        }

        this.handler = function(methodname, arg1, arg2, arg3, arg4, arg5, arg6) {
            var that = this;
	    var meth = methodname;
            var a1 = arg1;
            var a2 = arg2;
            var a3 = arg3;
            var a4 = arg4;
            var a5 = arg5;
            var a6 = arg6;
            return function(event) {
                that[meth](event, a1, a2, a3, a4, a5, a6);
            }
        }

	this.initialize(__params__||d3table.params,__element__);

    } // D3Table

} // d3table
