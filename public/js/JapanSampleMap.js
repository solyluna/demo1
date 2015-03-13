// *************************************************************** 
//  D3を利用して統計地図を作成
// *************************************************************** 

  var json;
  var svg;
  var mapScale = 1800;  //マップサイズ
  var mapWidth = 900;  //マップ幅
  var mapHeight = 700; //マップ高さ
  var consumePref = new Array();
  var CurItem = 0;     //選択中の品目
  var ssMin = 25; ssMax = 75; ssMid = 50; //偏差値の下限・上限・中央値（カラー設定用）
  var MapLegend;       //凡例描画用
  var OkinawaLine;     //沖縄県の描画位置移動を表すライン

  function setSVG() {

     var curPref,curText,prefCenter;
     var jsonFileName = "/json/PrefectureBorder.json";
     var consumeFileName = "/csv/pref_family_consume.csv";
     var itemFileName = "/csv/item_family_consume.csv";

     if (location.search.substr(0,6) == "?item=" && parseInt(location.search.substr(6)) > 0) {
        CurItem = parseInt(location.search.substr(6));
     }

     svg = d3.select("body").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("id", "svg")

     svg.append("rect")
        .attr("id","canvasBox")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height",mapHeight)
        .attr("width",mapWidth)
        .style("stroke","none")
        .style("fill","#ffffff")

     d3.json(jsonFileName, function(error, data) {
        json = data;
        for (var i = 0; i < json["features"].length; i++) {
           if (parseInt(json["features"][i]["properties"]["prefcode"])==47) {
              moveLocation(i,5,15);
           }
        }
        var mapbounds = d3.geo.bounds(json);
        var mapcenter = [(mapbounds[0][0]+mapbounds[1][0])/2, (mapbounds[0][1]+mapbounds[1][1])/2];
        var mapPath = d3.geo.path()
            .projection(d3.geo.mercator()
              .center(mapcenter)
              .translate([mapWidth/2, mapHeight/2+50])
              .scale(mapScale)
            );
        var prefElm = svg.selectAll(".pref")
           .data(json.features)
           .enter()
           .append("path")
           .attr("d", mapPath)
           .style("fill", "#ffffff")
           .attr("class", "pref")
           .style("stroke", "#808080")
           .style("stroke-width", "1")
           .attr('id', function(d) {
              this.addEventListener("contextmenu", function(e){
                 e.preventDefault();
              }, false);
              return "pref"+d.properties["prefcode"];
           })
           .attr('prefname', function(d) {
              return d.properties["prefname"];
           })
           .attr('prefcode', function(d) {
              return d.properties["prefcode"];
           })
           .on('mouseover', function(d) {
              d3.select(this).style("stroke-width", "2");
              if (CurItem > 0) {
                 prefCenter = mapPath.projection()(d3.geo.centroid(d));
                 curPref = parseInt(d3.select(this).attr("prefcode"));
                 curText = d.properties["prefname"]+" "+formatCurrency(consumePref[CurItem][curPref]["Amount"]);
                 SetTooltip(mapPath.projection()(d3.geo.bounds(d)[1]),curText);
              }
           })
           .on('mouseout', function() {
              d3.select(this).style("stroke-width", "1");
              var tooltip = svg.select(".tooltip")
              if(!tooltip.empty()) {
                 tooltip.style("visibility", "hidden")
              }
           })

        drawOkinawaLine(mapPath.projection(),5,15);

        d3.csv(itemFileName, function(error, idata){
           setItemOption(idata);
        });

        d3.csv(consumeFileName, function(error, cdata){
           cdata.forEach(function(d, i){
              var iCode = parseInt(d.ItemCode);
              curPref = parseInt(d.PrefectureCode);
              if (!consumePref[iCode]) {
                 consumePref[iCode] = new Array();
              }
              if (!consumePref[iCode][curPref]) {
                 consumePref[iCode][curPref] = new Array();
              }
              consumePref[iCode][curPref]["Amount"] = d.Amount;
              consumePref[iCode][curPref]["PrefectureCode"] = curPref;
           });
           if (CurItem > 0) {
              paintPrefConsume(CurItem);
           }
        });
     });

  }

  function SetTooltip(tipXY,tipText) {

     var tooltip = svg.select(".tooltip")
     var rectWidth = tipText.length * 8 + 10;

     if(tooltip.empty()) {
        tooltip = svg
           .append("g")
           .attr("class","tooltip")

        tooltip
           .append("rect")
           .attr("height",20)
           .style("stroke","none")
           .style("fill","#ffffff")
           .style("opacity","0.7")

        tooltip
           .append("text")
           .attr("text-anchor","middle")
           .style("font-size","12px")
           .style("font-family","sans-serif")
           .style("fill","#000000")
     }

     tooltip
        .style("visibility", "visible")
        .attr("transform", "translate("+tipXY+")");
     tooltip.select("text")
        .text(tipText)
        .attr("transform", "translate("+(rectWidth/2)+",15)")
     tooltip.select("rect")
        .attr("width",rectWidth)
  }

  function SaveMapImage() {

     d3.select(".tooltip")
       .remove()

     var svgElm = document.getElementById("svg");
     var svgData = new XMLSerializer().serializeToString(svgElm);

     d3.select("body").append("canvas")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("id", "canvas")
        canvg('canvas', svgData)
        var canvas = document.getElementById('canvas')
        canvas.toBlob(function(blob) {
           saveAs(blob, "FamilyExpenditure.jpg");
        }, "image/jpeg")
        d3.select("canvas").remove();
  }

  function setItemOption(myItemData) {
     var i;
     var fld = document.getElementById("f_item");
     var txtOption = "<option value='0' SELECTED >--------</option>";

     for (var i = 0; i < myItemData.length; i++) {
        txtOption += "<option value='"+myItemData[i].ItemCode+"'"
//        if (fld.value == myItemData[i].ItemCode) {
        if (myItemData[i].ItemCode == CurItem) {
           txtOption += " SELECTED";
        }
        txtOption += " year='"+ myItemData[i].StatisticsYear  + "'>"+myItemData[i].ItemName+"</option>"
     }
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

  }

  //実際の位置から移動していることを示すライン（沖縄用）
  function drawOkinawaLine(projection,my,mx) {

     var oLine = [
            [126.3+mx,25.7+my],
            [126.3+mx,26.7+my],
            [127.8+mx,27.7+my],
            [129.3+mx,27.7+my]
         ];

     var line_latlng_to_xy = d3.svg.line()
             .x(function(d){ return projection(d)[0];})
             .y(function(d){ return projection(d)[1];});

     d3.select("svg")
        .append("path")
        .attr("d", line_latlng_to_xy(oLine))
        .attr("class", "oLine")
        .style("stroke", "#808080")
        .style("stroke-width", "1")
        .style("fill", "none");

  }

  function formatCurrency(amount) {
     var formatF = d3.format(",.0f");
     return  "\\"+String(formatF(amount));
  }

  function paintPrefConsume(iCode) {

     var fcolor;
     var pref;
     var itemName,itemYear;
     var colorPl = d3.interpolateRgb("#ffffff", "#ff0000");  //偏差値50以上（消費金額：多）は赤系統
     var colorMn = d3.interpolateRgb("#ffffff", "#0000ff");  //偏差値50以下（消費金額：少）は青系統
     var ss;

     CurItem = iCode;
     d3.select("#f_item").selectAll("option")
        .each(function(d) {
           if (this.value == CurItem) {
              itemName = this.innerHTML;
              itemYear = this.year;
           }
        });

     calStandardScore(CurItem);

     d3.select("svg").selectAll(".pref")
        .each(function(d) {
           pref = parseInt(d3.select(this).attr("prefcode"));
           ss = consumePref[CurItem][pref]["StandardScore"];
           //偏差値が上限値（=75）を超える時や下限値（=25）未満の時には調整
           if (ss > ssMax) { 
              ss = ssMax;
           } else if (ss < ssMin) {
              ss = ssMin;
           }
           if (ss >= ssMid) {
              fcolor = colorPl((ss - ssMid) / (ssMax - ssMid));
           } else {
              fcolor = colorMn((ss - ssMid) / (ssMin - ssMid));
           }
           d3.select(this).style("fill", fcolor);
        });

     setMapTitle();

     if (!MapLegend) {
        paintMapLegend(colorPl,colorMn);
     }

  }

  //都道府県別　消費金額→偏差値
  function calStandardScore(iCode) {

     var n = 0;
     var Sxx = 0;
     var Ex,Sd;

     Ex = consumePref[iCode][0]["Amount"];  //PrefectureCode=0には全国平均値が収納されている

     for (i in consumePref[iCode]) {
        if (parseInt(consumePref[iCode][i]["PrefectureCode"]) > 0) {
           Sxx += Math.pow(Ex - consumePref[iCode][i]["Amount"],2); //分散
           n++;
        }
     }
     Sd = Math.sqrt(Sxx/(n-1)); //標準偏差

     for (var i = 1; i <= 47; i++) {
        consumePref[iCode][i]["StandardScore"] = (consumePref[iCode][i]["Amount"] - Ex) * 10 / Sd + 50;//偏差値
     }
     return 0;
  }

  //凡例を描画
  function paintMapLegend(colorPl,colorMn) { 

    var legendWidth = 50;
    var legendHeight = 10;
    var legendLeft = 100;
    var legendTop = 120;
    var valuerange = d3.range(ssMin,ssMax+0.1,2.5);

    MapLegend = d3.select("svg")
       .selectAll(".legend")
       .data(valuerange)
       .enter()
       .append("rect")
       .attr("class", "legend")
       .attr("x", legendLeft)
       .attr("y", function(d, i) {
          return legendTop + (valuerange.length - 1 - i) * legendHeight;
       })
       .attr("width",legendWidth)
       .attr("height", legendHeight)
       .style("fill", function(d, i){
          if (d >= ssMid) {
             return colorPl((d - ssMid) / (ssMax - ssMid));
          } else {
             return colorMn((d - ssMid) / (ssMin - ssMid));
          }
       })

    var fontsize = 14;
    var dataText = ["消費金額 多","消費金額 少"]
    var LegendText = d3.select("svg")
       .selectAll(".legendtext")
       .data(dataText)
       .enter()
       .append("text")
       .attr("transform", function(d, i) {
          return "translate(" + (legendLeft + legendWidth + 10)+","+ (legendTop + i * (valuerange.length) * legendHeight + ((fontsize*0.75) * (1-i) ) ) + ")";
       })
       .style("font-size",fontsize + "px")
       .style("font-weight","bold")
       .style("font-family","sans-serif")
       .style("fill","#000000")
　　   .text(function(d, i) {
          return d;
       })

    var p1 = [(legendLeft + legendWidth + 50),(legendTop + 45)];
    var p2 = [(legendLeft + legendWidth + 50),(legendTop + legendHeight * valuerange.length - 45)];
    var p = [p1,p2];
    var line = d3.svg.line()
       .x(function(d) {
          return d[0];
        })
       .y(function(d) {
          return d[1];
       });

    var LegendLine = d3.select("svg")
       .append('path')
       .attr("d",line(p))
       .style("stroke-width",5)
       .style("stroke","#606060")

    var LegendArrow = d3.select("svg")
       .selectAll(".arrow")
       .data(p)
       .enter()
       .append("path")
       .attr("d",function(d,i) {
          if (i == 0) {
             return "M "+(d[0]-7)+","+(d[1]+5)+" L "+d[0]+","+d[1]+" L "+(d[0]+7)+","+(d[1]+5)+" L "+d[0]+","+(d[1]-30)+" Z";
          } else {
             return "M "+(d[0]-7)+","+(d[1]-5)+" L "+d[0]+","+d[1]+" L "+(d[0]+7)+","+(d[1]-5)+" L "+d[0]+","+(d[1]+30)+" Z";
          }
       })
       .attr("class","arrow")
       .style("fill","#606060")

  }

  function setMapTitle() {

     var mapTitle;
     var titleText = new Array();
     var titleHeader ="総務省 家計調査 １世帯当たり品目別年間支出";
     var itemName;
     var itemYear;

     d3.select("#f_item").selectAll("option")
        .each(function(d) {
           if (this.value == CurItem) {
              itemName = this.innerHTML;
              itemYear = d3.select(this).attr("year");
           }
        });

     titleText = [titleHeader+" （"+itemYear+"）",itemName]

     mapTitle = d3.select("svg")
       .selectAll(".maptitle")
       .data(titleText)

     mapTitle.enter()
       .append("text")
       .attr("x", mapWidth/2)
       .attr("y", function(d,i) {
          return 30+i*25;
       })
       .attr("class", "maptitle")
       .attr("text-anchor","middle")
       .style("font-size","18px")
       .style("font-weight","bold")
       .style("font-family","sans-serif")
       .style("fill","#000000")
　　   .text(function(d,i) {
          return d;
       })

     mapTitle
　　   .text(function(d,i) {
          return d;
       })
  }

