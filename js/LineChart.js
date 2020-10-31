
function showLoader() {
    $("#cover").css('display', 'block');
}
function hideLoader() {
    $("#cover").css('display', 'none');
}

var margin = { top: 50, right: 160, bottom: 80, left: 50 },
    width = 1300 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

d3.select('#dek').style('width', width + 'px');
d3.select('#headline').style('width', width + 'px');
var sourcetext = "Source: prices.json , trades.json";


var bluescale4 = ["#8BA9D0", "#6A90C1", "#066CA9", "#004B8C"];
var color = d3.scale.ordinal().range(bluescale4);
var xscaleticks = 10;
var maketip = function (d) {
    var tip = '<p class="tip3">' + d.name + '<p class="tip1">' + d.value + '</p> <p class="tip3">' + formatDate(d.date) + '</p>';
    return tip;
}
var maketip2 = function (d) {
    var tip2 = "";
    if (d.direction) {
        tip2 = "<p class='tip3'>" + d.symbol + ', ' + d.close + "</p>";
        tip2 = tip2+"<p class='tip3'>" + d.direction + ', ' + d.side + "</p>";
        var dt = new Date(d.date);
        var dateText = dt.getDate() + "/" + dt.getMonth() + "/" + dt.getFullYear() + " " + dt.getHours() + ":" + dt.getMinutes();;
        tip2 = tip2 + "<p class='tip3'>" + dateText+"</p>";
    }
    return tip2;
}

var parseDate = d3.time.format("%m/%d/%y").parse;
var formatDate = d3.time.format("%b %d, '%y");
var prices = [];
var trades = [];
//create an SVG
var svg = d3.select("#graphic").append("svg")
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

showLoader();
var menu = d3.select("#menu select")
    .on("change", change);

function formatPrice(dt) {

    var data = [];
    var ind = 0;
    dt.data.forEach(element => {
        ind++;
        var d = {
            id: ind,
            date: element[0],
            close: element[1],
            symbol: element[2],
        }
        data.push(d);
    });
    return data;
}
function formatTrade(dt) {

    var data = [];
    dt.data.forEach(element => {

        var d = {
            date: element[0],
            symbol: element[1],
            direction: element[2],
            side: element[3]
        }
        data.push(d);
    });
    return data;
}

function MergeTradewithPrice() {

    trades.forEach(trade => {
        var tradeDate = new Date(trade.date);
        var len = prices.length;
        var closeminute = 10;
        var filterPrices = prices.filter(p => ((Math.abs(new Date(p.date) - tradeDate) / 60000) < closeminute) && (trade.symbol === p.symbol))
        if (filterPrices.length === 0) {
            closeminute = 20;
            filterPrices = prices.filter(p => ((Math.abs(new Date(p.date) - tradeDate) / 60000) < closeminute) && (trade.symbol === p.symbol))
        }
        else if (filterPrices.length === 0) {
            closeminute = 30;
            filterPrices = prices.filter(p => ((Math.abs(new Date(p.date) - tradeDate) / 60000) < closeminute) && (trade.symbol === p.symbol))
        }
        console.log('closeminute', closeminute);
        console.log('filterPrices', filterPrices);
        if (filterPrices.length > 0) {
            filterPrice = filterPrices[0];
            prices[filterPrice.id].direction = trade.direction;
            prices[filterPrice.id].side = trade.side;
            prices[filterPrice.id].tradeSymbol = trade.symbol;
            // console.log('index', filterPrice.id)
        }
    });
    hideLoader();
}

d3.json("data/trades.json", function (data) {
    data = formatTrade(data);
    trades = data;
});

d3.json("data/prices.json", function (data) {
    data = formatPrice(data);
    prices = data;
    MergeTradewithPrice();
    setTimeout(() => {
        redraw();
    }, 1000);
});

d3.select(window)
    .on("keydown", function () { altKey = d3.event.altKey; })
    .on("keyup", function () { altKey = false; });
var altKey;

