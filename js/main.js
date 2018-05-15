let restaurants, neighborhoods, cuisines;
var markers = [];
var map;
window.onload = function () {
  setInterval(() => {
    document.querySelectorAll('#map *').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
  }, 100);
}
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const SELECT = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = neighborhood;
    OPTION.value = neighborhood;
    SELECT.append(OPTION);
  });
}
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const SELECT = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = cuisine;
    OPTION.value = cuisine;
    SELECT.append(OPTION);
  });
}
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  editMap = () => {
    const mapElement = document.getElementById('map');
    const frame = mapElement.getElementsByTagName('iframe')[0];
    frame.setAttribute('title', 'Map of Restaurants');
  };
  this.map.addListener('tilesloaded', editMap);
  updateRestaurants();
}
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const UL = document.getElementById('restaurants-list');
  UL.innerHTML = '';
  // Remove all map markers
  //console.log(self.markers);
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const UL = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    UL.append(createRestaurantHTML(restaurant));
  });
  lazyLoad();
  addMarkersToMap();

}
createRestaurantHTML = (restaurant) => {
  const tagLI = document.createElement('li');
  const tagDIV = document.createElement('div');
  tagDIV.setAttribute('aria-label', `${restaurant.name}`);
  tagDIV.className = 'restaurantBox';
  tagLI.append(tagDIV);
  const tagPICTURE = document.createElement('picture');
  const urlAdress = DBHelper.imageUrlForRestaurant(restaurant);
  if (urlAdress) {
    const image = document.createElement('img');
    image.className = 'restaurantImg restaurantPict lazy';
    image.dataset.src = urlAdress + "_small@1x.jpg";
    image.dataset.srcset = urlAdress + "_small@2x.jpg 2x";
    image.alt = "Image of " + restaurant.name;
    tagDIV.append(image);
  }
  const tagH3 = document.createElement('h3');
  tagH3.innerHTML = restaurant.name;
  tagH3.className = 'restaurantNume';
  tagDIV.append(tagH3);
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.className = 'restaurantVecinatate';
  tagDIV.append(neighborhood);
  const address = document.createElement('address');
  address.innerHTML = restaurant.address;
  address.className = 'restaurantAdresas';
  tagDIV.append(address);
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `More details on ${restaurant.name}`);
  more.className = 'restaurantDetalii';
  tagDIV.append(more);
  return tagLI;
}
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('Service worker - inregistrat');
  }).catch((error) => {
    console.log('Service worker - nu a putut fi inregistrat', error);
  });
}
lazyLoad = () => {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;

          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
}
