dbPromise = idb.open("restaurants-store", 1, function(db) {
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", {
      keyPath: "date",
      autoIncrement: true
    });
  }
});
deleteItemFromData=(st, id)=> {
  dbPromise.then(function(db) {
    var tranz = db.transaction(st, "readwrite");
    var store = tranz.objectStore(st);
    store.delete(id);
    return tranz.complete;
  });
}
readAllData=(st)=> {
  return dbPromise.then(function(db) {
    var tranz = db.transaction(st, "readonly");
    var store = tranz.objectStore(st);
    return store.getAll();
  });
}
writeData=(st, data)=> {
  return dbPromise.then(function(db) {
    var tranz = db.transaction(st, "readwrite");
    var store = tranz.objectStore(st);
    store.put(data);
    return tranz.complete;
  });
}


