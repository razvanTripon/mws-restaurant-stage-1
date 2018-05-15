let restaurant;
var map;
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
 //     fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      //set tabindex to -1 for all map elements  
      self.map.addListener('tilesloaded', () => {
        const mapElement = document.getElementById('map');
        const frame = mapElement.getElementsByTagName('iframe')[0];
        frame.setAttribute('title', 'Restaurant Map');
        
        setInterval(() => {
          document.querySelectorAll('#map *').forEach((el) => {
            el.setAttribute('tabindex', '-1');
          });
        }, 1000);
      }
      );
    }
  });

}
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const ID = getParameterByName('id');
  if (!ID) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(ID, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-detailsName');
  name.innerHTML = restaurant.name;
  const address = document.getElementById('restaurant-address');
  const addressAfis = restaurant.address.replace(',', '<br>');
  address.innerHTML = addressAfis;
  const imagine = document.getElementById('restaurant-img');
  const url_imagine = DBHelper.imageUrlForRestaurant(restaurant);
  imagine.innerHTML = `<source media="(min-width: 1280px)"  srcset="${url_imagine}_large.jpg"  sizes="45vw">` +
    `<source media="(min-width: 440px)"   srcset="${url_imagine}_medium.jpg" sizes="(min-width: 650px) 50vw, 85vw">` +
    `<img
     class="restaurant-detailsImagine" 
     id="restaurant-detailsImagine" 
     alt="${restaurant.alt}"
     srcset="${url_imagine}_small@1x.jpg 1x,
            ${url_imagine}_small@2x.jpg 2x" 
     src="${url_imagine}_small@1x.jpg">`;
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  fillReviewsHTML();
}
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.className = 'deschisRanduri';
    const day = document.createElement('th');
    day.className = 'deschisZile';
    day.setAttribute('scope', 'row');
    day.innerHTML = key;
    row.appendChild(day);
    const time = document.createElement('td');
    time.className = 'deschisOre';
    const timeAfisat = operatingHours[key].replace(',', '<br>');
    time.innerHTML = timeAfisat
    row.appendChild(time);
    hours.appendChild(row);
  }
}
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews');
  const title = document.createElement('h3');
  title.className = 'reviewsHeader';
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviewsList');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}
createReviewHTML = (review) => {
  const tagLI = document.createElement('li');
  tagLI.className = 'reviewsItem';
  const tagArticle = document.createElement('article');
  const tagNameP = document.createElement('p');
  tagNameP.innerHTML = review.name;
  tagNameP.setAttribute('aria-hidden', 'true');
  tagNameP.className = 'autorul';
  tagArticle.appendChild(tagNameP);
  const tagRatingP = document.createElement('p');
  tagRatingP.innerHTML = `Rating: ${review.rating}`;
  tagRatingP.className = 'stele';
  tagArticle.appendChild(tagRatingP);
  tagArticle.setAttribute('role', 'article');
  tagArticle.setAttribute('aria-label', `Evaluated by ${review.name} on ${review.date}`);
  tagArticle.className = 'review';
  tagLI.appendChild(tagArticle);
  const tagDateP = document.createElement('p');
  tagDateP.innerHTML = review.date;
  tagDateP.setAttribute('aria-hidden', 'true');
  tagDateP.className = 'data';
  tagArticle.appendChild(tagDateP);
  const tagCommP = document.createElement('p');
  tagCommP.innerHTML = review.comments;
  tagCommP.className = 'comentarii';
  tagArticle.appendChild(tagCommP);
  return tagLI;
}
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const tagli = document.createElement('li');
  tagli.innerHTML = restaurant.name;
  tagli.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(tagli);
}
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const REGEX = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = REGEX.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}