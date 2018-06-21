let restaurants, neighborhoods, cuisines;
let map;
var markers = [];
document.addEventListener("DOMContentLoaded", event => {
  fetchNeighborhoods();
  fetchCuisines();
});
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      console.error(error);
    } else {
      self.cuisines = cuisines;
 
      fillCuisinesHTML();
    }
  });
};

fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option1 = document.createElement("option");
    option1.innerHTML = cuisine;
    option1.value = cuisine;
    select.appendChild(option1);
  });
};
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  self.map.addListener("tilesloaded", setMapTitle);
  updateRestaurants();
};
setMapTitle = () => {
  const mapFrame = document.querySelector("#map").querySelector("iframe");
  mapFrame.setAttribute("title", "Google maps with restaurant location");
  const htmlFrame = document.querySelector("#map").querySelector("iframe")
    .contentWindow;
  const htmlLang = htmlFrame.document.getElementsByTagName("html")[0];
  htmlLang.setAttribute("lang", "en");
};
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};
updateRestaurants();
resetRestaurants = restaurants => {
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  if (restaurants.length === 0) {
    const noMatch = document.createElement("li");
    noMatch.id = "no-match";
    const noMatchText = document.createElement("div");
    noMatchText.innerHTML = "<h2>No Match Found</h2>";
    noMatch.append(noMatchText);
    ul.append(noMatch);
    const noMatchImg = document.createElement("img");
    noMatchImg.src = "../img/no-match.png";
    noMatchImg.setAttribute("alt", " ");

    noMatch.append(noMatchImg);
  }
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (typeof google === "object" && typeof google.maps === "object") {
    addMarkersToMap();
  }
};

createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const image = document.createElement("img");
  image.className = "restaurant-img lazyload";
  image.alt = `Image from ${restaurant.name} restaurant`;
  const imageDest = DBHelper.imageUrlForRestaurant(restaurant);
  const setSourcet = `img/${imageDest}-1x.jpg 1x, img/${imageDest}-1x.webp 1x , img/${imageDest}-2x.jpg 2x, img/${imageDest}-2x.webp 2x`;
  image.setAttribute("data-srcset", setSourcet);
  image.setAttribute("data-sizes", "auto");
  image.setAttribute("data-src", `img/${imageDest}-2x.jpg`);
  li.append(image);
  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  li.append(name);
  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);
  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);
  const more = document.createElement("a");
  more.innerHTML = "View Restaurant Details";
  more.setAttribute('aria-label', `More details on ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const tagDIV = document.createElement('div');
  tagDIV.setAttribute('aria-label', `${restaurant.name}`);
  tagDIV.append(li);

  return tagDIV;
};

addMarkersToMap = (restaurants = self.restaurants) => {
  if (google.maps.event) {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      google.maps.event.addListener(marker, "click", () => {
        window.location.href = marker.url;
      });
      self.markers.push(marker);
    });
  }
};
document.getElementById("toTheMap").addEventListener("click", loadGoogleMap, false);

function loadGoogleMap() {
  let mainHeader=document.getElementById("mainHeader");
  mainHeader.style.backgroundImage="none";
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyA4oH775xlta1OwyIGbVVPtDYMLIfXcBpY&libraries=places&callback=initMap";
  script.setAttribute("async", true);
  script.setAttribute("defer", true);
  document.body.appendChild(script);
  document.getElementById("map-container").style.display = "block";
  document.getElementById("toTheMap").removeEventListener("click", loadGoogleMap, false);
  return false;
}
