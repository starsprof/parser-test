const request = require('request');
const cheerio = require('cheerio');
const tress = require('tress');
const fs = require('fs');


const URL = 'http://www.aleshka.by/brands/';
let results = [];

// `tress` последовательно вызывает наш обработчик для каждой ссылки в очереди
const q = tress(function (url, callback) {

    //тут мы обрабатываем страницу с адресом url
    request({
        method: 'GET',
        timeout: 5000,
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
        }
    }, (err, res, body) => {
        if (err) return console.error(err);
        const $ = cheerio.load(body);

        $('div.partners-list div.pic').each(function (i,el) {
            //let name = $(el).find('a').text();
            let link =  'http://www.aleshka.by' + $(el).find('a').attr('href');

            results.push({
                    'link': link,
                    //'name': name
                });
        });
        callback();
    });
});

// эта функция выполнится, когда в очереди закончатся ссылки
q.drain = function () {
    require('fs').writeFileSync('./category.json', JSON.stringify(results, null, 4));
    console.log(results);
};

// добавляем в очередь ссылку на первую страницу списка
q.push(URL);

