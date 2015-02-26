require "rubygems"
require "sinatra"
require "sinatra/json"
require "json"
require 'net/http'
require 'uri'

# リロードに必要な設定
set :environment, :development
require "sinatra/base"
require "sinatra/reloader" if development?

get '/' do
   "デモ用サイト"
end

get '/menu/' do
  erb :menu
end

get '/map' do
  erb :blank_t
end

get '/dispdata/' do
  erb :dispdata
end

get '/dispdata2/' do
  erb :dispdata2
end

get '/dispgraph1/' do
  erb :dispgraph1
end

get '/dispgraph2/' do
  erb :dispgraph2
end

get '/dispgraph3/' do
  erb :dispgraph3
end

get '/jqgridtest/' do
  erb :jqgridtest
end

#e-STAT統計データ取得 Test
get '/estat01/' do

  statsCode = "0000030003"

  opt="&cdCat04From=000&cdCat04To=001"

#  key = "94945f73da9387a2275e03f44cf7fd322aedf455"
  key = ENV["ESTAT_KEY"]
  url = "http://api.e-stat.go.jp/rest/1.0/app/json"
  uri = URI.parse("#{url}/getStatsData?appId=#{key}&statsDataId=#{statsCode}#{opt}")

  https = Net::HTTP.new(uri.host, uri.port)
  https.use_ssl = false

  res = https.start {
    https.get(uri.request_uri)
  }

  result=""
  if res.code == '200'
    result = JSON.parse(res.body)
    res2 = result["GET_STATS_DATA"]["STATISTICAL_DATA"]["DATA_INF"]["VALUE"]

    content_type :json
    res2.to_json

#    jsonout = res2.to_json
#    json jsonout

#    res2.each { |v| 
#      v1 = v["@cat01"].to_s
#      v2 = v["@cat02"].to_s
#      v3 = v["@cat03"].to_s
#      v4 = v["@cat04"].to_s
#      v5 = v["@cat05"].to_s
#      v6 = v["@area"].to_s
#      v7 = v["@time"].to_s
#      v8 = v["@unit"].to_s
#      v9 = v["$"].to_s
  else
      puts "API Error!! #{res.code}"
  end

end


#e-STAT統計データ取得 Test2
get '/estat02/:op' do |option|

  statsCode = "0000030001"

  opt=""

  key = "94945f73da9387a2275e03f44cf7fd322aedf455"
  url = "http://api.e-stat.go.jp/rest/1.0/app/json"
  uri = URI.parse("#{url}/getStatsData?appId=#{key}&statsDataId=#{statsCode}#{opt}")

  https = Net::HTTP.new(uri.host, uri.port)
  https.use_ssl = false

  res = https.start {
    https.get(uri.request_uri)
  }

  result=""
  if res.code == '200'
    result = JSON.parse(res.body)
    res2 = result["GET_STATS_DATA"]["STATISTICAL_DATA"]["DATA_INF"]["VALUE"]
    res3 = result["GET_STATS_DATA"]["STATISTICAL_DATA"]["CLASS_INF"]["CLASS_OBJ"]

    cat03_class = {}

    res3.each { |r|
     case r["@id"]
      when "cat03" then
        cat03_class = r["CLASS"]
      end  
    }

    cat03_title = {}
    cat03_class.each { |d|
      cat03_title[d["@code"]] = d["@name"]
    }

		if option == "data" then 

	    cat03_data = []
	    res2.each { |r|  #全域,男女総数,年齢5歳階級,全国
	      if r["@cat01"] == "00700" && r["@cat02"] == "000" && r["@cat03"] > "000" && r["@area"] == "00000"  then
	         r["@cat03"] = cat03_title[r["@cat03"]] #名前取得
	         cat03_data.push(r)     #出力配列に追加
  	    end
    	}
    	content_type :json
    	cat03_data.to_json
		else 
    	popData = []
    	labelTitle = []
    
    	i=0
    	res2.each { |r|
      	  if r["@cat01"] == "00700" && r["@cat02"] == "000" && r["@cat03"] > "000" && r["@area"] == "00000"  then
        	  labelTitle.push([i.to_s, cat03_title[r["@cat03"]]])
          	popData.push([i.to_s, r["$"]])
          	i = i + 1
        	end
    	}
    	outdata = {}
    	outdata["popData"] = popData
    	outdata["labelTitle"] = labelTitle
    	outdata.to_json
		end

	#    testdata = {}
	#    testdata["popData"]=[["0","4000000"],["1","3500000"],["2","6000000"]];
	#    testdata["labelTitle"]=[["0","０－４歳"],["1","１０－１４歳"],["2","２０－２４歳"]];
	#    testdata.to_json
  else
      puts "API Error!! #{res.code}"
  end

