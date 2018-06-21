let dbPromise = idb.open("restaurants-store", 1, function(db) {
  if (!db.objectStoreNames.contains("restaurants")) {
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    db.createObjectStore("reviews", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "date" });
  }
});

class DBHelper {
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static fetchRestaurants(callback) {
    getServerData() // get server data
      .then(dataFromNetwork => {
        callback(null, dataFromNetwork);
        saveRestaurantDataLocally(dataFromNetwork);
      })
      .catch(err => {
        console.log(
          "Network requests have failed"
        );
        getRestaurantData() 
          .then(offlineData => {
            callback(null, offlineData); 
          });
      });
  }
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          callback(null, restaurant);
        } else {
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  static fetchRestaurantByCuisine(cuisine, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
      DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
           results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  static fetchNeighborhoods(callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  static fetchCuisines(callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }
  static imageUrlForRestaurant(restaurant) {
    return `${restaurant.id}`;
  }
  static mapMarkerForRestaurant(restaurant, map) {
    if (self.map) {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP
      });
      return marker;
    }
  }
}

function saveRestaurantDataLocally(restaurants) {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tranz = db.transaction("restaurants", "readwrite");
    const store = tranz.objectStore("restaurants");
    return Promise.all(
      restaurants.map(restaurant => store.put(restaurant))
    ).catch(() => {
      tranz.abort();
      throw Error("restaurants were not added to the store");
    });
  });
}
function getRestaurantData() {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tranz = db.transaction("restaurants", "readonly");
    const store = tranz.objectStore("restaurants");
    return store.getAll();
  });
}
function getServerData() {
  return fetch(DBHelper.DATABASE_URL).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
}
