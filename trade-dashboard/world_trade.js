var choropleth_svg = d3.select("#choropleth");
var pie_svg = d3.select("#pie_chart");
var force_svg = d3.select("#force");
var bar_svg = d3.select("#bar_chart");
var trade_data_all;
var edge_data_all;
var xScale;
var yScale;
var xAxis;
var yAxis;


d3.select('#tradeType')
    .on('change', function () {
        var tradeType = d3.select(this).property('value');
        var year = d3.select("#year").property('value');
        var country = d3.select("#country").property('value');

        choropleth_svg.selectAll("*").remove();
        createChoropleth(trade_data_all, tradeType, year);
        pie_svg.selectAll("*").remove();
        createPieChart(trade_data_all, tradeType, year);
        force_svg.selectAll("*").remove();
        createForceLayout(trade_data_all, edge_data_all, tradeType, year);
        updateBarChart(trade_data_all, tradeType, country);
    });

d3.select('#year')
    .on('change', function () {
        var year = d3.select(this).property('value');
        var tradeType = d3.select("#tradeType").property('value');
        var country = d3.select("#country").property('value');

        choropleth_svg.selectAll("*").remove();
        createChoropleth(trade_data_all, tradeType, year);
        pie_svg.selectAll("*").remove();
        createPieChart(trade_data_all, tradeType, year);
        force_svg.selectAll("*").remove();
        createForceLayout(trade_data_all, edge_data_all, tradeType, year);
        updateBarChart(trade_data_all, tradeType, country);
    });

d3.select('#country')
    .on('change', function () {
        var year = d3.select("#year").property('value');
        var tradeType = d3.select("#tradeType").property('value');
        var country = d3.select(this).property('value');
        updateBarChart(trade_data_all, tradeType, country);
    });

d3.csv("all.csv", function (csv) {
    trade_data_all = csv;
    createChoropleth(trade_data_all, 'Import', 2020);
    createPieChart(trade_data_all, 'Import', 2020);
    countries = csv.map(a => a["Reporter"]);
    // unique countries
    var countries = countries.filter((v, i, list) => list.indexOf(v) === i).sort();
    d3.select("#country")
        .selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .attr("value", function (d) {
            return d;
        })
        .text(function (d) {
            return d;
        });
    createBarChart(trade_data_all, 'Import', 'Aruba');

    d3.csv("all_links.csv", function (edgeData) {
        edge_data_all = edgeData;
        createForceLayout(trade_data_all, edge_data_all, 'Import', 2020);
    });
});

function createChoropleth(csv, tradeType, year) {
    //Width and height
    var w = 960;
    var h = 500;
    var data = csv.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        .filter(trade => trade.Year == year);

    //Define map projection
    var projection = d3.geoMercator()
        .translate([w / 2, h / 2])
        .scale([200]);

    //Define path generator
    var path = d3.geoPath()
        .projection(projection);

    //Define quantize scale to sort data values into buckets of color
    var color = d3.scaleQuantize()
        // 						.range(["#6363FF", "#6373FF", "#63A3FF", "#63E3FF", "#63FFFB", "#63FFCB",
        //    "#63FF9B", "#63FF6B", "#7BFF63", "#BBFF63", "#DBFF63", "#FBFF63", 
        //    "#FFD363", "#FFB363", "#FF8363", "#FF7363", "#FF6364"]);

        //    .range(["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"]);
        .range(["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);
    //Colors derived from ColorBrewer, by Cynthia Brewer, and included in
    //https://github.com/d3/d3-scale-chromatic

    //Create choropleth_svg element
    choropleth_svg
        .attr("width", w)
        .attr("height", h);

    //Load in agriculture data
    // d3.csv("africapopulation.csv", function(data) {

    //Set input domain for color scale
    color.domain([
        d3.min(data, function (d) {
            return d["Trade.Value.(US$)"] / 1000;
        }),
        d3.max(data, function (d) {
            return d["Trade.Value.(US$)"] / 1000;
        })
    ]);

    //Load in GeoJSON data
    d3.json("countries.geo.json", function (json) {

        //Merge the ag. data and GeoJSON
        //Loop through once for each ag. data value
        for (var i = 0; i < data.length; i++) {

            //Grab state name
            var dataState = data[i]["Reporter.ISO"];

            //Grab data value, and convert from string to float
            var dataValue = parseFloat(data[i]["Trade.Value.(US$)"]);
            var flag = false;
            //Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonState = json.features[j].id;

                if (dataState == jsonState) {

                    //Copy the data value into the JSON
                    json.features[j].properties.value = dataValue;
                    flag = true;
                    //Stop looking through the JSON
                    break;

                }
            }
            if (!flag)
                console.log(dataState);
        }

        //Bind data and create one path per GeoJSON feature
        choropleth_svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", function (d) {
                //Get data value
                var value = d.properties.value / 1000;

                if (value) {
                    //If value exists…
                    return color(value);
                } else {
                    //If value is undefined…
                    return "#ccc";
                }
            });

    });

}

