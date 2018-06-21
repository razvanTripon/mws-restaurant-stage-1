let restaurant, map;
window.initMap = (restaurant = self.restaurant) => {
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });

  self.map.addListener("tilesloaded", setMapTitle);
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

document.addEventListener("DOMContentLoaded", event => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});

setMapTitle = () => {
  const mapFrame = document.getElementById("map").querySelector("iframe");
  mapFrame.setAttribute("title", "Google maps with restaurant location");
  const htmlFrame1 = document
    .getElementById("map")
    .querySelector("iframe")
    .contentWindow.document.querySelector("html");

  console.log(htmlFrame1);
  htmlFrame1.setAttribute("lang", "en");
};
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

var getReviewsURL = function() {
  const port = 1337; // Change this to your server port
  const index = window.location.href.indexOf("=");
  const id = window.location.href.slice(index + 1);

  return `http://localhost:${port}/reviews/?restaurant_id=${id}`;
};
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;
  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;
  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.alt = `${restaurant.name} restaurant`;
  const imageDest = DBHelper.imageUrlForRestaurant(restaurant);
  const imageNumber = imageDest;
  const setSourcet = `img/${imageNumber}-1x.jpg 1x, img/${imageNumber}-1x.webp 1x , img/${imageNumber}-2x.jpg 2x, img/${imageNumber}-2x.webp 2x`;
  image.setAttribute("srcset", setSourcet);
  image.setAttribute("sizes", "(min-width: 416px) 320px");
  image.src = `img/${imageNumber}-2x.jpg`;
  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  getReviewsURL();
};
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");
    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);
    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
  }
};
getRestaurantReviews = () => {
  return fetch(getReviewsURL()).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};

loadContentNetworkFirst();
function loadContentNetworkFirst() {
  getRestaurantReviews()
    .then(dataFromNetwork => {
      fillReviewsHTML(dataFromNetwork); 
      saveReviewsDataLocally(dataFromNetwork);
    })
    .catch(err => {
       console.log("Network requests have failed, this is expected if offline");
      getReviewsData() 
        .then(offlineData => {
          if (!offlineData.length) {
              console.log("no data");
          } else {
            fillReviewsHTML(offlineData);
          }
        });
    });
}

getRestaurantReviews = () => {
  return fetch(getReviewsURL()).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};

function saveReviewsDataLocally(reviews) {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tx = db.transaction("reviews", "readwrite");
    const store = tx.objectStore("reviews");
    return Promise.all(reviews.map(review => store.put(review))).catch(() => {
      tx.abort();
      throw Error("Err");
    });
  });
}

function getReviewsData() {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tx = db.transaction("reviews", "readonly");
    const store = tx.objectStore("reviews");
    return store.getAll();
  });
}
fillReviewsHTML = reviews => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h3");
  title.innerHTML = "REVIEWS";
  title.classList = "review-list_title";
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

createReviewHTML = review => {
  const li = document.createElement("li");
  const tagArticle = document.createElement('article');
  const name = document.createElement("p");
  name.innerHTML = review.name;
  name.setAttribute('aria-hidden', 'true');
  name.classList = "reviewer";
  tagArticle.appendChild(name);
  //li.appendChild(name);
  const date = document.createElement("p");
  let secDate = new Date(review.createdAt);
  date.innerHTML = secDate.toLocaleDateString();
  date.setAttribute('aria-hidden', 'true');
  tagArticle.appendChild(date);
  //li.appendChild(date);
  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = "ratings";
  tagArticle.appendChild(rating);
  tagArticle.setAttribute('role', 'article');
  tagArticle.setAttribute('aria-label', `Evaluated by ${review.name} on ${secDate.toLocaleDateString()}`);
  //li.appendChild(rating);
  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  tagArticle.appendChild(comments);
  li.appendChild(tagArticle);
  return li;
};
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
const restaurantId = window.location.href.slice(41);
document.getElementById("restId").value = restaurantId;
var buttonMap = document.getElementById("showGoogleMap");
buttonMap.addEventListener("click", loadGoogleMap, false);
document
  .querySelector("#post-message")
  .addEventListener("submit", function(event) {
    event.preventDefault();
    const reviewerRate = document.getElementById("rating");
    const reviewerName = document.getElementById("reviewerName");
    const reviewComment = document.getElementById("comment");
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready
        .then(function(sw) {
          var post = {
            date: new Date().toISOString(),
            restaurant_id: restaurantId,
            name: reviewerName.value,
            rating: reviewerRate.value,
            comments: reviewComment.value
          };
          writeData("sync-posts", post)
            .then(function() {
              return sw.sync.register("sync-new-posts");
            })
            .then(function(res) {
              if (navigator.onLine) {
                window.location.reload();
              } else {
                document.getElementById("connectivity-message").style.display = "block";
              }
            })
            .catch(function(err) {
              console.log(err);
            });
        })
        .catch(function() {
          var comment = {
            restaurant_id: restaurantId,
            name: reviewerName.value,
            rating: reviewerRate.value,
            comments: reviewComment.value
          };
          fetch("http://localhost:1337/reviews/", {
            method: "POST",
            headers: new Headers({
              "content-type": "application/json"
            }),
            body: JSON.stringify(comment)
          }).then(function(res) {
            if (res.ok) {
              window.location.reload();
            }
          });
        });
    } else {
      var comment = {
        restaurant_id: restaurantId,
        name: reviewerName.value,
        rating: reviewerRate.value,
        comments: reviewComment.value
      };
      return fetch("http://localhost:1337/reviews/", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json"
        }),
        body: JSON.stringify(comment)
      }).then(function(res) {
        if (res.ok) {
          window.location.reload();
        }
      });
    }
  });

function loadGoogleMap() {
  let restHeader=document.getElementById("restHeader");
  restHeader.style.backgroundImage="none";
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyA4oH775xlta1OwyIGbVVPtDYMLIfXcBpY&libraries=places&callback=initMap";
  document.getElementsByTagName("head")[0].appendChild(script);
  document.getElementById("map-container").style.display = "block";
  buttonMap.removeEventListener("click", loadGoogleMap, false);
  return false;
}
