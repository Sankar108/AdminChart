var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

/* 
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */

// setup x 
var xValue = function(d) { return d.col26; }, // data -> value
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d)); }, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) { return d.col14; }, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d)); }, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// setup fill color
var cValue = function(d) { return d.col1; },
    color = d3.scale.category10();

// add the graph canvas to the body of the webpage
var svg = d3.select("#graphic").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("#graphic").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function FormatData(data) {
    var formattedDataList = [];
    var keys = Object.keys(data);
    var keyLen = Object.keys(data).length;
    var dataLen = Object.keys(data[keys[0]]).length;

    for (var a = 0; a < dataLen; a++) {
        var formattedData = {};
        for (var b = 0; b < keyLen; b++) {
            var keyName = keys[b];
            formattedData[keyName] = data[keyName][a];
        }
        formattedDataList.push(formattedData);
    }
    console.log('formattedDataList', formattedDataList);
    return formattedDataList;
}

var maketip = function(d) {
    var tip = '<p class="tip1">' + d.col0 + '<p class="tip3">' + d.col26 + ', ' + d.col14 + '</p>';
    return tip;
}

// load data
d3.json("data/stg_full_table.json", function(error, data) {
    console.log('data', data);
    data = FormatData(data);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
    yScale.domain([d3.min(data, yValue), d3.max(data, yValue)]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Col 26");

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Col 14");

    // draw dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(cValue(d)); })
        .attr("title", maketip)
        .on("click", function(d) {
            DisplayTableData(d);
        });
    $('.dot').tipsy({ opacity: .9, gravity: 'n', html: true });

    // draw legend
    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; })
});

function DisplayTableData(data) {
    var tradeData = data.col25;
    var dataNumber = data.col0;

    $("#tblData").empty();
    tradeData = FormatData(tradeData);
    console.log('tradeData', tradeData);

    $("#dataNumber").html(dataNumber + " (" + tradeData.length + ")");

    if (tradeData && tradeData.length > 0) {
        var tableContent = "";

        var tableHeader = "<tr>";
        var tableHeaders = Object.keys(tradeData[0]);
        for (var i = 0; i < tableHeaders.length; i++) {
            if (tableHeaders[i] === "price")
                tableHeader += "<th>name</th><th>" + tableHeaders[i] + "</th>";
        }
        tableHeader = tableHeader + "</tr>";

        var tableRows = "";
        for (var i = 0; i < tradeData.length; i++) {
            var tableRow = "<tr>";
            for (var j = 0; j < tableHeaders.length; j++) {
                var keyName = tableHeaders[j];
                if (keyName === "price")
                    tableRow += "<td>" + data.col0 + "</td><td>" + tradeData[i][keyName] + "</td>";
            }
            tableRow = tableRow + "</tr>";
            tableRows = tableRows + tableRow;
        }

        tableContent = tableHeader + tableRows;
        $("#tblData").append(tableContent);
        DrawLineChart(tradeData, data.col0);
    } else {
        alert("no table data");
    }
}