function createPieChart(csv, tradeType, year) {
    //Width and height
    var w = 300;
    var h = 300;
    var outerRadius = w / 2;
    var innerRadius = w / 3;
    var data = csv.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        .filter(trade => trade.Year == year)
        .sort(function (a, b) {
            return b["Trade.Value.(US$)"] - a["Trade.Value.(US$)"];
        }).slice(0, 5);

    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var pie = d3.pie()
        .value(function (d) { return d["Trade.Value.(US$)"]; });

    //Easy colors accessible via a 10-step ordinal scale
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    //Create SVG element
    pie_svg.attr("width", w)
        .attr("height", h);

    //Set up groups
    var arcs = pie_svg.selectAll("g.arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    //Draw arc paths
    arcs.append("path")
        .attr("fill", function (d, i) {
            return color(i);
        })
        .attr("d", arc);

    //Labels
    arcs.append("text")
        .attr("transform", function (d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle")
        .text(function (d) {
            return d.data.Reporter;
        }).attr("fill", "#fff");

    arcs.append("title")
        .text(function (d) {
            var tradeValue = d.data["Trade.Value.(US$)"];
            var displayTradeValue;
            if (tradeValue >= 1000000000) {
                displayTradeValue = (tradeValue / 1000000000).toFixed(2) + "B"
            } else {
                displayTradeValue = (tradeValue / 1000000).toFixed(2) + "M"
            }
            return displayTradeValue;
        });
}

function createForceLayout(nodesData, edgeData, tradeType, year) {
    var w = 1000;
    var h = 600;
    var nodes = nodesData.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        .filter(trade => trade.Year == year)
        .sort(function (a, b) {
            return b["Trade.Value.(US$)"] - a["Trade.Value.(US$)"];
        }).slice(0, 20);

    var edgeData = edgeData.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        .filter(trade => trade.Year == year);

    nodeIndex = {}; var ind = 0;
    for (let i = 0; i < nodes.length; i++) {
        if (!nodeIndex[nodes[i]]) {
            nodeIndex[nodes[i]["Reporter.ISO"]] = ind++;
        }
        nodes[i]["id"] = nodeIndex[nodes[i]["Reporter.ISO"]];
    }

    var links = [];
    for (let i = 0; i < edgeData.length; i++) {
        var source = nodeIndex[edgeData[i]["Reporter.ISO"]];
        var target = nodeIndex[edgeData[i]["Partner.ISO"]];
        if (source != undefined && target != undefined) {
            edgeData[i]["source"] = source;
            edgeData[i]["target"] = target;
            links = links.concat(edgeData[i]);
        }
    }

    var radiusScale = d3.scaleLinear()
        .domain([0
            , d3.max(nodes, function (d) {
                return d["Trade.Value.(US$)"] / 1000000;
            })])
        .range([5, 30]);

    var strokeScale = d3.scaleLinear()
        .domain([0
            , d3.max(links, function (d) {
                return d["Trade.Value..US.."] / 1000000;
            })])
        .range([1, 5]);

    //Initialize a simple force layout, using the nodes and edges in dataset
    var force = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(links).distance(300))
        .force("center", d3.forceCenter().x(w / 2).y(h / 2));

    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    //Create SVG element
    force_svg.attr("width", w)
        .attr("height", h);

    //Create edges as lines
    var edges = force_svg.selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .style("stroke", "#ccc")
        .style("stroke-width", function (d) {
            return strokeScale(d["Trade.Value..US.."] / 1000000);
        });

    //Create text for nodes
    var texts = force_svg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(function (d) {
            return d.Reporter;
        })
        .attr("fill", "white")
        ;

    //Create nodes as circles
    var nodes = force_svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", function (d) {
            return radiusScale(d["Trade.Value.(US$)"] / 1000000);
            // return d["Trade.Value.(US$)"]/100000000000;
        })
        .style("fill", function (d, i) {
            return colors(i);
        })
        .call(d3.drag()  //Define what to do on drag events
            .on("start", dragStarted)
            .on("drag", dragging)
            .on("end", dragEnded)

        )
        .on("mouseover", function (d, i) {
            mouseover(d);
        })
        .on("mouseout", function (d, i) {
            mouseout();
        });

        function mouseover(d) {
        force_svg.selectAll("line")
            .filter(function (l) {
                return l.source.id === d.id || l.target.id === d.id;
            })
            .classed("highlight", true);
        force_svg.selectAll("line")
            .filter(function (l) {
                return l.source.id != d.id && l.target.id != d.id;
            })
            .classed("downlight", true);
    }

    function mouseout(d) {
        force_svg.selectAll("line")
            .classed("highlight downlight", false);
    }

    //Add a simple tooltip
    nodes.append("title")
        .text(function (d) {
            return d["Reporter"];
        });

    //Every time the simulation "ticks", this will be called
    force.on("tick", function () {

        edges.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        nodes.attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });

        texts.attr("x", function (d) { return d.x + radiusScale(d["Trade.Value.(US$)"] / 1000000); })
            .attr("y", function (d) { return d.y; });

    });

    //Define drag event functions
    function dragStarted(d) {
        if (!d3.event.active) force.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragging(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragEnded(d) {
        if (!d3.event.active) force.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function createBarChart(csv, tradeType, country) {
    //Width and height
    var w = 300;
    var h = 250;
    var padding = 20;
    var dataset = csv.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        .filter(trade => trade.Reporter == country)
        .sort(function (a, b) {
            return a["Year"] - b["Year"];
        });


    years = dataset.map(a => a["Year"]);
    xScale = d3.scaleBand()
        .domain(years)
        .rangeRound([3 * padding, w - padding])
        .paddingInner(0.05);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, function (d) {
            return d["Trade.Value.(US$)"] / 1000000;
        })])
        .range([h - padding, padding]);

    //Create SVG element
    bar_svg
        .attr("width", w)
        .attr("height", h);

    //Create bars
    bar_svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return xScale(d["Year"]);
        })
        .attr("y", function (d) {
            return yScale(d["Trade.Value.(US$)"] / 1000000);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d) {
            return h - padding - yScale(d["Trade.Value.(US$)"] / 1000000);
        })
        .attr("fill", function (d) {
            return "#00a9e6";
        });

    //Create labels
    bar_svg.selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .text(function (d) {
            var tradeValue = d["Trade.Value.(US$)"];
            var displayTradeValue;
            if (tradeValue >= 1000000000) {
                displayTradeValue = (tradeValue / 1000000000).toFixed(2) + "B"
            } else {
                displayTradeValue = (tradeValue / 1000000).toFixed(2) + "M"
            }
            return displayTradeValue;
        })
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
            return xScale(d["Year"]) + xScale.bandwidth() / 2;
        })
        .attr("y", function (d) {
            return yScale(d["Trade.Value.(US$)"] / 1000000) + padding;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white");


    //Define X axis
    xAxis = d3.axisBottom(xScale)
    // .scale(xScale)
    // .ticks(5);

    //Define Y axis
    yAxis = d3.axisLeft(yScale)
        // .scale(yScale)
        .ticks(5)
        .tickFormat(function (d, i) {
            var displayTradeValue;
            if (d == 0) {
                return 0;
            } else if (d >= 1000) {
                displayTradeValue = (d / 1000).toFixed(2) + "B"
            } else {
                displayTradeValue = d.toFixed(2) + "M"
            }
            return displayTradeValue;
        });

    //Create X axis
    bar_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //Create Y axis
    bar_svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 3 * padding + ",0)")
        .call(yAxis);

    d3.selectAll("rect").on("mouseover", function (e) {
        d3.select(this).attr("fill", "orange");
    })

    d3.selectAll("rect").on("mouseout", function (e) {
        d3.select(this).attr("fill", "#00a9e6");
    })
}

