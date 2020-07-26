(function (pviz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/country-data.json')
        .defer(d3.json, 'static/data/map-data.json')
        .defer(d3.json, 'static/data/population-data.json')
        .await(ready);

    function ready(error, countryData, mapData, populationData) {
        /* Ha valami hiba történt az adatok beolvasása során, akkor álljon le, és írja ki a hibát */
        if (error) {
            return console.warn(error);
        }

        /* hozzáadjuk az adattárolóhoz a beolvasott adatokat */
        pviz.data.countryData = countryData;
        pviz.data.mapData = mapData;
        pviz.data.populationData = populationData;

        /* elindítjuk a vizualizációt */
        pviz.initMap();

        setTimeout(function () {
            setTimeout(function () {
                pviz.onDataChange();
            }, 500);

            d3.select('body').attr('class', '');
            d3.select('.overlay').attr('class', 'overlay');
        }, 2000);
    }
}(window.pviz = window.pviz || {}));