function change() {
    d3.transition()
        .duration(altKey ? 7500 : 1500)
        .each(redraw);
}

function redraw() {
    var nested = d3.nest()
        .key(function (d) { return d.symbol; })
        .map(prices)
    // console.log('nested', nested)
    var keys = Object.keys(nested);

    if ($("#symbolList").html() === "") {
        for (var i = 0; i < keys.length; i++) {
            var optionHTML = "<option value='" + keys[i] + "'>" + keys[i] + "</option>";
            $("#symbolList").append(optionHTML);
        }
    }

    var series = menu.property("value");
    var data = nested[series];

    color.domain(d3.keys(data[0]).filter(function (key) {
        // return (key !== "date" && key !== "close");
        return (key === "symbol");

    }));

    var linedata = color.domain().map(function (name) {
        return {
            name: $("#symbolList").val(),
            values: data.map(function (d) {
                return {
                    name: $("#symbolList").val(),
                    date: new Date(d.date),
                    value: parseFloat(d['close'], 10),
                    direction: d.direction ? d.direction : "",
                    side: d.side ? d.side : "",
                };
            })
        };
    });

    // console.log('linedata', linedata);
    var lastvalues = [];
    //setup the x and y scales
    var x = d3.time.scale()
        .domain([
            d3.min(linedata, function (c) { return d3.min(c.values, function (v) { return v.date; }); }),
            d3.max(linedata, function (c) { return d3.max(c.values, function (v) { return v.date; }); })
        ])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([
            d3.min(linedata, function (c) { return d3.min(c.values, function (v) { return v.value; }); }),
            d3.max(linedata, function (c) { return d3.max(c.values, function (v) { return v.value; }); })
        ])
        .range([height, 0]);

    var line = d3.svg.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.value); });

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
        .attr('id', function (d) { return d.name + "-line"; })
        .style("stroke-width", 1.5)
        .on("mouseover", function (d) {
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
        .on("mouseout", function (d) {
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
        .style("stroke", function (d) { return color(d.name); })
        .attr("d", function (d) { return line(d.values[0]); })
        .transition()
        .duration(2000)
        .attrTween('d', function (d) {
            var interpolate = d3.scale.quantile()
                .domain([0, 1])
                .range(d3.range(1, d.values.length + 1));
            return function (t) {
                return line(d.values.slice(0, interpolate(t)));
            };
        });

    thegraph.selectAll("circle")
        .data(function (d) { return (d.values); })
        .enter()
        .append("circle")
        .attr("class", "tipcircle")
        .attr("cx", function (d, i) { return x(d.date) })
        .attr("cy", function (d, i) { return y(d.value) })
        .attr("r", 12)
        .style('opacity', 1e-6)//1e-6
        .attr("title", maketip)

    //append the legend
    var legend = svg.selectAll('.legend')
        .data(linedata);

    var legendEnter = legend
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('id', function (d) { return d.name; })
        .on('click', function (d) {
            if ($(this).css("opacity") == 1) {

                var elemented = document.getElementById(this.id + "-line");
                d3.select(elemented)
                    .transition()
                    .duration(1000)
                    .style("opacity", 0)
                    .style("display", 'none');

                d3.select(this)
                    .attr('fakeclass', 'fakelegend')
                    .transition()
                    .duration(1000)
                    .style("opacity", .2);
            } else {

                var elemented = document.getElementById(this.id + "-line");
                d3.select(elemented)
                    .style("display", "block")
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);

                d3.select(this)
                    .attr('fakeclass', 'legend')
                    .transition()
                    .duration(1000)
                    .style("opacity", 1);
            }
        });

    var legendscale = d3.scale.ordinal()
        .domain(lastvalues)
        .range([0, 30, 60, 90, 120, 150, 180, 210]);

    legendEnter.append('circle')
        .attr('cx', width + 20)
        .attr('cy', function (d) { return legendscale(d.values[d.values.length - 1].value); })
        .attr('r', 7)
        .style('fill', function (d) {
            return color(d.name);
        });

    legendEnter.append('text')
        .attr('x', width + 35)
        .attr('y', function (d) { return legendscale(d.values[d.values.length - 1].value); })
        .text(function (d) { return d.name; });

    var thegraphUpdate = d3.transition(thegraph);

    thegraphUpdate.select("path")
        .attr("d", function (d, i) {
            lastvalues[i] = d.values[d.values.length - 1].value;
            lastvalues.sort(function (a, b) { return b - a });
            legendscale.domain(lastvalues);

            return line(d.values);
        });

    thegraphUpdate.selectAll("circle")
        .attr("title", maketip)
        .attr("cy", function (d, i) { return y(d.value) })
        .attr("cx", function (d, i) { return x(d.date) });

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
            .attr("cx", function (d, i) { return x(d.date) })
            .attr("cy", function (d, i) {
                return y(d.value)
            });

        svg.selectAll(".symbol2")
            .attr("x", function (d, i) { return x(d.date) })
            .attr("y", function (d, i) {
                return y(d.close)
            });

        svg.selectAll(".line")
            .attr("class", "line")
            .attr("d", function (d) { return line(d.values) });
    }
    // console.log('data', data)

    $(".symbol2").remove();
    var tradeData = data;
    var t = thegraph.append("g")
        .selectAll(".symbol2")
        .data(tradeData)
        .enter()
        .append("image")
        .attr("xlink:href", function (d, i) {
            var symbolType = "";
            if (d.side === "BUY") {
                symbolType = "images/UpArrow.png"
            }
            else if (d.side === "SELL") {
                symbolType = "images/DownArrow.png"
            }
            return symbolType;
        })
        .attr("class", "symbol2")
        .attr("x", function (d, i) {
            return x(d.date) - 15;
        })
        .attr("y", function (d, i) {
            var ys = d.side === "BUY" ? -15 : 15;
            return y(d.close) + ys;
        })
        .attr("title", maketip2)

    $('.symbol2').tipsy({ opacity: .9, gravity: 'n', html: true });


    // g.append('svg:circle')
    //     .attr('cx', function () { return x(j.timestamp._d); })
    //     .attr('cy', function () { return y(j.value); })
    //     .attr('r', 4)
    //     .attr('stroke', ML.colors.array[i])
    //     .attr('stroke-width', 2)
    //     .attr('fill', '#ffffff')
    //     .attr('class', 'circle-markers')
    //     .attr('data-index', k)
    //     .on('mouseover', function () {
    //         $(this).attr('fill', ML.colors.array[i]);
    //     }).on('mouseout', function () {
    //         $(this).attr('fill', '#ffffff');
    //     });
    // var legendUpdate = d3.transition(legend);
    // legendUpdate.select("circle")
    // 	.attr('cy', function (d, i) {
    // 		return legendscale(d.values[d.values.length - 1].value);
    // 	});
    // legendUpdate.select("text")
    // 	.attr('y', function (d) { return legendscale(d.values[d.values.length - 1].value); });

    // var t = thegraph.append("g")
    // 	.selectAll(".symbol")
    // 	.data(data)
    // 	.enter()
    // 	.append("text")
    // 	.attr("class", "symbol")
    // 	.html(function (d, i) {
    // 		var symbolType = "";
    // 		if (d.side === "BUY") {
    // 			symbolType = "&#xf072"
    // 		}
    // 		else if (d.side === "SELL") {
    // 			symbolType = "&#xf084"
    // 		}
    // 		return symbolType;
    // 	})
    // 	.attr("x", function (d, i) {
    // 		return x(d.date);
    // 	})
    // 	.attr("y", function (d, i) {
    // 		var ys = d.side === "BUY" ? -25 : 25;
    // 		return y(d.close) + ys;
    // 	})
}

svg.append("svg:text")
    .attr("text-anchor", "start")
    .attr("x", 0 - margin.left)
    .attr("y", height + margin.bottom - 10)
    .text(sourcetext)
    .attr("class", "source");