end

#e-STAT統計データ取得 Test3 県別人口
get '/estat03/' do

  statsCode = "0000030001"

  opt="&cdcat01=00700"
  
  key = "94945f73da9387a2275e03f44cf7fd322aedf455"
  url = "http://api.e-stat.go.jp/rest/1.0/app/json"
  uri = URI.parse("#{url}/getStatsData?appId=#{key}&statsDataId=#{statsCode}#{opt}")

  https = Net::HTTP.new(uri.host, uri.port)
  https.use_ssl = false

  res = https.start {
    https.get(uri.request_uri)
  }

  result=""
  if res.code == '200'
    result = JSON.parse(res.body)
    res2 = result["GET_STATS_DATA"]["STATISTICAL_DATA"]["DATA_INF"]["VALUE"]
    res3 = result["GET_STATS_DATA"]["STATISTICAL_DATA"]["CLASS_INF"]["CLASS_OBJ"]

    area_class = {}

    res3.each { |r|
     case r["@id"]
      when "area" then
        area_class = r["CLASS"]
      end  
    }

    area_title = {}
    area_class.each { |d|
      area_title[d["@code"]] = d["@name"]
    }

    content_type :json
#    cat03_data.to_json

    dispData = []
    popData = []
    labelTitle = []
    
    i=0
    res2.each { |r|
        if r["@cat01"] == "00700" && r["@cat02"] == "000" && r["@cat03"] == "000" && r["@area"] > "00100"  then
#          labelTitle.push([i.to_s, area_title[r["@area"]]])
          dispData.push([i.to_s, r["$"],area_title[r["@area"]]])
          i = i + 1
        end
    }
    
    #人口の降順にSORT
    sorted_dispData = dispData.sort {|a,b|
      -(a[1].to_i <=> b[1].to_i)
    }  
    
    i=0
    sorted_dispData.each { |r|
        i = i + 1
        popData.push([i.to_s, r[1]])
        labelTitle.push([i.to_s,r[2]])
    }
    
    outdata = {}
    outdata["popData"] = popData
    outdata["labelTitle"] = labelTitle
  
 #   outdata.sort_by 
    outdata.to_json

#  res2.to_json
  
  else
      puts "API Error!! #{res.code}"
  end

end

get '/jqplottest/' do

  outdata = {}
  outdata["tempList"] = [["0","25"],["1","30"],["2","0"],["3","10"],["4","80"],["5","50"],["6","70"]]
  outdata["rainList"] = [["0","18"],["1","13"],["2","12"],["3","13"],["4","9"],["5","4"],["6","3"]]
  content_type :json
  outdata.to_json

end

get '/getdata/:name' do
# APIでデータを取得して、JSONで返す
end


get '/member/:name' do
  member_age = rand(100)
  content_type :json
  data = {name: params[:name], age: member_age}
  data.to_json
end

get '/d3test/' do
  erb :d3jsdemo
end

#起動方法
#  ruby app.rb -s webrick
#
#動作確認
#http://localhost:4567/
#
