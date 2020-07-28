(function (pviz) {
    'use strict';

    /* alapvető változók */
    const mapContainer = d3.select('#map');
    const boundingRect = mapContainer.node().getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;
    let svg = null;
    let path = null;
    let spikes = null;
    let KEYS = null;

    const tooltip = mapContainer.select('#map-tooltip');

    /* az ajánlott projection a térképünkhöz */
    const projection = d3
        .geoAzimuthalEqualArea()
        .rotate([-10, -52])
        .scale(1150);

    const spike = function (length, width = 16) {
        return `M${-width / 2},0L0,${-length}L${width / 2},0`;
    }

    const dateTime = d3.range(0, 110).map(function (d) {
        return new Date(1990 + d, 1, 1);
    });

    const stopButton = d3.select('#stop').on('click', function (d) {
        if (pviz.STOPTIMER) {
            /* console.log('Starting'); */
            pviz.STOPTIMER = false;
            pviz.onDataChange();
        } else {
            /* console.log('Stopping'); */
            pviz.STOPTIMER = true;
        }
    });

    const fwdButton = d3.select('#fwd').on('click', function () {
        if (pviz.CURRENTYEAR < 2100) {
            pviz.CURRENTYEAR++;
            enlargeMap();
            updateDisplay();
            pviz.STOPTIMER = true;
        }
    });
    const fwd5Button = d3.select('#fwd5').on('click', function () {
        if (pviz.CURRENTYEAR < 2095) {
            pviz.CURRENTYEAR += 5;
            enlargeMap(true);
            updateDisplay();
            pviz.STOPTIMER = true;
        }
    });
    const endButton = d3.select('#end').on('click', function () {
        pviz.CURRENTYEAR = 2100;
        enlargeMap(true);
        updateDisplay();
        pviz.STOPTIMER = true;
    });

    const backButton = d3.select('#back').on('click', function () {
        if (pviz.CURRENTYEAR > 1990) {
            pviz.CURRENTYEAR--;
            enlargeMap();
            updateDisplay();
            pviz.STOPTIMER = true;
        }
    });
    const back5Button = d3.select('#back5').on('click', function () {
        if (pviz.CURRENTYEAR > 1995) {
            pviz.CURRENTYEAR -= 5;
            enlargeMap(true);
            updateDisplay();
            pviz.STOPTIMER = true;
        }
    });
    const startButton = d3.select('#start').on('click', function () {
        pviz.CURRENTYEAR = 1990;
        enlargeMap(true);
        updateDisplay();
        pviz.STOPTIMER = true;
    });

    const enlargeMap = function (forceUpdate = false) {
        if (!(pviz.CURRENTYEAR % 5) || forceUpdate) {
            d3.select('.spikes').selectAll('svg').select('path').transition().duration(pviz.TRANS_DURATION).attr('d', function (d) {
                if (pviz.data.populationData.hasOwnProperty(d.properties.id)) {
                    return spike(pviz.data.populationData[d.properties.id][pviz.CURRENTYEAR] / 250000, pviz.CURRENTYEAR / 100);
                } else {
                    return null;
                }
            });
        }
    }

    const addThousandCommas = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const updateDisplay = function () {
        if (pviz.CURRENTYEAR == 2101) return;

        d3.select('#currentYear').text(pviz.CURRENTYEAR);

        let popArray = [];
        for (const k of KEYS) {
            popArray.push(pviz.data.populationData[k][pviz.CURRENTYEAR]);
        }

        pviz.TOTAL_POP = d3.sum(popArray);
        d3.select('#totalPop').text(addThousandCommas(pviz.TOTAL_POP));
    }

    /* létrehozza a térképet */
    pviz.initMap = function () {
        KEYS = Object.keys(pviz.data.populationData);

        /* létrehozzuk az svg kontextust */
        svg = mapContainer.append('svg').attr('width', width).attr('height', height);

        /* létrehozzuk a path generátort */
        path = d3.geoPath().projection(projection);

        /* hozzáadjuk az országokat */
        const countries = svg.append('g').attr('class', 'countries').attr('transform', 'translate(0, 175)').selectAll('path')
            .data(topojson.feature(pviz.data.mapData, pviz.data.mapData.objects.nutsrg).features).enter().append('path').attr('d', path).style('fill', '#fff')
            .attr('id', function (d) {
                return d.properties.id;
            });

        /* hozzáadjuk a határokat */
        const borders = svg.append('g').attr('class', 'boundaries').attr('transform', 'translate(0, 175)').selectAll('path').data(topojson.feature(pviz.data.mapData,
            pviz.data.mapData.objects.nutsbn).features).enter().append('path').attr('d', path).style('stroke', '#777').style('fill', '#fff');

        spikes = svg.append('g').attr('class', 'spikes').attr('transform', 'translate(0, 175)').selectAll('svg').data(pviz.data.countryData.features).enter().append('svg').style('overflow', 'visible').attr('x', function (d) {
                return projection(d.geometry.coordinates)[0];
            })
            .attr('y', function (d) {
                return projection(d.geometry.coordinates)[1];
            }).append('path')
            .attr('d', function (d) {
                if (pviz.data.populationData.hasOwnProperty(d.properties.id)) {
                    return spike(1);
                } else {
                    return null;
                }
            })
            .on('mouseenter', function (d) {
                pviz.STOPTIMER = true;

                if (pviz.CURRENTYEAR == 2020) {
                    tooltip.select('div #comparison').style('display', 'none');
                } else {
                    tooltip.select('div #comparison').style('display', 'block');
                }

                d3.select(this).attr('class', 'active');

                d3.select('#map-tooltip--country').text(d.properties.na);

                const pop = pviz.data.populationData[d.properties.id][pviz.CURRENTYEAR];
                const perc = pviz.data.populationData[d.properties.id][pviz.CURRENTYEAR] / pviz.data.populationData[d.properties.id][2019] - 1;
                const rate = perc > 0 ? 'higher' : 'lower';

                d3.select('#map-tooltip--year').text(pviz.CURRENTYEAR);
                d3.select('#map-tooltip--pop').text(addThousandCommas(pop));
                d3.select('#map-tooltip--perc').text(Math.abs((perc * 100).toPrecision(4)));
                d3.select('#map-tooltip--rate').attr('class', rate).text(rate);

                const mouseCoords = d3.mouse(d3.select('#chart').node());
                const w = parseInt(tooltip.style('width'));
                const h = parseInt(tooltip.style('height'));

                tooltip.style('top', (mouseCoords[1] - h * 1.5) + 'px');
                tooltip.style('left', (mouseCoords[0] - w / 2) + 'px');
            })
            .on('mouseout', function (d) {
                d3.select(this).attr('class', '');
                tooltip.style('left', '-9999px');
            })
            .transition().duration(pviz.TRANS_DURATION)
            .attr('d', function (d) {
                if (pviz.data.populationData.hasOwnProperty(d.properties.id)) {
                    return spike(pviz.data.populationData[d.properties.id][pviz.CURRENTYEAR] / 250000, pviz.CURRENTYEAR / 100);
                } else {
                    return null;
                }
            })
            .attr('fill', 'red').attr('fill-opacity', 0.3).attr('stroke', 'red').attr('id', function (d) {
                return d.properties.id;
            });

        const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(850, 475)');

        const small = legend.append('g').attr('class', 'cell');
        small.append('path').attr('d', function () {
            return spike(1000000 / 250000, 2019 / 100);
        }).attr('fill', 'red').attr('fill-opacity', 0.3).attr('stroke', 'red');
        small.append('text').text('1 million').attr('transform', 'translate(-20, 15)');

        const medium = legend.append('g').attr('class', 'cell').attr('transform', 'translate(50, 0)');
        medium.append('path').attr('d', function () {
            return spike(5000000 / 250000, 2019 / 100);
        }).attr('fill', 'red').attr('fill-opacity', 0.3).attr('stroke', 'red');
        medium.append('text').text('5 million').attr('transform', 'translate(-20, 15)');

        const high = legend.append('g').attr('class', 'cell').attr('transform', 'translate(100, 0)');;
        high.append('path').attr('d', function () {
            return spike(10000000 / 250000, 2019 / 100);
        }).attr('fill', 'red').attr('fill-opacity', 0.3).attr('stroke', 'red');
        high.append('text').text('10 million').attr('transform', 'translate(-20, 15)');

        const highest = legend.append('g').attr('class', 'cell').attr('transform', 'translate(150, 0)');;
        highest.append('path').attr('d', function () {
            return spike(30000000 / 250000, 2019 / 100);
        }).attr('fill', 'red').attr('fill-opacity', 0.3).attr('stroke', 'red');
        highest.append('text').text('30 million').attr('transform', 'translate(-20, 15)');
    };

    /* frissíti a térképet az új évnek megfelelően */
    pviz.updateMap = function () {
        let i = 1;
        const timer = d3.timer(function (duration) {
            if (duration > (pviz.TRANS_DURATION * i - 20) && duration < (pviz.TRANS_DURATION * i + 20)) {
                i++;

                pviz.CURRENTYEAR += 1;
                enlargeMap();
                updateDisplay();

                if (pviz.CURRENTYEAR > 2100) {
                    timer.stop();
                } else if (pviz.STOPTIMER) {
                    timer.stop();
                }

                /* console.log(pviz.CURRENTYEAR); */
            }
        }, pviz.TRANS_DURATION);
    };

}(window.pviz = window.pviz || {}));