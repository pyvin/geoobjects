
ymaps.ready(init);

function init () {
    var log = document.getElementById('log'),
    myMap = new ymaps.Map("map", {
        // center: [48.856929, 2.341198],
        center: [55.753215, 37.622504],
        zoom: 10,
        // controls: ['zoomControl']
        controls: ['geolocationControl']
    },{
        searchControlProvider: 'yandex#search'
    }),
        objectManager = new ymaps.ObjectManager({
            // Чтобы метки начали кластеризоваться, выставляем опцию.
            clusterize: true,
            // ObjectManager принимает те же опции, что и кластеризатор.
            gridSize: 32,
            clusterDisableClickZoom: true
        }
    ),
    
    myCircle = new ymaps.Circle([myMap.getCenter(), 1000], {
        balloonContentBody: 'Балун',
        hintContent: 'Хинт'
    }, {
        draggable: true
    });
    
    var secondButton = new ymaps.control.Button({
        data: {
            // Зададим текст и иконку для кнопки.
            content: "---Адаптивная кнопка",
            // Иконка имеет размер 16х16 пикселей.
            image: 'images/error.png'
        },
        options: {
            // Поскольку кнопка будет менять вид в зависимости от размера карты,
            // зададим ей три разных значения maxWidth в массиве.
            maxWidth: [28, 150, 178]
        }
    });

    var polygon = new ymaps.Polygon([
        [
            [55.75, 37.80],
            [55.80, 37.90],
            [55.75, 38.00],
            [55.70, 38.00],
            [55.70, 37.80]
        ],
        // Координаты вершин внутреннего контура.
        [
            [55.75, 37.82],
            [55.75, 37.98],
            [55.65, 37.90]
        ]
    ]);
    // Добавляем многоугольник на карту.
    myMap.geoObjects.add(polygon);
        
    var geoObject = new ymaps.Placemark([55.753215, 37.622504], {
        // Данные, на основе которых будет формироваться диаграмма.
        data: [
            { weight: 500, height: 2, color: '#224080' },
            { weight: 20,height: 2, color: '#408022' },
            { weight: 12,height: 2, color: '#802246' }
        ]
    }, {
        iconLayout: 'default#pieChart',
        iconPieChartCoreRadius: 30,
        pieChartStrokeWidth: 1
    });
    geoObject.events.add('click', function (e) {
        alert('1')
    });
    myPlacemark = new ymaps.Placemark([55.821696091304695, 37.76944613867187], {
        // Чтобы балун и хинт открывались на метке, необходимо задать ей определенные свойства.
        balloonContentHeader: "Балун метки",
        balloonContentBody: "Содержимое <em>балуна</em> метки",
        balloonContentFooter: "Подвал",
        hintContent: "Хинт метки"
    });

    myMap.geoObjects.add(myPlacemark);
    myMap.geoObjects.add(geoObject);
    
    
    myMap.events.add('click', function (e) {
        console.log(e.get('coords'))
        getAddress(e.get('coords'))
     });

        // Создание метки.
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
        ymaps.geocode(coords).then(function (res) {

            var firstGeoObject = res.geoObjects.get(0);
            console.log(firstGeoObject.getLocalities() )
            console.log(firstGeoObject.getAdministrativeAreas())
            console.log(firstGeoObject.properties._data.text)
        
            console.log(firstGeoObject.balloonContentBody())
            firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                        // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
            firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
        });
        
    }

    ButtonLayout = ymaps.templateLayoutFactory.createClass([
        '<div title="{{ data.title }}" class="my-button ',
        '{% if state.size == "small" %}my-button_small{% endif %}',
        '{% if state.size == "medium" %}my-button_medium{% endif %}',
        '{% if state.size == "large" %}my-button_large{% endif %}',
        '{% if state.selected %} my-button-selected{% endif %}">',
        '<img class="my-button__img" src="{{ data.image }}" alt="{{ data.title }}">',
        '<span class="my-button__text">{{ data.content }}</span>',
        '</div>'
    ].join('')),

    button = new ymaps.control.Button({
        data: {
            content: "Жмак-жмак-жмак",
            image: 'images/pen.png',
            title: "Жмак-жмак-жмак"
        },
        options: {
            layout: ButtonLayout,
            maxWidth: [170, 190, 220]
        }
    });

    // Создадим пользовательский макет ползунка масштаба.
    ZoomLayout = ymaps.templateLayoutFactory.createClass("<div>" +
        "<div id='zoom-in' class='btn'><i class='icon-plus'></i></div><br>" +
        "<div id='zoom-out' class='btn'><i class='icon-minus'></i></div>" +
        "</div>", {
        build: function () {
            // Вызываем родительский метод build.
            ZoomLayout.superclass.build.call(this);

            // Привязываем функции-обработчики к контексту и сохраняем ссылки
            // на них, чтобы потом отписаться от событий.
            this.zoomInCallback = ymaps.util.bind(this.zoomIn, this);
            this.zoomOutCallback = ymaps.util.bind(this.zoomOut, this);

            // Начинаем слушать клики на кнопках макета.
            $('#zoom-in').bind('click', this.zoomInCallback);
            $('#zoom-out').bind('click', this.zoomOutCallback);
        },
        clear: function () {
            // Снимаем обработчики кликов.
            $('#zoom-in').unbind('click', this.zoomInCallback);
            $('#zoom-out').unbind('click', this.zoomOutCallback);

            // Вызываем родительский метод clear.
            ZoomLayout.superclass.clear.call(this);
        },

        zoomIn: function () {
            var map = this.getData().control.getMap();
            map.setZoom(map.getZoom() + 1, {checkZoomRange: true});
        },

        zoomOut: function () {
            var map = this.getData().control.getMap();
            map.setZoom(map.getZoom() - 1, {checkZoomRange: true});
        }
    }),
    zoomControl = new ymaps.control.ZoomControl({options: {layout: ZoomLayout}});

    myMap.controls.add(button, {
        right: 5,
        top: 5
    });
    myMap.controls.add(zoomControl);
    myMap.controls.add(secondButton);
    
    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
    myMap.geoObjects.add(objectManager);


    // Создадим 5 пунктов выпадающего списка.
    var listBoxItems = ['Школа', 'Аптека', 'Магазин', 'Больница', 'Бар']
        .map(function (title) {
            return new ymaps.control.ListBoxItem({
                data: {
                    content: title
                },
                state: {
                    selected: true
                }
            })
        }),
        reducer = function (filters, filter) {
            filters[filter.data.get('content')] = filter.isSelected();
            
            return filters;
        },
    // Теперь создадим список, содержащий 5 пунктов.
    listBoxControl = new ymaps.control.ListBox({
        data: {
            content: 'Фильтр',
            title: 'Фильтр'
        },
        items: listBoxItems,
        state: {
            // Признак, развернут ли список.
            expanded: true,
            filters: listBoxItems.reduce(reducer, {})
        },
        // options: {layout: MyListBoxLayout}
    });

    myMap.controls.add(listBoxControl);
    // Добавим отслеживание изменения признака, выбран ли пункт списка.
    listBoxControl.events.add(['select', 'deselect'], function (e) {
        var listBoxItem = e.get('target');
        var filters = ymaps.util.extend({}, listBoxControl.state.get('filters'));
        filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
        listBoxControl.state.set('filters', filters);
    });

    var filterMonitor = new ymaps.Monitor(listBoxControl.state);
    filterMonitor.add('filters', function (filters) {
        // Применим фильтр.
        console.log(filters)
        objectManager.setFilter(getFilterFunction(filters));
    });

    $.ajax({
        url: "data.json"
    }).done(function(data) {
        objectManager.add(data);
    });
}


function getFilterFunction(categories) {
    return function (obj) {
        var content = obj.properties.balloonContent;
        return categories[content]
    }
}