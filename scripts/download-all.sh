#!/bin/bash

cd "c:/Users/mario/Desktop/BookiScout/public/images/destinations"

# Download all destination images
echo "📥 Downloading Croatian destination images..."

curl -k -L -o dubrovnik.jpg "https://images.pexels.com/photos/30238170/pexels-photo-30238170.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ dubrovnik.jpg"
curl -k -L -o zagreb.jpg "https://images.pexels.com/photos/6627904/pexels-photo-6627904.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ zagreb.jpg"
curl -k -L -o zadar.jpg "https://images.pexels.com/photos/3566194/pexels-photo-3566194.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ zadar.jpg"
curl -k -L -o rijeka.jpg "https://images.pexels.com/photos/3566192/pexels-photo-3566192.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ rijeka.jpg"
curl -k -L -o pula.jpg "https://images.pexels.com/photos/3566195/pexels-photo-3566195.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ pula.jpg"

curl -k -L -o rovinj.jpg "https://images.pexels.com/photos/546942/pexels-photo-546942.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ rovinj.jpg"
curl -k -L -o porec.jpg "https://images.pexels.com/photos/3566196/pexels-photo-3566196.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ porec.jpg"
curl -k -L -o umag.jpg "https://images.pexels.com/photos/3566197/pexels-photo-3566197.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ umag.jpg"
curl -k -L -o motovun.jpg "https://images.pexels.com/photos/3566198/pexels-photo-3566198.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ motovun.jpg"

curl -k -L -o opatija.jpg "https://images.pexels.com/photos/3566199/pexels-photo-3566199.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ opatija.jpg"
curl -k -L -o krk.jpg "https://images.pexels.com/photos/3566200/pexels-photo-3566200.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ krk.jpg"
curl -k -L -o rab.jpg "https://images.pexels.com/photos/3566201/pexels-photo-3566201.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ rab.jpg"
curl -k -L -o losinj.jpg "https://images.pexels.com/photos/3566202/pexels-photo-3566202.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ losinj.jpg"

curl -k -L -o sibenik.jpg "https://images.pexels.com/photos/3566203/pexels-photo-3566203.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ sibenik.jpg"
curl -k -L -o trogir.jpg "https://images.pexels.com/photos/3566204/pexels-photo-3566204.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ trogir.jpg"
curl -k -L -o makarska.jpg "https://images.pexels.com/photos/3566205/pexels-photo-3566205.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ makarska.jpg"
curl -k -L -o brela.jpg "https://images.pexels.com/photos/3566206/pexels-photo-3566206.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ brela.jpg"

curl -k -L -o hvar.jpg "https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ hvar.jpg"
curl -k -L -o brac.jpg "https://images.pexels.com/photos/3566207/pexels-photo-3566207.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ brac.jpg"
curl -k -L -o korcula.jpg "https://images.pexels.com/photos/3566208/pexels-photo-3566208.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ korcula.jpg"
curl -k -L -o vis.jpg "https://images.pexels.com/photos/3566209/pexels-photo-3566209.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ vis.jpg"
curl -k -L -o bol.jpg "https://images.pexels.com/photos/3566210/pexels-photo-3566210.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ bol.jpg"

curl -k -L -o cavtat.jpg "https://images.pexels.com/photos/3566211/pexels-photo-3566211.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ cavtat.jpg"

curl -k -L -o plitvice.jpg "https://images.pexels.com/photos/19818816/pexels-photo-19818816.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ plitvice.jpg"
curl -k -L -o krka.jpg "https://images.pexels.com/photos/3566212/pexels-photo-3566212.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ krka.jpg"
curl -k -L -o kornati.jpg "https://images.pexels.com/photos/3566213/pexels-photo-3566213.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ kornati.jpg"
curl -k -L -o brijuni.jpg "https://images.pexels.com/photos/3566214/pexels-photo-3566214.jpeg?auto=compress&cs=tinysrgb&w=1920" && echo "✅ brijuni.jpg"

echo ""
echo "📊 Download complete! Checking files..."
ls -lh *.jpg | wc -l
echo "images downloaded"
