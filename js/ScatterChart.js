
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
var xValue = function (d) { return d.col26; }, // data -> value
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function (d) { return xScale(xValue(d)); }, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function (d) { return d.col14; }, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function (d) { return yScale(yValue(d)); }, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// setup fill color
var cValue = function (d) { return d.col1; },
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
    debugger
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

var maketip = function (d) {
    var tip = '<p class="tip1">' + d.col0 + '<p class="tip3">' + d.col26 + ', ' + d.col14 + '</p>';
    return tip;
}

// load data
d3.json("data/stg_full_table.json", function (error, data) {
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
        .style("fill", function (d) { return color(cValue(d)); })
        .attr("title", maketip)
        .on("click", function (d) {
            DisplayTableData(d);
        });
    $('.dot').tipsy({ opacity: .9, gravity: 'n', html: true });

    // draw legend
    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

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
        .text(function (d) { return d; })
});

function DisplayTableData(data) {
    var tradeData = data.col25;
    var dataNumber = data.col0;
    

    $("#tblData").empty();
    tradeData = FormatData(tradeData);
    console.log('tradeData', tradeData);

    $("#dataNumber").html(dataNumber + " ("+ tradeData.length + ")");

    if (tradeData && tradeData.length > 0) {
        var tableContent = "";

        var tableHeader = "<tr>";
        var tableHeaders = Object.keys(tradeData[0]);
        for (var i = 0; i < tableHeaders.length; i++) {
            tableHeader += "<th>" + tableHeaders[i] + "</th>";
        }
        tableHeader = tableHeader + "</tr>";

        var tableRows = "";
        for (var i = 0; i < tradeData.length; i++) {
            var tableRow = "<tr>";
            for (var j = 0; j < tableHeaders.length; j++) {
                var keyName = tableHeaders[j];
                tableRow += "<td>" + tradeData[i][keyName] + "</td>";
            }
            tableRow = tableRow + "</tr>";
            tableRows = tableRows + tableRow;
        }

        tableContent = tableHeader + tableRows;
        $("#tblData").append(tableContent);
    }
    else {
        alert("no table data");
    }
}