function updateBarChart(csv, tradeType, country) {
    //Width and height
    var w = 300;
    var h = 250;
    var padding = 20;
    var dataset = csv.filter(countryTrade => countryTrade["Trade.Flow"] == tradeType)
        // .filter(trade => trade.Year == year)
        .filter(trade => trade.Reporter == country)
        .sort(function (a, b) {
            return a["Year"] - b["Year"];
        });

    //Update scale domains
    years = dataset.map(a => a["Year"]);
    xScale.domain(years);
    yScale.domain([0, d3.max(dataset, function (d) {
        return d["Trade.Value.(US$)"] / 1000000;
    })]);

    var bars = bar_svg.selectAll("rect")			//Select all bars
        .data(dataset, function (d) {
            return d["Trade.Value.(US$)"];
        });							//Re-bind data to existing bars, return the 'update' selection
    //'bars' is now the update selection

    //Enter…
    bars.enter()								//References the enter selection (a subset of the update selection)
        .append("rect")							//Creates a new rect
        .attr("x", w)							//Sets the initial x position of the rect beyond the far right edge of the SVG
        .attr("y", function (d) {				//Sets the y value, based on the updated yScale
            return yScale(d["Trade.Value.(US$)"] / 1000000);
        })
        .attr("width", xScale.bandwidth())		//Sets the width value, based on the updated xScale
        .attr("height", function (d) {			//Sets the height value, based on the updated yScale
            return h - padding - yScale(d["Trade.Value.(US$)"] / 1000000);
        })
        .attr("fill", function (d) {			//Sets the fill value
            return "#00a9e6";
        })
        .merge(bars)							//Merges the enter selection with the update selection
        .transition()							//Initiate a transition on all elements in the update selection (all rects)
        .duration(500)
        .attr("x", function (d, i) {				//Set new x position, based on the updated xScale
            return xScale(d["Year"]);
        })
        .attr("y", function (d) {				//Set new y position, based on the updated yScale
            return yScale(d["Trade.Value.(US$)"] / 1000000);
        })
        .attr("width", xScale.bandwidth())		//Set new width value, based on the updated xScale
        .attr("height", function (d) {			//Set new height value, based on the updated yScale
            return h - padding - yScale(d["Trade.Value.(US$)"] / 1000000);
        });

    //Exit…
    bars.exit()				//References the exit selection (a subset of the update selection)
        .transition()		//Initiates a transition on the one element we're deleting
        .duration(500)
        .attr("x", w)		//Move past the right edge of the SVG
        .remove();

    // Updating labels
    var texts = bar_svg.selectAll("text")
        .data(dataset, function (d) {
            return d["Trade.Value.(US$)"];
        });

    texts.enter()
        .append("text")
        .text(function (d) {
            var tradeValue = d["Trade.Value.(US$)"];
            var displayTradeValue;
            if (tradeValue >= 1000000000) {
                displayTradeValue = (tradeValue / 1000000000).toFixed(2) + "B"
            } else {
                displayTradeValue = (tradeValue / 1000000).toFixed(2) + "M"
            }
            return displayTradeValue;
        })
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
            return w;
        })
        .attr("y", function (d) {
            return yScale(d["Trade.Value.(US$)"] / 1000000) + padding;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white")
        .merge(texts)
        .transition()
        .duration(500)

        .text(function (d) {
            var tradeValue = d["Trade.Value.(US$)"];
            var displayTradeValue;
            if (tradeValue >= 1000000000) {
                displayTradeValue = (tradeValue / 1000000000).toFixed(2) + "B"
            } else {
                displayTradeValue = (tradeValue / 1000000).toFixed(2) + "M"
            }
            return displayTradeValue;
        })
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
            return xScale(d["Year"]) + xScale.bandwidth() / 2;
        })
        .attr("y", function (d) {
            return yScale(d["Trade.Value.(US$)"] / 1000000) + padding;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white");

    texts.exit()
        .transition()
        .duration(500)
        .attr("x", 0)
        .remove();

    // Updating yAxis with new x Scale
    bar_svg.selectAll("g.y.axis")
        .transition()
        .duration(1000)
        .call(yAxis);

    // Updating xAxis with new x Scale
    bar_svg.selectAll("g.x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);

    d3.selectAll("rect").on("mouseover", function (e) {
        d3.select(this).attr("fill", "orange");
    });

    d3.selectAll("rect").on("mouseout", function (e) {
        d3.select(this).attr("fill", "#00a9e6");
    });
}