const request = require('request');
const cheerio = require('cheerio');
const tress = require('tress');
const fs = require('fs');
const log = require('cllc')();
const uuidv4 = require('uuid/v4');
const https = require('https');


// `tress` последовательно вызывает наш обработчик для каждой ссылки в очереди
const q = tress(function (link, callback) {

    //тут мы обрабатываем страницу с адресом url
    request({
        method: 'GET',
        timeout: 5000,
        url: link,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
        }
    }, (err, res, body) => {
        if (err) {
            console.error(err);
            throw err;
        }
        const $ = cheerio.load(body);
        // let sizes = [];
        // $('div.good-item-wrap').each(function () {
        //    let title = $(this).find('h1#title').first().text().trim();
        //    let value = $(this).find('h1#title').last().text().trim();
        //    sizes.push({
        //        'title' : title,
        //        'value'  : value
        //    });
        // });
        //let images = $('div.thumb > a').map((i, x) =>  loadImg($(x).attr('href')) ).toArray();

        let results = {
            // 'category' : $('ul#breadcrumbs > li > a[itemprop="item"] > span').last().text().trim(),
            'title': $('h1#title').text(),
            'price': $('div.cost span').text(),
            // 'article' : $('tr.prop_CML2_ARTICLE td.val > span').text().trim(),
            // 'lenses' : $('tr.prop_LINZU > td.val > span').text().trim(),
             //'sizes' : sizes,
            // 'images' : images
        };
        callback(null, results);
    });
});

// function loadImg(url){
//     let ext = url.split('.').pop();
//     let fileName = uuidv4() + '.' + ext;
//     const file = fs.createWriteStream("./images/" + fileName);
//     const request = https.get('https://boston-optika.by' + url, function(response) {
//         response.pipe(file);
//     });
//     return 'images/' + fileName;
// }
//эта функция выполнится, когда в очереди закончатся ссылки
q.drain = function () {
    log.finish(); // Остановить индикатор.
};
q.success = function (data) {
    require('fs').appendFile('./product.json', JSON.stringify(data, null, 4) + ',\n', function (err) {
        if (err) {
            console.error('Error: write to file');
        }
    });
    log.step(0, 1);
    q.concurrency = 1;
};

q.retry = function () {
    log.error('Ошибка ждем 5 сек');
    q.concurrency = -5000;
};
log.start('Ссылок %s, Спаршено ссылок %s');
let links = fs.readFileSync('links.csv').toString().split("\n");
links.forEach(function (link) {
    // добавляем в очередь ссылки на страницы
    q.push(link);
    log.step(1);
    log.info('Added: ' + link);
});

