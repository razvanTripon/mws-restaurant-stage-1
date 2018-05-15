
class DBHelper {
  static get DATABASE_URL() {
    const port = 1337;
    return  `http://localhost:${port}/restaurants`;
    
  }
  static get db_name() { return "restaurant_reviews"; }
  static get object_store() { return "restaurants"; }
  static get version() { return 2; }

  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json()).then(
        json => {
          const restaurants = json;
          DBHelper.saveRestaurantsToDB(restaurants);
          return callback(null, restaurants);
        }
      ).catch(e => {
        let cachedRestaurantsData = DBHelper.fetchRestaurantsFromIndexedDB().then((data) => {
          return callback(null, data);
        }).catch((e) => {
          console.error(e);
          const error = (`Err. Returned status of ${e}`);
          return callback(error, null);
        });
      });
  }
  static saveRestaurantsToDB(restaurants) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return false;
    }
    const DBOpenRequest = window.indexedDB.open(DBHelper.db_name, DBHelper.version);
    let db;
    DBOpenRequest.onsuccess = (event) => {
      db = DBOpenRequest.result;
      const tx = db.transaction([DBHelper.object_store], 'readwrite');
      const store = tx.objectStore(DBHelper.object_store);
      for (let i = 0; i < restaurants.length; i++) {
        store.add(restaurants[i]);
      }
    };
    DBOpenRequest.onerror = (e) => {
      console.error("Error opening local database", e);
    }
    DBOpenRequest.onupgradeneeded = function (event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore(DBHelper.object_store, {
        keyPath: "id"
      });
    };
  }
  static fetchRestaurantsFromIndexedDB() {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return false;
    }
    const DBOpenRequest = window.indexedDB.open(DBHelper.db_name, DBHelper.version);
    let db;
    let restaurants = [];
    return new Promise((resolve, reject) => {
      DBOpenRequest.onsuccess = (event) => {
        db = DBOpenRequest.result;
        const tx = db.transaction([DBHelper.object_store]);
        const store = tx.objectStore(DBHelper.object_store);
        return store.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            restaurants.push(cursor.value);
            cursor.continue();
          } else {
            resolve(restaurants);
          }
        };
      };
      DBOpenRequest.onerror = (e) => {
        reject("Error opening database");
      }
    })
  }
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const RESTAURANT = restaurants.find(r => r.id == id);
        if (RESTAURANT) { // Got the restaurant
          callback(null, RESTAURANT);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
  static fetchRestaurantByCuisine(cuisine, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const RESULTS = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, RESULTS);
      }
    });
  }
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const RESULTS = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, RESULTS);
      }
    });
  }
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
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
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
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
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  static imageUrlForRestaurant(restaurant) {
    return restaurant.id ? (`/img/${restaurant.id}`) : false;
  }
  static mapMarkerForRestaurant(restaurant, map) {
    const MARKER = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return MARKER;
  }
}
