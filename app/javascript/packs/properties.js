console.log("properties pack");
import _ from "underscore"


document.addEventListener("turbolinks:load", function() {
  // init map for different types of views
  ymaps.ready(init);
});


// render map on property page
// DOCS: https://tech.yandex.com/maps/jsbox/2.1?from=jsapi
function init() {
  let newProperty = document.getElementById("new_property")
  let showProperty = document.getElementById("show_property")
  let editProperty = document.getElementById("edit_property")
  let suggestNotice = document.getElementById("suggest_notice")

  // SHOW EXISTING PROPERTY
  if (document.body.contains(showProperty)) {
    let propCoords = JSON.parse(document.querySelector('#map_coords').dataset.coords)
    let propAddress = document.getElementById("property_address").innerText

    var myMap = new ymaps.Map("property_map", {
        center: propCoords,
        zoom: 16,
        controls: ['zoomControl', 'fullscreenControl']

    });
    var myPlacemark = new ymaps.Placemark(propCoords, {
      balloonContent: propAddress
    })
    myMap.geoObjects.add(myPlacemark)
  }

  // NEW OR EDIT PAGE
  if (document.body.contains(newProperty) || document.body.contains(editProperty)) {
    var propCoords = [
      document.getElementById("property_latitude").value || 55.75532206,
      document.getElementById("property_longitude").value || 37.617716
    ]

    let propAddress = document.getElementById("property_address").value
    var myMap = new ymaps.Map("property_map", {
        center: propCoords,
        zoom: 8,
        controls: ['zoomControl', 'fullscreenControl']
    });

    var myPlacemark = new ymaps.Placemark(propCoords, {
      balloonContent: propAddress
    });

    myMap.geoObjects.add(myPlacemark)


    // SUGGEST BY ADDRESS
    let suggestView = new ymaps.SuggestView('property_address')
    var delayedGeocode = _.debounce(geocode, 1000)
    document.getElementById("property_address").addEventListener("keyup", delayedGeocode, false)

    myMap.events.add('click', function (e) {
      var coords = e.get('coords');
      var lat = document.getElementById("property_latitude").value = coords[0].toPrecision(6)
      var lng = document.getElementById("property_longitude").value = coords[1].toPrecision(6)

      // Если метка уже создана – просто передвигаем ее.
      if (myPlacemark) {
          myPlacemark.geometry.setCoordinates(coords);
      }
      // Если нет – создаем.
      else {
          myPlacemark = createPlacemark(coords);
          myMap.geoObjects.add(myPlacemark);
          // Слушаем событие окончания перетаскивания на метке.
          myPlacemark.events.add('dragend', function () {
              getAddress(myPlacemark.geometry.getCoordinates());
          });
      }
      getAddress(coords);
    });

    myMap.events.add('contextmenu', function (e) {
        myMap.hint.open(e.get('coords'), 'Кто-то щелкнул правой кнопкой');
    });

    // Скрываем хинт при открытии балуна.
    myMap.events.add('balloonopen', function (e) {
        myMap.hint.close();
    });
  }

  function createPlacemark(coords) {
      return new ymaps.Placemark(coords, {
          iconCaption: 'поиск...'
      }, {
          preset: 'islands#violetDotIconWithCaption',
          draggable: true
      });
  }

  // Определяем адрес по координатам (обратное геокодирование).
  function getAddress(coords) {
      myPlacemark.properties.set('iconCaption', 'поиск...');
      ymaps.geocode(coords).then(function (res) {
          var firstGeoObject = res.geoObjects.get(0);
          document.getElementById("property_address").value  = firstGeoObject.getAddressLine()

          myPlacemark.properties
              .set({
                  // Формируем строку с данными об объекте.
                  iconCaption: [
                      // Название населенного пункта или вышестоящее административно-территориальное образование.
                      firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                      // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
                      firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                  ].filter(Boolean).join(', '),
                  // В качестве контента балуна задаем строку с адресом объекта.
                  balloonContent: firstGeoObject.getAddressLine()
              });
      });
  }

  function geocode() {
    // Забираем запрос из поля ввода.
    var request = document.getElementById("property_address").value
    console.log(request);
    // Геокодируем введённые данные.
    ymaps.geocode(request).then(function (res) {
        var obj = res.geoObjects.get(0),
            error, hint;
        if (obj) {
            // Об оценке точности ответа геокодера можно прочитать тут: https://tech.yandex.ru/maps/doc/geocoder/desc/reference/precision-docpage/
            switch (obj.properties.get('metaDataProperty.GeocoderMetaData.precision')) {
                case 'exact':
                    break;
                case 'number':
                case 'near':
                case 'range':
                    error = 'Неточный адрес, требуется уточнение';
                    hint = 'Уточните номер дома';
                    break;
                case 'street':
                    error = 'Неполный или неверный адрес, требуется уточнение';
                    hint = 'Уточните номер дома';
                    break;
                case 'other':
                default:
                    error = 'Неточный адрес, требуется уточнение';
                    hint = 'Уточните адрес';
            }
        } else {
            console.log("address not found");
            error = 'Адрес не найден';
            hint = 'Уточните адрес';
        }

        // Если геокодер возвращает пустой массив или неточный результат, то показываем ошибку.
        if (error) {
            showError(error);
            // showMessage(hint);
        } else {
            showResult(obj);
        }
    }, function (e) {
        console.log(e)
    })
  }

  function showResult(obj) {
    // Удаляем сообщение об ошибке, если найденный адрес совпадает с поисковым запросом.

    var mapContainer = document.getElementById("property_map");
    var bounds = obj.properties.get('boundedBy'),
    // Рассчитываем видимую область для текущего положения пользователя.
        mapState = ymaps.util.bounds.getCenterAndZoom(
            bounds,
            [mapContainer.offsetWidth, mapContainer.offsetHeight]
        ),
    // Сохраняем полный адрес для сообщения под картой.
        address = [obj.getCountry(), obj.getAddressLine()].join(', '),
    // Сохраняем укороченный адрес для подписи метки.
        shortAddress = [obj.getThoroughfare(), obj.getPremiseNumber(), obj.getPremise()].join(' ');

    // Убираем контролы с карты.
    mapState.controls = [];
    suggestNotice.classList.remove("suggest_error")

    // Создаём карту.
    createMap(mapState, shortAddress);
  }

  function createMap(state, caption) {
      // Если карта еще не была создана, то создадим ее и добавим метку с адресом.
      if (!myMap) {
          console.log("no map");
          myMap = new ymaps.Map('property_map', state);
          myPlacemark = new ymaps.Placemark(
              myMap.getCenter(), {
                  iconCaption: caption,
                  balloonContent: caption
              }, {
                  preset: 'islands#redDotIconWithCaption'
              });
          myMap.geoObjects.add(myPlacemark);
          // Если карта есть, то выставляем новый центр карты и меняем данные и позицию метки в соответствии с найденным адресом.
      } else {
        document.getElementById("property_latitude").value = state.center[0]
        document.getElementById("property_longitude").value = state.center[1]

        myMap.setCenter(state.center, state.zoom);
        myPlacemark.geometry.setCoordinates(state.center);
        myPlacemark.properties.set({iconCaption: caption, balloonContent: caption});
      }
  }

  // ERROR MESSAGE IF BAD ADDRESS
  function showError(message) {
    suggestNotice.innerText = message
    suggestNotice.classList.add("suggest_error")
  }
}
