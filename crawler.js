const request = require('request');
const cheerio = require('cheerio');
const tress = require('tress');
const fs = require('fs');
const log = require('cllc')();


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
        if (err){
            return console.log(err);
        };
        log.warn('Parse: ' + link);
        const $ = cheerio.load(body);
        let nextPage = $('ul.list-reset a').attr('href');
        if(nextPage) {
            let nextLink = 'http://www.aleshka.by' + nextPage;
            log.info('Added: ' + nextLink);
            q.push(nextLink);
            log.step(1);
        }
        let results = [];
        let item = $('div.cat-block').each(function () {
           let url = 'http://www.aleshka.by' + $(this).find('a.link').attr('href');
           results.push(url);
        });

        callback(null, results);
        //callback();
    });
});

//эта функция выполнится, когда в очереди закончатся ссылки
q.drain = function () {
    log.finish(); // Остановить индикатор.
};
q.success = function (urls) {
    if (urls) {
        log.step(0, 0, urls.length);
        require('fs').appendFile('./links.csv', urls.join('\n') + '\n', function (err) {
            if (err) {
                console.error('Error: write to file');
            }
        });
    }
    log.step(0, 1);

};

let rawdata = fs.readFileSync('category.json');
let links = JSON.parse(rawdata);
log.start('Найдено ссылок %s, Спаршено ссылок %s, Найдено продуктов %s.');
links.forEach(function (link) {
    // добавляем в очередь ссылки на страницы
    log.step(1);
    log.info('Added: ' + link.link);
    q.push(link.link);
});

