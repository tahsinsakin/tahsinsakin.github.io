(function (g) {
  function listings() {
    return [
      {id:"lst-golbasi-cilek",farmId:"farm-yildiz",farm:"Yildiz Bahce",farmer:"Emine Yildiz",city:"Ankara",district:"Golbasi",lat:39.7942,lng:32.8044,title:"Cilekler burada hazir",crop:"Cilek",category:"Meyve",unit:"kg",price:95,stock:48,status:"Fresh strawberries are ready to be picked.",about:"Acik tarla.",vegan:true,active:true,createdAt:"2026-09-24T06:10:00+03:00"},
      {id:"lst-ayas-domates",farmId:"farm-kaya",farm:"Kaya Sera",farmer:"Hasan Kaya",city:"Ankara",district:"Ayas",lat:40.0153,lng:32.3325,title:"Organik sera domatesi",crop:"Domates",category:"Sebze",unit:"kg",price:32,stock:120,status:"Organic tomatoes ready.",about:"Sera.",vegan:true,active:true,createdAt:"2026-09-23T18:40:00+03:00"},
      {id:"lst-cubuk-mersin",farmId:"farm-demir",farm:"Demir Bahceleri",farmer:"Ayse Demir",city:"Ankara",district:"Cubuk",lat:40.2386,lng:33.0322,title:"Yaban mersini",crop:"Yaban mersini",category:"Meyve",unit:"kg",price:220,stock:18,status:"Blueberries ready.",about:"Cubuk.",vegan:true,active:true,createdAt:"2026-09-22T08:00:00+03:00"},
      {id:"lst-beypazari-havuc",farmId:"farm-aksoy",farm:"Aksoy Ova",farmer:"Fatma Aksoy",city:"Ankara",district:"Beypazari",lat:40.1675,lng:31.9214,title:"Havuc",crop:"Havuc",category:"Sebze",unit:"kg",price:18,stock:200,status:"Havuc toprakta.",about:"Ova.",vegan:true,active:true,createdAt:"2026-09-24T05:50:00+03:00"},
      {id:"lst-elmadag-elma",farmId:"farm-koc",farm:"Koc Bahce",farmer:"Ibrahim Koc",city:"Ankara",district:"Elmadag",lat:39.9208,lng:33.2306,title:"Elma",crop:"Elma",category:"Meyve",unit:"kg",price:28,stock:150,status:"Elma dalda.",about:"Yamac.",vegan:true,active:true,createdAt:"2026-09-19T14:00:00+03:00"}
    ];
  }
  function reviews() { return []; }
  g.GPCatalog = { listings: listings, reviews: reviews };
})(window);
