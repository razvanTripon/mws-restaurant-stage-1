let restaurants, neighborhoods, cuisines;
var markers = [];
var map;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
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

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const SELECT = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = neighborhood;
    OPTION.value = neighborhood;
    SELECT.append(OPTION);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
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

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const SELECT = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = cuisine;
    OPTION.value = cuisine;
    SELECT.append(OPTION);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
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

  google.maps.event.addDomListener(window, 'resize', function () {
    console.log("fired resize event")
    map.setCenter(loc);
  });
  updateRestaurants();

  //set tabindex to -1 for all map elements  
  self.map.addListener('tilesloaded', () => {
    setInterval(() => {
      document.querySelectorAll('#map *').forEach((el) => {
        el.setAttribute('tabindex', '-1');
      });
    }, 1000);
  }
  );
}

/**
 * Update page and map for current restaurants.
 */
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

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
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

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const UL = document.getElementById('restaurants-list');
  let tabindex=10;
  restaurants.forEach(restaurant => {
    UL.append(createRestaurantHTML(restaurant,tabindex));
    tabindex+=2;
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant,tabindex) => {
  const tagLI = document.createElement('li');

  const tagDIV = document.createElement('div');
  tagDIV.setAttribute('tabindex', tabindex.toString());
  tagDIV.setAttribute('aria-label', `${restaurant.name}`);
  tagDIV.className = 'restaurantBox';
  tagLI.append(tagDIV);

  const tagPICTURE = document.createElement('picture');
  const urlAdress = DBHelper.imageUrlForRestaurant(restaurant);
  tagPICTURE.innerHTML = `<img class="restaurantImg"  alt="Restaurant ${restaurant.name} picture"  srcset="${urlAdress}_small@1x.jpg 1x,  ${urlAdress}_small@2x.jpg 2x" src="${urlAdress}_small@1x.jpg">`;
  tagPICTURE.className = 'restaurantPict';
  tagDIV.append(tagPICTURE);

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
  more.setAttribute('tabindex', (tabindex+1).toString());
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `More details on ${restaurant.name}`);
  more.className = 'restaurantDetalii';
  tagDIV.append(more);
  return tagLI;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
}

/**
 * Register service worker
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('Service worker - inregistrat');
  }).catch((error) => {
    console.log('Service worker - nu a putut fi inregistrat', error);
  });
}