function DrawLineChart(tradeData, dataID) {
    $("#lineChart").empty();

    var margin = { top: 20, right: 30, bottom: 50, left: 60 },
        width = 900 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%m/%d/%y").parse;
    var formatDate = d3.time.format("%b %d, '%y");

    var bluescale4 = ["#8BA9D0", "#6A90C1", "#066CA9", "#004B8C"];
    var color = d3.scale.ordinal().range(bluescale4);
    var xscaleticks = 10;
    var maketip = function(d) {
            var tip = '<p class="tip3">' + d.name + '<p class="tip1">' + d.value + '</p> <p class="tip3">' + formatDate(d.date) + '</p>';
            tip = tip + '<p class="tip3">' + d.amount + ', ' + d.type + '</p>';
            return tip;
        }
        //create an SVG
    var svg = d3.select("#lineChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "plot");

    var clip = svg.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    redraw();

    function redraw() {
        var data = tradeData;
        color.domain(d3.keys(data[0]).filter(function(key) {
            // return (key !== "date" && key !== "close");
            return [dataID];
        }));

        var linedata = color.domain().map(function(name) {
            return {
                name: dataID,
                values: data.map(function(d) {
                    return {
                        name: dataID,
                        date: new Date(d.timestamp),
                        value: parseFloat(d.price, 10),
                        amount: d.amount,
                        type: d.type,
                    };
                })
            };
        });

        // console.log('linedata', linedata);
        var lastvalues = [];

        //setup the x and y scales
        // minDT = new Date(minDT.setDate(minDT.getDate() - 5));
        var minX = d3.min(linedata, function(c) { return d3.min(c.values, function(v) { return v.date; }); });
        var maxX = d3.max(linedata, function(c) { return d3.max(c.values, function(v) { return v.date; }); });
        var minY = d3.min(linedata, function(c) { return d3.min(c.values, function(v) { return v.value; }); });
        var maxY = d3.max(linedata, function(c) { return d3.max(c.values, function(v) { return v.value; }); });

        console.log(minX, maxX, minY, maxY)
        var extentValue = (maxY - minY) / 20;
        minY = minY - extentValue;
        maxY = maxY + extentValue;

        var x = d3.time.scale().domain([minX, maxX]).range([10, (width - 10)]);
        var y = d3.scale.linear().domain([minY, maxY]).range([height, 0]);

        var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.value); });

        var zoom = d3.behavior.zoom()
            .x(x)
            // .y(y)
            .scaleExtent([1, 15])
            .on("zoom", zoomed);

        svg.call(zoom);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickPadding(8)
            .ticks(xscaleticks);

        svg.append("svg:g")
            .attr("class", "x axis");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(0 - width)
            .tickPadding(8);

        svg.append("svg:g")
            .attr("class", "y axis");

        var thegraph = svg.selectAll(".thegraph")
            .data(linedata)

        var thegraphEnter = thegraph.enter().append("g")
            .attr("clip-path", "url(#clip)")
            .attr("class", "thegraph")
            .attr('id', function(d) { return d.name + "-line"; })
            .style("stroke-width", 1.5)
            .on("mouseover", function(d) {
                d3.select(this)
                    .style("stroke-width", '2px');

                var selectthegraphs = $('.thegraph').not(this);
                d3.selectAll(selectthegraphs)
                    .style("opacity", 0.2);

                var getname = document.getElementById(d.name);
                var selectlegend = $('.legend').not(getname);

                d3.selectAll(selectlegend)
                    .style("opacity", .2);

                d3.select(getname)
                    .attr("class", "legend-select");
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .style("stroke-width", '2px');

                var selectthegraphs = $('.thegraph').not(this);
                d3.selectAll(selectthegraphs)
                    .style("opacity", 1);

                var getname = document.getElementById(d.name);
                var getname2 = $('.legend[fakeclass="fakelegend"]')
                var selectlegend = $('.legend').not(getname2).not(getname);

                d3.selectAll(selectlegend)
                    .style("opacity", 1);

                d3.select(getname)
                    .attr("class", "legend");
            });

        //actually append the line to the graph
        thegraphEnter.append("path")
            .attr("class", "line")
            .style("stroke", function(d) { return color(d.name); })
            .attr("d", function(d) { return line(d.values[0]); })
            .transition()
            .duration(2000)
            .attrTween('d', function(d) {
                var interpolate = d3.scale.quantile()
                    .domain([0, 1])
                    .range(d3.range(1, d.values.length + 1));
                return function(t) {
                    return line(d.values.slice(0, interpolate(t)));
                };
            });

        thegraph.selectAll("circle")
            .data(function(d) { return (d.values); })
            .enter()
            .append("circle")
            .attr("class", "tipcircle")
            .attr("cx", function(d, i) { return x(d.date) })
            .attr("cy", function(d, i) { return y(d.value) })
            .attr("r", 3)
            .style('opacity', 1) //1e-6
            .style('fill', function(d) {
                return d.type === "OPEN" ? "#208620" : "#f00";
            })
            .attr("title", maketip)
            .on("mouseover", function(d) {
                d3.select(this).attr("r", 5);
            })
            .on("mouseout", function(d) {
                d3.select(this).attr("r", 3);
            });

        d3.transition(svg).select(".y.axis")
            .call(yAxis);

        d3.transition(svg).select(".x.axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        $('circle').tipsy({ opacity: .9, gravity: 'n', html: true });

        function zoomed() {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            svg.selectAll(".tipcircle")
                .attr("cx", function(d, i) { return x(d.date) })
                .attr("cy", function(d, i) {
                    return y(d.value)
                });

            svg.selectAll(".symbol2")
                .attr("x", function(d, i) { return x(d.date) })
                .attr("y", function(d, i) {
                    return y(d.price)
                });

            svg.selectAll(".line")
                .attr("class", "line")
                .attr("d", function(d) { return line(d.values) });
        }
        // console.log('data', data)
    }
}