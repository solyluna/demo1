// *************************************************************** 
//  ～Web上で操作可能な日本の白地図（都道府県別）を作る～ 
//
//  テスト：都道府県ポリゴンを指定した色でペイント
//
// *************************************************************** 

  var map;
  var json;
  var OkinawaLine;

  function initialize() {

     setDivSize();
 //    setColorPicker();

     var iniCenter = new google.maps.LatLng(37,138);
     var iniZoom = 5;

     var styleAllOFF = [
        {
           featureType: 'all',
           stylers: [
              {visibility: 'off'},
           ],
        }
     ];

     var myOptions = {
        zoom: iniZoom,
        center: iniCenter,
        backgroundColor: '#ffffff',
        styles: styleAllOFF
     };
     map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

     getGeoJson();
     drawRectangle();

  }

  //ウィンドウサイズに合わせて地図サイズを調整
  function setDivSize() {

     var w = 1024; //デフォルト値
     var h = 768;  //デフォルト値
     if (window.innerWidth) {
        w = window.innerWidth;
        h = window.innerHeight;
     } else if (document.all) {
        if (document.documentElement.clientWidth) {
           w = document.documentElement.clientWidth;
           h = document.documentElement.clientHeight;
        } else if (document.body.clientWidth) {
           w = document.body.clientWidth;
           h = document.body.clientHeight;
        }
     } else {
        return false;
     }

     var divTop = document.getElementById("top_bar").style;
     var divMain = document.getElementById("map_canvas").style;
     var divHeightTop = 60;

     divTop.height = divHeightTop + "px";
     divMain.width = (w - 20) + "px";
     divMain.height = (h - divHeightTop - 20) + "px";

  }

  function getGeoJson() {

     var jsonfilename = "json/PrefectureBorder.json";
     jQuery.ajax({
        url : jsonfilename,
        dataType: 'json',
        async : false,
        success: function(request){
           json = request;
           setMapGeoJSON();
        },
        error: function() {
           alert('JSONデータの取得に失敗しました');
        }
     });

  }

  function setMapGeoJSON() {

     for (var i = 0; i < json["features"].length; i++) {
        if (parseInt(json["features"][i]["properties"]["prefcode"])==47) {
           moveLocation(i,5,15);
        }
     }

     map.data.addGeoJson(json);

     map.data.setStyle(function(feature) {
        return ({
           title: feature.getProperty('prefname'),
           strokeColor: "#666666",
           strokeOpacity: 1.0,
           strokeWeight: 1,
           fillColor: "#FFFFFF",
           fillOpacity: 1.0,
           zIndex: 1
        });
     });

     map.data.addListener('mouseover', function(event) {
        map.data.overrideStyle(event.feature, {strokeWeight: 2.0});
     });

     map.data.addListener('mouseout', function(event) {
        map.data.overrideStyle(event.feature, {strokeWeight: 1.0});
     });

     map.data.addListener('click', function(event) {
        var prefFld = document.getElementById("f_pref");
        for(var j = 0; j < prefFld.length; j++) {
           if (parseInt(prefFld.options[j].value) == event.feature.getProperty('prefcode')) {
              prefFld.options[j].selected = true;
           } else {
              prefFld.options[j].selected = false;
           }
        }
        var fColor = document.getElementById("f_colorpicker").value;
        paintPref(event.feature.getProperty('prefcode'),fColor);
     });

     map.data.addListener('rightclick', function(event) {
        var fColor = "#ffffff";
        paintPref(event.feature.getProperty('prefcode'),fColor);
     });

     setPrefOption();

  }

  function setPrefOption() {

     var i;
     var fld = document.getElementById("f_pref");
     var txtOption = "<option value='0' SELECTED >--------</option>";
     var pCode,pName;

     map.data.forEach(function(feature) {
        pCode = feature.getProperty('prefcode');
        pName = feature.getProperty('prefname');
        txtOption += "<option value='"+pCode+"'";
        if (fld.value == pCode) {
           txtOption += " SELECTED";
        }
        txtOption += " >"+pName+"</option>"
     });
     fld.innerHTML = txtOption;

  }

  //沖縄県の場所を移動（スペースの都合。白地図によくあるケース）
  function moveLocation(fNo,my,mx) {

     for (var i = 0; i < json["features"][fNo]["geometry"]["coordinates"].length; i++) {
        for (var j = 0; j < json["features"][fNo]["geometry"]["coordinates"][i].length; j++) {  //実際のデータはj=0固定
           for (var k = 0; k < json["features"][fNo]["geometry"]["coordinates"][i][j].length; k++) {
             json["features"][fNo]["geometry"]["coordinates"][i][j][k][0] += mx; //Lng
             json["features"][fNo]["geometry"]["coordinates"][i][j][k][1] += my; //Lat
           }
        }
     }

     //実際の位置から移動していることを示すライン
     if (!OkinawaLine && parseInt(json["features"][fNo]["properties"]["prefcode"])==47) {
        var OkinawaLineCoords = [
           new google.maps.LatLng(25.7+my, 126.3+mx),
           new google.maps.LatLng(26.7+my, 126.3+mx),
           new google.maps.LatLng(27.7+my, 127.8+mx),
           new google.maps.LatLng(27.7+my, 129.3+mx)
        ];
        OkinawaLine = new google.maps.Polyline({
           path: OkinawaLineCoords,
           strokeColor: "#808080",
           strokeOpacity: 1.0,
           strokeWeight: 1.5,
           zIndex: 1
        });
        OkinawaLine.setMap(map);
     }
  }

  //都道府県の領域（ポリゴン）を指定した色でペイント
  function paintPref(prefcode,fcolor) {
     map.data.forEach(function(feature) {
        if (parseInt(feature.getProperty('prefcode')) == parseInt(prefcode)) {
           map.data.overrideStyle(feature, {fillColor: fcolor});
        }
     });
  }

  //巨大な矩形で地図全体を覆う（背景の設定）
  function drawRectangle() {

     var rectangle = new google.maps.Rectangle();
     var rectBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(-90.0, -180),
              new google.maps.LatLng(90.0, 180));
     var rectOptions = {
        strokeColor: "#FFFFFF",
        strokeOpacity: 1.0,
        strokeWeight: 0.0,
        fillColor: "#FFFFFF",
        fillOpacity: 1.0,
        zIndex: 0,
        map: map,
        bounds: rectBounds
     };
     rectangle.setOptions(rectOptions);

  }

  //カラーピッカー（Spectrum）の設定
  function setColorPicker() {

     var fld = document.getElementById("f_colorpicker");

     $(function(){
        $("#f_colorpicker").spectrum({
          color: fld.value,
          showInput: true,
          showInitial: true,
          showPalette: true,
          showSelectionPalette: true,
          preferredFormat: "hex",
          chooseText: "OK",
          cancelText: "Cancel",
          palette: [
             ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"],
             ["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"],
             ["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d9ead3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"],
             ["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
             ["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"],
             ["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"],
             ["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"],
             ["#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"]
          ]

        });
     })
  }
