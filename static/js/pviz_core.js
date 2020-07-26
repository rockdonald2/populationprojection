(function (pviz) {
    'use strict';

    /* adattároló cache */
    pviz.data = {}
    pviz.CURRENTYEAR = 1990;
    pviz.TOTALPOP = 0;
    pviz.TRANS_DURATION = 1000;
    pviz.STOPTIMER = false;

    /* ha bármilyen adat megváltozik, akkor frissítse a térképet */
    /* ezt úgy lehet majd elképzelni, hogy változik az év, fríssül a metódus által a térkép */
    pviz.onDataChange = function () {
        pviz.updateMap();
    }
}(window.pviz = window.pviz || {}));